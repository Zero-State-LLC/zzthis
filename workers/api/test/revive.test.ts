import { env } from "cloudflare:workers";
import { afterEach, describe, expect, it, vi } from "vitest";
import { TIMESTAMP } from "../src/lib/time.ts";
import {
  call,
  mint,
  sessionFrom,
  signIn,
  type MintedCode,
} from "./helpers/http.ts";
import {
  DAY,
  events,
  grant,
  IDLE,
  idleExpiredAt,
  idleSince,
  lastActive,
  listStatus,
  refresh,
  resolve,
  run,
  suspend,
} from "./helpers/idle.ts";
import { runOps, UUID_V4 } from "./helpers/ops.ts";
import { expectMatchesSchema } from "./helpers/schema.ts";
import { makeWorld } from "./helpers/world.ts";

// Revive (D-2026-10-13-01, RM-127): the owner's next sign-in or refresh
// turns idle-expired codes back on, unless the account is suspended.

afterEach(() => {
  vi.restoreAllMocks();
});

describe("revive (D-2026-10-13-01)", () => {
  it("turns every idle-expired code back on at the owner's next sign-in, with one code.revive event each", async () => {
    vi.spyOn(console, "log").mockImplementation(() => {});
    const w = await makeWorld();
    const alice = await signIn(w);
    const one = await mint(w, alice.access);
    const two = await mint(w, alice.access);
    w.clock.advance(IDLE + DAY);
    await run(w);
    expect((await resolve(w, one.canonical)).status).toBe(404);
    const again = await signIn(w);
    expect(again.accountId).toBe(alice.accountId);
    expect(await lastActive(alice.accountId)).toBe(
      new Date(w.clock.ms).toISOString(),
    );
    for (const code of [one, two]) {
      expect((await resolve(w, code.canonical)).status).toBe(200);
      expect(await idleExpiredAt(code.id)).toBeNull();
    }
    expect(await listStatus(w, again.access)).toEqual({
      [one.id]: "active",
      [two.id]: "active",
    });
    const revived = await events("code.revive");
    expect(revived.map((e) => e.target_id).sort()).toEqual(
      [one.id, two.id].sort(),
    );
    for (const event of revived) {
      expect(event).toMatchObject({
        actor_id: alice.accountId,
        target_type: "code",
        result: "ok",
      });
      expect(event.id).toMatch(UUID_V4);
      expect(event.created_at).toMatch(TIMESTAMP);
    }
    // A later sign-in has nothing to revive.
    await signIn(w);
    expect(await events("code.revive")).toHaveLength(2);
  });

  it("revives at a refresh, and a refused refresh revives nothing", async () => {
    vi.spyOn(console, "log").mockImplementation(() => {});
    const w = await makeWorld();
    const alice = await signIn(w);
    const other = await signIn(w);
    const code: MintedCode = await mint(w, alice.access);
    const idle = w.clock.ms - IDLE - DAY;
    await idleSince(alice.accountId, idle);
    await run(w);
    expect((await resolve(w, code.canonical)).status).toBe(404);
    // A revoked refresh token is refused: no revive, no activity.
    await call(w, "POST", "/v1/auth/revoke", {
      body: { refresh_token: other.refresh },
    });
    expect((await refresh(w, other)).status).toBe(401);
    expect((await resolve(w, code.canonical)).status).toBe(404);
    expect(await events("code.revive")).toEqual([]);
    expect(await lastActive(alice.accountId)).toBe(
      new Date(idle).toISOString(),
    );
    w.clock.advance(1);
    const next = await sessionFrom(await refresh(w, alice));
    expect(next.accountId).toBe(alice.accountId);
    expect((await resolve(w, code.canonical)).status).toBe(200);
    const revived = await events("code.revive");
    expect(revived).toHaveLength(1);
    expect(revived[0]).toMatchObject({
      actor_id: alice.accountId,
      target_id: code.id,
      created_at: new Date(w.clock.ms).toISOString(),
    });
    expect(await lastActive(alice.accountId)).toBe(
      new Date(w.clock.ms).toISOString(),
    );
  });

  it("does not revive a suspended owner's codes, but counts the sign-in as activity", async () => {
    vi.spyOn(console, "log").mockImplementation(() => {});
    const w = await makeWorld();
    const alice = await signIn(w);
    const code = await mint(w, alice.access);
    w.clock.advance(IDLE + DAY);
    await run(w);
    await suspend(alice.accountId, w.clock.ms);
    const suspended = await signIn(w);
    expect((await resolve(w, code.canonical)).status).toBe(404);
    expect(await events("code.revive")).toEqual([]);
    expect(await lastActive(alice.accountId)).toBe(
      new Date(w.clock.ms).toISOString(),
    );
    // Unsuspended the same UTC day: the next refresh revives, although
    // last_active_at was already written today.
    await env.ZZ_DB.prepare(
      "UPDATE accounts SET suspended_at = NULL WHERE id = ?",
    )
      .bind(alice.accountId)
      .run();
    w.clock.advance(1000);
    expect((await refresh(w, suspended)).status).toBe(200);
    expect((await resolve(w, code.canonical)).status).toBe(200);
    expect(await events("code.revive")).toHaveLength(1);
  });

  it("does not bring back a code the operator revoked while it was idle-expired", async () => {
    vi.spyOn(console, "log").mockImplementation(() => {});
    const w = await makeWorld();
    const alice = await signIn(w);
    const code = await mint(w, alice.access);
    w.clock.advance(IDLE + DAY);
    await run(w);
    await runOps("suspend.sql", { account_id: alice.accountId });
    await runOps("unsuspend.sql", { account_id: alice.accountId });
    w.clock.advance(1);
    await signIn(w);
    expect((await resolve(w, code.canonical)).status).toBe(404);
    expect(await events("code.revive")).toEqual([]);
  });

  it("writes last_active_at at most once per UTC day", async () => {
    const w = await makeWorld();
    w.clock.ms = Date.parse("2026-11-02T10:00:00.000Z");
    const alice = await signIn(w);
    expect(await lastActive(alice.accountId)).toBe("2026-11-02T10:00:00.000Z");
    w.clock.ms = Date.parse("2026-11-02T23:59:59.999Z");
    const later = await sessionFrom(await refresh(w, alice));
    await signIn(w);
    expect(await lastActive(alice.accountId)).toBe("2026-11-02T10:00:00.000Z");
    w.clock.ms = Date.parse("2026-11-03T00:00:00.000Z");
    await refresh(w, later);
    expect(await lastActive(alice.accountId)).toBe("2026-11-03T00:00:00.000Z");
    w.clock.ms = Date.parse("2026-11-03T08:00:00.000Z");
    await signIn(w);
    expect(await lastActive(alice.accountId)).toBe("2026-11-03T00:00:00.000Z");
  });

  it("lets a free_public auditor read its own codes' expire and revive events (FR-016)", async () => {
    vi.spyOn(console, "log").mockImplementation(() => {});
    const w = await makeWorld();
    const alice = await signIn(w);
    await grant(alice.accountId, "free_public", "auditor");
    const code = await mint(w, alice.access);
    const bob = await signIn(w, "bob");
    await grant(bob.accountId, "free_public", "auditor");
    w.clock.advance(IDLE + DAY);
    await run(w);
    w.clock.advance(1);
    const again = await signIn(w);
    const response = await call(w, "GET", `/v1/audit?code_id=${code.id}`, {
      token: again.access,
    });
    const body = await expectMatchesSchema<{
      events: { action: string }[];
    }>(response, "listAudit", 200);
    expect(body.events.map((e) => e.action)).toEqual([
      "code.mint",
      "code.expire",
      "code.revive",
    ]);
    // Bob's grant has no organization, so it reaches only his own codes.
    const bobAgain = await signIn(w, "bob");
    const other = await call(w, "GET", `/v1/audit?code_id=${code.id}`, {
      token: bobAgain.access,
    });
    expect(
      (
        await expectMatchesSchema<{ events: unknown[] }>(
          other,
          "listAudit",
          200,
        )
      ).events,
    ).toEqual([]);
  });
});
