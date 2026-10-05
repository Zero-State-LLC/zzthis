-- Add a grant (spec 005 FR-034, plan.md Operator work): the role issuer,
-- viewer, or auditor, for one scope, to one account. Put the values in
-- place of :subject_id, :scope, :role, and :expires_at, then run the file
-- with wrangler d1 execute:
--
--   npx wrangler d1 execute ZZ_DB --remote --command="$(sed \
--     -e 's/:subject_id/ACCOUNT_ID/g' -e 's/:scope/enterprise/g' \
--     -e 's/:role/issuer/g' -e 's/:expires_at//g' ops/grant.sql)"
--
-- :expires_at is a time in the spec 005 form (RFC 3339 UTC, three
-- fractional digits, Z), or empty for a grant that does not expire. One
-- grant.add audit event with no actor, whose target is the account, is
-- written in the same batch. Nothing is written for an unknown or deleted
-- account, a scope or role the schema does not allow, or an expiry in any
-- other form.
--
-- Both inserts check the same condition, so both happen or neither does.
INSERT INTO audit_events (id, actor_id, action, target_type, target_id, result, created_at)
SELECT
  lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' ||
    substr(lower(hex(randomblob(2))), 2) || '-' ||
    substr('89ab', 1 + (random() & 3), 1) ||
    substr(lower(hex(randomblob(2))), 2) || '-' || lower(hex(randomblob(6))),
  NULL, 'grant.add', 'account', id, 'ok',
  strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
FROM accounts
WHERE id = ':subject_id' AND deleted_at IS NULL
  AND ':scope' IN ('enterprise', 'logistics', 'free_public')
  AND ':role' IN ('issuer', 'viewer', 'auditor')
  AND (
    ':expires_at' = ''
    OR strftime('%Y-%m-%dT%H:%M:%fZ', ':expires_at') = ':expires_at'
  );

INSERT INTO grants (id, subject_id, scope, role, expires_at)
SELECT
  lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' ||
    substr(lower(hex(randomblob(2))), 2) || '-' ||
    substr('89ab', 1 + (random() & 3), 1) ||
    substr(lower(hex(randomblob(2))), 2) || '-' || lower(hex(randomblob(6))),
  id, ':scope', ':role', NULLIF(':expires_at', '')
FROM accounts
WHERE id = ':subject_id' AND deleted_at IS NULL
  AND ':scope' IN ('enterprise', 'logistics', 'free_public')
  AND ':role' IN ('issuer', 'viewer', 'auditor')
  AND (
    ':expires_at' = ''
    OR strftime('%Y-%m-%dT%H:%M:%fZ', ':expires_at') = ':expires_at'
  );

SELECT id, scope, role, expires_at
FROM grants
WHERE subject_id = ':subject_id'
ORDER BY scope, role;
