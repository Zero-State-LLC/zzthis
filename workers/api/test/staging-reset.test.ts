import { env } from "cloudflare:workers";
import { afterEach, describe, expect, it, vi } from "vitest";
import { sha256Hex } from "../src/lib/crypto.ts";
import { call, mint, nonce, sessionFrom, signIn } from "./helpers/http.ts";
import { report } from "./helpers/ops.ts";
import { APPLE_BUNDLE_ID, appleSettings, makeWorld } from "./helpers/world.ts";

// workers/api/scripts/staging-reset.sql (D-2026-10-13-06, RM-013): empties
// every application table and puts the audit triggers back.

afterEach(() => {
  vi.restoreAllMocks();
});

// The tables the reset deletes from, in its order.
const resetTables = env.TEST_STAGING_RESET.flatMap((statement) => {
  const match = /^DELETE FROM (\w+)$/.exec(statement.trim());
  return match ? [match[1] as string] : [];
});

async function applicationTables(): Promise<string[]> {
  const rows = await env.ZZ_DB.prepare(
    "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_cf_%' AND name <> 'd1_migrations' ORDER BY name",
  ).all<{ name: string }>();
  return rows.results.map((row) => row.name);
}

async function rowCount(table: string): Promise<number> {
  const row = await env.ZZ_DB.prepare(
    `SELECT count(*) AS n FROM ${table}`,
  ).first<{ n: number }>();
  return (row as { n: number }).n;
}

async function schema(): Promise<unknown[]> {
  return (
    await env.ZZ_DB.prepare(
      "SELECT type, name, tbl_name, sql FROM sqlite_master WHERE name NOT LIKE '_cf_%' ORDER BY type, name",
    ).all()
  ).results;
}

function runReset(): Promise<unknown> {
  return env.ZZ_DB.batch(
    env.TEST_STAGING_RESET.map((statement) => env.ZZ_DB.prepare(statement)),
  );
}

describe("scripts/staging-reset.sql", () => {
  it("deletes from every table in the migrations", async () => {
    expect([...resetTables].sort()).toEqual(await applicationTables());
  });

  it("empties every application table and puts the audit triggers back", async () => {
    vi.spyOn(console, "log").mockImplementation(() => {});
    const w = await makeWorld({
      settings: { ...(await appleSettings()), ZZ_PHOTO_READS: "true" },
      photoReader: {
        read: async () => ({ canonical: null, band: "abstain", reason: null }),
      },
    });
    // A row in every table: sign-ins, a code with a second version, a
    // report, a grant, a read photo, and an Apple token left to retry.
    const alice = await signIn(w);
    const code = await mint(w, alice.access);
    await call(w, "POST", `/v1/records/${code.record_id}/versions`, {
      token: alice.access,
      body: { title: "v2", body: "" },
    });
    await report(w, code.canonical);
    await env.ZZ_DB.prepare(
      "INSERT INTO grants (id, subject_id, scope, role, expires_at) VALUES ('g1', ?, 'enterprise', 'issuer', NULL)",
    )
      .bind(alice.accountId)
      .run();
    const form = new FormData();
    form.set(
      "photo",
      new Blob([new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 1])], {
        type: "image/jpeg",
      }),
      "read.jpg",
    );
    expect(
      (await call(w, "POST", "/v1/reads", { token: alice.access, raw: form }))
        .status,
    ).toBe(200);
    const n = await nonce(w);
    const bob = await sessionFrom(
      await call(w, "POST", "/v1/auth/token", {
        body: {
          provider: "apple",
          client: "ios",
          id_token: await w.apple.idToken({
            sub: "apple-bob",
            aud: APPLE_BUNDLE_ID,
            nonce: await sha256Hex(n),
          }),
          nonce: n,
          authorization_code: "code-bob",
        },
      }),
    );
    w.appleStub.revoke = () => new Response("unavailable", { status: 503 });
    expect(
      (await call(w, "DELETE", "/v1/me", { token: bob.access })).status,
    ).toBe(204);
    for (const table of resetTables) {
      expect({ table, empty: (await rowCount(table)) === 0 }).toEqual({
        table,
        empty: false,
      });
    }
    const schemaBefore = await schema();
    const migrations = await env.ZZ_DB.prepare(
      "SELECT * FROM d1_migrations ORDER BY id",
    ).all();
    expect(migrations.results).toHaveLength(3);

    await runReset();

    for (const table of resetTables) {
      expect({ table, rows: await rowCount(table) }).toEqual({
        table,
        rows: 0,
      });
    }
    // The triggers are back as the migration wrote them, and the schema
    // and the migration record are unchanged.
    expect(await schema()).toEqual(schemaBefore);
    expect(
      (await env.ZZ_DB.prepare("SELECT * FROM d1_migrations ORDER BY id").all())
        .results,
    ).toEqual(migrations.results);
    await env.ZZ_DB.prepare(
      "INSERT INTO audit_events (id, actor_id, action, target_type, target_id, result, created_at) VALUES ('e1', NULL, 'probe', 'account', 'a1', 'ok', '2026-10-14T00:00:00.000Z')",
    ).run();
    await expect(
      env.ZZ_DB.prepare("DELETE FROM audit_events").run(),
    ).rejects.toThrow(/append-only/);
    await expect(
      env.ZZ_DB.prepare("UPDATE audit_events SET result = 'denied'").run(),
    ).rejects.toThrow(/append-only/);
    expect(await rowCount("audit_events")).toBe(1);

    // The app works on the empty database, and a second reset is clean.
    const again = await signIn(w);
    expect(again.accountId).not.toBe(alice.accountId);
    await runReset();
    expect(await rowCount("accounts")).toBe(0);
    expect(await schema()).toEqual(schemaBefore);
  });
});
