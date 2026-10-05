import { env } from "cloudflare:workers";
import { describe, expect, it } from "vitest";
import { TIMESTAMP } from "../src/lib/time.ts";
import { call, count, mintRequest, signIn } from "./helpers/http.ts";
import {
  audit,
  DAY,
  expectOperatorEvent,
  type Row,
  runOps,
  UUID_V4,
} from "./helpers/ops.ts";
import { makeWorld } from "./helpers/world.ts";

// The grant files in workers/api/ops (spec 005 plan.md, Operator work,
// T038), and the FR-016 scope of their audit events (D-2026-10-05-07).

describe("ops/grant.sql", () => {
  it("adds an issuer grant, so the account can mint in that scope, with one audit event", async () => {
    const w = await makeWorld();
    const alice = await signIn(w);
    expect(
      (await mintRequest(w, alice.access, { scope: "logistics" })).status,
    ).toBe(403);
    const shown = await runOps("grant.sql", {
      subject_id: alice.accountId,
      scope: "logistics",
      role: "issuer",
      expires_at: "",
    });
    expect(shown).toEqual([
      {
        id: expect.stringMatching(UUID_V4),
        scope: "logistics",
        role: "issuer",
        expires_at: null,
      },
    ]);
    expect(
      (await mintRequest(w, alice.access, { scope: "logistics" })).status,
    ).toBe(201);
    const events = await audit("grant.add");
    expect(events).toHaveLength(1);
    expectOperatorEvent(
      events[0],
      "grant.add",
      "grant",
      shown[0]?.id as string,
    );
  });

  it("adds a viewer or auditor grant with an expiry in the spec 005 form", async () => {
    const w = await makeWorld();
    const alice = await signIn(w);
    const expiry = new Date(w.clock.ms + 30 * DAY).toISOString();
    for (const role of ["viewer", "auditor"]) {
      await runOps("grant.sql", {
        subject_id: alice.accountId,
        scope: "enterprise",
        role,
        expires_at: expiry,
      });
    }
    const grants = await env.ZZ_DB.prepare(
      "SELECT role, expires_at FROM grants WHERE subject_id = ? ORDER BY role",
    )
      .bind(alice.accountId)
      .all<Row>();
    expect(grants.results).toEqual([
      { role: "auditor", expires_at: expiry },
      { role: "viewer", expires_at: expiry },
    ]);
    expect(await audit("grant.add")).toHaveLength(2);
  });

  it("writes nothing for an unknown or deleted account, a bad scope or role, or an expiry in another form", async () => {
    const w = await makeWorld();
    const alice = await signIn(w, "alice");
    const gone = await signIn(w, "gone");
    expect(
      (await call(w, "DELETE", "/v1/me", { token: gone.access })).status,
    ).toBe(204);
    const good = {
      subject_id: alice.accountId,
      scope: "enterprise",
      role: "issuer",
      expires_at: "",
    };
    const cases: Record<string, string>[] = [
      { ...good, subject_id: crypto.randomUUID() },
      { ...good, subject_id: gone.accountId },
      { ...good, scope: "public" },
      { ...good, role: "owner" },
      { ...good, expires_at: "2027-01-01" },
      { ...good, expires_at: "2027-02-30T00:00:00.000Z" },
      { ...good, expires_at: "2027-01-01T00:00:00Z" },
      {},
    ];
    for (const values of cases) {
      await runOps("grant.sql", values);
    }
    expect(await count(w, "SELECT count(*) AS n FROM grants")).toBe(0);
    expect(await audit("grant.add")).toEqual([]);
  });

  it("lists grant.add and grant.remove for the grant's scope's auditor only (D-2026-10-05-07)", async () => {
    const w = await makeWorld();
    const alice = await signIn(w, "alice");
    const enterprise = await signIn(w, "enterprise-auditor");
    const logistics = await signIn(w, "logistics-auditor");
    const grantTo = async (subject: string, scope: string, role: string) => {
      const shown = await runOps("grant.sql", {
        subject_id: subject,
        scope,
        role,
        expires_at: "",
      });
      return shown.find((row) => row.scope === scope && row.role === role)
        ?.id as string;
    };
    const enterpriseAuditor = await grantTo(
      enterprise.accountId,
      "enterprise",
      "auditor",
    );
    const logisticsAuditor = await grantTo(
      logistics.accountId,
      "logistics",
      "auditor",
    );
    const issuer = await grantTo(alice.accountId, "enterprise", "issuer");
    await runOps("remove-grant.sql", { grant_id: issuer });
    const listed = async (token: string) => {
      const response = await call(w, "GET", "/v1/audit?limit=100", { token });
      expect(response.status).toBe(200);
      // Sorted, because two events can share a millisecond.
      return ((await response.json()) as { events: Row[] }).events
        .filter((event) => event.target_type === "grant")
        .map((event) => [event.action, event.target_id, event.actor_id])
        .sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));
    };
    expect(await listed(enterprise.access)).toEqual(
      [
        ["grant.add", enterpriseAuditor, null],
        ["grant.add", issuer, null],
        ["grant.remove", issuer, null],
      ].sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b))),
    );
    expect(await listed(logistics.access)).toEqual([
      ["grant.add", logisticsAuditor, null],
    ]);
  });
});

describe("ops/remove-grant.sql", () => {
  it("ends the grant now, keeps its row, and writes one grant.remove event", async () => {
    const w = await makeWorld();
    const alice = await signIn(w);
    const [granted] = await runOps("grant.sql", {
      subject_id: alice.accountId,
      scope: "enterprise",
      role: "issuer",
      expires_at: "",
    });
    const id = granted?.id as string;
    expect(
      (await mintRequest(w, alice.access, { scope: "enterprise" })).status,
    ).toBe(201);
    const [ended] = await runOps("remove-grant.sql", { grant_id: id });
    expect(ended).toEqual({
      id,
      subject_id: alice.accountId,
      scope: "enterprise",
      role: "issuer",
      expires_at: expect.stringMatching(TIMESTAMP),
    });
    const events = await audit("grant.remove");
    expect(events).toHaveLength(1);
    expectOperatorEvent(events[0], "grant.remove", "grant", id);
    // From its expiry on, the grant no longer lets the account mint.
    w.clock.ms = Date.parse(ended?.expires_at as string);
    const refused = await mintRequest(w, alice.access, { scope: "enterprise" });
    expect(refused.status).toBe(403);
    // Running it again changes nothing and writes no second event.
    await runOps("remove-grant.sql", { grant_id: id });
    expect(
      await count(
        w,
        "SELECT count(*) AS n FROM grants WHERE id = ? AND expires_at = ?",
        id,
        ended?.expires_at,
      ),
    ).toBe(1);
    expect(await audit("grant.remove")).toHaveLength(1);
  });

  it("leaves an expired grant, an unknown id, or an unnamed grant alone", async () => {
    const w = await makeWorld();
    const alice = await signIn(w);
    const past = "2020-01-01T00:00:00.000Z";
    const [granted] = await runOps("grant.sql", {
      subject_id: alice.accountId,
      scope: "logistics",
      role: "viewer",
      expires_at: past,
    });
    await runOps("remove-grant.sql", { grant_id: granted?.id as string });
    await runOps("remove-grant.sql", { grant_id: crypto.randomUUID() });
    await runOps("remove-grant.sql");
    expect(
      await count(
        w,
        "SELECT count(*) AS n FROM grants WHERE expires_at = ?",
        past,
      ),
    ).toBe(1);
    expect(await audit("grant.remove")).toEqual([]);
  });
});
