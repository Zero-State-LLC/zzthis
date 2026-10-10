import { env } from "cloudflare:workers";
import { describe, expect, it } from "vitest";
import { TIMESTAMP } from "../src/lib/time.ts";
import {
  call,
  count,
  mint,
  mintRequest,
  resolvePath,
  signIn,
  type Session,
} from "./helpers/http.ts";
import {
  audit,
  DAY,
  expectOperatorEvent,
  type Row,
  runOps,
  UUID_V4,
} from "./helpers/ops.ts";
import { makeWorld, type World } from "./helpers/world.ts";

// The grant files in workers/api/ops (spec 005 plan.md, Operator work,
// T038), and the FR-016 scope of their audit events (D-2026-10-05-07).

// A signed-in account in an organization: ops/set-org.sql runs before
// ops/grant.sql, which refuses an org_id that is not the holder's (RM-098).
async function member(
  w: World,
  name = "alice",
  org = "acme",
): Promise<Session> {
  const session = await signIn(w, name);
  await runOps("set-org.sql", { account_id: session.accountId, org_id: org });
  return session;
}

describe("ops/grant.sql", () => {
  it("adds an issuer grant, so the account can mint in that scope, with one audit event", async () => {
    const w = await makeWorld();
    const alice = await member(w);
    expect(
      (await mintRequest(w, alice.access, { scope: "logistics" })).status,
    ).toBe(403);
    const shown = await runOps("grant.sql", {
      subject_id: alice.accountId,
      scope: "logistics",
      role: "issuer",
      expires_at: "",
      org_id: "acme",
    });
    expect(shown).toEqual([
      {
        id: expect.stringMatching(UUID_V4),
        scope: "logistics",
        role: "issuer",
        org_id: "acme",
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
    const alice = await member(w);
    const expiry = new Date(w.clock.ms + 30 * DAY).toISOString();
    for (const role of ["viewer", "auditor"]) {
      await runOps("grant.sql", {
        subject_id: alice.accountId,
        scope: "enterprise",
        role,
        expires_at: expiry,
        org_id: "acme",
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

  it("writes nothing for an unknown or deleted account, a bad scope, role, or org_id, or an expiry in another form", async () => {
    const w = await makeWorld();
    const alice = await member(w, "alice");
    const gone = await member(w, "gone");
    expect(
      (await call(w, "DELETE", "/v1/me", { token: gone.access })).status,
    ).toBe(204);
    const good = {
      subject_id: alice.accountId,
      scope: "enterprise",
      role: "issuer",
      expires_at: "",
      org_id: "acme",
    };
    const cases: Record<string, string>[] = [
      { ...good, subject_id: crypto.randomUUID() },
      { ...good, subject_id: gone.accountId },
      { ...good, scope: "public" },
      { ...good, role: "owner" },
      { ...good, expires_at: "2027-01-01" },
      { ...good, expires_at: "2027-02-30T00:00:00.000Z" },
      { ...good, expires_at: "2027-01-01T00:00:00Z" },
      { ...good, org_id: "Acme" },
      { ...good, org_id: "acme corp" },
      { ...good, org_id: "acme_1" },
      { ...good, org_id: "a".repeat(65) },
      {
        subject_id: alice.accountId,
        scope: "enterprise",
        role: "issuer",
        expires_at: "",
      },
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
    const alice = await member(w, "alice");
    const enterprise = await member(w, "enterprise-auditor");
    const logistics = await member(w, "logistics-auditor");
    const grantTo = async (
      subject: string,
      scope: string,
      role: string,
      extra: Record<string, string> = {},
    ) => {
      const shown = await runOps("grant.sql", {
        subject_id: subject,
        scope,
        role,
        expires_at: "",
        org_id: "acme",
        ...extra,
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
    // A second account in enterprise: the operator states it is the same
    // organization (RM-073).
    const issuer = await grantTo(alice.accountId, "enterprise", "issuer", {
      same_org: "enterprise",
    });
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

describe("ops/grant.sql, one organization per scope (RM-073, D-2026-10-10-22)", () => {
  const grantIn = (
    subject: string,
    scope: string,
    role: string,
    extra: Record<string, string> = {},
  ) =>
    runOps("grant.sql", {
      subject_id: subject,
      scope,
      role,
      expires_at: "",
      org_id: "acme",
      same_org: "",
      ...extra,
    });
  const grantCount = (w: Parameters<typeof count>[0], subject: string) =>
    count(w, "SELECT count(*) AS n FROM grants WHERE subject_id = ?", subject);

  it("refuses a second account in enterprise without :same_org, writing no grant and no event", async () => {
    const w = await makeWorld();
    const a = await member(w, "a");
    const b = await member(w, "b");
    const [first] = await grantIn(a.accountId, "enterprise", "issuer");
    const added = await audit("grant.add");
    expect(added).toHaveLength(1);
    expectOperatorEvent(added[0], "grant.add", "grant", first?.id as string);
    const code = await mint(w, a.access, {
      scope: "enterprise",
      visibility: "private",
    });
    for (const role of ["issuer", "viewer", "auditor"]) {
      expect(await grantIn(b.accountId, "enterprise", role)).toEqual([]);
    }
    expect(await grantCount(w, b.accountId)).toBe(0);
    expect(await audit("grant.add")).toHaveLength(1);
    expect(
      (await mintRequest(w, b.access, { scope: "enterprise" })).status,
    ).toBe(403);
    const seen = await call(w, "GET", resolvePath(code.canonical), {
      token: b.access,
    });
    expect(seen.status).toBe(404);
  });

  it("adds the second account when :same_org names the scope, and never blocks the same account", async () => {
    const w = await makeWorld();
    const a = await member(w, "a");
    const b = await member(w, "b");
    await grantIn(a.accountId, "enterprise", "issuer");
    // Another scope's name, or any other text, is not the override.
    for (const same of ["logistics", "yes", "ENTERPRISE"]) {
      await grantIn(b.accountId, "enterprise", "issuer", { same_org: same });
    }
    expect(await grantCount(w, b.accountId)).toBe(0);
    await grantIn(b.accountId, "enterprise", "issuer", {
      same_org: "enterprise",
    });
    expect(await grantCount(w, b.accountId)).toBe(1);
    expect(
      (await mintRequest(w, b.access, { scope: "enterprise" })).status,
    ).toBe(201);
    // A further grant to an account that already holds one in the scope.
    await grantIn(a.accountId, "enterprise", "viewer");
    await grantIn(a.accountId, "enterprise", "auditor");
    expect(await grantCount(w, a.accountId)).toBe(3);
    expect(await audit("grant.add")).toHaveLength(4);
  });

  it("does not count expired grants, deleted accounts, or another scope", async () => {
    const w = await makeWorld();
    const lapsed = await member(w, "lapsed");
    const gone = await member(w, "gone");
    const other = await member(w, "other");
    const b = await member(w, "b");
    await grantIn(lapsed.accountId, "enterprise", "viewer", {
      expires_at: "2020-01-01T00:00:00.000Z",
    });
    const shown = await grantIn(lapsed.accountId, "logistics", "issuer");
    const ended = shown.find((row) => row.scope === "logistics");
    await runOps("remove-grant.sql", { grant_id: ended?.id as string });
    await grantIn(gone.accountId, "enterprise", "auditor", {
      same_org: "enterprise",
    });
    // Account deletion removes the account's grants (FR-023), and a grant
    // left on a deleted account would not count either.
    await env.ZZ_DB.prepare(
      "UPDATE accounts SET deleted_at = '2026-01-01T00:00:00.000Z' WHERE id = ?",
    )
      .bind(gone.accountId)
      .run();
    await grantIn(other.accountId, "logistics", "issuer", {
      same_org: "logistics",
    });
    await grantIn(b.accountId, "enterprise", "issuer");
    expect(await grantCount(w, b.accountId)).toBe(1);
    // logistics now has other's active grant, so lapsed is refused there.
    await grantIn(lapsed.accountId, "logistics", "issuer");
    expect(await grantCount(w, lapsed.accountId)).toBe(2);
  });

  it("never blocks a free_public grant", async () => {
    const w = await makeWorld();
    const a = await member(w, "a");
    const b = await member(w, "b");
    for (const subject of [a.accountId, b.accountId]) {
      await grantIn(subject, "free_public", "auditor");
    }
    expect(
      await count(
        w,
        "SELECT count(*) AS n FROM grants WHERE scope = 'free_public'",
      ),
    ).toBe(2);
    expect(await audit("grant.add")).toHaveLength(2);
  });
});

describe("ops/grant.sql, the holder's organization (RM-098, D-2026-10-10-24)", () => {
  const grantIn = (
    subject: string,
    scope: string,
    role: string,
    org: string,
    same_org = "",
  ) =>
    runOps("grant.sql", {
      subject_id: subject,
      scope,
      role,
      expires_at: "",
      org_id: org,
      same_org,
    });
  const grantsOf = (w: World, subject: string) =>
    count(w, "SELECT count(*) AS n FROM grants WHERE subject_id = ?", subject);

  it("writes nothing when :org_id is not the holder's, for a new or an existing holder", async () => {
    const w = await makeWorld();
    const acme = await member(w, "acme-issuer", "acme");
    const loner = await signIn(w, "loner");
    // A new holder: another organization, or one for an account with none.
    for (const scope of ["enterprise", "free_public"]) {
      expect(await grantIn(acme.accountId, scope, "viewer", "beta")).toEqual(
        [],
      );
      expect(await grantIn(loner.accountId, scope, "viewer", "acme")).toEqual(
        [],
      );
    }
    // Empty matches only an account with no organization.
    await grantIn(acme.accountId, "logistics", "issuer", "");
    expect(await grantsOf(w, acme.accountId)).toBe(0);
    expect(await grantsOf(w, loner.accountId)).toBe(0);
    // An existing holder: an issuer in acme gets no grant bound to beta.
    await grantIn(acme.accountId, "enterprise", "issuer", "acme");
    for (const role of ["issuer", "viewer", "auditor"]) {
      await grantIn(acme.accountId, "enterprise", role, "beta");
    }
    expect(await grantsOf(w, acme.accountId)).toBe(1);
    expect(await audit("grant.add")).toHaveLength(1);
  });

  it("adds a grant whose :org_id is the holder's, and an empty one for an account with no organization", async () => {
    const w = await makeWorld();
    const acme = await member(w, "acme-auditor", "acme");
    const loner = await signIn(w, "loner");
    const [granted] = await grantIn(
      acme.accountId,
      "enterprise",
      "auditor",
      "acme",
    );
    expect(granted).toMatchObject({ role: "auditor", org_id: "acme" });
    const [own] = await grantIn(loner.accountId, "logistics", "issuer", "");
    expect(own).toMatchObject({ role: "issuer", org_id: null });
    expect(await audit("grant.add")).toHaveLength(2);
  });

  it("lets :same_org through only when :org_id is every active grant's org_id in the scope", async () => {
    const w = await makeWorld();
    const first = await member(w, "first", "acme");
    const beta = await member(w, "beta", "beta");
    const loner = await signIn(w, "loner");
    const second = await member(w, "second", "acme");
    await grantIn(first.accountId, "enterprise", "issuer", "acme");
    // A different organization, or no organization, is refused.
    await grantIn(beta.accountId, "enterprise", "viewer", "beta", "enterprise");
    await grantIn(loner.accountId, "enterprise", "issuer", "", "enterprise");
    expect(await grantsOf(w, beta.accountId)).toBe(0);
    expect(await grantsOf(w, loner.accountId)).toBe(0);
    // The same organization goes ahead.
    await grantIn(
      second.accountId,
      "enterprise",
      "viewer",
      "acme",
      "enterprise",
    );
    expect(await grantsOf(w, second.accountId)).toBe(1);
    // A scope whose active grant has no organization refuses every
    // :same_org grant, because null matches no org_id.
    await grantIn(loner.accountId, "logistics", "issuer", "");
    await grantIn(first.accountId, "logistics", "issuer", "acme", "logistics");
    expect(await grantsOf(w, first.accountId)).toBe(1);
    // An expired grant of another organization does not count. grant.sql
    // would refuse it now, so it is written directly.
    const lapsed = await member(w, "lapsed", "beta");
    await env.ZZ_DB.prepare(
      "INSERT INTO grants (id, subject_id, scope, role, org_id, expires_at) VALUES (?, ?, 'enterprise', 'viewer', 'beta', '2020-01-01T00:00:00.000Z')",
    )
      .bind(crypto.randomUUID(), lapsed.accountId)
      .run();
    const third = await member(w, "third", "acme");
    await grantIn(
      third.accountId,
      "enterprise",
      "auditor",
      "acme",
      "enterprise",
    );
    expect(await grantsOf(w, third.accountId)).toBe(1);
    expect(await audit("grant.add")).toHaveLength(4);
  });
});

describe("ops/remove-grant.sql", () => {
  it("ends the grant now, keeps its row, and writes one grant.remove event", async () => {
    const w = await makeWorld();
    const alice = await member(w);
    const [granted] = await runOps("grant.sql", {
      subject_id: alice.accountId,
      scope: "enterprise",
      role: "issuer",
      expires_at: "",
      org_id: "acme",
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
    const alice = await member(w);
    const past = "2020-01-01T00:00:00.000Z";
    const [granted] = await runOps("grant.sql", {
      subject_id: alice.accountId,
      scope: "logistics",
      role: "viewer",
      expires_at: past,
      org_id: "acme",
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
