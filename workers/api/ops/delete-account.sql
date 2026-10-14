-- Delete one account for the operator (spec 005 FR-023, D-2026-10-13-08,
-- RM-023, RM-027). Use it for a deletion request the person cannot make
-- with DELETE /v1/me. Check who is asking first: the person signs in and
-- quotes the account id shown on /account/ (docs/OPERATIONS.md, Operator
-- deletion and access requests). Put that id in place of :account_id, then
-- run the file with wrangler d1 execute:
--
--   npx wrangler d1 execute ZZ_DB --remote \
--     --command="$(sed 's/:account_id/ACCOUNT_ID/g' ops/delete-account.sql)"
--
-- This is the FR-023 step 2 batch, the one DELETE /v1/me writes: the
-- account's active codes are revoked with revoked_reason account-deleted,
-- its records are marked deleted, every version's title, body, and
-- signature are emptied and erased_at is set, its identities, grants, and
-- read-photo rows are deleted, its refresh tokens are revoked, and
-- accounts.deleted_at is set. Audit rows stay. One account.delete audit
-- event with no actor, whose target is the account, is written in the same
-- batch. Signing in again later creates a new, empty account.
--
-- Step 1, the Apple revoke, needs a network call that SQL cannot make.
-- Instead, each stored Apple refresh token is copied, still encrypted, with
-- its client id, into pending_revocations before the identities are
-- deleted: attempts 0, due now. The next daily run (FR-026, 03:17 UTC)
-- revokes it, and retries a failure from one day later.
--
-- Step 3 is not in this file: SQL cannot delete R2 objects or purge the
-- edge cache. The photo objects expire under the bucket's 30-day reads/
-- lifecycle rule, and a cached resolve of a revoked code lasts at most its
-- max-age, 60 seconds, the FR-018 worst case.
--
-- An account that is unknown or already deleted is left alone, and no
-- event is written, so running the file twice writes nothing the second
-- time. A suspended account is deleted like any other (FR-025).
-- Times use the spec 005 form: RFC 3339 UTC, three fractional digits, Z.
-- Every write after the audit insert takes its time from that event, so
-- the account, its records, versions, tokens, and the queued revocations
-- share one timestamp, as they do in DELETE /v1/me.
--
-- The audit insert comes first, and every statement checks the same
-- condition: the account exists and is not deleted. The account row is
-- marked last, so all of them happen or none does.
INSERT INTO audit_events (id, actor_id, action, target_type, target_id, result, created_at)
SELECT
  lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' ||
    substr(lower(hex(randomblob(2))), 2) || '-' ||
    substr('89ab', 1 + (random() & 3), 1) ||
    substr(lower(hex(randomblob(2))), 2) || '-' || lower(hex(randomblob(6))),
  NULL, 'account.delete', 'account', id, 'ok',
  strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
FROM accounts
WHERE id = ':account_id' AND deleted_at IS NULL;

-- pending_revocations holds no account id, so an erased account stays
-- erased.
INSERT INTO pending_revocations (id, provider, client_id, token_enc, attempts, next_attempt_at, created_at)
SELECT
  lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' ||
    substr(lower(hex(randomblob(2))), 2) || '-' ||
    substr('89ab', 1 + (random() & 3), 1) ||
    substr(lower(hex(randomblob(2))), 2) || '-' || lower(hex(randomblob(6))),
  'apple', apple_client_id, apple_refresh_token_enc, 0,
  (
    SELECT max(created_at) FROM audit_events
    WHERE action = 'account.delete' AND target_type = 'account'
      AND target_id = ':account_id'
  ),
  (
    SELECT max(created_at) FROM audit_events
    WHERE action = 'account.delete' AND target_type = 'account'
      AND target_id = ':account_id'
  )
FROM identities
WHERE account_id = ':account_id' AND apple_refresh_token_enc IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM accounts
    WHERE id = ':account_id' AND deleted_at IS NULL
  );

UPDATE codes
SET status = 'revoked', revoked_reason = 'account-deleted'
WHERE owner_id = ':account_id' AND status = 'active'
  AND EXISTS (
    SELECT 1 FROM accounts
    WHERE id = ':account_id' AND deleted_at IS NULL
  );

UPDATE records
SET deleted_at = (
  SELECT max(created_at) FROM audit_events
  WHERE action = 'account.delete' AND target_type = 'account'
    AND target_id = ':account_id'
)
WHERE owner_id = ':account_id' AND deleted_at IS NULL
  AND EXISTS (
    SELECT 1 FROM accounts
    WHERE id = ':account_id' AND deleted_at IS NULL
  );

-- Erase the text, and the signature over it, from every version.
UPDATE record_versions
SET title = '', body = '', signature = '', erased_at = (
  SELECT max(created_at) FROM audit_events
  WHERE action = 'account.delete' AND target_type = 'account'
    AND target_id = ':account_id'
)
WHERE record_id IN (SELECT id FROM records WHERE owner_id = ':account_id')
  AND erased_at IS NULL
  AND EXISTS (
    SELECT 1 FROM accounts
    WHERE id = ':account_id' AND deleted_at IS NULL
  );

DELETE FROM identities
WHERE account_id = ':account_id'
  AND EXISTS (
    SELECT 1 FROM accounts
    WHERE id = ':account_id' AND deleted_at IS NULL
  );

DELETE FROM grants
WHERE subject_id = ':account_id'
  AND EXISTS (
    SELECT 1 FROM accounts
    WHERE id = ':account_id' AND deleted_at IS NULL
  );

DELETE FROM read_photos
WHERE account_id = ':account_id'
  AND EXISTS (
    SELECT 1 FROM accounts
    WHERE id = ':account_id' AND deleted_at IS NULL
  );

UPDATE refresh_tokens
SET revoked_at = (
  SELECT max(created_at) FROM audit_events
  WHERE action = 'account.delete' AND target_type = 'account'
    AND target_id = ':account_id'
)
WHERE account_id = ':account_id' AND revoked_at IS NULL
  AND EXISTS (
    SELECT 1 FROM accounts
    WHERE id = ':account_id' AND deleted_at IS NULL
  );

UPDATE accounts
SET deleted_at = (
  SELECT max(created_at) FROM audit_events
  WHERE action = 'account.delete' AND target_type = 'account'
    AND target_id = ':account_id'
)
WHERE id = ':account_id' AND deleted_at IS NULL;

SELECT id, suspended_at, deleted_at
FROM accounts
WHERE id = ':account_id';
