import type { AppContext } from "../http/context.ts";
import { json } from "../http/respond.ts";
import { randomToken, sha256Hex } from "../lib/crypto.ts";
import { iso, MINUTE } from "../lib/time.ts";
import { limitIp } from "../limits/enforce.ts";

const NONCE_LIFETIME = 10 * MINUTE;

// POST /v1/auth/nonce (FR-020): a random nonce that works once, for 10
// minutes. Only its hash is stored. Nonces are pre-sign-in and anonymous,
// so they write no audit event; the daily run deletes them.
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
export async function consumeNonce(
  c: AppContext,
  nonce: string,
): Promise<boolean> {
  const now = iso(c.get("now"));
  const result = await c.env.ZZ_DB.prepare(
    "UPDATE auth_nonces SET used_at = ? WHERE nonce_hash = ? AND used_at IS NULL AND expires_at > ?",
  )
    .bind(now, await sha256Hex(nonce), now)
    .run();
  return result.meta.changes === 1;
}
