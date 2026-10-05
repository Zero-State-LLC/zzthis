-- Lift a suspension (spec 005 FR-025, plan.md Operator work). Put the
-- account id in place of :account_id, then run the file with wrangler d1
-- execute:
--
--   npx wrangler d1 execute ZZ_DB --remote \
--     --command="$(sed 's/:account_id/ACCOUNT_ID/g' ops/unsuspend.sql)"
--
-- This clears suspended_at, so the account can write again. Codes that
-- suspend.sql revoked during the suspension stay revoked: a revoked code
-- never comes back, and the owner mints new ones. One account.unsuspend
-- audit event with no actor is written in the same batch. An account that
-- is not suspended, deleted, or unknown is left alone, and no event is
-- written.
-- Times use the spec 005 form: RFC 3339 UTC, three fractional digits, Z.
--
-- The audit insert comes first and checks the same condition as the
-- update, so both happen or neither does.
INSERT INTO audit_events (id, actor_id, action, target_type, target_id, result, created_at)
SELECT
  lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' ||
    substr(lower(hex(randomblob(2))), 2) || '-' ||
    substr('89ab', 1 + (random() & 3), 1) ||
    substr(lower(hex(randomblob(2))), 2) || '-' || lower(hex(randomblob(6))),
  NULL, 'account.unsuspend', 'account', id, 'ok',
  strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
FROM accounts
WHERE id = ':account_id' AND suspended_at IS NOT NULL AND deleted_at IS NULL;

UPDATE accounts
SET suspended_at = NULL
WHERE id = ':account_id' AND suspended_at IS NOT NULL AND deleted_at IS NULL;

SELECT id, suspended_at, deleted_at
FROM accounts
WHERE id = ':account_id';
