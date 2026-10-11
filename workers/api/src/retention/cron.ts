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

// RM-035: one run does bounded work. Each step deletes in batches of at
// most `batch` rows, for at most `rounds` batches, and the pending Apple
// revocations take at most `revocations` outbound calls, so a backlog
// clears over successive daily runs instead of exceeding one invocation's
// limits. R2 takes at most 1,000 keys per delete call.
export interface RetentionLimits {
  readonly batch: number;
  readonly rounds: number;
  readonly revocations: number;
}

export const RETENTION_LIMITS: RetentionLimits = {
  batch: 500,
  rounds: 10,
  revocations: 25,
};

const R2_DELETE_MAX = 1000;

async function expiredPhotos(
  env: WorkerEnv,
  now: string,
  limits: RetentionLimits,
): Promise<number> {
  const db = env.ZZ_DB;
  const batch = Math.min(limits.batch, R2_DELETE_MAX);
  let total = 0;
  for (let round = 0; round < limits.rounds; round += 1) {
    const rows = await db
      .prepare(
        "SELECT id, object_key FROM read_photos WHERE expires_at <= ? LIMIT ?",
      )
      .bind(now, batch)
      .all<{ id: string; object_key: string }>();
    if (rows.results.length === 0) break;
    await env.ZZ_PHOTOS.delete(rows.results.map((row) => row.object_key));
    await db.batch(
      rows.results.map((row) =>
        db.prepare("DELETE FROM read_photos WHERE id = ?").bind(row.id),
      ),
    );
    total += rows.results.length;
    if (rows.results.length < batch) break;
  }
  return total;
}

// Deletes the rows `where` selects, `batch` at a time.
async function deleteInBatches(
  db: D1Database,
  limits: RetentionLimits,
  table: string,
  where: string,
  ...params: string[]
): Promise<number> {
  let total = 0;
  for (let round = 0; round < limits.rounds; round += 1) {
    const result = await db
      .prepare(
        `DELETE FROM ${table} WHERE rowid IN (SELECT rowid FROM ${table} WHERE ${where} LIMIT ?)`,
      )
      .bind(...params, limits.batch)
      .run();
    total += result.meta.changes;
    if (result.meta.changes < limits.batch) break;
  }
  return total;
}

// A step that fails is logged by name and counts as zero; the other steps
// still run.
async function step(
  name: string,
  work: () => Promise<number>,
): Promise<number> {
  try {
    return await work();
  } catch {
    console.error(
      JSON.stringify({ event: "retention-step-fault", step: name }),
    );
    return 0;
  }
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
  limits: RetentionLimits = RETENTION_LIMITS,
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
  const photos = await step("photos", () => expiredPhotos(env, now, limits));
  // Two deletes, so each one can use its index.
  const nonces = await step(
    "nonces",
    async () =>
      (await deleteInBatches(
        db,
        limits,
        "auth_nonces",
        "used_at IS NOT NULL",
      )) +
      (await deleteInBatches(
        db,
        limits,
        "auth_nonces",
        "expires_at <= ?",
        now,
      )),
  );
  const refreshTokens = await step("refresh-tokens", () =>
    deleteInBatches(
      db,
      limits,
      "refresh_tokens",
      "expires_at <= ?",
      iso(nowMs - REFRESH_KEPT_AFTER_EXPIRY),
    ),
  );
  // An open report has no closed_at, so it is never deleted here. Its audit
  // rows stay.
  const reports = await step("reports", () =>
    deleteInBatches(
      db,
      limits,
      "reports",
      "closed_at IS NOT NULL AND closed_at <= ?",
      iso(nowMs - REPORT_KEPT_AFTER_CLOSE),
    ),
  );
  // Due for a retry, or past the 30-day window even if the next retry is
  // later, so no token outlives the window by a doubled wait. Oldest first.
  const outcomes: Outcome[] = [];
  await step("apple-revocations", async () => {
    const due = await db
      .prepare(
        "SELECT id, client_id, token_enc, attempts, created_at FROM pending_revocations WHERE next_attempt_at <= ? OR created_at <= ? ORDER BY next_attempt_at LIMIT ?",
      )
      .bind(now, iso(nowMs - REVOCATION_WINDOW), limits.revocations)
      .all<PendingRow>();
    for (const row of due.results) {
      outcomes.push(
        await retryRevocation(env, deps, ready.settings, row, nowMs),
      );
    }
    return outcomes.length;
  });
  const count = (outcome: Outcome) =>
    outcomes.filter((o) => o === outcome).length;
  const report: RetentionReport = {
    photos,
    nonces,
    refreshTokens,
    reports,
    revoked: count("revoked"),
    retried: count("retried"),
    abandoned: count("abandoned"),
  };
  // FR-027: counts only.
  console.log(JSON.stringify({ event: "retention", ...report }));
  // RM-035: a token deleted unrevoked is an operator signal, logged apart
  // from the routine report so an alert can match it.
  if (report.abandoned > 0) {
    console.error(
      JSON.stringify({
        event: "apple-revocation-abandoned",
        count: report.abandoned,
      }),
    );
  }
  return report;
}
