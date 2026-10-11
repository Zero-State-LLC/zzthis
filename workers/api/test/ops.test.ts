import { createScheduledController } from "cloudflare:test";
import { env } from "cloudflare:workers";
import { describe, expect, it, vi } from "vitest";
import { TIMESTAMP } from "../src/lib/time.ts";
import {
  call,
  count,
  mint,
  mintRequest,
  resolvePath,
  signIn,
} from "./helpers/http.ts";
import {
  audit,
  codeRow,
  DAY,
  expectOperatorEvent,
  report,
  type Row,
  runOps,
} from "./helpers/ops.ts";
import { fixture7Codes } from "./helpers/random.ts";
import { makeWorld } from "./helpers/world.ts";

// The report, suspension, and revoke files in workers/api/ops (spec 005
// plan.md, Operator work, T038). The grant files are in ops-grants.test.ts.

describe("ops/reports.sql", () => {
  it("lists the open reports as written, and closes nothing", async () => {
    const w = await makeWorld();
    const alice = await signIn(w);
    const code = await mint(w, alice.access);
    const first = await report(w, code.canonical);
    w.clock.advance(1000);
    const second = await report(w, code.canonical);
    const listed = await runOps("reports.sql");
    expect(listed.map((row) => row.id)).toEqual([first, second]);
    expect(listed[0]).toEqual({
      id: first,
      canonical: code.canonical,
      code_id: code.id,
      reason: "spam",
      note: "",
      created_at: expect.stringMatching(TIMESTAMP),
    });
    expect(
      await count(
        w,
        "SELECT count(*) AS n FROM reports WHERE closed_at IS NOT NULL",
      ),
    ).toBe(0);
    expect(await audit("report.close")).toEqual([]);
  });

  it("closes one report with one audit event, and the daily run deletes it 365 days later", async () => {
    vi.spyOn(console, "log").mockImplementation(() => {});
    const w = await makeWorld();
    const alice = await signIn(w);
    const code = await mint(w, alice.access);
    const closing = await report(w, code.canonical);
    const open = await report(w, code.canonical);
    const listed = await runOps("reports.sql", { report_id: closing });
    expect(listed.map((row) => row.id)).toEqual([open]);
    const closedAt = (
      await env.ZZ_DB.prepare("SELECT closed_at FROM reports WHERE id = ?")
        .bind(closing)
        .first<{ closed_at: string }>()
    )?.closed_at as string;
    expect(closedAt).toMatch(TIMESTAMP);
    const events = await audit("report.close");
    expect(events).toHaveLength(1);
    expectOperatorEvent(events[0], "report.close", "report", closing);
    // A second close keeps the first closed_at and writes no second event.
    await runOps("reports.sql", { report_id: closing });
    expect(
      await count(
        w,
        "SELECT count(*) AS n FROM reports WHERE id = ? AND closed_at = ?",
        closing,
        closedAt,
      ),
    ).toBe(1);
    expect(await audit("report.close")).toHaveLength(1);
    // B3 (D-2026-10-05-06): kept until 365 days after closed_at.
    const sweep = () =>
      w.worker.scheduled(
        createScheduledController({ cron: "17 3 * * *" }),
        w.env,
      );
    w.clock.ms = Date.parse(closedAt) + 365 * DAY - 1;
    await sweep();
    expect(await count(w, "SELECT count(*) AS n FROM reports")).toBe(2);
    w.clock.ms = Date.parse(closedAt) + 365 * DAY;
    await sweep();
    const left = await env.ZZ_DB.prepare("SELECT id FROM reports").all<Row>();
    expect(left.results).toEqual([{ id: open }]);
  });
});

describe("ops/suspend.sql", () => {
  it("suspends the account and revokes its active codes, with one audit event", async () => {
    const w = await makeWorld();
    const alice = await signIn(w, "alice");
    const bob = await signIn(w, "bob");
    const active = await mint(w, alice.access);
    const ownRevoked = await mint(w, alice.access);
    expect(
      (
        await call(w, "POST", `/v1/codes/${ownRevoked.id}/revoke`, {
          token: alice.access,
        })
      ).status,
    ).toBe(200);
    const bobs = await mint(w, bob.access);
    const shown = await runOps("suspend.sql", { account_id: alice.accountId });
    expect(shown).toEqual([
      {
        id: alice.accountId,
        suspended_at: expect.stringMatching(TIMESTAMP),
        deleted_at: null,
      },
    ]);
    expect(await codeRow(active.id)).toEqual({
      status: "revoked",
      revoked_reason: "operator",
    });
    expect(await codeRow(ownRevoked.id)).toEqual({
      status: "revoked",
      revoked_reason: "owner",
    });
    expect(await codeRow(bobs.id)).toEqual({
      status: "active",
      revoked_reason: null,
    });
    const events = await audit("account.suspend");
    expect(events).toHaveLength(1);
    expectOperatorEvent(
      events[0],
      "account.suspend",
      "account",
      alice.accountId,
    );
    // FR-025: writes are refused, the account can still be read.
    const write = await mintRequest(w, alice.access);
    expect(write.status).toBe(403);
    expect(await write.json()).toEqual({ error: "forbidden" });
    expect(
      (await call(w, "GET", "/v1/me", { token: alice.access })).status,
    ).toBe(200);
    expect((await call(w, "GET", resolvePath(active.canonical))).status).toBe(
      404,
    );
    // Running it again changes nothing and writes no second event.
    await runOps("suspend.sql", { account_id: alice.accountId });
    expect(
      await count(
        w,
        "SELECT count(*) AS n FROM accounts WHERE id = ? AND suspended_at = ?",
        alice.accountId,
        shown[0]?.suspended_at,
      ),
    ).toBe(1);
    expect(await audit("account.suspend")).toHaveLength(1);
  });

  it("leaves a deleted, unknown, or unnamed account alone", async () => {
    const w = await makeWorld();
    const gone = await signIn(w, "gone");
    expect(
      (await call(w, "DELETE", "/v1/me", { token: gone.access })).status,
    ).toBe(204);
    const alice = await signIn(w, "alice");
    const code = await mint(w, alice.access);
    await runOps("suspend.sql", { account_id: gone.accountId });
    await runOps("suspend.sql", { account_id: crypto.randomUUID() });
    // The placeholder left as written matches no account.
    await runOps("suspend.sql");
    expect(
      await count(
        w,
        "SELECT count(*) AS n FROM accounts WHERE suspended_at IS NOT NULL",
      ),
    ).toBe(0);
    expect(await codeRow(code.id)).toEqual({
      status: "active",
      revoked_reason: null,
    });
    expect(await audit("account.suspend")).toEqual([]);
  });
});

describe("ops/unsuspend.sql", () => {
  it("lifts the suspension with one audit event, and revoked codes stay revoked", async () => {
    const w = await makeWorld();
    const alice = await signIn(w);
    const code = await mint(w, alice.access);
    await runOps("suspend.sql", { account_id: alice.accountId });
    expect((await mintRequest(w, alice.access)).status).toBe(403);
    const shown = await runOps("unsuspend.sql", {
      account_id: alice.accountId,
    });
    expect(shown).toEqual([
      { id: alice.accountId, suspended_at: null, deleted_at: null },
    ]);
    const events = await audit("account.unsuspend");
    expect(events).toHaveLength(1);
    expectOperatorEvent(
      events[0],
      "account.unsuspend",
      "account",
      alice.accountId,
    );
    expect(await codeRow(code.id)).toEqual({
      status: "revoked",
      revoked_reason: "operator",
    });
    expect((await mintRequest(w, alice.access)).status).toBe(201);
    // Running it again changes nothing and writes no second event.
    await runOps("unsuspend.sql", { account_id: alice.accountId });
    expect(await audit("account.unsuspend")).toHaveLength(1);
  });

  it("leaves an account that is not suspended, deleted, unknown, or unnamed alone", async () => {
    const w = await makeWorld();
    const alice = await signIn(w, "alice");
    const gone = await signIn(w, "gone");
    await runOps("suspend.sql", { account_id: gone.accountId });
    expect(
      (await call(w, "DELETE", "/v1/me", { token: gone.access })).status,
    ).toBe(204);
    const cases: Record<string, string>[] = [
      { account_id: alice.accountId },
      { account_id: gone.accountId },
      { account_id: crypto.randomUUID() },
      {},
    ];
    for (const values of cases) {
      await runOps("unsuspend.sql", values);
    }
    expect(
      await count(
        w,
        "SELECT count(*) AS n FROM accounts WHERE id = ? AND suspended_at IS NOT NULL",
        gone.accountId,
      ),
    ).toBe(1);
    expect(await audit("account.unsuspend")).toEqual([]);
  });
});

describe("ops/revoke-code.sql", () => {
  it("revokes the reported code with one audit event, which the scope's auditor sees", async () => {
    const w = await makeWorld();
    const issuer = await signIn(w, "issuer");
    const auditor = await signIn(w, "auditor");
    for (const [subject, role] of [
      [issuer.accountId, "issuer"],
      [auditor.accountId, "auditor"],
    ] as const) {
      await runOps("grant.sql", {
        subject_id: subject,
        scope: "enterprise",
        role,
        expires_at: "",
        org_id: "acme",
        same_org: "enterprise",
      });
      await runOps("set-org.sql", { account_id: subject, org_id: "acme" });
    }
    const code = await mint(w, issuer.access, { scope: "enterprise" });
    await report(w, code.canonical);
    const [listed] = await runOps("reports.sql");
    const shown = await runOps("revoke-code.sql", {
      code_id: listed?.code_id as string,
    });
    expect(shown).toEqual([
      {
        id: code.id,
        canonical: code.canonical,
        scope: "enterprise",
        status: "revoked",
        revoked_reason: "operator",
      },
    ]);
    const events = await audit("code.revoke");
    expect(events).toHaveLength(1);
    expectOperatorEvent(events[0], "code.revoke", "code", code.id);
    expect((await call(w, "GET", resolvePath(code.canonical))).status).toBe(
      404,
    );
    // FR-016: the event's scope is the code's, so the auditor lists it.
    const seen = await call(w, "GET", "/v1/audit?limit=100", {
      token: auditor.access,
    });
    const listedEvents = (
      (await seen.json()) as { events: { action: string; actor_id: unknown }[] }
    ).events.filter((event) => event.action === "code.revoke");
    expect(listedEvents).toEqual([
      expect.objectContaining({ action: "code.revoke", actor_id: null }),
    ]);
    // Running it again changes nothing and writes no second event.
    await runOps("revoke-code.sql", { code_id: code.id });
    expect(await audit("code.revoke")).toHaveLength(1);
  });

  it("leaves a code that is not active alone", async () => {
    const w = await makeWorld();
    const alice = await signIn(w);
    const code = await mint(w, alice.access);
    expect(
      (
        await call(w, "POST", `/v1/codes/${code.id}/revoke`, {
          token: alice.access,
        })
      ).status,
    ).toBe(200);
    const shown = await runOps("revoke-code.sql", { code_id: code.id });
    expect(shown[0]).toMatchObject({
      status: "revoked",
      revoked_reason: "owner",
    });
    await runOps("revoke-code.sql");
    expect(
      await count(
        w,
        "SELECT count(*) AS n FROM audit_events WHERE action = 'code.revoke' AND actor_id IS NULL",
      ),
    ).toBe(0);
  });
});

describe("moderation (RM-102, FR-025, D-2026-10-10-25)", () => {
  // Sets a report's arrival time, so the queue's age columns can be checked
  // against SQLite's clock, which the operator files read.
  async function arrivedHoursAgo(id: string, hours: number): Promise<string> {
    const at = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
    await env.ZZ_DB.prepare("UPDATE reports SET created_at = ? WHERE id = ?")
      .bind(at, id)
      .run();
    return at;
  }

  it("lists every open report oldest first, with its age, the overdue flag, and the owner", async () => {
    const w = await makeWorld();
    const alice = await signIn(w, "alice");
    const bob = await signIn(w, "bob");
    const aliceCode = await mint(w, alice.access);
    const bobCode = await mint(w, bob.access);
    const old = await report(w, aliceCode.canonical);
    const again = await report(w, aliceCode.canonical);
    const fresh = await report(w, bobCode.canonical);
    const closed = await report(w, bobCode.canonical);
    await arrivedHoursAgo(old, 30);
    await arrivedHoursAgo(again, 23);
    await arrivedHoursAgo(fresh, 1);
    await arrivedHoursAgo(closed, 40);
    await runOps("reports.sql", { report_id: closed });
    await runOps("suspend.sql", { account_id: bob.accountId });
    const events = () => count(w, "SELECT count(*) AS n FROM audit_events");
    const before = await events();
    const queue = await runOps("report-queue.sql");
    expect(queue.map((row) => row.id)).toEqual([old, again, fresh]);
    expect(queue[0]).toEqual({
      id: old,
      canonical: aliceCode.canonical,
      reason: "spam",
      note: "",
      created_at: expect.stringMatching(TIMESTAMP),
      hours_open: 30,
      overdue: 1,
      open_for_code: 2,
      code_id: aliceCode.id,
      code_status: "active",
      owner_id: alice.accountId,
      owner_suspended: 0,
    });
    expect(queue[1]).toMatchObject({ hours_open: 23, overdue: 0 });
    expect(queue[2]).toMatchObject({
      hours_open: 1,
      overdue: 0,
      open_for_code: 1,
      code_status: "revoked",
      owner_id: bob.accountId,
      owner_suspended: 1,
    });
    // Read only: nothing changed, and no audit row was written.
    expect(
      await count(
        w,
        "SELECT count(*) AS n FROM reports WHERE closed_at IS NULL",
      ),
    ).toBe(3);
    expect(await events()).toBe(before);
  });

  it("names no code or owner for a report of a code that was never issued", async () => {
    const w = await makeWorld();
    // This world mints nothing, so every fixture-7 code is unissued.
    const response = await call(w, "POST", "/v1/reports", {
      body: { canonical: fixture7Codes()[0] as string, reason: "other" },
    });
    expect(response.status).toBe(202);
    const [row] = await runOps("report-queue.sql");
    expect(row).toMatchObject({
      code_id: null,
      code_status: null,
      owner_id: null,
      owner_suspended: null,
      open_for_code: 1,
    });
  });

  it("lists in report-overdue.sql only the reports open for more than one day", async () => {
    const w = await makeWorld();
    const alice = await signIn(w);
    const code = await mint(w, alice.access);
    const late = await report(w, code.canonical);
    const edge = await report(w, code.canonical);
    const fresh = await report(w, code.canonical);
    await arrivedHoursAgo(late, 25);
    await arrivedHoursAgo(edge, 23.9);
    await arrivedHoursAgo(fresh, 0);
    const overdue = await runOps("report-overdue.sql");
    expect(overdue).toEqual([
      {
        id: late,
        canonical: code.canonical,
        reason: "spam",
        created_at: expect.stringMatching(TIMESTAMP),
        hours_open: 25,
      },
    ]);
    // Acting on it and closing it meets the target: zero rows.
    await runOps("revoke-code.sql", { code_id: code.id });
    await runOps("reports.sql", { report_id: late });
    expect(await runOps("report-overdue.sql")).toEqual([]);
  });

  it("suspension refuses mint, re-roll, and record writes with 403, and unsuspend restores them", async () => {
    const w = await makeWorld();
    const alice = await signIn(w);
    const code = await mint(w, alice.access);
    await runOps("suspend.sql", { account_id: alice.accountId });
    const [suspended] = await audit("account.suspend");
    expectOperatorEvent(
      suspended,
      "account.suspend",
      "account",
      alice.accountId,
    );
    const writes = () => [
      mintRequest(w, alice.access),
      call(w, "POST", `/v1/codes/${code.id}/reroll`, { token: alice.access }),
      call(w, "POST", `/v1/records/${code.record_id}/versions`, {
        token: alice.access,
        body: { title: "v2", body: "" },
      }),
    ];
    for (const response of await Promise.all(writes())) {
      expect(response.status).toBe(403);
      expect(await response.json()).toEqual({ error: "forbidden" });
    }
    await runOps("unsuspend.sql", { account_id: alice.accountId });
    // The suspension revoked the code, so re-roll is tried on a new one.
    const minted = await mintRequest(w, alice.access);
    expect(minted.status).toBe(201);
    const next = (await minted.json()) as { id: string; record_id: string };
    const rerolled = await call(w, "POST", `/v1/codes/${next.id}/reroll`, {
      token: alice.access,
    });
    expect(rerolled.status).toBe(200);
    const version = await call(
      w,
      "POST",
      `/v1/records/${next.record_id}/versions`,
      {
        token: alice.access,
        body: { title: "v2", body: "" },
      },
    );
    expect(version.status).toBe(201);
  });
});
