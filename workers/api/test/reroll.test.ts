import { env } from "cloudflare:workers";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  call,
  count,
  mint,
  resolvePath,
  signIn,
  type MintedCode,
} from "./helpers/http.ts";
import { scripted } from "./helpers/random.ts";
import { expectMatchesSchema } from "./helpers/schema.ts";
import { makeWorld, type World } from "./helpers/world.ts";

const FIXTURE_7 = [
  "copper",
  "lantern",
  "sky",
  "maple",
  "river",
  "harbor",
  "falcon",
];

afterEach(() => {
  vi.restoreAllMocks();
});

function reroll(w: World, token: string, id: string): Promise<Response> {
  return call(w, "POST", `/v1/codes/${id}/reroll`, { token });
}

// The issuer values that draw this fixture-7 code first.
function indexes(canonical: string): number[] {
  return canonical
    .slice(3, -3)
    .split("-")
    .slice(0, 2)
    .map((word) => FIXTURE_7.indexOf(word));
}

async function codesOf(recordId: string) {
  const rows = await env.ZZ_DB.prepare(
    "SELECT id, canonical, status, revoked_reason, replaced_by, rerolls_remaining FROM codes WHERE record_id = ? ORDER BY created_at, rowid",
  )
    .bind(recordId)
    .all<Record<string, unknown>>();
  return rows.results;
}

describe("POST /v1/codes/{id}/reroll (T009)", () => {
  it("re-rolls three times, then reroll-cap, and the retired codes never come back", async () => {
    const values: number[] = [];
    const source = scripted();
    const w = await makeWorld({ random: () => values.shift() ?? source() });
    const alice = await signIn(w);
    const first = await mint(w, alice.access);
    const retired: string[] = [];
    let current: MintedCode = first;
    for (const remaining of [2, 1, 0]) {
      const response = await reroll(w, alice.access, current.id);
      const next = await expectMatchesSchema<MintedCode>(
        response,
        "rerollCode",
        200,
      );
      expect(next.rerolls_remaining).toBe(remaining);
      expect(next.record_id).toBe(first.record_id);
      expect(next.status).toBe("active");
      expect(next.id).not.toBe(current.id);
      retired.push(current.canonical);
      current = next;
    }
    const rows = await count(w, "SELECT count(*) AS n FROM codes");
    const capped = await reroll(w, alice.access, current.id);
    expect(await expectMatchesSchema(capped, "rerollCode", 403)).toEqual({
      error: "reroll-cap",
    });
    // A re-roll at the cap stores nothing, and the current code stays.
    expect(await count(w, "SELECT count(*) AS n FROM codes")).toBe(rows);
    expect((await call(w, "GET", resolvePath(current.canonical))).status).toBe(
      200,
    );

    const history = await codesOf(first.record_id);
    expect(history.filter((row) => row.status === "active")).toHaveLength(1);
    const old = history.filter((row) => row.revoked_reason === "reroll");
    expect(old.map((row) => row.canonical)).toEqual(retired);
    for (const row of old) expect(row.status).toBe("revoked");
    // Each retired code is not-found.
    for (const canonical of retired) {
      expect((await call(w, "GET", resolvePath(canonical))).status).toBe(404);
    }
    // The issuer draws a retired code first; the server draws again.
    for (const canonical of retired) {
      values.push(...indexes(canonical));
      const fresh = await mint(w, alice.access);
      expect(retired).not.toContain(fresh.canonical);
    }
  });

  it("gives two parallel re-rolls of one code one 200 and one reroll-cap, leaving one active code", async () => {
    const w = await makeWorld();
    const alice = await signIn(w);
    const code = await mint(w, alice.access);
    const results = await Promise.all([
      reroll(w, alice.access, code.id),
      reroll(w, alice.access, code.id),
    ]);
    expect(results.map((r) => r.status).sort()).toEqual([200, 403]);
    const loser = results.find((r) => r.status === 403) as Response;
    expect(await loser.json()).toEqual({ error: "reroll-cap" });
    const history = await codesOf(code.record_id);
    expect(history.filter((row) => row.status === "active")).toHaveLength(1);
    expect(history).toHaveLength(2);
    expect(
      await count(
        w,
        "SELECT count(*) AS n FROM audit_events WHERE action = 'code.reroll' AND target_id = ? AND result = 'ok'",
        code.id,
      ),
    ).toBe(1);
  });

  it("answers another account's code id, or an unknown id, with not-found and adds no row", async () => {
    const w = await makeWorld();
    const alice = await signIn(w);
    const bob = await signIn(w, "bob");
    const code = await mint(w, alice.access);
    const rows = await count(w, "SELECT count(*) AS n FROM codes");
    for (const id of [code.id, "no-such-code"]) {
      const response = await reroll(w, bob.access, id);
      expect(await expectMatchesSchema(response, "rerollCode", 404)).toEqual({
        error: "not-found",
      });
    }
    expect(await count(w, "SELECT count(*) AS n FROM codes")).toBe(rows);
  });

  it("is reroll-cap once the code was resolved, revoked, used, or expired", async () => {
    const w = await makeWorld();
    const alice = await signIn(w);
    const resolved = await mint(w, alice.access);
    expect((await call(w, "GET", resolvePath(resolved.canonical))).status).toBe(
      200,
    );
    const revoked = await mint(w, alice.access);
    expect(
      (
        await call(w, "POST", `/v1/codes/${revoked.id}/revoke`, {
          token: alice.access,
        })
      ).status,
    ).toBe(200);
    const used = await mint(w, alice.access, { single_use: true });
    expect((await call(w, "GET", resolvePath(used.canonical))).status).toBe(
      200,
    );
    const expiring = await mint(w, alice.access, {
      expires_at: new Date(w.clock.ms + 60_000).toISOString(),
    });
    w.clock.advance(60_000);
    for (const code of [resolved, revoked, used, expiring]) {
      const response = await reroll(w, alice.access, code.id);
      expect(await expectMatchesSchema(response, "rerollCode", 403)).toEqual({
        error: "reroll-cap",
      });
    }
  });

  it("keeps the record, the scope, single_use, and expires_at on the new code", async () => {
    const w = await makeWorld();
    const alice = await signIn(w);
    const expiresAt = new Date(w.clock.ms + 3_600_000).toISOString();
    const code = await mint(w, alice.access, {
      single_use: true,
      expires_at: expiresAt,
    });
    const next = await (
      await reroll(w, alice.access, code.id)
    ).json<MintedCode>();
    const row = await env.ZZ_DB.prepare("SELECT * FROM codes WHERE id = ?")
      .bind(next.id)
      .first<Record<string, unknown>>();
    expect(row).toMatchObject({
      record_id: code.record_id,
      scope: "free_public",
      single_use: 1,
      expires_at: expiresAt,
      owner_id: alice.accountId,
      kind: "plain",
      list_version: "fixture-7",
    });
  });

  it("draws again when the new code's match_key is taken", async () => {
    const values: number[] = [];
    const source = scripted();
    const w = await makeWorld({ random: () => values.shift() ?? source() });
    const alice = await signIn(w);
    const taken = await mint(w, alice.access);
    const code = await mint(w, alice.access);
    values.push(...indexes(taken.canonical));
    const next = await (
      await reroll(w, alice.access, code.id)
    ).json<MintedCode>();
    expect(next.canonical).not.toBe(taken.canonical);
    expect(next.canonical).not.toBe(code.canonical);
  });

  it("is not-ready while the issuer is off, and 401 with no bearer", async () => {
    const w = await makeWorld();
    const alice = await signIn(w);
    const code = await mint(w, alice.access);
    const off = { ...w, env: { ...w.env, ZZ_MINT_ENABLED: "false" } };
    const notReady = await reroll(off, alice.access, code.id);
    expect(await expectMatchesSchema(notReady, "rerollCode", 503)).toEqual({
      error: "not-ready",
    });
    const anonymous = await call(w, "POST", `/v1/codes/${code.id}/reroll`);
    expect(await expectMatchesSchema(anonymous, "rerollCode", 401)).toEqual({
      error: "unauthorized",
    });
  });
});

describe("re-roll keeps the mint scope rules (RM-032)", () => {
  it("refuses a re-roll after the issuer grant ended, writes nothing, and audits the refusal", async () => {
    const w = await makeWorld();
    const alice = await signIn(w);
    const grantId = crypto.randomUUID();
    await env.ZZ_DB.prepare(
      "INSERT INTO grants (id, subject_id, scope, role, expires_at) VALUES (?, ?, 'logistics', 'issuer', NULL)",
    )
      .bind(grantId, alice.accountId)
      .run();
    const code = await mint(w, alice.access, { scope: "logistics" });
    await env.ZZ_DB.prepare("UPDATE grants SET expires_at = ? WHERE id = ?")
      .bind(new Date(w.clock.ms - 1000).toISOString(), grantId)
      .run();
    const before = await count(w, "SELECT count(*) AS n FROM codes");
    const response = await reroll(w, alice.access, code.id);
    expect(await expectMatchesSchema(response, "rerollCode", 403)).toEqual({
      error: "forbidden",
    });
    expect(await count(w, "SELECT count(*) AS n FROM codes")).toBe(before);
    expect(
      await count(
        w,
        "SELECT count(*) AS n FROM audit_events WHERE action = 'code.reroll' AND result = 'denied' AND target_type = 'scope' AND target_id = 'logistics'",
      ),
    ).toBe(1);
  });

  it("refuses a free_public re-roll once the scope flag is off", async () => {
    const on = await makeWorld();
    const alice = await signIn(on);
    const code = await mint(on, alice.access);
    const off = await makeWorld({ settings: { ZZ_FREE_PUBLIC: "false" } });
    const before = await count(off, "SELECT count(*) AS n FROM codes");
    const response = await reroll(off, alice.access, code.id);
    expect(await expectMatchesSchema(response, "rerollCode", 403)).toEqual({
      error: "scope-unavailable",
    });
    expect(await count(off, "SELECT count(*) AS n FROM codes")).toBe(before);
  });
});
