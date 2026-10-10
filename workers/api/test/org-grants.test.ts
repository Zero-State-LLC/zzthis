import { env } from "cloudflare:workers";
import { describe, expect, it } from "vitest";
import {
  call,
  mint,
  mintRequest,
  resolvePath,
  signIn,
  type MintedCode,
  type Session,
} from "./helpers/http.ts";
import { runOps } from "./helpers/ops.ts";
import { fixture7Codes } from "./helpers/random.ts";
import { expectMatchesSchema } from "./helpers/schema.ts";
import { makeWorld, type World } from "./helpers/world.ts";

// Org-bound grants (spec 005 FR-016, FR-034, FR-035; D-2026-10-10-22,
// RM-074, #135): two organizations, acme and beta, in enterprise, plus
// accounts with no organization.
//
// Grants go through ops/grant.sql. Since RM-098 that file refuses a
// second organization in one scope, and a grant with no organization next
// to one with: the mistake the one-organization rule (RM-073) guards
// against. These tests need that state anyway, because the server must
// keep the organizations apart even if the database holds it (written by
// hand, or before RM-098). So a grant grant.sql refuses is written
// directly, with the grant.add event grant.sql writes.

interface Event {
  actor_id: string | null;
  action: string;
  target_type: string;
  target_id: string;
  result: string;
}

async function grant(
  subject: Session,
  role: string,
  org: string,
  scope = "enterprise",
): Promise<string> {
  const shown = await runOps("grant.sql", {
    subject_id: subject.accountId,
    scope,
    role,
    org_id: org,
    expires_at: "",
    same_org: scope,
  });
  const granted = shown.find((row) => row.scope === scope && row.role === role)
    ?.id as string | undefined;
  if (granted !== undefined) return granted;
  const id = crypto.randomUUID();
  await env.ZZ_DB.batch([
    env.ZZ_DB.prepare(
      "INSERT INTO grants (id, subject_id, scope, role, org_id) VALUES (?, ?, ?, ?, NULLIF(?, ''))",
    ).bind(id, subject.accountId, scope, role, org),
    env.ZZ_DB.prepare(
      "INSERT INTO audit_events (id, actor_id, action, target_type, target_id, result, created_at) VALUES (?, NULL, 'grant.add', 'grant', ?, 'ok', strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))",
    ).bind(crypto.randomUUID(), id),
  ]);
  return id;
}

async function member(w: World, name: string, org: string): Promise<Session> {
  const session = await signIn(w, name);
  await runOps("set-org.sql", { account_id: session.accountId, org_id: org });
  return session;
}

interface Org {
  issuer: Session;
  viewer: Session;
  auditor: Session;
  privateCode: MintedCode;
  grants: string[];
}

// One organization's issuer, viewer, and auditor, a private code with a
// second version, and a refused mint by its viewer.
async function organization(w: World, org: string): Promise<Org> {
  const issuer = await member(w, `${org || "none"}-issuer`, org);
  const viewer = await member(w, `${org || "none"}-viewer`, org);
  const auditor = await member(w, `${org || "none"}-auditor`, org);
  const grants = [
    await grant(issuer, "issuer", org),
    await grant(viewer, "viewer", org),
    await grant(auditor, "auditor", org),
  ];
  const privateCode = await mint(w, issuer.access, {
    scope: "enterprise",
    visibility: "private",
  });
  const version = await call(
    w,
    "POST",
    `/v1/records/${privateCode.record_id}/versions`,
    { token: issuer.access, body: { title: "v2", body: "" } },
  );
  expect(version.status).toBe(201);
  const refused = await mintRequest(w, viewer.access, { scope: "enterprise" });
  expect(refused.status).toBe(403);
  return { issuer, viewer, auditor, privateCode, grants };
}

function resolve(w: World, code: string, token?: string): Promise<Response> {
  return call(
    w,
    "GET",
    resolvePath(code),
    token === undefined ? {} : { token },
  );
}

async function events(w: World, token: string, query = ""): Promise<Event[]> {
  const response = await call(w, "GET", `/v1/audit?limit=100${query}`, {
    token,
  });
  return (
    await expectMatchesSchema<{ events: Event[] }>(response, "listAudit", 200)
  ).events;
}

// The ids an organization's auditor may see: its codes, its records, the
// scope its members' refused mints named, and its grants.
function idsOf(org: Org): Set<string> {
  return new Set([
    org.privateCode.id,
    org.privateCode.record_id,
    "enterprise",
    ...org.grants,
  ]);
}

describe("org-bound viewer grants (FR-035, Resolve step 7)", () => {
  it("opens a private record for a viewer of the owner's organization only", async () => {
    const w = await makeWorld();
    const acme = await organization(w, "acme");
    const beta = await organization(w, "beta");
    const opened = await resolve(
      w,
      acme.privateCode.canonical,
      acme.viewer.access,
    );
    expect(
      (await expectMatchesSchema<{ view: string }>(opened, "resolveCode", 200))
        .view,
    ).toBe("viewer");
    // Across organizations, the answer is the one not-found body: the same
    // status, body, and Cache-Control as a code that was never issued.
    const unknown = fixture7Codes()[29] as string;
    const never = await resolve(w, unknown, acme.viewer.access);
    const across = await resolve(
      w,
      beta.privateCode.canonical,
      acme.viewer.access,
    );
    expect(across.status).toBe(404);
    expect(never.status).toBe(404);
    expect(await across.text()).toBe(await never.text());
    expect(across.headers.get("Cache-Control")).toBe(
      never.headers.get("Cache-Control"),
    );
    // Each organization's own viewer still opens its own record.
    const own = await resolve(
      w,
      beta.privateCode.canonical,
      beta.viewer.access,
    );
    expect((await own.json<{ view: string }>()).view).toBe("viewer");
  });

  it("gives a grant with no organization only the holder's own records", async () => {
    const w = await makeWorld();
    const acme = await organization(w, "acme");
    const loner = await member(w, "loner", "");
    const other = await member(w, "other", "");
    await grant(loner, "issuer", "");
    await grant(loner, "viewer", "");
    await grant(other, "issuer", "");
    const mine = await mint(w, loner.access, {
      scope: "enterprise",
      visibility: "private",
    });
    const theirs = await mint(w, other.access, {
      scope: "enterprise",
      visibility: "private",
    });
    const own = await resolve(w, mine.canonical, loner.access);
    expect((await own.json<{ view: string }>()).view).toBe("owner");
    for (const code of [theirs, acme.privateCode]) {
      const response = await resolve(w, code.canonical, loner.access);
      expect(await expectMatchesSchema(response, "resolveCode", 404)).toEqual({
        error: "not-found",
      });
    }
    // An owner with no organization is never matched by a bound grant.
    const bound = await resolve(w, theirs.canonical, acme.viewer.access);
    expect(bound.status).toBe(404);
  });

  it("leaves public records open to everyone", async () => {
    const w = await makeWorld();
    const acme = await organization(w, "acme");
    const beta = await organization(w, "beta");
    const loner = await member(w, "loner", "");
    const code = await mint(w, acme.issuer.access, { scope: "enterprise" });
    for (const token of [
      undefined,
      beta.viewer.access,
      beta.auditor.access,
      loner.access,
    ]) {
      const response = await resolve(w, code.canonical, token);
      expect((await response.json<{ view: string }>()).view).toBe("public");
    }
  });

  it("stops at a removed or expired grant: 404 on resolve, 403 on audit", async () => {
    const w = await makeWorld();
    const acme = await organization(w, "acme");
    const lapsed = await member(w, "lapsed", "acme");
    await runOps("grant.sql", {
      subject_id: lapsed.accountId,
      scope: "enterprise",
      role: "viewer",
      org_id: "acme",
      expires_at: new Date(w.clock.ms - 1).toISOString(),
      same_org: "enterprise",
    });
    expect(
      (await resolve(w, acme.privateCode.canonical, lapsed.access)).status,
    ).toBe(404);
    const [, viewerGrant, auditorGrant] = acme.grants;
    let ended = "";
    for (const id of [viewerGrant, auditorGrant]) {
      const [row] = await runOps("remove-grant.sql", {
        grant_id: id as string,
      });
      ended = row?.expires_at as string;
    }
    w.clock.ms = Date.parse(ended);
    expect(
      (await resolve(w, acme.privateCode.canonical, acme.viewer.access)).status,
    ).toBe(404);
    const audit = await call(w, "GET", "/v1/audit", {
      token: acme.auditor.access,
    });
    expect(await expectMatchesSchema(audit, "listAudit", 403)).toEqual({
      error: "forbidden",
    });
  });
});

describe("org-bound auditor grants (FR-016)", () => {
  it("lists only the auditor's organization: code, record, scope, and grant events", async () => {
    const w = await makeWorld();
    const acme = await organization(w, "acme");
    const beta = await organization(w, "beta");
    // Beta's viewer tries acme's private code: a not-found resolve, whose
    // target is an HMAC, so no auditor lists it. Acme's viewer opens it.
    await resolve(w, acme.privateCode.canonical, beta.viewer.access);
    await resolve(w, acme.privateCode.canonical, acme.viewer.access);
    for (const [org, other] of [
      [acme, beta],
      [beta, acme],
    ] as const) {
      const seen = await events(w, org.auditor.access);
      const allowed = idsOf(org);
      for (const event of seen) {
        expect(allowed.has(event.target_id)).toBe(true);
        if (event.target_type === "scope") {
          expect(event.actor_id).toBe(org.viewer.accountId);
        }
      }
      expect(new Set(seen.map((event) => event.target_type))).toEqual(
        new Set(["code", "record", "scope", "grant"]),
      );
      expect(seen.filter((event) => event.target_type === "grant").length).toBe(
        3,
      );
      expect(
        seen.some((event) => event.actor_id === other.viewer.accountId),
      ).toBe(false);
    }
  });

  it("returns an empty list for another organization's code_id or record_id", async () => {
    const w = await makeWorld();
    const acme = await organization(w, "acme");
    const beta = await organization(w, "beta");
    for (const query of [
      `&code_id=${beta.privateCode.id}`,
      `&record_id=${beta.privateCode.record_id}`,
    ]) {
      expect(await events(w, acme.auditor.access, query)).toEqual([]);
    }
    const own = await events(
      w,
      acme.auditor.access,
      `&record_id=${acme.privateCode.record_id}`,
    );
    // Sorted, because two events can share a millisecond.
    expect(own.map((event) => event.action).sort()).toEqual([
      "code.mint",
      "record.version",
    ]);
  });

  it("gives an auditor grant with no organization only the holder's own events", async () => {
    const w = await makeWorld();
    await organization(w, "acme");
    const loner = await member(w, "loner", "");
    const other = await member(w, "other", "");
    const grants = [
      await grant(loner, "issuer", ""),
      await grant(loner, "auditor", ""),
    ];
    await grant(other, "issuer", "");
    const mine = await mint(w, loner.access, { scope: "enterprise" });
    await mint(w, other.access, { scope: "enterprise" });
    // Refused mints in logistics, which loner does not audit, and in
    // enterprise by another account with no organization.
    await mintRequest(w, loner.access, { scope: "logistics" });
    const outsider = await signIn(w, "outsider");
    await mintRequest(w, outsider.access, { scope: "enterprise" });
    await grant(loner, "issuer", "", "logistics");
    const seen = await events(w, loner.access);
    expect(seen.map((event) => [event.action, event.target_id]).sort()).toEqual(
      [
        ["code.mint", mine.id],
        ["grant.add", grants[0]],
        ["grant.add", grants[1]],
      ].sort(),
    );
  });

  it("keeps a deleted owner's code and record events listed, and drops its grant events (RM-100)", async () => {
    const w = await makeWorld();
    const acme = await organization(w, "acme");
    await resolve(w, acme.privateCode.canonical, acme.viewer.access);
    const before = await events(w, acme.auditor.access);
    const [issuerGrant] = acme.grants;
    expect(before.some((event) => event.target_id === issuerGrant)).toBe(true);
    expect(
      (await call(w, "DELETE", "/v1/me", { token: acme.issuer.access })).status,
    ).toBe(204);
    // Deletion revokes the owner's code rows and keeps them, and the account
    // row keeps its org_id, so its code and record events stay listed. It
    // removes the owner's grant rows, so their grant events drop out. The
    // account.delete event has an account target and is listed for no
    // auditor.
    const after = await events(w, acme.auditor.access);
    expect(after).toEqual(
      before.filter((event) => event.target_id !== issuerGrant),
    );
    expect(
      after.some(
        (event) =>
          event.action === "code.mint" &&
          event.target_id === acme.privateCode.id &&
          event.actor_id === acme.issuer.accountId,
      ),
    ).toBe(true);
    expect(
      after.some((event) => event.target_id === acme.privateCode.record_id),
    ).toBe(true);
  });
});
