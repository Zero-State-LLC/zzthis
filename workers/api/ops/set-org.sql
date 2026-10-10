-- Set the organization of one account (spec 005 FR-034, D-2026-10-10-22,
-- RM-074). Put the account id in place of :account_id and the organization
-- id in place of :org_id, then run the file with wrangler d1 execute:
--
--   npx wrangler d1 execute ZZ_DB --remote --command="$(sed \
--     -e 's/:account_id/ACCOUNT_ID/g' -e 's/:org_id/ORG_ID/g' \
--     ops/set-org.sql)"
--
-- An org_id is 1 to 64 characters of a-z, 0-9, and -. Until the
-- Organization entity (RM-080), it is the interim tenant key: viewer and
-- auditor grants with the same org_id (ops/grant.sql) reach this account's
-- private records and events, and no other grant does (FR-016, FR-035).
-- Empty clears the organization, so only the account itself reaches its
-- rows. Nothing is written for an unknown or deleted account, an org_id in
-- another form, or an account that already has that org_id.
--
-- One account.org.set audit event with no actor, whose target is the
-- account, is written in the same batch. Like every account event it is
-- listed for no auditor (FR-016). The audit row has no column for the
-- org_id; the account row holds it.
--
-- The audit insert comes first and checks the same condition as the
-- update, so both happen or neither does.
INSERT INTO audit_events (id, actor_id, action, target_type, target_id, result, created_at)
SELECT
  lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' ||
    substr(lower(hex(randomblob(2))), 2) || '-' ||
    substr('89ab', 1 + (random() & 3), 1) ||
    substr(lower(hex(randomblob(2))), 2) || '-' || lower(hex(randomblob(6))),
  NULL, 'account.org.set', 'account', id, 'ok',
  strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
FROM accounts
WHERE id = ':account_id' AND deleted_at IS NULL
  AND (
    ':org_id' = ''
    OR (length(':org_id') <= 64 AND ':org_id' NOT GLOB '*[^a-z0-9-]*')
  )
  AND org_id IS NOT NULLIF(':org_id', '');

UPDATE accounts
SET org_id = NULLIF(':org_id', '')
WHERE id = ':account_id' AND deleted_at IS NULL
  AND (
    ':org_id' = ''
    OR (length(':org_id') <= 64 AND ':org_id' NOT GLOB '*[^a-z0-9-]*')
  )
  AND org_id IS NOT NULLIF(':org_id', '');

SELECT id, org_id
FROM accounts
WHERE id = ':account_id';
