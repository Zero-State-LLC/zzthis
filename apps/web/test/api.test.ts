import { describe, expect, it } from "vitest";
import {
  ApiFailure,
  createApi,
  DEV_SUBJECT,
  Offline,
  REFRESH_LOCK,
  SignedOut,
} from "../src/lib/api.ts";
import {
  Clock,
  fakeServer,
  json,
  token,
  type Call,
  type Handler,
} from "./helpers.ts";

function setup(handler: Handler, locks?: LockManager) {
  const server = fakeServer(handler);
  const clock = new Clock();
  const api = createApi({ fetch: server.fetch, locks, now: clock.now });
  return { api, calls: server.calls, clock };
}

const refreshes = (calls: Call[]) =>
  calls.filter((c) => c.url === "/v1/auth/refresh");

// A Web Locks stand-in that runs one holder at a time, as the browser does
// across tabs.
class SerialLocks {
  readonly names: string[] = [];
  private tail: Promise<unknown> = Promise.resolve();
  request(name: string, callback: () => Promise<unknown>): Promise<unknown> {
    this.names.push(name);
    const run = this.tail.then(callback);
    this.tail = run.catch(() => undefined);
    return run;
  }
}

function asLocks(locks: SerialLocks): LockManager {
  return locks as unknown as LockManager;
}

describe("resolve (spec 005 Web session)", () => {
  it("asks with cache no-store, the contract header, and no bearer token or refresh", async () => {
    const { api, calls } = setup(() =>
      json(200, {
        view: "public",
        canonical: "zz-@bob-zz",
        record: { title: "t", body: "b", updated_at: "x" },
        share: { text: "zz-@bob-zz", url: null },
      }),
    );
    const found = await api.resolve("zz-@bob-zz");
    expect(found.record.title).toBe("t");
    expect(calls).toHaveLength(1);
    const call = calls[0] as Call;
    expect(call.url).toBe("/v1/resolve/zz-%40bob-zz");
    expect(call.init.cache).toBe("no-store");
    expect(call.headers).toEqual({ "X-ZZ-Contract": "1" });
    expect(call.init.credentials).toBe("same-origin");
  });

  it("raises the contract's error code and reason", async () => {
    const { api } = setup(() =>
      json(400, { error: "malformed", reason: "check-mismatch" }),
    );
    await expect(api.resolve("zz-a-b-c-zz")).rejects.toEqual(
      new ApiFailure(400, "malformed", "check-mismatch"),
    );
    const empty = setup(() => new Response("not json", { status: 502 }));
    const failure = await empty.api
      .resolve("zz-a-b-c-zz")
      .catch((e: unknown) => e);
    expect(failure).toBeInstanceOf(ApiFailure);
    expect(failure).toMatchObject({
      status: 502,
      code: null,
      reason: null,
      message: "502",
    });
  });

  it("is Offline when the request never reaches the server", async () => {
    const { api } = setup(() => Promise.reject(new TypeError("network")));
    await expect(api.resolve("zz-a-b-c-zz")).rejects.toBeInstanceOf(Offline);
  });
});

describe("ensureSession (spec 005 Web session, D-2026-10-05-02)", () => {
  it("gets an access token from the refresh cookie the first time a page needs one", async () => {
    const { api, calls, clock } = setup(() => json(200, token(1)));
    expect(await api.ensureSession()).toBe("access-1");
    expect(await api.ensureSession()).toBe("access-1");
    expect(refreshes(calls)).toHaveLength(1);
    expect(calls[0]?.body).toEqual({});
    expect(calls[0]?.method).toBe("POST");
    // Near expiry it refreshes again.
    clock.ms += 871 * 1000;
    await api.ensureSession();
    expect(refreshes(calls)).toHaveLength(2);
  });

  it("makes one refresh for two concurrent calls with an expired token", async () => {
    let refreshed = 0;
    const { api, calls } = setup((call) => {
      if (call.url === "/v1/auth/refresh")
        return json(200, token((refreshed += 1)));
      return json(200, { id: "acct", providers: ["dev"], created_at: "x" });
    });
    await Promise.all([api.me(), api.me()]);
    expect(refreshes(calls)).toHaveLength(1);
    const me = calls.filter((c) => c.url === "/v1/me");
    expect(me.map((c) => c.headers.Authorization)).toEqual([
      "Bearer access-1",
      "Bearer access-1",
    ]);
  });

  it("refreshes under the zz-refresh lock and checks the token again inside it", async () => {
    const locks = new SerialLocks();
    const { api, calls } = setup((call) => {
      if (call.url === "/v1/auth/token") return json(200, token(7));
      return json(200, token(1));
    }, asLocks(locks));
    expect(await api.ensureSession()).toBe("access-1");
    expect(locks.names).toEqual([REFRESH_LOCK]);
    // Another sign-in lands while this call waits for the lock: the call
    // takes that token instead of refreshing.
    api.clear();
    const original = locks.request.bind(locks);
    locks.request = (name, callback) =>
      original(name, async () => {
        await api.signIn("dev", DEV_SUBJECT, "n");
        return callback();
      });
    expect(await api.ensureSession()).toBe("access-7");
    expect(refreshes(calls)).toHaveLength(1);
  });

  it("is null after a 401 from refresh, and raises any other refresh failure", async () => {
    const out = setup(() => json(401, { error: "unauthorized" }));
    expect(await out.api.ensureSession()).toBeNull();
    const broken = setup(() => json(503, { error: "not-ready" }));
    await expect(broken.api.ensureSession()).rejects.toMatchObject({
      status: 503,
    });
  });
});

describe("calls with a bearer token (FR-021)", () => {
  it("refreshes once and retries once after a 401", async () => {
    let refreshed = 0;
    let me = 0;
    const { api, calls } = setup((call) => {
      if (call.url === "/v1/auth/refresh")
        return json(200, token((refreshed += 1)));
      me += 1;
      return me === 1
        ? json(401, { error: "unauthorized" })
        : json(200, { id: "a", providers: [], created_at: "x" });
    });
    expect(await api.me()).toMatchObject({ id: "a" });
    expect(
      calls
        .filter((c) => c.url === "/v1/me")
        .map((c) => c.headers.Authorization),
    ).toEqual(["Bearer access-1", "Bearer access-2"]);
  });

  it("keeps a newer token that another call already got", async () => {
    let me = 0;
    const { api, calls } = setup(async (call) => {
      if (call.url === "/v1/auth/refresh") return json(200, token(1));
      if (call.url === "/v1/auth/token") return json(200, token(9));
      me += 1;
      if (me === 1) {
        await api.signIn("dev", DEV_SUBJECT, "n");
        return json(401, { error: "unauthorized" });
      }
      return json(200, { id: "a", providers: [], created_at: "x" });
    });
    await api.me();
    expect(
      calls
        .filter((c) => c.url === "/v1/me")
        .map((c) => c.headers.Authorization),
    ).toEqual(["Bearer access-1", "Bearer access-9"]);
    expect(refreshes(calls)).toHaveLength(1);
  });

  it("signs out only when the refresh itself is 401", async () => {
    const none = setup(() => json(401, { error: "unauthorized" }));
    await expect(none.api.me()).rejects.toBeInstanceOf(SignedOut);
    let refreshed = 0;
    const later = setup((call) => {
      if (call.url === "/v1/auth/refresh") {
        refreshed += 1;
        return refreshed === 1
          ? json(200, token(1))
          : json(401, { error: "unauthorized" });
      }
      return json(401, { error: "unauthorized" });
    });
    await expect(later.api.me()).rejects.toBeInstanceOf(SignedOut);
    // A second 401 after a good refresh is a failure, not a sign-out.
    let refreshing = 0;
    const stubborn = setup((call) => {
      if (call.url === "/v1/auth/refresh")
        return json(200, token((refreshing += 1)));
      return json(401, { error: "unauthorized" });
    });
    await expect(stubborn.api.me()).rejects.toMatchObject({ status: 401 });
  });
});

describe("the other /v1 calls", () => {
  const code = {
    id: "c 1",
    canonical: "zz-copper-lantern-sky-zz",
    check_word: "sky",
    status: "active",
    record_id: "r/1",
    scope: "free_public",
    rerolls_remaining: 3,
    created_at: "x",
  };

  it("signs in as the web client, with the authorization code only for Apple", async () => {
    const { api, calls } = setup((call) => {
      if (call.url === "/v1/auth/nonce")
        return json(200, { nonce: "n1", expires_in: 600 });
      if (call.url === "/v1/auth/token") return json(200, token(1));
      return json(200, { id: "a", providers: ["dev"], created_at: "x" });
    });
    expect(await api.nonce()).toBe("n1");
    await api.signIn("dev", DEV_SUBJECT, "n1");
    await api.signIn("apple", "id-token", "n2", "apple-code");
    expect(
      calls.filter((c) => c.url === "/v1/auth/token").map((c) => c.body),
    ).toEqual([
      { provider: "dev", client: "web", id_token: "dev:web", nonce: "n1" },
      {
        provider: "apple",
        client: "web",
        id_token: "id-token",
        nonce: "n2",
        authorization_code: "apple-code",
      },
    ]);
    // The sign-in's access token is used without a refresh.
    await api.me();
    expect(refreshes(calls)).toHaveLength(0);
  });

  it("signs out with the cookie and forgets the token, even on a 401", async () => {
    for (const status of [204, 401]) {
      const { api, calls } = setup((call) => {
        if (call.url === "/v1/auth/revoke") return json(status);
        return json(200, token(1));
      });
      await api.ensureSession();
      await api.signOut();
      expect(calls.find((c) => c.url === "/v1/auth/revoke")?.body).toEqual({});
      await api.ensureSession();
      expect(refreshes(calls)).toHaveLength(2);
    }
    const failing = setup(() => json(503, { error: "not-ready" }));
    await expect(failing.api.signOut()).rejects.toMatchObject({ status: 503 });
  });

  it("mints, re-rolls, revokes, reads, and appends with encoded ids", async () => {
    const { api, calls } = setup((call) => {
      if (call.url === "/v1/auth/refresh") return json(200, token(1));
      if (call.url === "/v1/codes") return json(201, code);
      if (call.url.endsWith("/reroll")) return json(200, code);
      if (call.url.endsWith("/revoke")) return json(200, { status: "revoked" });
      if (call.url.endsWith("/versions"))
        return json(201, { id: "v2", version: 2 });
      if (call.url.startsWith("/v1/records/"))
        return json(200, {
          id: "r/1",
          version: 1,
          title: "t",
          body: "",
          updated_at: "x",
        });
      if (call.url === "/v1/me") return json(204);
      return json(500);
    });
    expect(await api.mint("Lost cat", "")).toEqual(code);
    await api.reroll("c 1");
    await api.revoke("c 1");
    await api.record("r/1");
    await api.addVersion("r/1", "Found", "b");
    await api.deleteMe();
    const sent = calls
      .filter((c) => c.url !== "/v1/auth/refresh")
      .map((c) => [c.method, c.url, c.body]);
    expect(sent).toEqual([
      [
        "POST",
        "/v1/codes",
        {
          scope: "free_public",
          kind: "plain",
          record: { title: "Lost cat", body: "" },
        },
      ],
      ["POST", "/v1/codes/c%201/reroll", undefined],
      ["POST", "/v1/codes/c%201/revoke", undefined],
      ["GET", "/v1/records/r%2F1", undefined],
      ["POST", "/v1/records/r%2F1/versions", { title: "Found", body: "b" }],
      ["DELETE", "/v1/me", undefined],
    ]);
    // Deleting the account forgets the token.
    await api.ensureSession();
    expect(refreshes(calls)).toHaveLength(2);
  });

  it("follows next_cursor to list every code and to find one by id", async () => {
    const pages: Record<string, unknown> = {
      "": { codes: [{ ...code, id: "a", title: "A" }], next_cursor: "p/2" },
      "p/2": { codes: [{ ...code, id: "b", title: "B" }], next_cursor: null },
    };
    const { api, calls } = setup((call) => {
      if (call.url === "/v1/auth/refresh") return json(200, token(1));
      const cursor =
        new URL(call.url, "https://x.test").searchParams.get("cursor") ?? "";
      return json(200, pages[cursor]);
    });
    expect((await api.allCodes()).map((c) => c.id)).toEqual(["a", "b"]);
    expect(
      calls.filter((c) => c.url.startsWith("/v1/me/codes")).map((c) => c.url),
    ).toEqual(["/v1/me/codes?limit=50", "/v1/me/codes?limit=50&cursor=p%2F2"]);
    expect((await api.findCode("a"))?.id).toBe("a");
    expect((await api.findCode("b"))?.title).toBe("B");
    expect(await api.findCode("none")).toBeNull();
  });

  it("reads discovery and sends a report without a bearer token", async () => {
    const { api, calls } = setup((call) =>
      call.url === "/v1"
        ? json(200, {
            contract: "1",
            free_public: true,
            auth_providers: ["dev"],
            scopes: [],
            wordlist_version: "fixture-7",
            photo_reads: false,
          })
        : json(202, { id: "r" }),
    );
    expect((await api.discovery()).auth_providers).toEqual(["dev"]);
    await api.report("zz-a-b-c-zz", "spam", "note");
    expect(calls[1]).toMatchObject({
      method: "POST",
      url: "/v1/reports",
      body: { canonical: "zz-a-b-c-zz", reason: "spam", note: "note" },
    });
    expect(calls.every((c) => c.headers.Authorization === undefined)).toBe(
      true,
    );
  });
});
