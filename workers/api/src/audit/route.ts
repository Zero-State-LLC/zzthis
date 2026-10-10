import { requireCaller } from "../auth/caller.ts";
import { isAuditor } from "../codes/scope.ts";
import type { AppContext } from "../http/context.ts";
import { forbidden, json, malformed } from "../http/respond.ts";
import { iso, parseTimestamp } from "../lib/time.ts";
import { limitUser } from "../limits/enforce.ts";

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;

function limitParam(text: string | undefined): number {
  if (text === undefined) return DEFAULT_LIMIT;
  const limit = Number(text);
  if (!/^\d+$/.test(text) || limit < 1 || limit > MAX_LIMIT) throw malformed();
  return limit;
}

interface Filter {
  readonly sql: string;
  readonly params: readonly string[];
}

// code_id: the code's own events. record_id: the record's versions and the
// events of every code on it. since: events at or after that time, in the
// form the server writes.
function filters(c: AppContext): Filter[] {
  const out: Filter[] = [];
  const codeId = c.req.query("code_id");
  if (codeId !== undefined) {
    out.push({
      sql: "target_type = 'code' AND target_id = ?",
      params: [codeId],
    });
  }
  const recordId = c.req.query("record_id");
  if (recordId !== undefined) {
    out.push({
      sql: "((target_type = 'record' AND target_id = ?) OR (target_type = 'code' AND target_id IN (SELECT id FROM codes WHERE record_id = ?)))",
      params: [recordId, recordId],
    });
  }
  const since = c.req.query("since");
  if (since !== undefined) {
    if (parseTimestamp(since) === null) throw malformed();
    out.push({ sql: "created_at >= ?", params: [since] });
  }
  return out;
}

// The caller's active auditor grants, each one scope and one organization
// (FR-016, D-2026-10-10-22, #135).
const AUDITOR_GRANTS =
  "WITH ag AS (SELECT DISTINCT scope, org_id, subject_id AS holder FROM grants WHERE subject_id = ? AND role = 'auditor' AND (expires_at IS NULL OR expires_at > ?))";

// The code's owner is in the grant's organization or, for a grant with no
// organization, is the auditor.
const OWNER_IN_ORG =
  "((ag.org_id IS NOT NULL AND ag.org_id = (SELECT org_id FROM accounts WHERE id = c.owner_id)) OR (ag.org_id IS NULL AND c.owner_id = ag.holder))";

// An event's scope is its target's: a code's scope, the scope of a
// record's codes, the scope a refused mint named, or a grant's scope (the
// operator's grant.add and grant.remove, D-2026-10-05-07). Within that
// scope a grant reaches one organization: code and record events of codes
// whose owner is in it, refused mints whose actor is in it, and grants
// bound to it. A grant with no organization reaches only its holder's own
// codes, refused mints, and grants. Events whose target has no scope
// (accounts, nonces, reports, reads, and not-found resolves, whose target
// is an HMAC) are listed for no auditor.
const IN_REACH = [
  `(e.target_type = 'code' AND EXISTS (SELECT 1 FROM codes c JOIN ag ON ag.scope = c.scope WHERE c.id = e.target_id AND ${OWNER_IN_ORG}))`,
  `(e.target_type = 'record' AND EXISTS (SELECT 1 FROM codes c JOIN ag ON ag.scope = c.scope WHERE c.record_id = e.target_id AND ${OWNER_IN_ORG}))`,
  "(e.target_type = 'scope' AND EXISTS (SELECT 1 FROM ag WHERE ag.scope = e.target_id AND ((ag.org_id IS NOT NULL AND ag.org_id = (SELECT org_id FROM accounts WHERE id = e.actor_id)) OR (ag.org_id IS NULL AND e.actor_id = ag.holder))))",
  "(e.target_type = 'grant' AND EXISTS (SELECT 1 FROM grants g JOIN ag ON ag.scope = g.scope WHERE g.id = e.target_id AND ((ag.org_id IS NOT NULL AND g.org_id = ag.org_id) OR (ag.org_id IS NULL AND g.org_id IS NULL AND g.subject_id = ag.holder))))",
].join(" OR ");

// GET /v1/audit (FR-016): the append-only log, newest last, for what the
// caller's auditor grants reach.
export async function listAudit(c: AppContext): Promise<Response> {
  const caller = await requireCaller(c);
  await limitUser(c, "audit", caller.id);
  if (!(await isAuditor(c, caller.id))) throw forbidden();
  const limit = limitParam(c.req.query("limit"));
  const where = [{ sql: `(${IN_REACH})`, params: [] }, ...filters(c)];
  const clause = where.map((f) => f.sql).join(" AND ");
  const rows = await c.env.ZZ_DB.prepare(
    `${AUDITOR_GRANTS} SELECT e.id, e.actor_id, e.action, e.target_type, e.target_id, e.result, e.created_at FROM audit_events e WHERE ${clause} ORDER BY e.created_at ASC, e.id ASC LIMIT ?`,
  )
    .bind(
      caller.id,
      iso(c.get("now")),
      ...where.flatMap((f) => f.params),
      limit,
    )
    .all();
  return json(200, { events: rows.results });
}
