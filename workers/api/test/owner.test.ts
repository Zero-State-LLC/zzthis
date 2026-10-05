import { env } from "cloudflare:workers";
import { afterEach, describe, expect, it, vi } from "vitest";
import { fromBase64url } from "../src/lib/encoding.ts";
import {
  call,
  count,
  mint,
  resolvePath,
  signIn,
  type MintedCode,
} from "./helpers/http.ts";
import { expectMatchesSchema } from "./helpers/schema.ts";
import { makeWorld, testSecrets, type World } from "./helpers/world.ts";

afterEach(() => {
  vi.restoreAllMocks();
});

interface Page {
  codes: (MintedCode & { title: string })[];
  next_cursor: string | null;
}

function list(w: World, token: string, query = ""): Promise<Response> {
  return call(w, "GET", `/v1/me/codes${query}`, { token });
}

function addVersion(
  w: World,
  token: string,
  recordId: string,
  title: string,
  body = "",
): Promise<Response> {
  return call(w, "POST", `/v1/records/${recordId}/versions`, {
    token,
    body: { title, body },
  });
}

function revoke(w: World, token: string, id: string): Promise<Response> {
  return call(w, "POST", `/v1/codes/${id}/revoke`, { token });
}

describe("GET /v1/me/codes (FR-030, T013)", () => {
  it("lists the caller's codes newest first, with titles and status, and hides re-rolled codes", async () => {
    const w = await makeWorld();
    const alice = await signIn(w);
    const bob = await signIn(w, "bob");
    await mint(w, bob.access);
    const first = await mint(w, alice.access, {
      record: { title: "First", body: "" },
    });
    w.clock.advance(1000);
    const second = await mint(w, alice.access, {
      record: { title: "Second", body: "" },
      expires_at: new Date(w.clock.ms + 2000).toISOString(),
    });
    w.clock.advance(1000);
    const rolled = await mint(w, alice.access, {
      record: { title: "Rolled", body: "" },
    });
    const replacement = await (
      await call(w, "POST", `/v1/codes/${rolled.id}/reroll`, {
        token: alice.access,
      })
    ).json<MintedCode>();
    await revoke(w, alice.access, first.id);
    w.clock.advance(2000);
    const page = await expectMatchesSchema<Page>(
      await list(w, alice.access),
      "listMyCodes",
      200,
    );
    expect(page.next_cursor).toBeNull();
    expect(page.codes.map((c) => [c.id, c.title, c.status])).toEqual([
      [replacement.id, "Rolled", "active"],
      [second.id, "Second", "expired"],
      [first.id, "First", "revoked"],
    ]);
  });

  it("pages with limit and next_cursor, breaking created_at ties by id", async () => {
    const w = await makeWorld();
    const alice = await signIn(w);
    const minted: string[] = [];
    for (let i = 0; i < 5; i += 1) {
      minted.unshift(
        (
          await mint(w, alice.access, {
            record: { title: `Code ${i}`, body: "" },
          })
        ).id,
      );
    }
    const seen: string[] = [];
    let cursor: string | null = null;
    do {
      const query: string = `?limit=2${cursor === null ? "" : `&cursor=${encodeURIComponent(cursor)}`}`;
      const page: Page = await expectMatchesSchema<Page>(
        await list(w, alice.access, query),
        "listMyCodes",
        200,
      );
      seen.push(...page.codes.map((c) => c.id));
      cursor = page.next_cursor;
    } while (cursor !== null);
    // The test clock does not move, so every created_at is the same and
    // the id breaks the tie: no row is skipped or repeated across pages.
    expect(seen).toEqual([...minted].sort().reverse());
    const all = await (await list(w, alice.access, "?limit=50")).json<Page>();
    expect(all.codes).toHaveLength(5);
  });

  it("refuses a limit outside 1 to 50 and a cursor it did not write", async () => {
    const w = await makeWorld();
    const alice = await signIn(w);
    const notJson = btoa("not json").replace(/=+$/, "");
    const wrongShape = btoa(JSON.stringify([1, 2])).replace(/=+$/, "");
    const badTime = btoa(JSON.stringify(["yesterday", "id"])).replace(
      /=+$/,
      "",
    );
    for (const query of [
      "?limit=0",
      "?limit=51",
      "?limit=abc",
      "?limit=1.5",
      "?cursor=@@",
      `?cursor=${notJson}`,
      `?cursor=${wrongShape}`,
      `?cursor=${badTime}`,
    ]) {
      const response = await list(w, alice.access, query);
      expect(await expectMatchesSchema(response, "listMyCodes", 400)).toEqual({
        error: "malformed",
      });
    }
  });

  it("is 401 with no bearer token", async () => {
    const w = await makeWorld();
    const response = await call(w, "GET", "/v1/me/codes");
    expect(await expectMatchesSchema(response, "listMyCodes", 401)).toEqual({
      error: "unauthorized",
    });
  });
});

describe("GET /v1/records/{id} (FR-030, T034)", () => {
  it("returns the owner's current title and body, and not-found to anyone else", async () => {
    const w = await makeWorld();
    const alice = await signIn(w);
    const bob = await signIn(w, "bob");
    const code = await mint(w, alice.access, {
      record: { title: "Lost cat", body: "Answers to Kathy." },
    });
    const response = await call(w, "GET", `/v1/records/${code.record_id}`, {
      token: alice.access,
    });
    const body = await expectMatchesSchema<Record<string, unknown>>(
      response,
      "getRecord",
      200,
    );
    expect(body).toEqual({
      id: code.record_id,
      version: 1,
      title: "Lost cat",
      body: "Answers to Kathy.",
      updated_at: code.created_at,
    });
    await addVersion(w, alice.access, code.record_id, "Found cat", "Thanks.");
    const updated = await (
      await call(w, "GET", `/v1/records/${code.record_id}`, {
        token: alice.access,
      })
    ).json<Record<string, unknown>>();
    expect(updated).toMatchObject({
      version: 2,
      title: "Found cat",
      body: "Thanks.",
    });
    for (const [token, id] of [
      [bob.access, code.record_id],
      [alice.access, "no-such-record"],
    ] as const) {
      const denied = await call(w, "GET", `/v1/records/${id}`, { token });
      expect(await expectMatchesSchema(denied, "getRecord", 404)).toEqual({
        error: "not-found",
      });
    }
    const anonymous = await call(w, "GET", `/v1/records/${code.record_id}`);
    expect(await expectMatchesSchema(anonymous, "getRecord", 401)).toEqual({
      error: "unauthorized",
    });
  });
});

describe("POST /v1/records/{id}/versions (T014)", () => {
  it("appends a signed version and keeps the older ones", async () => {
    const w = await makeWorld();
    const alice = await signIn(w);
    const code = await mint(w, alice.access);
    const response = await addVersion(
      w,
      alice.access,
      code.record_id,
      "  Found cat ",
      "Thank you.\u0000",
    );
    const body = await expectMatchesSchema<{ id: string; version: number }>(
      response,
      "addRecordVersion",
      201,
    );
    expect(body.version).toBe(2);
    const version = await env.ZZ_DB.prepare(
      "SELECT * FROM record_versions WHERE id = ?",
    )
      .bind(body.id)
      .first<Record<string, string | number>>();
    expect(version).toMatchObject({
      record_id: code.record_id,
      version: 2,
      title: "Found cat",
      body: "Thank you.",
      created_by: alice.accountId,
    });
    const signed = new TextEncoder().encode(
      JSON.stringify([
        code.record_id,
        2,
        "Found cat",
        "Thank you.",
        version?.created_at,
      ]),
    );
    expect(
      await crypto.subtle.verify(
        "Ed25519",
        (await testSecrets()).signingPublicKey,
        fromBase64url(version?.signature as string) as Uint8Array,
        signed,
      ),
    ).toBe(true);
    expect(
      await count(
        w,
        "SELECT count(*) AS n FROM record_versions WHERE record_id = ?",
        code.record_id,
      ),
    ).toBe(2);
    expect(
      await count(
        w,
        "SELECT count(*) AS n FROM audit_events WHERE action = 'record.version' AND target_id = ? AND result = 'ok'",
        code.record_id,
      ),
    ).toBe(1);
    const resolved = await (
      await call(w, "GET", resolvePath(code.canonical))
    ).json<{ record: { title: string }; share: { url: null } }>();
    expect(resolved.record.title).toBe("Found cat");
    expect(resolved.share.url).toBeNull();
  });

  it("refuses another account's record, an unknown record, and bad text", async () => {
    const w = await makeWorld({ settings: { ZZ_BLOCKLIST: "badword" } });
    const alice = await signIn(w);
    const bob = await signIn(w, "bob");
    const code = await mint(w, alice.access);
    const before = await count(w, "SELECT count(*) AS n FROM record_versions");
    for (const [token, id] of [
      [bob.access, code.record_id],
      [alice.access, "no-such-record"],
    ] as const) {
      const response = await addVersion(w, token, id, "Mine now");
      expect(
        await expectMatchesSchema(response, "addRecordVersion", 404),
      ).toEqual({ error: "not-found" });
    }
    expect(
      await expectMatchesSchema(
        await addVersion(w, alice.access, code.record_id, " "),
        "addRecordVersion",
        400,
      ),
    ).toEqual({ error: "malformed" });
    const missing = await call(
      w,
      "POST",
      `/v1/records/${code.record_id}/versions`,
      { token: alice.access, body: { title: "x" } },
    );
    expect(await expectMatchesSchema(missing, "addRecordVersion", 400)).toEqual(
      { error: "malformed" },
    );
    const blocked = await addVersion(
      w,
      alice.access,
      code.record_id,
      "a badword",
    );
    expect(await expectMatchesSchema(blocked, "addRecordVersion", 422)).toEqual(
      { error: "content-refused" },
    );
    expect(
      await count(
        w,
        "SELECT count(*) AS n FROM audit_events WHERE action = 'record.version' AND result = 'denied' AND target_id = ?",
        code.record_id,
      ),
    ).toBe(1);
    expect(await count(w, "SELECT count(*) AS n FROM record_versions")).toBe(
      before,
    );
    const anonymous = await call(
      w,
      "POST",
      `/v1/records/${code.record_id}/versions`,
      { body: { title: "x", body: "" } },
    );
    expect(
      await expectMatchesSchema(anonymous, "addRecordVersion", 401),
    ).toEqual({ error: "unauthorized" });
  });

  it("stores nothing when the signature or the audit write fails", async () => {
    const w = await makeWorld();
    const alice = await signIn(w);
    const code = await mint(w, alice.access);
    vi.spyOn(console, "error").mockImplementation(() => {});
    const sign = crypto.subtle.sign.bind(crypto.subtle);
    const spy = vi
      .spyOn(crypto.subtle, "sign")
      .mockImplementation((algorithm, key, data) =>
        algorithm === "Ed25519"
          ? Promise.reject(new Error("signer down"))
          : sign(algorithm, key, data),
      );
    expect(
      await expectMatchesSchema(
        await addVersion(w, alice.access, code.record_id, "New"),
        "addRecordVersion",
        500,
      ),
    ).toEqual({ error: "failed" });
    spy.mockRestore();
    await env.ZZ_DB.prepare(
      "CREATE TRIGGER audit_down BEFORE INSERT ON audit_events BEGIN SELECT RAISE (ABORT, 'audit down'); END",
    ).run();
    expect(
      (await addVersion(w, alice.access, code.record_id, "New")).status,
    ).toBe(500);
    await env.ZZ_DB.prepare("DROP TRIGGER audit_down").run();
    expect(
      await count(
        w,
        "SELECT count(*) AS n FROM record_versions WHERE record_id = ?",
        code.record_id,
      ),
    ).toBe(1);
    const record = await (
      await call(w, "GET", `/v1/records/${code.record_id}`, {
        token: alice.access,
      })
    ).json<{ version: number }>();
    expect(record.version).toBe(1);
  });

  it("numbers two edits at once 2 and 3", async () => {
    const w = await makeWorld();
    const alice = await signIn(w);
    const code = await mint(w, alice.access);
    const results = await Promise.all([
      addVersion(w, alice.access, code.record_id, "One"),
      addVersion(w, alice.access, code.record_id, "Two"),
    ]);
    const versions = await Promise.all(
      results.map((r) => r.json<{ version: number }>()),
    );
    expect(versions.map((v) => v.version).sort()).toEqual([2, 3]);
  });

  // A D1 handle that runs a competing write before each batch.
  function racing(w: World, before: () => Promise<void>): World {
    const db = w.env.ZZ_DB;
    const proxy = new Proxy(db, {
      get(target, property) {
        if (property === "batch") {
          return async (statements: D1PreparedStatement[]) => {
            await before();
            return target.batch(statements);
          };
        }
        const value = Reflect.get(target, property, target) as unknown;
        return typeof value === "function" ? value.bind(target) : value;
      },
    });
    return { ...w, env: { ...w.env, ZZ_DB: proxy } };
  }

  async function competingVersion(
    recordId: string,
    ownerId: string,
  ): Promise<void> {
    const id = crypto.randomUUID();
    await env.ZZ_DB.batch([
      env.ZZ_DB.prepare(
        "INSERT INTO record_versions (id, record_id, version, title, body, signature, signing_key_id, created_by, created_at) SELECT ?, ?, MAX(version) + 1, 'other', '', 's', 'k', ?, ? FROM record_versions WHERE record_id = ?",
      ).bind(id, recordId, ownerId, new Date().toISOString(), recordId),
      env.ZZ_DB.prepare(
        "UPDATE records SET current_version_id = ? WHERE id = ?",
      ).bind(id, recordId),
    ]);
  }

  it("gives up with 500 after losing three times to concurrent edits", async () => {
    const w = await makeWorld();
    const alice = await signIn(w);
    const code = await mint(w, alice.access);
    const busy = racing(w, () =>
      competingVersion(code.record_id, alice.accountId),
    );
    const response = await addVersion(
      busy,
      alice.access,
      code.record_id,
      "Mine",
    );
    expect(
      await expectMatchesSchema(response, "addRecordVersion", 500),
    ).toEqual({ error: "failed" });
    expect(
      await count(
        w,
        "SELECT count(*) AS n FROM record_versions WHERE title = 'Mine'",
      ),
    ).toBe(0);
  });

  it("is not-found when the record is deleted while it waits", async () => {
    const w = await makeWorld();
    const alice = await signIn(w);
    const code = await mint(w, alice.access);
    const gone = racing(w, async () => {
      await env.ZZ_DB.prepare("UPDATE records SET deleted_at = ? WHERE id = ?")
        .bind(new Date().toISOString(), code.record_id)
        .run();
    });
    const response = await addVersion(
      gone,
      alice.access,
      code.record_id,
      "Mine",
    );
    expect(
      await expectMatchesSchema(response, "addRecordVersion", 404),
    ).toEqual({ error: "not-found" });
  });
});

describe("POST /v1/codes/{id}/revoke (T014, spec 005 Mint)", () => {
  it("revokes at the central server, then answers revoked again with no second ok event", async () => {
    const w = await makeWorld();
    const alice = await signIn(w);
    const code = await mint(w, alice.access);
    const first = await revoke(w, alice.access, code.id);
    expect(await expectMatchesSchema(first, "revokeCode", 200)).toEqual({
      status: "revoked",
    });
    const row = await env.ZZ_DB.prepare(
      "SELECT status, revoked_reason FROM codes WHERE id = ?",
    )
      .bind(code.id)
      .first();
    expect(row).toEqual({ status: "revoked", revoked_reason: "owner" });
    expect(
      await expectMatchesSchema(
        await revoke(w, alice.access, code.id),
        "revokeCode",
        200,
      ),
    ).toEqual({ status: "revoked" });
    expect(
      await count(
        w,
        "SELECT count(*) AS n FROM audit_events WHERE action = 'code.revoke' AND target_id = ? AND result = 'ok'",
        code.id,
      ),
    ).toBe(1);
    expect((await call(w, "GET", resolvePath(code.canonical))).status).toBe(
      404,
    );
  });

  it("writes one ok event when two revokes race", async () => {
    const w = await makeWorld();
    const alice = await signIn(w);
    const code = await mint(w, alice.access);
    const results = await Promise.all([
      revoke(w, alice.access, code.id),
      revoke(w, alice.access, code.id),
    ]);
    expect(results.map((r) => r.status)).toEqual([200, 200]);
    expect(
      await count(
        w,
        "SELECT count(*) AS n FROM audit_events WHERE action = 'code.revoke' AND target_id = ? AND result = 'ok'",
        code.id,
      ),
    ).toBe(1);
  });

  it("is not-found for another account's code, an unknown id, and the caller's own used or expired code", async () => {
    const w = await makeWorld();
    const alice = await signIn(w);
    const bob = await signIn(w, "bob");
    const theirs = await mint(w, bob.access);
    const used = await mint(w, alice.access, { single_use: true });
    await call(w, "GET", resolvePath(used.canonical));
    const expiring = await mint(w, alice.access, {
      expires_at: new Date(w.clock.ms + 1000).toISOString(),
    });
    w.clock.advance(1000);
    for (const id of [theirs.id, "no-such-code", used.id, expiring.id]) {
      const response = await revoke(w, alice.access, id);
      expect(await expectMatchesSchema(response, "revokeCode", 404)).toEqual({
        error: "not-found",
      });
    }
    const row = await env.ZZ_DB.prepare("SELECT status FROM codes WHERE id = ?")
      .bind(theirs.id)
      .first();
    expect(row).toEqual({ status: "active" });
  });

  it("answers revoked for the caller's own code that a re-roll retired", async () => {
    const w = await makeWorld();
    const alice = await signIn(w);
    const code = await mint(w, alice.access);
    await call(w, "POST", `/v1/codes/${code.id}/reroll`, {
      token: alice.access,
    });
    expect(await (await revoke(w, alice.access, code.id)).json()).toEqual({
      status: "revoked",
    });
  });

  it("is 401 with no bearer token", async () => {
    const w = await makeWorld();
    const response = await call(w, "POST", "/v1/codes/any/revoke");
    expect(await expectMatchesSchema(response, "revokeCode", 401)).toEqual({
      error: "unauthorized",
    });
  });
});
