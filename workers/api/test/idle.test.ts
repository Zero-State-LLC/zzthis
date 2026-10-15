import { env } from "cloudflare:workers";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PURGE_MAX } from "../src/account/me.ts";
import { cacheKey } from "../src/resolve/cache.ts";
import { runRetention } from "../src/retention/cron.ts";
import { call, count, mint, signIn } from "./helpers/http.ts";
import {
  answer,
  bulkCodes,
  DAY,
  events,
  grant,
  IDLE,
  idleExpiredAt,
  lastActive,
  listStatus,
  resolve,
  run,
} from "./helpers/idle.ts";
import { UUID_V4 } from "./helpers/ops.ts";
import { scripted, unknownCode } from "./helpers/random.ts";
import { expectMatchesSchema } from "./helpers/schema.ts";
import { makeWorld } from "./helpers/world.ts";

// Idle expiry (D-2026-10-13-01, RM-127): free_public codes of an owner idle
// more than 90 days stop resolving after the daily run. Revive is in
// revive.test.ts.

const SMALL = { batch: 3, rounds: 2, revocations: 2 };

afterEach(() => {
  vi.restoreAllMocks();
});

describe("idle expiry (D-2026-10-13-01)", () => {
  it("expires a free_public code after more than 90 days idle and one run, with the one not-found body", async () => {
    vi.spyOn(console, "log").mockImplementation(() => {});
    const w = await makeWorld();
    const alice = await signIn(w);
    const code = await mint(w, alice.access);
    // Resolved once, signed out, so the edge cache holds it.
    expect((await resolve(w, code.canonical)).status).toBe(200);
    const unknown = await answer(await resolve(w, await unknownCode()));
    // Exactly 90 days is not more than 90 days.
    w.clock.advance(IDLE);
    await run(w);
    expect((await resolve(w, code.canonical)).status).toBe(200);
    expect(await events("code.expire")).toEqual([]);
    w.clock.advance(1);
    const purges = vi.spyOn(caches.default, "delete");
    await run(w);
    // The run purged the cached key, so the next resolve reads D1.
    expect(purges).toHaveBeenCalledWith(cacheKey(code.canonical));
    expect(await answer(await resolve(w, code.canonical))).toEqual(unknown);
    expect(unknown.status).toBe(404);
    expect(await idleExpiredAt(code.id)).toBe(
      new Date(w.clock.ms).toISOString(),
    );
    const expired = await events("code.expire");
    expect(expired).toHaveLength(1);
    expect(expired[0]).toMatchObject({
      actor_id: null,
      target_type: "code",
      target_id: code.id,
      result: "ok",
      created_at: new Date(w.clock.ms).toISOString(),
    });
    expect(expired[0]?.id).toMatch(UUID_V4);
    // The code row stays, active, with its match_key taken (never
    // reissued); a second run writes no second event.
    expect(
      await count(
        w,
        "SELECT count(*) AS n FROM codes WHERE id = ? AND status = 'active'",
        code.id,
      ),
    ).toBe(1);
    await run(w);
    expect(await events("code.expire")).toHaveLength(1);
  });

  it("shows an idle-expired code as expired in GET /v1/me/codes, with no wire change", async () => {
    const w = await makeWorld();
    const alice = await signIn(w);
    const idle = await mint(w, alice.access);
    const timed = await mint(w, alice.access, {
      expires_at: new Date(w.clock.ms + 1000).toISOString(),
    });
    const live = await mint(w, alice.access);
    await env.ZZ_DB.prepare("UPDATE codes SET idle_expired_at = ? WHERE id = ?")
      .bind(new Date(w.clock.ms).toISOString(), idle.id)
      .run();
    w.clock.advance(1000);
    expect(await listStatus(w, alice.access)).toEqual({
      [idle.id]: "expired",
      [timed.id]: "expired",
      [live.id]: "active",
    });
  });

  it("never expires enterprise or logistics codes, and leaves other scopes' codes alone", async () => {
    vi.spyOn(console, "log").mockImplementation(() => {});
    const w = await makeWorld();
    const alice = await signIn(w);
    await grant(alice.accountId, "enterprise", "issuer");
    await grant(alice.accountId, "logistics", "issuer");
    const ent = await mint(w, alice.access, { scope: "enterprise" });
    const log = await mint(w, alice.access, { scope: "logistics" });
    const pub = await mint(w, alice.access);
    w.clock.advance(IDLE + DAY);
    await run(w);
    expect((await resolve(w, ent.canonical)).status).toBe(200);
    expect((await resolve(w, log.canonical)).status).toBe(200);
    expect((await resolve(w, pub.canonical)).status).toBe(404);
    expect(await idleExpiredAt(ent.id)).toBeNull();
    expect(await idleExpiredAt(log.id)).toBeNull();
    expect((await events("code.expire")).map((e) => e.target_id)).toEqual([
      pub.id,
    ]);
  });

  it("skips codes that are already revoked, used, or past their own expiry", async () => {
    vi.spyOn(console, "log").mockImplementation(() => {});
    const w = await makeWorld();
    const alice = await signIn(w);
    const revoked = await mint(w, alice.access);
    await call(w, "POST", `/v1/codes/${revoked.id}/revoke`, {
      token: alice.access,
    });
    const used = await mint(w, alice.access, { single_use: true });
    await resolve(w, used.canonical);
    const timed = await mint(w, alice.access, {
      expires_at: new Date(w.clock.ms + DAY).toISOString(),
    });
    w.clock.advance(IDLE + DAY);
    await run(w);
    expect(await events("code.expire")).toEqual([]);
    for (const code of [revoked, used, timed]) {
      expect(await idleExpiredAt(code.id)).toBeNull();
    }
  });

  it("does not count another person's scans as the owner's activity", async () => {
    vi.spyOn(console, "log").mockImplementation(() => {});
    const w = await makeWorld();
    const alice = await signIn(w);
    const code = await mint(w, alice.access);
    const since = await lastActive(alice.accountId);
    for (let day = 0; day < 91; day += 10) {
      w.clock.advance(10 * DAY);
      const bob = await signIn(w, "bob");
      expect((await resolve(w, code.canonical)).status).toBe(200);
      expect((await resolve(w, code.canonical, bob.access)).status).toBe(200);
    }
    expect(await lastActive(alice.accountId)).toBe(since);
    await run(w);
    expect((await resolve(w, code.canonical)).status).toBe(404);
  });

  it("does at most batch times rounds rows per run, and the backlog clears over runs", async () => {
    vi.spyOn(console, "log").mockImplementation(() => {});
    const w = await makeWorld();
    const alice = await signIn(w);
    const code = await mint(w, alice.access);
    await bulkCodes(w, alice, code.record_id, 6, false);
    w.clock.advance(IDLE + DAY);
    expect(await runRetention(w.env, w.deps, SMALL)).toMatchObject({
      idleExpired: 6,
    });
    expect(await events("code.expire")).toHaveLength(6);
    expect(await runRetention(w.env, w.deps, SMALL)).toMatchObject({
      idleExpired: 1,
    });
    expect(await events("code.expire")).toHaveLength(7);
    expect(
      await count(
        w,
        "SELECT count(*) AS n FROM codes WHERE idle_expired_at IS NULL",
      ),
    ).toBe(0);
  });

  it("purges at most PURGE_MAX cache keys per run, only for codes that could be cached", async () => {
    vi.spyOn(console, "log").mockImplementation(() => {});
    const w = await makeWorld();
    const alice = await signIn(w);
    const code = await mint(w, alice.access);
    await bulkCodes(w, alice, code.record_id, PURGE_MAX + 20, true);
    await bulkCodes(w, alice, code.record_id, 30, false);
    w.clock.advance(IDLE + DAY);
    const purges = vi.spyOn(caches.default, "delete");
    const report = await runRetention(w.env, w.deps);
    expect(report).toMatchObject({ idleExpired: PURGE_MAX + 51 });
    expect(purges).toHaveBeenCalledTimes(PURGE_MAX);
    for (const [key] of purges.mock.calls) {
      expect(String(key)).toContain("zz-bulk-");
    }
  });

  it("logs a failed idle-expiry step by name, writes nothing for it, and runs the others", async () => {
    const logs = vi.spyOn(console, "log").mockImplementation(() => {});
    const errors = vi.spyOn(console, "error").mockImplementation(() => {});
    const w = await makeWorld();
    const alice = await signIn(w);
    const code = await mint(w, alice.access);
    await env.ZZ_DB.prepare(
      "CREATE TRIGGER expire_down BEFORE INSERT ON audit_events WHEN NEW.action = 'code.expire' BEGIN SELECT RAISE (ABORT, 'audit down'); END",
    ).run();
    w.clock.advance(IDLE + DAY);
    await run(w);
    expect(errors.mock.calls.map((args) => String(args[0]))).toContain(
      JSON.stringify({ event: "retention-step-fault", step: "idle-expiry" }),
    );
    // The mark and its event are one batch: no event, no mark.
    expect(await idleExpiredAt(code.id)).toBeNull();
    const report = logs.mock.calls
      .map((args) => String(args[0]))
      .find((line) => line.includes('"retention"'));
    expect(JSON.parse(report as string)).toMatchObject({
      event: "retention",
      idleExpired: 0,
      nonces: 1,
    });
  });

  it("never reissues an idle-expired code's words", async () => {
    vi.spyOn(console, "log").mockImplementation(() => {});
    // Both mints draw the same first code; the second draws again.
    const w = await makeWorld({ random: scripted(0, 1, 0, 1) });
    const alice = await signIn(w);
    const first = await mint(w, alice.access);
    w.clock.advance(IDLE + DAY);
    await run(w);
    const bob = await signIn(w, "bob");
    const second = await mint(w, bob.access);
    expect(second.canonical).not.toBe(first.canonical);
    expect((await resolve(w, first.canonical)).status).toBe(404);
  });

  it("refuses to re-roll an idle-expired code, as for any other refused re-roll", async () => {
    const w = await makeWorld();
    const alice = await signIn(w);
    const code = await mint(w, alice.access);
    await env.ZZ_DB.prepare("UPDATE codes SET idle_expired_at = ? WHERE id = ?")
      .bind(new Date(w.clock.ms).toISOString(), code.id)
      .run();
    const rows = await count(w, "SELECT count(*) AS n FROM codes");
    const response = await call(w, "POST", `/v1/codes/${code.id}/reroll`, {
      token: alice.access,
    });
    expect(await expectMatchesSchema(response, "rerollCode", 403)).toEqual({
      error: "reroll-cap",
    });
    expect(await count(w, "SELECT count(*) AS n FROM codes")).toBe(rows);
    expect(await events("code.reroll")).toEqual([]);
  });
});
