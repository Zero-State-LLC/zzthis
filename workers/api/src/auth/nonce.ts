import { auditStatement, type AuditResult } from "../audit/writer.ts";
import type { AppContext } from "../http/context.ts";
import { json } from "../http/respond.ts";
import { hmacTag, randomToken, sha256Hex } from "../lib/crypto.ts";
import { changes } from "../lib/db.ts";
import { iso, MINUTE } from "../lib/time.ts";
import { limitIp } from "../limits/enforce.ts";

const NONCE_LIFETIME = 10 * MINUTE;

// POST /v1/auth/nonce (FR-020): a random nonce that works once, for 10
// minutes. Only its hash is stored; the daily run deletes it.
export async function createNonce(c: AppContext): Promise<Response> {
  await limitIp(c, "auth");
  const nonce = randomToken();
  await c.env.ZZ_DB.prepare(
    "INSERT INTO auth_nonces (nonce_hash, expires_at, used_at) VALUES (?, ?, NULL)",
  )
    .bind(await sha256Hex(nonce), iso(c.get("now") + NONCE_LIFETIME))
    .run();
  return json(200, { nonce, expires_in: NONCE_LIFETIME / 1000 });
}

// One guarded update consumes the nonce, so two sign-ins with one nonce
// cannot both pass. Unknown, expired, or used: false.
//
// D-2026-10-05-04 (Danny, #78): the consume and a failed consume each write
// an audit event. Its target is an HMAC of the nonce under the derived HMAC
// key, so the log never holds the nonce. The ok event is gated on the row
// this call marked and on there being no ok event for the nonce yet: a
// nonce is consumed once, and D1 runs batches one at a time, so a second
// consume in the same millisecond writes no second ok event.
export async function consumeNonce(
  c: AppContext,
  nonce: string,
): Promise<boolean> {
  const db = c.env.ZZ_DB;
  const now = iso(c.get("now"));
  const hash = await sha256Hex(nonce);
  const target = await hmacTag(c.get("settings").dataKeys, "nonce", nonce);
  const event = (result: AuditResult) => ({
    actorId: null,
    action: "auth.nonce",
    targetType: "nonce",
    targetId: target,
    result,
    at: now,
  });
  const results = await db.batch([
    db
      .prepare(
        "UPDATE auth_nonces SET used_at = ? WHERE nonce_hash = ? AND used_at IS NULL AND expires_at > ?",
      )
      .bind(now, hash, now),
    auditStatement(db, event("ok"), {
      sql: "SELECT 1 FROM auth_nonces WHERE nonce_hash = ? AND used_at = ? AND NOT EXISTS (SELECT 1 FROM audit_events WHERE action = 'auth.nonce' AND target_type = 'nonce' AND target_id = ? AND result = 'ok')",
      params: [hash, now, target],
    }),
  ]);
  if (changes(results) === 1) return true;
  await auditStatement(db, event("denied")).run();
  return false;
}
