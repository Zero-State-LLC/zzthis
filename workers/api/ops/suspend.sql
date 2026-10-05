-- Suspend an account and revoke its codes (spec 005 FR-025, plan.md
-- Operator work). Put the account id in place of :account_id, then run the
-- file with wrangler d1 execute:
--
--   npx wrangler d1 execute ZZ_DB --remote \
--     --command="$(sed 's/:account_id/ACCOUNT_ID/g' ops/suspend.sql)"
--
-- The account's writes and GET /v1/me/codes then return 403. Sign-in,
-- GET /v1/me, and DELETE /v1/me still work (FR-025). Its active codes are
-- revoked with revoked_reason operator. SQL cannot purge the edge cache, so
-- a cached resolve of one of them can last 60 seconds, the worst case in
-- FR-018. One account.suspend audit event with no actor is written in the
-- same batch. An account that is already suspended, deleted, or unknown is
-- left alone, and no event is written.
-- Times use the spec 005 form: RFC 3339 UTC, three fractional digits, Z.
--
-- Every statement checks the same condition before the account changes, so
-- all of them happen or none does.
INSERT INTO audit_events (id, actor_id, action, target_type, target_id, result, created_at)
SELECT
  lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' ||
    substr(lower(hex(randomblob(2))), 2) || '-' ||
    substr('89ab', 1 + (random() & 3), 1) ||
    substr(lower(hex(randomblob(2))), 2) || '-' || lower(hex(randomblob(6))),
  NULL, 'account.suspend', 'account', id, 'ok',
  strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
FROM accounts
WHERE id = ':account_id' AND suspended_at IS NULL AND deleted_at IS NULL;

UPDATE codes
SET status = 'revoked', revoked_reason = 'operator'
WHERE owner_id = ':account_id' AND status = 'active'
  AND EXISTS (
    SELECT 1 FROM accounts
    WHERE id = ':account_id' AND suspended_at IS NULL AND deleted_at IS NULL
  );

UPDATE accounts
SET suspended_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
WHERE id = ':account_id' AND suspended_at IS NULL AND deleted_at IS NULL;

SELECT id, suspended_at, deleted_at
FROM accounts
WHERE id = ':account_id';
