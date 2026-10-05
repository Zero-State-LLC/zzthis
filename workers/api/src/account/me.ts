import { revokeAppleToken } from "../auth/apple.ts";
import { requireCaller } from "../auth/caller.ts";
import { auditStatement } from "../audit/writer.ts";
import type { AppContext } from "../http/context.ts";
import { clearedRefreshCookie, readRefreshCookie } from "../http/cookies.ts";
import { json } from "../http/respond.ts";
import { open } from "../lib/crypto.ts";
import { DAY, iso } from "../lib/time.ts";
import { limitUser } from "../limits/enforce.ts";
import { purgeResolve } from "../resolve/cache.ts";

// GET /v1/me: the account id and its providers. No profile fields.
export async function getMe(c: AppContext): Promise<Response> {
  const caller = await requireCaller(c);
  await limitUser(c, "owner-read", caller.id);
  const rows = await c.env.ZZ_DB.prepare(
    "SELECT DISTINCT provider FROM identities WHERE account_id = ? ORDER BY provider",
  )
    .bind(caller.id)
    .all<{ provider: string }>();
  return json(200, {
    id: caller.id,
    providers: rows.results.map((row) => row.provider),
    created_at: caller.createdAt,
  });
}

interface AppleIdentity {
  id: string;
  apple_refresh_token_enc: string;
  apple_client_id: string;
}

// FR-023 step 1: revoke each stored Apple token with its own client id.
// Returns the identities whose revoke failed, for pending_revocations.
async function revokeAppleTokens(
  c: AppContext,
  accountId: string,
): Promise<string[]> {
  const rows = await c.env.ZZ_DB.prepare(
    "SELECT id, apple_refresh_token_enc, apple_client_id FROM identities WHERE account_id = ? AND apple_refresh_token_enc IS NOT NULL",
  )
    .bind(accountId)
    .all<AppleIdentity>();
  const settings = c.get("settings");
  const failed: string[] = [];
  for (const row of rows.results) {
    const revoked = await open(
      settings.dataKey,
      row.apple_refresh_token_enc,
      row.apple_client_id,
    ).then(
      (token) =>
        revokeAppleToken(
          c.get("deps"),
          settings.apple,
          row.apple_client_id,
          token,
          c.get("now"),
        ),
      () => false,
    );
    if (!revoked) failed.push(row.id);
  }
  return failed;
}

// The first retry waits a day; the daily run doubles the wait after each
// failure (FR-026).
const FIRST_RETRY = DAY;

function accountDeletion(
  c: AppContext,
  accountId: string,
  pending: readonly string[],
): D1PreparedStatement[] {
  const db = c.env.ZZ_DB;
  const now = iso(c.get("now"));
  const writeId = c.get("requestId");
  // Every statement after the guard selects its rows through it: the
  // account row this request marked deleted.
  const guard =
    "EXISTS (SELECT 1 FROM accounts WHERE id = ? AND deleted_at = ?)";
  const run = (sql: string, ...params: (string | number)[]) =>
    db.prepare(`${sql} AND ${guard}`).bind(...params, accountId, now);
  return [
    db
      .prepare(
        "UPDATE accounts SET deleted_at = ? WHERE id = ? AND deleted_at IS NULL",
      )
      .bind(now, accountId),
    ...pending.map((identityId) =>
      run(
        "INSERT INTO pending_revocations (id, provider, client_id, token_enc, attempts, next_attempt_at, created_at) SELECT ?, 'apple', apple_client_id, apple_refresh_token_enc, 1, ?, ? FROM identities WHERE id = ?",
        crypto.randomUUID(),
        iso(c.get("now") + FIRST_RETRY),
        now,
        identityId,
      ),
    ),
    run(
      "UPDATE codes SET status = 'revoked', revoked_reason = 'account-deleted', write_id = ? WHERE owner_id = ? AND status = 'active'",
      writeId,
      accountId,
    ),
    run(
      "UPDATE records SET deleted_at = ? WHERE owner_id = ? AND deleted_at IS NULL",
      now,
      accountId,
    ),
    // Erase the text, and the signature over it, from every version.
    run(
      "UPDATE record_versions SET title = '', body = '', signature = '', erased_at = ? WHERE record_id IN (SELECT id FROM records WHERE owner_id = ?) AND erased_at IS NULL",
      now,
      accountId,
    ),
    run("DELETE FROM identities WHERE account_id = ?", accountId),
    run("DELETE FROM grants WHERE subject_id = ?", accountId),
    run("DELETE FROM read_photos WHERE account_id = ?", accountId),
    run(
      "UPDATE refresh_tokens SET revoked_at = ? WHERE account_id = ? AND revoked_at IS NULL",
      now,
      accountId,
    ),
    auditStatement(
      db,
      {
        actorId: accountId,
        action: "account.delete",
        targetType: "account",
        targetId: accountId,
        result: "ok",
        at: now,
      },
      {
        sql: "SELECT 1 FROM accounts WHERE id = ? AND deleted_at = ?",
        params: [accountId, now],
      },
    ),
  ];
}

// DELETE /v1/me (FR-023). Audit rows stay, and the words are never issued
// again. Signing in later creates a new, empty account.
export async function deleteMe(c: AppContext): Promise<Response> {
  const caller = await requireCaller(c);
  await limitUser(c, "delete-account", caller.id);
  const db = c.env.ZZ_DB;
  const pending = await revokeAppleTokens(c, caller.id);
  const photos = await db
    .prepare("SELECT object_key FROM read_photos WHERE account_id = ?")
    .bind(caller.id)
    .all<{ object_key: string }>();
  await db.batch(accountDeletion(c, caller.id, pending));
  // Step 3: the photo objects and the cache keys of the revoked codes.
  await c.env.ZZ_PHOTOS.delete(photos.results.map((row) => row.object_key));
  const revoked = await db
    .prepare("SELECT canonical FROM codes WHERE owner_id = ? AND write_id = ?")
    .bind(caller.id, c.get("requestId"))
    .all<{ canonical: string }>();
  await Promise.all(revoked.results.map((row) => purgeResolve(row.canonical)));
  return new Response(null, {
    status: 204,
    headers:
      readRefreshCookie(c) === undefined
        ? {}
        : { "Set-Cookie": clearedRefreshCookie() },
  });
}
