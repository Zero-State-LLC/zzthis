import type { Gate } from "../audit/writer.ts";
import { changes } from "../lib/db.ts";
import { DAY, iso } from "../lib/time.ts";
import {
  COULD_BE_CACHED,
  PURGE_MAX,
  purgeResolveAll,
} from "../resolve/cache.ts";

// Idle expiry and revive (D-2026-10-13-01, D-2026-10-11-15 option B).
// Only free_public codes expire; enterprise and logistics codes keep their
// issuer-set expires_at. Activity is the owner's sign-in or token refresh,
// counted for the whole account. A scan is never activity. A code is never
// reissued: its match_key stays taken.

export const IDLE_LIMIT = 90 * DAY;

// A version 4 UUID made in SQL, one per row of a set-based audit insert,
// in the form the operator SQL writes (ops/revoke-code.sql).
const SQL_UUID =
  "lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))), 2) || '-' || substr('89ab', 1 + (random() & 3), 1) || substr(lower(hex(randomblob(2))), 2) || '-' || lower(hex(randomblob(6)))";

const AUDIT_COLUMNS =
  "id, actor_id, action, target_type, target_id, result, created_at";

// The start of the UTC day that holds ms.
function utcDayStart(ms: number): string {
  return iso(Math.floor(ms / DAY) * DAY);
}

// The statements a sign-in or refresh adds to its batch. last_active_at is
// written at most once per UTC day. Every idle-expired code of the account
// comes back on, with one code.revive event each, unless the account is
// suspended (or deleted). A code revoked meanwhile (suspend.sql revokes an
// account's active codes) does not come back, so it is left as it is. The audit insert runs first and reads the same
// rows the update then clears. With a gate, every statement writes only
// when the batch's guard took effect (FR-031).
export function activityStatements(
  db: D1Database,
  accountId: string,
  nowMs: number,
  gate?: Gate,
): D1PreparedStatement[] {
  const now = iso(nowMs);
  const gated = gate === undefined ? "" : ` AND EXISTS (${gate.sql})`;
  const gateParams = gate?.params ?? [];
  const live =
    "EXISTS (SELECT 1 FROM accounts WHERE id = ? AND suspended_at IS NULL AND deleted_at IS NULL)";
  return [
    db
      .prepare(
        `UPDATE accounts SET last_active_at = ? WHERE id = ? AND (last_active_at IS NULL OR last_active_at < ?)${gated}`,
      )
      .bind(now, accountId, utcDayStart(nowMs), ...gateParams),
    db
      .prepare(
        `INSERT INTO audit_events (${AUDIT_COLUMNS}) SELECT ${SQL_UUID}, ?, 'code.revive', 'code', id, 'ok', ? FROM codes WHERE owner_id = ? AND status = 'active' AND idle_expired_at IS NOT NULL AND ${live}${gated}`,
      )
      .bind(accountId, now, accountId, accountId, ...gateParams),
    db
      .prepare(
        `UPDATE codes SET idle_expired_at = NULL WHERE owner_id = ? AND status = 'active' AND idle_expired_at IS NOT NULL AND ${live}${gated}`,
      )
      .bind(accountId, accountId, ...gateParams),
  ];
}

export interface IdleLimits {
  readonly batch: number;
  readonly rounds: number;
}

// FR-026 daily run, idle-expiry step. Each round marks at most `batch`
// active free_public codes whose owner's last_active_at is more than 90
// days old, and writes one code.expire event per code (no actor) in the
// same batch, selected through the round's write_id. The run then purges
// the edge-cache keys of the codes it expired that could be cached (as
// FR-023 step 3 does), at most PURGE_MAX per run; the rest age out within
// the FR-018 60 seconds.
export async function expireIdleCodes(
  db: D1Database,
  nowMs: number,
  limits: IdleLimits,
): Promise<number> {
  const now = iso(nowMs);
  const cutoff = iso(nowMs - IDLE_LIMIT);
  let total = 0;
  let purged = 0;
  for (let round = 0; round < limits.rounds; round += 1) {
    const writeId = crypto.randomUUID();
    const results = await db.batch([
      db
        .prepare(
          "UPDATE codes SET idle_expired_at = ?, write_id = ? WHERE rowid IN (SELECT c.rowid FROM accounts a JOIN codes c ON c.owner_id = a.id WHERE a.last_active_at < ? AND a.deleted_at IS NULL AND c.scope = 'free_public' AND c.status = 'active' AND c.idle_expired_at IS NULL AND (c.expires_at IS NULL OR c.expires_at > ?) LIMIT ?)",
        )
        .bind(now, writeId, cutoff, now, limits.batch),
      db
        .prepare(
          `INSERT INTO audit_events (${AUDIT_COLUMNS}) SELECT ${SQL_UUID}, NULL, 'code.expire', 'code', id, 'ok', ? FROM codes WHERE idle_expired_at = ? AND write_id = ?`,
        )
        .bind(now, now, writeId),
    ]);
    const expired = changes(results);
    total += expired;
    const cached = await db
      .prepare(
        `SELECT c.canonical FROM codes c JOIN records r ON r.id = c.record_id WHERE c.idle_expired_at = ? AND c.write_id = ? AND ${COULD_BE_CACHED} LIMIT ?`,
      )
      .bind(now, writeId, PURGE_MAX - purged)
      .all<{ canonical: string }>();
    await purgeResolveAll(cached.results.map((row) => row.canonical));
    purged += cached.results.length;
    if (expired < limits.batch) break;
  }
  return total;
}
