import { env } from "cloudflare:workers";
import { jwtVerify } from "jose";
import { afterEach, describe, expect, it, vi } from "vitest";
import { open, sha256Hex } from "../src/lib/crypto.ts";
import { cacheKey } from "../src/resolve/cache.ts";
import {
  call,
  count,
  mint,
  mintRequest,
  nonce,
  resolvePath,
  sessionFrom,
  signIn,
} from "./helpers/http.ts";
import { expectMatchesSchema } from "./helpers/schema.ts";
import {
  APPLE_BUNDLE_ID,
  APPLE_SERVICES_ID,
  appleSettings,
  makeWorld,
  testDataKeys,
  testSecrets,
  type World,
} from "./helpers/world.ts";

const DAY = 24 * 60 * 60 * 1000;

afterEach(() => {
  vi.restoreAllMocks();
});

const abstain = {
  read: async () => ({
    canonical: null,
    band: "abstain" as const,
    reason: null,
  }),
};

function jpeg(): Blob {
  return new Blob([new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3])], {
    type: "image/jpeg",
  });
}

async function uploadPhoto(w: World, token: string): Promise<void> {
  const form = new FormData();
  form.set("photo", jpeg(), "read.jpg");
  const response = await call(w, "POST", "/v1/reads", { token, raw: form });
  expect(response.status).toBe(200);
}

async function appleSignIn(w: World, client: "ios" | "web", sub: string) {
  const n = await nonce(w);
  const aud = client === "ios" ? APPLE_BUNDLE_ID : APPLE_SERVICES_ID;
  const idToken = await w.apple.idToken({
    sub,
    aud,
    nonce: await sha256Hex(n),
  });
  const response = await call(w, "POST", "/v1/auth/token", {
    body: {
      provider: "apple",
      client,
      id_token: idToken,
      nonce: n,
      authorization_code: `code-${sub}`,
    },
  });
  return sessionFrom(response);
}

function deleteMe(w: World, token: string, cookie?: string): Promise<Response> {
  return call(w, "DELETE", "/v1/me", { token, ...(cookie ? { cookie } : {}) });
}

describe("GET /v1/me", () => {
  it("returns the account id, its providers, and no profile fields", async () => {
    const w = await makeWorld();
    const session = await signIn(w);
    const response = await call(w, "GET", "/v1/me", { token: session.access });
    const body = await expectMatchesSchema<Record<string, unknown>>(
      response,
      "getMe",
      200,
    );
    expect(body).toEqual({
      id: session.accountId,
      providers: ["dev"],
      created_at: expect.any(String),
    });
  });

  it("is 401 with no bearer token", async () => {
    const w = await makeWorld();
    const response = await call(w, "GET", "/v1/me");
    expect(await expectMatchesSchema(response, "getMe", 401)).toEqual({
      error: "unauthorized",
    });
  });
});

describe("DELETE /v1/me (FR-023, T007)", () => {
  it("runs every deletion step and keeps the audit rows", async () => {
    const w = await makeWorld({
      settings: { ZZ_PHOTO_READS: "true" },
      photoReader: abstain,
    });
    const alice = await signIn(w);
    const bob = await signIn(w, "bob");
    const live = await mint(w, alice.access);
    const used = await mint(w, alice.access, { single_use: true });
    expect((await call(w, "GET", resolvePath(used.canonical))).status).toBe(
      200,
    );
    const bobs = await mint(w, bob.access);
    await env.ZZ_DB.prepare(
      "INSERT INTO grants (id, subject_id, scope, role, expires_at) VALUES ('g1', ?, 'enterprise', 'issuer', NULL)",
    )
      .bind(alice.accountId)
      .run();
    await uploadPhoto(w, alice.access);
    const photo = await env.ZZ_DB.prepare(
      "SELECT object_key FROM read_photos",
    ).first<{ object_key: string }>();
    expect(
      await w.env.ZZ_PHOTOS.head(photo?.object_key as string),
    ).not.toBeNull();
    const auditBefore = await count(
      w,
      "SELECT count(*) AS n FROM audit_events",
    );

    const response = await deleteMe(w, alice.access);
    await expectMatchesSchema(response, "deleteMe", 204);
    expect(response.headers.get("Set-Cookie")).toBeNull();

    const codes = await env.ZZ_DB.prepare(
      "SELECT id, status, revoked_reason FROM codes WHERE owner_id = ? ORDER BY created_at",
    )
      .bind(alice.accountId)
      .all<{ id: string; status: string; revoked_reason: string | null }>();
    expect(codes.results.find((c) => c.id === live.id)).toMatchObject({
      status: "revoked",
      revoked_reason: "account-deleted",
    });
    // A used code stays used: only active codes are revoked.
    expect(codes.results.find((c) => c.id === used.id)).toMatchObject({
      status: "used",
      revoked_reason: null,
    });
    expect(
      await count(
        w,
        "SELECT count(*) AS n FROM records WHERE owner_id = ? AND deleted_at IS NULL",
        alice.accountId,
      ),
    ).toBe(0);
    const versions = await env.ZZ_DB.prepare(
      "SELECT title, body, signature, erased_at FROM record_versions WHERE record_id IN (SELECT id FROM records WHERE owner_id = ?)",
    )
      .bind(alice.accountId)
      .all<Record<string, string | null>>();
    expect(versions.results.length).toBe(2);
    for (const version of versions.results) {
      expect(version).toMatchObject({ title: "", body: "", signature: "" });
      expect(version.erased_at).not.toBeNull();
    }
    expect(
      await count(
        w,
        "SELECT count(*) AS n FROM identities WHERE account_id = ?",
        alice.accountId,
      ),
    ).toBe(0);
    expect(
      await count(
        w,
        "SELECT count(*) AS n FROM grants WHERE subject_id = ?",
        alice.accountId,
      ),
    ).toBe(0);
    expect(
      await count(
        w,
        "SELECT count(*) AS n FROM read_photos WHERE account_id = ?",
        alice.accountId,
      ),
    ).toBe(0);
    expect(await w.env.ZZ_PHOTOS.head(photo?.object_key as string)).toBeNull();
    expect(
      await count(
        w,
        "SELECT count(*) AS n FROM refresh_tokens WHERE account_id = ? AND revoked_at IS NULL",
        alice.accountId,
      ),
    ).toBe(0);
    const account = await env.ZZ_DB.prepare(
      "SELECT deleted_at FROM accounts WHERE id = ?",
    )
      .bind(alice.accountId)
      .first<{ deleted_at: string | null }>();
    expect(account?.deleted_at).not.toBeNull();
    expect(await count(w, "SELECT count(*) AS n FROM audit_events")).toBe(
      auditBefore + 1,
    );
    expect(
      await count(
        w,
        "SELECT count(*) AS n FROM audit_events WHERE action = 'account.delete' AND actor_id = ?",
        alice.accountId,
      ),
    ).toBe(1);

    // The deleted account's codes are not-found; another account's are not touched.
    expect((await call(w, "GET", resolvePath(live.canonical))).status).toBe(
      404,
    );
    expect((await call(w, "GET", resolvePath(bobs.canonical))).status).toBe(
      200,
    );
  });

  it("purges the cache keys of the codes it revokes (T024)", async () => {
    const w = await makeWorld();
    const alice = await signIn(w);
    const code = await mint(w, alice.access);
    expect((await call(w, "GET", resolvePath(code.canonical))).status).toBe(
      200,
    );
    expect(await caches.default.match(cacheKey(code.canonical))).toBeDefined();
    await deleteMe(w, alice.access);
    expect(
      await caches.default.match(cacheKey(code.canonical)),
    ).toBeUndefined();
    const after = await call(w, "GET", resolvePath(code.canonical));
    expect(await expectMatchesSchema(after, "resolveCode", 404)).toEqual({
      error: "not-found",
    });
  });

  it("clears the web cookie with Max-Age 0 for a web session", async () => {
    const w = await makeWorld();
    const web = await signIn(w, "alice", "web");
    const response = await deleteMe(
      w,
      web.access,
      `__Host-zz_refresh=${web.cookie}`,
    );
    await expectMatchesSchema(response, "deleteMe", 204);
    expect(response.headers.get("Set-Cookie")).toBe(
      "__Host-zz_refresh=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0",
    );
  });

  it("locks out the other client's still-valid access token and writes no rows for it", async () => {
    const w = await makeWorld();
    const phone = await signIn(w, "alice", "ios");
    const tablet = await signIn(w, "alice", "android");
    await mint(w, phone.access);
    expect((await deleteMe(w, phone.access)).status).toBe(204);
    const records = await count(w, "SELECT count(*) AS n FROM records");
    const codes = await count(w, "SELECT count(*) AS n FROM codes");
    const minted = await mintRequest(w, tablet.access);
    expect(await expectMatchesSchema(minted, "mintCode", 401)).toEqual({
      error: "unauthorized",
    });
    expect(
      await expectMatchesSchema(
        await call(w, "GET", "/v1/me", { token: tablet.access }),
        "getMe",
        401,
      ),
    ).toEqual({ error: "unauthorized" });
    expect(
      await expectMatchesSchema(
        await call(w, "GET", "/v1/me/codes", { token: tablet.access }),
        "listMyCodes",
        401,
      ),
    ).toEqual({ error: "unauthorized" });
    expect((await deleteMe(w, tablet.access)).status).toBe(401);
    expect(await count(w, "SELECT count(*) AS n FROM records")).toBe(records);
    expect(await count(w, "SELECT count(*) AS n FROM codes")).toBe(codes);
    // Its refresh token was revoked too.
    const refreshed = await call(w, "POST", "/v1/auth/refresh", {
      body: { refresh_token: tablet.refresh },
    });
    expect(refreshed.status).toBe(401);
  });

  it("writes one deletion event when two deletions race in one millisecond", async () => {
    const w = await makeWorld();
    const phone = await signIn(w, "alice", "ios");
    const tablet = await signIn(w, "alice", "android");
    // The test clock does not move, so both calls share one timestamp.
    const results = await Promise.all([
      deleteMe(w, phone.access),
      deleteMe(w, tablet.access),
    ]);
    for (const response of results)
      expect([204, 401]).toContain(response.status);
    expect(
      await count(
        w,
        "SELECT count(*) AS n FROM audit_events WHERE action = 'account.delete' AND target_id = ?",
        phone.accountId,
      ),
    ).toBe(1);
  });

  it("creates a new, empty account on the next sign-in", async () => {
    const w = await makeWorld();
    const first = await signIn(w);
    await mint(w, first.access);
    await deleteMe(w, first.access);
    const again = await signIn(w);
    expect(again.accountId).not.toBe(first.accountId);
    const list = await (
      await call(w, "GET", "/v1/me/codes", { token: again.access })
    ).json<{ codes: unknown[] }>();
    expect(list.codes).toEqual([]);
  });

  it("revokes each Apple token with the client id it was issued to", async () => {
    const w = await makeWorld({ settings: await appleSettings() });
    const phone = await appleSignIn(w, "ios", "apple-ios-user");
    const web = await appleSignIn(w, "web", "apple-web-user");
    const exchanged = w.appleStub.calls.length;
    expect((await deleteMe(w, phone.access)).status).toBe(204);
    expect((await deleteMe(w, web.access)).status).toBe(204);
    const revokes = w.appleStub.calls.slice(exchanged);
    expect(revokes.map((c) => c.url)).toEqual([
      "https://appleid.apple.com/auth/revoke",
      "https://appleid.apple.com/auth/revoke",
    ]);
    expect(revokes.map((c) => c.form.get("client_id"))).toEqual([
      APPLE_BUNDLE_ID,
      APPLE_SERVICES_ID,
    ]);
    const key = (await testSecrets()).applePublicKey;
    for (const revoke of revokes) {
      const { payload } = await jwtVerify(
        revoke.form.get("client_secret") as string,
        key,
      );
      expect(payload.sub).toBe(revoke.form.get("client_id"));
      expect(revoke.form.get("token_type_hint")).toBe("refresh_token");
      expect(revoke.form.get("token")).toMatch(/^[A-Za-z0-9_-]{32}$/);
    }
    expect(
      await count(w, "SELECT count(*) AS n FROM pending_revocations"),
    ).toBe(0);
  });

  it("keeps a failed Apple revoke in pending_revocations with its client id and no account id", async () => {
    vi.spyOn(console, "log").mockImplementation(() => {});
    const w = await makeWorld({ settings: await appleSettings() });
    const web = await appleSignIn(w, "web", "apple-web-user");
    const stored = await env.ZZ_DB.prepare(
      "SELECT apple_refresh_token_enc AS t FROM identities",
    ).first<{ t: string }>();
    w.appleStub.revoke = () => new Response("unavailable", { status: 503 });
    expect((await deleteMe(w, web.access)).status).toBe(204);
    const pending = await env.ZZ_DB.prepare(
      "SELECT * FROM pending_revocations",
    ).all<Record<string, unknown>>();
    expect(pending.results).toHaveLength(1);
    const row = pending.results[0] as Record<string, unknown>;
    expect(row).toMatchObject({
      provider: "apple",
      client_id: APPLE_SERVICES_ID,
      token_enc: stored?.t,
      attempts: 1,
    });
    expect(Date.parse(row.next_attempt_at as string) - w.clock.ms).toBe(DAY);
    expect(Object.keys(row)).not.toContain("account_id");
    // The copy is still encrypted with the HKDF-derived AES key, bound to
    // its client id.
    const token = await open(
      await testDataKeys(),
      row.token_enc as string,
      APPLE_SERVICES_ID,
    );
    expect(token).toMatch(/^[A-Za-z0-9_-]{32}$/);
    await expect(
      open(await testDataKeys(), row.token_enc as string, APPLE_BUNDLE_ID),
    ).rejects.toThrow();
  });

  it("keeps the token for retry when Apple cannot be reached or is no longer configured", async () => {
    vi.spyOn(console, "log").mockImplementation(() => {});
    const w = await makeWorld({ settings: await appleSettings() });
    const first = await appleSignIn(w, "ios", "apple-user-a");
    w.appleStub.revoke = () => Promise.reject(new Error("network"));
    expect((await deleteMe(w, first.access)).status).toBe(204);
    const second = await appleSignIn(w, "ios", "apple-user-b");
    // The same database and secrets, with the Apple group removed.
    const unconfigured = {
      ...w,
      env: {
        ...w.env,
        APPLE_TEAM_ID: undefined,
        APPLE_KEY_ID: undefined,
        APPLE_PRIVATE_KEY: undefined,
        APPLE_BUNDLE_ID: undefined,
        APPLE_SERVICES_ID: undefined,
        APPLE_WEB_REDIRECT_URI: undefined,
      },
    };
    const calls = w.appleStub.calls.length;
    expect(
      (await call(unconfigured, "DELETE", "/v1/me", { token: second.access }))
        .status,
    ).toBe(204);
    expect(w.appleStub.calls.length).toBe(calls);
    expect(
      await count(w, "SELECT count(*) AS n FROM pending_revocations"),
    ).toBe(2);
  });

  it("keeps a token it cannot decrypt for the retry run", async () => {
    vi.spyOn(console, "log").mockImplementation(() => {});
    const w = await makeWorld({ settings: await appleSettings() });
    const session = await appleSignIn(w, "ios", "apple-user-c");
    await env.ZZ_DB.prepare(
      "UPDATE identities SET apple_refresh_token_enc = 'AAAA'",
    ).run();
    expect((await deleteMe(w, session.access)).status).toBe(204);
    expect(
      w.appleStub.calls.filter((c) => c.url.endsWith("/revoke")),
    ).toHaveLength(0);
    expect(
      await count(
        w,
        "SELECT count(*) AS n FROM pending_revocations WHERE token_enc = 'AAAA'",
      ),
    ).toBe(1);
  });
});
