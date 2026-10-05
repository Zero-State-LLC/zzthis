import { requireCaller } from "../auth/caller.ts";
import { auditorScopes } from "../codes/scope.ts";
import type { AppContext } from "../http/context.ts";
import { forbidden, json, malformed } from "../http/respond.ts";
import { parseTimestamp } from "../lib/time.ts";
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

// An event's scope is its target's: a code's scope, the scope of a
// record's codes, the scope a refused mint named, or a grant's scope (the
// operator's grant.add and grant.remove, D-2026-10-05-07). Events whose
// target has no scope (accounts, nonces, reports, reads, and not-found
// resolves, whose target is an HMAC) are listed for no auditor.
function inScopes(scopes: readonly string[]): Filter {
  const marks = scopes.map(() => "?").join(", ");
  return {
    sql: `((target_type = 'code' AND target_id IN (SELECT id FROM codes WHERE scope IN (${marks}))) OR (target_type = 'record' AND target_id IN (SELECT record_id FROM codes WHERE scope IN (${marks}))) OR (target_type = 'scope' AND target_id IN (${marks})) OR (target_type = 'grant' AND target_id IN (SELECT id FROM grants WHERE scope IN (${marks}))))`,
    params: [...scopes, ...scopes, ...scopes, ...scopes],
  };
}

// GET /v1/audit (FR-016): the append-only log, newest last, for the scopes
// the caller holds an auditor grant for.
export async function listAudit(c: AppContext): Promise<Response> {
  const caller = await requireCaller(c);
  await limitUser(c, "audit", caller.id);
  const scopes = await auditorScopes(c, caller.id);
  if (scopes.length === 0) throw forbidden();
  const limit = limitParam(c.req.query("limit"));
  const where = [inScopes(scopes), ...filters(c)];
  const clause = where.map((f) => f.sql).join(" AND ");
  const rows = await c.env.ZZ_DB.prepare(
    `SELECT id, actor_id, action, target_type, target_id, result, created_at FROM audit_events WHERE ${clause} ORDER BY created_at ASC, id ASC LIMIT ?`,
  )
    .bind(...where.flatMap((f) => f.params), limit)
    .all();
  return json(200, { events: rows.results });
}
