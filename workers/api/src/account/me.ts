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
      settings.dataKeys,
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
        // An account is deleted once; the second clause keeps a racing
        // deletion in the same millisecond from writing a second event.
        sql: "SELECT 1 FROM accounts WHERE id = ? AND deleted_at = ? AND NOT EXISTS (SELECT 1 FROM audit_events WHERE action = 'account.delete' AND target_type = 'account' AND target_id = ?)",
        params: [accountId, now, accountId],
      },
    ),
  ];
}

// RM-035: step 3 does bounded work after the deletion committed. R2 takes
// at most 1,000 keys per call. Only a code that could be in the edge cache
// is purged: reusable, no expiry, public, and resolved at least once; any
// other code was never cached (FR-019 a). At most PURGE_MAX keys are
// purged, PURGE_CHUNK at a time; any beyond that age out within max-age,
// the FR-018 worst case. A cleanup fault is logged and the 204 stands: the
// rows are gone, and the reads/ lifecycle rule expires a stray object.
const R2_DELETE_MAX = 1000;
export const PURGE_MAX = 500;
const PURGE_CHUNK = 50;

async function deletionCleanup(
  c: AppContext,
  accountId: string,
  objectKeys: readonly string[],
): Promise<void> {
  try {
    for (let i = 0; i < objectKeys.length; i += R2_DELETE_MAX) {
      await c.env.ZZ_PHOTOS.delete(objectKeys.slice(i, i + R2_DELETE_MAX));
    }
  } catch {
    console.error(
      JSON.stringify({ event: "deletion-cleanup-fault", step: "photos" }),
    );
  }
  const cached = await c.env.ZZ_DB.prepare(
    "SELECT c.canonical FROM codes c JOIN records r ON r.id = c.record_id WHERE c.owner_id = ? AND c.write_id = ? AND c.single_use = 0 AND c.expires_at IS NULL AND c.first_resolved_at IS NOT NULL AND r.visibility = 'public' LIMIT ?",
  )
    .bind(accountId, c.get("requestId"), PURGE_MAX)
    .all<{ canonical: string }>();
  for (let i = 0; i < cached.results.length; i += PURGE_CHUNK) {
    await Promise.all(
      cached.results
        .slice(i, i + PURGE_CHUNK)
        .map((row) => purgeResolve(row.canonical)),
    );
  }
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
  await deletionCleanup(
    c,
    caller.id,
    photos.results.map((row) => row.object_key),
  );
  return new Response(null, {
    status: 204,
    headers:
      readRefreshCookie(c) === undefined
        ? {}
        : { "Set-Cookie": clearedRefreshCookie() },
  });
}
