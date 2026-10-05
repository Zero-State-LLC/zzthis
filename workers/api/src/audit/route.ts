import { requireCaller } from "../auth/caller.ts";
import { isAuditor } from "../codes/scope.ts";
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

// GET /v1/audit (FR-016): the append-only log, newest last, for an account
// with an auditor grant.
export async function listAudit(c: AppContext): Promise<Response> {
  const caller = await requireCaller(c);
  await limitUser(c, "audit", caller.id);
  if (!(await isAuditor(c, caller.id))) throw forbidden();
  const limit = limitParam(c.req.query("limit"));
  const where = filters(c);
  const clause =
    where.length === 0 ? "" : `WHERE ${where.map((f) => f.sql).join(" AND ")}`;
  const rows = await c.env.ZZ_DB.prepare(
    `SELECT id, actor_id, action, target_type, target_id, result, created_at FROM audit_events ${clause} ORDER BY created_at ASC, id ASC LIMIT ?`,
  )
    .bind(...where.flatMap((f) => f.params), limit)
    .all();
  return json(200, { events: rows.results });
}
