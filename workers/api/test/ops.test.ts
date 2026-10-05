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
      });
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
