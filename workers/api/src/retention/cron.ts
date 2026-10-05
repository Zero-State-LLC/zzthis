import { revokeAppleToken } from "../auth/apple.ts";
import type { Deps } from "../deps.ts";
import { readSettings, type Settings, type WorkerEnv } from "../env.ts";
import { open } from "../lib/crypto.ts";
import { DAY, iso } from "../lib/time.ts";

const REFRESH_KEPT_AFTER_EXPIRY = 30 * DAY;
const REVOCATION_WINDOW = 30 * DAY;
// D-2026-10-05-06: one year, counted as 365 days.
const REPORT_KEPT_AFTER_CLOSE = 365 * DAY;

interface PendingRow {
  id: string;
  client_id: string;
  token_enc: string;
  attempts: number;
  created_at: string;
}

export interface RetentionReport {
  readonly photos: number;
  readonly nonces: number;
  readonly refreshTokens: number;
  readonly reports: number;
  readonly revoked: number;
  readonly retried: number;
  readonly abandoned: number;
}

async function expiredPhotos(env: WorkerEnv, now: string): Promise<number> {
  const db = env.ZZ_DB;
  const rows = await db
    .prepare("SELECT id, object_key FROM read_photos WHERE expires_at <= ?")
    .bind(now)
    .all<{ id: string; object_key: string }>();
  if (rows.results.length === 0) return 0;
  await env.ZZ_PHOTOS.delete(rows.results.map((row) => row.object_key));
  await db.batch(
    rows.results.map((row) =>
      db.prepare("DELETE FROM read_photos WHERE id = ?").bind(row.id),
    ),
  );
  return rows.results.length;
}

type Outcome = "revoked" | "retried" | "abandoned";

// One pending Apple revocation: retried with its stored client id. After a
// failure the wait doubles, from one day. After 30 days the token is
// deleted unrevoked and the outcome is logged.
async function retryRevocation(
  env: WorkerEnv,
  deps: Deps,
  settings: Settings,
  row: PendingRow,
  nowMs: number,
): Promise<Outcome> {
  const db = env.ZZ_DB;
  const remove = db
    .prepare("DELETE FROM pending_revocations WHERE id = ?")
    .bind(row.id);
  if (Date.parse(row.created_at) + REVOCATION_WINDOW <= nowMs) {
    await remove.run();
    return "abandoned";
  }
  const revoked = await open(
    settings.dataKeys,
    row.token_enc,
    row.client_id,
  ).then(
    (token) =>
      revokeAppleToken(deps, settings.apple, row.client_id, token, nowMs),
    () => false,
  );
  if (revoked) {
    await remove.run();
    return "revoked";
  }
  const attempts = row.attempts + 1;
  await db
    .prepare(
      "UPDATE pending_revocations SET attempts = ?, next_attempt_at = ? WHERE id = ?",
    )
    .bind(attempts, iso(nowMs + DAY * 2 ** (attempts - 1)), row.id)
    .run();
  return "retried";
}

// FR-026, daily at 03:17 UTC: expired photos and their rows, used or
// expired nonces, refresh tokens 30 days past expiry, reports 365 days
// after they were closed, and the pending Apple revocations that are due.
export async function runRetention(
  env: WorkerEnv,
  deps: Deps,
): Promise<RetentionReport | null> {
  const ready = await readSettings(env);
  if (!ready.ok) {
    console.error(
      JSON.stringify({ event: "config-error", settings: ready.problems }),
    );
    return null;
  }
  const nowMs = deps.now();
  const now = iso(nowMs);
  const db = env.ZZ_DB;
  const photos = await expiredPhotos(env, now);
  const nonces = await db
    .prepare(
      "DELETE FROM auth_nonces WHERE used_at IS NOT NULL OR expires_at <= ?",
    )
    .bind(now)
    .run();
  const refresh = await db
    .prepare("DELETE FROM refresh_tokens WHERE expires_at <= ?")
    .bind(iso(nowMs - REFRESH_KEPT_AFTER_EXPIRY))
    .run();
  // An open report has no closed_at, so it is never deleted here. Its audit
  // rows stay.
  const reports = await db
    .prepare(
      "DELETE FROM reports WHERE closed_at IS NOT NULL AND closed_at <= ?",
    )
    .bind(iso(nowMs - REPORT_KEPT_AFTER_CLOSE))
    .run();
  // Due for a retry, or past the 30-day window even if the next retry is
  // later, so no token outlives the window by a doubled wait.
  const due = await db
    .prepare(
      "SELECT id, client_id, token_enc, attempts, created_at FROM pending_revocations WHERE next_attempt_at <= ? OR created_at <= ?",
    )
    .bind(now, iso(nowMs - REVOCATION_WINDOW))
    .all<PendingRow>();
  const outcomes: Outcome[] = [];
  for (const row of due.results) {
    outcomes.push(await retryRevocation(env, deps, ready.settings, row, nowMs));
  }
  const count = (outcome: Outcome) =>
    outcomes.filter((o) => o === outcome).length;
  const report: RetentionReport = {
    photos,
    nonces: nonces.meta.changes,
    refreshTokens: refresh.meta.changes,
    reports: reports.meta.changes,
    revoked: count("revoked"),
    retried: count("retried"),
    abandoned: count("abandoned"),
  };
  // FR-027: counts only.
  console.log(JSON.stringify({ event: "retention", ...report }));
  return report;
}
