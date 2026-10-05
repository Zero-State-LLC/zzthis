import { env } from "cloudflare:workers";
import { expect } from "vitest";
import { TIMESTAMP } from "../../src/lib/time.ts";
import { call } from "./http.ts";
import type { World } from "./world.ts";

// Runs the operator SQL in workers/api/ops (spec 005 plan.md, Operator
// work) against the migrated local D1 schema (T038).

export const DAY = 24 * 60 * 60 * 1000;
export const UUID_V4 =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

export type Row = Record<string, unknown>;

// The operator's sed: every :name in the file becomes its value. Then the
// file's statements run in order in one batch, as wrangler d1 execute sends
// them. The result is the rows of the file's last statement, its report.
export async function runOps(
  file: string,
  values: Record<string, string> = {},
) {
  let sql = env.TEST_OPS_SQL[file];
  if (sql === undefined) throw new Error(`no ops/${file}`);
  for (const [name, value] of Object.entries(values)) {
    sql = sql.replaceAll(`:${name}`, value);
  }
  const statements = sql
    .split("\n")
    .filter((line) => !line.trimStart().startsWith("--"))
    .join("\n")
    .split(";")
    .map((statement) => statement.trim())
    .filter((statement) => statement !== "");
  const results = await env.ZZ_DB.batch(
    statements.map((statement) => env.ZZ_DB.prepare(statement)),
  );
  return (results.at(-1)?.results ?? []) as Row[];
}

export async function audit(action: string): Promise<Row[]> {
  const rows = await env.ZZ_DB.prepare(
    "SELECT * FROM audit_events WHERE action = ? ORDER BY rowid",
  )
    .bind(action)
    .all<Row>();
  return rows.results;
}

export function expectOperatorEvent(
  row: Row | undefined,
  action: string,
  targetType: string,
  targetId: string,
): void {
  expect(row).toMatchObject({
    actor_id: null,
    action,
    target_type: targetType,
    target_id: targetId,
    result: "ok",
  });
  expect(row?.id).toMatch(UUID_V4);
  expect(row?.created_at).toMatch(TIMESTAMP);
}

export async function codeRow(id: string): Promise<Row | null> {
  return env.ZZ_DB.prepare(
    "SELECT status, revoked_reason FROM codes WHERE id = ?",
  )
    .bind(id)
    .first<Row>();
}

export async function report(w: World, canonical: string): Promise<string> {
  const response = await call(w, "POST", "/v1/reports", {
    body: { canonical, reason: "spam" },
  });
  expect(response.status).toBe(202);
  return ((await response.json()) as { id: string }).id;
}
