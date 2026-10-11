import { describe, expect, it } from "vitest";
import { call, count, signIn } from "./helpers/http.ts";
import { audit, expectOperatorEvent, runOps } from "./helpers/ops.ts";
import { makeWorld } from "./helpers/world.ts";

// ops/set-org.sql: the interim tenant key on accounts (D-2026-10-10-22,
// RM-074, #135).

describe("ops/set-org.sql", () => {
  it("sets an account's org_id with one account.org.set event, and clears it", async () => {
    const w = await makeWorld();
    const alice = await signIn(w);
    const shown = await runOps("set-org.sql", {
      account_id: alice.accountId,
      org_id: "acme",
    });
    expect(shown).toEqual([{ id: alice.accountId, org_id: "acme" }]);
    const events = await audit("account.org.set");
    expect(events).toHaveLength(1);
    expectOperatorEvent(
      events[0],
      "account.org.set",
      "account",
      alice.accountId,
    );
    // The same org_id again changes nothing and writes no second event.
    await runOps("set-org.sql", {
      account_id: alice.accountId,
      org_id: "acme",
    });
    expect(await audit("account.org.set")).toHaveLength(1);
    // Empty clears it, once.
    for (let i = 0; i < 2; i += 1) {
      const [cleared] = await runOps("set-org.sql", {
        account_id: alice.accountId,
        org_id: "",
      });
      expect(cleared).toEqual({ id: alice.accountId, org_id: null });
    }
    expect(await audit("account.org.set")).toHaveLength(2);
    // The longest org_id the form allows.
    const longest = `a-${"9".repeat(62)}`;
    await runOps("set-org.sql", {
      account_id: alice.accountId,
      org_id: longest,
    });
    expect(
      await count(
        w,
        "SELECT count(*) AS n FROM accounts WHERE org_id = ?",
        longest,
      ),
    ).toBe(1);
  });

  it("writes nothing for an unknown or deleted account, an org_id in another form, or a placeholder left as written", async () => {
    const w = await makeWorld();
    const alice = await signIn(w, "alice");
    const gone = await signIn(w, "gone");
    expect(
      (await call(w, "DELETE", "/v1/me", { token: gone.access })).status,
    ).toBe(204);
    const cases: Record<string, string>[] = [
      { account_id: crypto.randomUUID(), org_id: "acme" },
      { account_id: gone.accountId, org_id: "acme" },
      { account_id: alice.accountId, org_id: "Acme" },
      { account_id: alice.accountId, org_id: "acme corp" },
      { account_id: alice.accountId, org_id: "acme_1" },
      { account_id: alice.accountId, org_id: "a".repeat(65) },
      { account_id: alice.accountId },
      {},
    ];
    for (const values of cases) {
      await runOps("set-org.sql", values);
    }
    expect(
      await count(
        w,
        "SELECT count(*) AS n FROM accounts WHERE org_id IS NOT NULL",
      ),
    ).toBe(0);
    expect(await audit("account.org.set")).toEqual([]);
  });

  it("is listed for no auditor, like every account event (FR-016)", async () => {
    const w = await makeWorld();
    const auditor = await signIn(w, "auditor");
    await runOps("set-org.sql", {
      account_id: auditor.accountId,
      org_id: "acme",
    });
    await runOps("grant.sql", {
      subject_id: auditor.accountId,
      scope: "enterprise",
      role: "auditor",
      org_id: "acme",
      expires_at: "",
      same_org: "",
    });
    const response = await call(w, "GET", "/v1/audit?limit=100", {
      token: auditor.access,
    });
    expect(response.status).toBe(200);
    const { events } = await response.json<{
      events: { action: string }[];
    }>();
    expect(events.map((event) => event.action)).toEqual(["grant.add"]);
  });
});
