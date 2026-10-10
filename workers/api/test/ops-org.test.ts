import { env } from "cloudflare:workers";
import { describe, expect, it } from "vitest";
import {
  call,
  count,
  mint,
  resolvePath,
  signIn,
  type Session,
} from "./helpers/http.ts";
import { audit, expectOperatorEvent, runOps } from "./helpers/ops.ts";
import { makeWorld, type World } from "./helpers/world.ts";

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

  it("first assigns an organization to an account with no grants and no codes", async () => {
    const w = await makeWorld();
    const alice = await signIn(w);
    const [shown] = await runOps("set-org.sql", {
      account_id: alice.accountId,
      org_id: "acme",
      revoke_grants: "",
      move_owner: "",
    });
    expect(shown).toEqual({ id: alice.accountId, org_id: "acme" });
  });
});

describe("ops/set-org.sql, moving an account (RM-099, D-2026-10-10-24)", () => {
  async function member(w: World, name: string, org: string) {
    const session = await signIn(w, name);
    await runOps("set-org.sql", { account_id: session.accountId, org_id: org });
    return session;
  }
  const grant = async (
    subject: Session,
    scope: string,
    role: string,
    org: string,
  ) =>
    (
      await runOps("grant.sql", {
        subject_id: subject.accountId,
        scope,
        role,
        expires_at: "",
        org_id: org,
        same_org: scope,
      })
    ).find((row) => row.scope === scope && row.role === role)?.id as string;
  const move = (
    subject: Session,
    org: string,
    extra: Record<string, string> = {},
  ) =>
    runOps("set-org.sql", {
      account_id: subject.accountId,
      org_id: org,
      revoke_grants: "",
      move_owner: "",
      ...extra,
    });
  const orgOf = async (w: World, subject: Session) =>
    (
      await env.ZZ_DB.prepare("SELECT org_id FROM accounts WHERE id = ?")
        .bind(subject.accountId)
        .first<{ org_id: string | null }>()
    )?.org_id;

  it("does not move an account whose active grants name another organization, or none", async () => {
    const w = await makeWorld();
    const viewer = await member(w, "viewer", "acme");
    await grant(viewer, "enterprise", "viewer", "acme");
    const loner = await signIn(w, "loner");
    await grant(loner, "logistics", "issuer", "");
    const before = (await audit("account.org.set")).length;
    // Any value but yes is no.
    for (const revoke of ["", "YES", "true", ":revoke_grants"]) {
      await move(viewer, "beta", { revoke_grants: revoke });
      await move(viewer, "", { revoke_grants: revoke });
      await move(loner, "acme", { revoke_grants: revoke });
    }
    await runOps("set-org.sql", {
      account_id: viewer.accountId,
      org_id: "beta",
    });
    expect(await orgOf(w, viewer)).toBe("acme");
    expect(await orgOf(w, loner)).toBeNull();
    expect(await audit("account.org.set")).toHaveLength(before);
    expect(await audit("grant.remove")).toEqual([]);
    expect(
      await count(
        w,
        "SELECT count(*) AS n FROM grants WHERE expires_at IS NULL",
      ),
    ).toBe(2);
  });

  it("with :revoke_grants yes, ends the other organization's grants with grant.remove events and moves the account", async () => {
    const w = await makeWorld();
    const owner = await member(w, "owner", "acme");
    await grant(owner, "enterprise", "issuer", "acme");
    const code = await mint(w, owner.access, {
      scope: "enterprise",
      visibility: "private",
    });
    const viewer = await member(w, "viewer", "acme");
    const auditor = await member(w, "auditor", "acme");
    const viewerGrant = await grant(viewer, "enterprise", "viewer", "acme");
    const auditorGrants = [
      await grant(auditor, "enterprise", "auditor", "acme"),
      await grant(auditor, "free_public", "auditor", "acme"),
    ];
    const opened = await call(w, "GET", resolvePath(code.canonical), {
      token: viewer.access,
    });
    expect(opened.status).toBe(200);
    const listed = await call(w, "GET", "/v1/audit?limit=100", {
      token: auditor.access,
    });
    expect(
      (await listed.json<{ events: { target_id: string }[] }>()).events.some(
        (event) => event.target_id === code.id,
      ),
    ).toBe(true);

    expect(await move(viewer, "beta", { revoke_grants: "yes" })).toEqual([
      { id: viewer.accountId, org_id: "beta" },
    ]);
    expect(await move(auditor, "", { revoke_grants: "yes" })).toEqual([
      { id: auditor.accountId, org_id: null },
    ]);
    const removed = await audit("grant.remove");
    expect(removed).toHaveLength(3);
    for (const id of [viewerGrant, ...auditorGrants]) {
      expectOperatorEvent(
        removed.find((row) => row.target_id === id),
        "grant.remove",
        "grant",
        id,
      );
    }
    expect(await audit("account.org.set")).toHaveLength(5);
    // The ended grants reach nothing: the viewer gets the not-found answer,
    // and the auditor, with no auditor grant left, gets no list.
    w.clock.ms = Date.now() + 1000;
    const after = await call(w, "GET", resolvePath(code.canonical), {
      token: viewer.access,
    });
    expect(after.status).toBe(404);
    const refused = await call(w, "GET", "/v1/audit?limit=100", {
      token: auditor.access,
    });
    expect(refused.status).toBe(403);
    // A new auditor grant for its new organization lists none of acme's
    // events.
    await grant(auditor, "free_public", "auditor", "");
    const fresh = await call(w, "GET", "/v1/audit?limit=100", {
      token: auditor.access,
    });
    expect(fresh.status).toBe(200);
    const { events } = await fresh.json<{
      events: { target_type: string; target_id: string }[];
    }>();
    expect(events.filter((event) => event.target_type !== "grant")).toEqual([]);
    expect(events.some((event) => event.target_id === code.id)).toBe(false);
    // The owner stays in acme.
    expect(await orgOf(w, owner)).toBe("acme");
  });

  it("does not move the owner of an enterprise or logistics code without :move_owner yes", async () => {
    const w = await makeWorld();
    const owner = await member(w, "owner", "acme");
    const issuer = await grant(owner, "logistics", "issuer", "acme");
    await mint(w, owner.access, { scope: "logistics" });
    // Ending the grants is not enough, and nothing is half done.
    await move(owner, "beta", { revoke_grants: "yes" });
    await move(owner, "beta", { revoke_grants: "yes", move_owner: "YES" });
    expect(await orgOf(w, owner)).toBe("acme");
    expect(await audit("grant.remove")).toEqual([]);
    // :move_owner alone is not enough while the acme grant is active.
    await move(owner, "beta", { move_owner: "yes" });
    expect(await orgOf(w, owner)).toBe("acme");
    // Both together move it.
    expect(
      await move(owner, "beta", { revoke_grants: "yes", move_owner: "yes" }),
    ).toEqual([{ id: owner.accountId, org_id: "beta" }]);
    const [removed] = await audit("grant.remove");
    expectOperatorEvent(removed, "grant.remove", "grant", issuer);
    // A revoked code still counts: its history is still the owner's.
    await runOps("revoke-code.sql", {
      code_id: (
        await env.ZZ_DB.prepare("SELECT id FROM codes WHERE owner_id = ?")
          .bind(owner.accountId)
          .first<{ id: string }>()
      )?.id as string,
    });
    await move(owner, "acme");
    expect(await orgOf(w, owner)).toBe("beta");
    await move(owner, "acme", { move_owner: "yes" });
    expect(await orgOf(w, owner)).toBe("acme");
  });
});
