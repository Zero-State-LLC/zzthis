import { createScheduledController } from "cloudflare:test";
import { env } from "cloudflare:workers";
import { call, resolvePath, type Session } from "./http.ts";
import { expectMatchesSchema } from "./schema.ts";
import type { World } from "./world.ts";

// Shared by the idle expiry and revive tests (D-2026-10-13-01, RM-127).

export const DAY = 24 * 60 * 60 * 1000;
export const IDLE = 90 * DAY;

export async function run(w: World): Promise<void> {
  await w.worker.scheduled(
    createScheduledController({ cron: "17 3 * * *" }),
    w.env,
  );
}

export function resolve(
  w: World,
  code: string,
  token?: string,
): Promise<Response> {
  return call(
    w,
    "GET",
    resolvePath(code),
    token === undefined ? {} : { token },
  );
}

export interface Answer {
  status: number;
  body: string;
  headers: Record<string, string>;
}

export async function answer(response: Response): Promise<Answer> {
  return {
    status: response.status,
    body: await response.text(),
    headers: Object.fromEntries(response.headers.entries()),
  };
}

export function refresh(w: World, session: Session): Promise<Response> {
  return call(w, "POST", "/v1/auth/refresh", {
    body: { refresh_token: session.refresh },
  });
}

export async function lastActive(accountId: string): Promise<string | null> {
  const row = await env.ZZ_DB.prepare(
    "SELECT last_active_at FROM accounts WHERE id = ?",
  )
    .bind(accountId)
    .first<{ last_active_at: string | null }>();
  return row?.last_active_at ?? null;
}

// The owner idle since `ms`, as if no sign-in or refresh happened after.
export async function idleSince(accountId: string, ms: number): Promise<void> {
  await env.ZZ_DB.prepare("UPDATE accounts SET last_active_at = ? WHERE id = ?")
    .bind(new Date(ms).toISOString(), accountId)
    .run();
}

// Suspension as the column alone, so the codes stay active and only the
// revive guard is under test (suspend.sql also revokes them).
export async function suspend(accountId: string, ms: number): Promise<void> {
  await env.ZZ_DB.prepare("UPDATE accounts SET suspended_at = ? WHERE id = ?")
    .bind(new Date(ms).toISOString(), accountId)
    .run();
}

export async function idleExpiredAt(codeId: string): Promise<string | null> {
  const row = await env.ZZ_DB.prepare(
    "SELECT idle_expired_at FROM codes WHERE id = ?",
  )
    .bind(codeId)
    .first<{ idle_expired_at: string | null }>();
  return row?.idle_expired_at ?? null;
}

export interface AuditRow {
  id: string;
  actor_id: string | null;
  action: string;
  target_type: string;
  target_id: string;
  result: string;
  created_at: string;
}

export async function events(action: string): Promise<AuditRow[]> {
  const rows = await env.ZZ_DB.prepare(
    "SELECT * FROM audit_events WHERE action = ? ORDER BY rowid",
  )
    .bind(action)
    .all<AuditRow>();
  return rows.results;
}

export async function listStatus(
  w: World,
  token: string,
): Promise<Record<string, string>> {
  const response = await call(w, "GET", "/v1/me/codes", { token });
  const body = await expectMatchesSchema<{
    codes: { id: string; status: string }[];
  }>(response, "listMyCodes", 200);
  return Object.fromEntries(body.codes.map((code) => [code.id, code.status]));
}

export async function grant(accountId: string, scope: string, role: string) {
  await env.ZZ_DB.prepare(
    "INSERT INTO grants (id, subject_id, scope, role, org_id, expires_at) VALUES (?, ?, ?, ?, NULL, NULL)",
  )
    .bind(crypto.randomUUID(), accountId, scope, role)
    .run();
}

// Bulk free_public codes on one record, resolved once (so each could be
// cached) or never resolved.
export async function bulkCodes(
  w: World,
  owner: Session,
  recordId: string,
  n: number,
  resolved: boolean,
): Promise<void> {
  const now = new Date(w.clock.ms).toISOString();
  const rows = Array.from({ length: n }, () =>
    env.ZZ_DB.prepare(
      "INSERT INTO codes (id, scope, canonical, match_key, kind, check_word, list_version, status, revoked_reason, single_use, expires_at, record_id, owner_id, first_resolved_at, rerolls_remaining, replaced_by, write_id, created_at) VALUES (?, 'free_public', ?, ?, 'plain', NULL, NULL, 'active', NULL, 0, NULL, ?, ?, ?, 0, NULL, NULL, ?)",
    ).bind(
      crypto.randomUUID(),
      `zz-bulk-${crypto.randomUUID()}-zz`,
      crypto.randomUUID(),
      recordId,
      owner.accountId,
      resolved ? now : null,
      now,
    ),
  );
  for (let i = 0; i < rows.length; i += 50) {
    await env.ZZ_DB.batch(rows.slice(i, i + 50));
  }
}
