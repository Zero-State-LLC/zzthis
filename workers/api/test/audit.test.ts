import { env } from "cloudflare:workers";
import { describe, expect, it } from "vitest";
import {
  call,
  mint,
  mintRequest,
  resolvePath,
  signIn,
  type Session,
} from "./helpers/http.ts";
import { unknownCode } from "./helpers/random.ts";
import { expectMatchesSchema } from "./helpers/schema.ts";
import { makeWorld, type World } from "./helpers/world.ts";

interface Event {
  id: string;
  actor_id: string | null;
  action: string;
  target_type: string;
  target_id: string;
  result: string;
  created_at: string;
}

// Every account in these tests is in one organization, as the operator's
// set-org.sql and grant.sql would bind it (D-2026-10-10-22).
async function grant(
  accountId: string,
  scope: string,
  role: string,
  expiresAt: string | null = null,
) {
  await env.ZZ_DB.batch([
    env.ZZ_DB.prepare(
      "INSERT INTO grants (id, subject_id, scope, role, org_id, expires_at) VALUES (?, ?, ?, ?, 'acme', ?)",
    ).bind(crypto.randomUUID(), accountId, scope, role, expiresAt),
    env.ZZ_DB.prepare("UPDATE accounts SET org_id = 'acme' WHERE id = ?").bind(
      accountId,
    ),
  ]);
}

async function events(w: World, token: string, query = ""): Promise<Event[]> {
  const response = await call(w, "GET", `/v1/audit${query}`, { token });
  return (
    await expectMatchesSchema<{ events: Event[] }>(response, "listAudit", 200)
  ).events;
}

// One enterprise and one logistics issuer, each with a few events.
async function twoScopes(w: World): Promise<{
  ent: Session;
  log: Session;
  entCode: string;
  logCode: string;
  entRecord: string;
}> {
  const ent = await signIn(w, "ent");
  const log = await signIn(w, "log");
  await grant(ent.accountId, "enterprise", "issuer");
  await grant(log.accountId, "logistics", "issuer");
  // A second between steps, so the log's order is the order of the calls.
  const entCode = await mint(w, ent.access, { scope: "enterprise" });
  w.clock.advance(1000);
  const logCode = await mint(w, log.access, { scope: "logistics" });
  w.clock.advance(1000);
  await call(w, "GET", resolvePath(entCode.canonical));
  w.clock.advance(1000);
  await call(w, "POST", `/v1/records/${entCode.record_id}/versions`, {
    token: ent.access,
    body: { title: "v2", body: "" },
  });
  w.clock.advance(1000);
  // A refused mint names its scope.
  const refused = await mintRequest(w, log.access, { scope: "enterprise" });
  expect(refused.status).toBe(403);
  return {
    ent,
    log,
    entCode: entCode.id,
    logCode: logCode.id,
    entRecord: entCode.record_id,
  };
}

describe("GET /v1/audit (FR-016, T015)", () => {
  it("is 403 without an auditor grant and 401 without a bearer", async () => {
    const w = await makeWorld();
    const alice = await signIn(w);
    await grant(alice.accountId, "enterprise", "issuer");
    await grant(alice.accountId, "enterprise", "viewer");
    const lapsed = await signIn(w, "lapsed");
    await grant(
      lapsed.accountId,
      "enterprise",
      "auditor",
      new Date(w.clock.ms - 1).toISOString(),
    );
    for (const session of [alice, lapsed]) {
      const response = await call(w, "GET", "/v1/audit", {
        token: session.access,
      });
      expect(await expectMatchesSchema(response, "listAudit", 403)).toEqual({
        error: "forbidden",
      });
    }
    const anonymous = await call(w, "GET", "/v1/audit");
    expect(await expectMatchesSchema(anonymous, "listAudit", 401)).toEqual({
      error: "unauthorized",
    });
  });

  it("lists only the events of the auditor's own scopes (D-2026-10-05-04)", async () => {
    const w = await makeWorld();
    const { ent, entCode, logCode, entRecord } = await twoScopes(w);
    const auditor = await signIn(w, "auditor");
    await grant(auditor.accountId, "enterprise", "auditor");
    const seen = await events(w, auditor.access);
    expect(seen.map((e) => [e.action, e.target_type, e.result])).toEqual([
      ["code.mint", "code", "ok"],
      ["code.resolve", "code", "ok"],
      ["record.version", "record", "ok"],
      ["code.mint", "scope", "denied"],
    ]);
    expect(seen[0]?.target_id).toBe(entCode);
    expect(seen[0]?.actor_id).toBe(ent.accountId);
    expect(seen[2]?.target_id).toBe(entRecord);
    expect(seen.some((e) => e.target_id === logCode)).toBe(false);
  });

  it("lists no event whose target has no scope: accounts, nonces, reports, and not-found resolves", async () => {
    const w = await makeWorld();
    await twoScopes(w);
    const unknown = await unknownCode();
    await call(w, "GET", resolvePath(unknown));
    await call(w, "POST", "/v1/reports", {
      body: { canonical: unknown, reason: "spam" },
    });
    const auditor = await signIn(w, "auditor");
    for (const scope of ["enterprise", "logistics", "free_public"])
      await grant(auditor.accountId, scope, "auditor");
    const seen = await events(w, auditor.access, "?limit=100");
    const types = new Set(seen.map((e) => e.target_type));
    expect([...types].sort()).toEqual(["code", "record", "scope"]);
    expect(seen.some((e) => e.result === "not-found")).toBe(false);
    const all = await env.ZZ_DB.prepare(
      "SELECT DISTINCT target_type FROM audit_events ORDER BY target_type",
    ).all<{ target_type: string }>();
    expect(all.results.map((r) => r.target_type)).toEqual([
      "account",
      "code",
      "nonce",
      "record",
      "report",
      "scope",
    ]);
  });

  it("lists both scopes for an auditor of both, newest last", async () => {
    const w = await makeWorld();
    const { entCode, logCode } = await twoScopes(w);
    const auditor = await signIn(w, "auditor");
    await grant(auditor.accountId, "enterprise", "auditor");
    await grant(auditor.accountId, "logistics", "auditor");
    const seen = await events(w, auditor.access);
    expect(seen.some((e) => e.target_id === entCode)).toBe(true);
    expect(seen.some((e) => e.target_id === logCode)).toBe(true);
    const times = seen.map((e) => e.created_at);
    expect(times).toEqual([...times].sort());
  });

  it("filters by code_id and record_id within the auditor's scopes", async () => {
    const w = await makeWorld();
    const { entCode, entRecord } = await twoScopes(w);
    const auditor = await signIn(w, "auditor");
    await grant(auditor.accountId, "enterprise", "auditor");
    const byCode = await events(w, auditor.access, `?code_id=${entCode}`);
    expect(byCode.map((e) => e.action)).toEqual(["code.mint", "code.resolve"]);
    const byRecord = await events(w, auditor.access, `?record_id=${entRecord}`);
    expect(byRecord.map((e) => e.action)).toEqual([
      "code.mint",
      "code.resolve",
      "record.version",
    ]);
  });

  it("includes events at exactly since, and refuses a since in another form (D-2026-10-05-04)", async () => {
    const w = await makeWorld();
    const ent = await signIn(w, "ent");
    await grant(ent.accountId, "enterprise", "issuer");
    await mint(w, ent.access, { scope: "enterprise" });
    w.clock.advance(1000);
    const since = new Date(w.clock.ms).toISOString();
    await mint(w, ent.access, { scope: "enterprise" });
    w.clock.advance(1000);
    await mint(w, ent.access, { scope: "enterprise" });
    await grant(ent.accountId, "enterprise", "auditor");
    const seen = await events(
      w,
      (await signIn(w, "ent")).access,
      `?since=${since}`,
    );
    expect(seen).toHaveLength(2);
    expect(seen[0]?.created_at).toBe(since);
    for (const bad of ["2026-10-05T00:00:00Z", "yesterday"]) {
      const response = await call(w, "GET", `/v1/audit?since=${bad}`, {
        token: ent.access,
      });
      expect(await expectMatchesSchema(response, "listAudit", 400)).toEqual({
        error: "malformed",
      });
    }
  });

  it("takes a limit from 1 to 100, 50 by default", async () => {
    const w = await makeWorld();
    const ent = await signIn(w, "ent");
    await grant(ent.accountId, "enterprise", "issuer");
    await grant(ent.accountId, "enterprise", "auditor");
    const code = await mint(w, ent.access, { scope: "enterprise" });
    for (let i = 0; i < 55; i += 1) {
      await call(w, "GET", resolvePath(code.canonical), {
        token: ent.access,
        ip: `198.51.100.${i}`,
      });
      if (i === 30) w.clock.advance(60_000);
    }
    expect(await events(w, ent.access)).toHaveLength(50);
    expect(await events(w, ent.access, "?limit=100")).toHaveLength(56);
    expect(await events(w, ent.access, "?limit=1")).toHaveLength(1);
    for (const limit of ["0", "101", "ten"]) {
      const response = await call(w, "GET", `/v1/audit?limit=${limit}`, {
        token: ent.access,
      });
      expect(response.status).toBe(400);
    }
  });
});
