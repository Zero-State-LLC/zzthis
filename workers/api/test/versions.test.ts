import { env } from "cloudflare:workers";
import { afterEach, describe, expect, it, vi } from "vitest";
import { fromBase64url } from "../src/lib/encoding.ts";
import { call, count, mint, resolvePath, signIn } from "./helpers/http.ts";
import { expectMatchesSchema } from "./helpers/schema.ts";
import { makeWorld, testSecrets, type World } from "./helpers/world.ts";

afterEach(() => {
  vi.restoreAllMocks();
});

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
