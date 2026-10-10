-- Add a grant (spec 005 FR-034, plan.md Operator work): the role issuer,
-- viewer, or auditor, for one scope, to one account. Put the values in
-- place of :subject_id, :scope, :role, :org_id, :expires_at, and
-- :same_org, then run the file with wrangler d1 execute:
--
--   npx wrangler d1 execute ZZ_DB --remote --command="$(sed \
--     -e 's/:subject_id/ACCOUNT_ID/g' -e 's/:scope/enterprise/g' \
--     -e 's/:role/issuer/g' -e 's/:org_id/ORG_ID/g' \
--     -e 's/:expires_at//g' -e 's/:same_org//g' ops/grant.sql)"
--
-- :org_id binds the grant to one organization (D-2026-10-10-22, RM-074):
-- 1 to 64 characters of a-z, 0-9, and -, the same id ops/set-org.sql puts
-- on that organization's accounts. A viewer grant opens the private records
-- of accounts with that org_id only (FR-035), and an auditor grant lists
-- only their events (FR-016). Empty means no organization: the grant then
-- reaches only its holder's own records and events. Give the grant the
-- holder's own org_id. An issuer grant only lets its holder mint, so its
-- org_id changes nothing today.
--
-- One organization per scope (D-2026-10-10-06, D-2026-10-10-22, RM-073).
-- Until contract 2, each of enterprise and logistics serves one
-- organization, because a viewer or auditor grant reaches the whole scope.
-- Before each grant, list the scope's active grants and check that every
-- account holding one belongs to the same organization as the new account
-- (RM-063):
--
--   SELECT g.subject_id, g.role, g.expires_at FROM grants g
--   JOIN accounts a ON a.id = g.subject_id
--   WHERE g.scope = 'enterprise' AND a.deleted_at IS NULL
--     AND (g.expires_at IS NULL
--       OR g.expires_at > strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
--
-- This file enforces the rule: an enterprise or logistics grant is refused,
-- with no grant and no audit row, when another account that is not deleted
-- holds an active grant (any role) in that scope. Expired grants do not
-- count. Once that check is done, set :same_org to the scope name, which is
-- the operator's written statement that the new account belongs to the
-- same organization, and the grant goes ahead. Leave :same_org empty
-- otherwise. A further grant to an account that already holds an active
-- grant in the scope, and every free_public grant, is never refused.
--
-- :expires_at is a time in the spec 005 form (RFC 3339 UTC, three
-- fractional digits, Z), or empty for a grant that does not expire. Nothing
-- is written for an unknown or deleted account, a scope or role the schema
-- does not allow, an org_id in another form, or an expiry in any other
-- form.
--
-- One grant.add audit event with no actor is written in the same batch. Its
-- target is the new grant, so the event takes the grant's scope, and that
-- scope's auditors list it (FR-016, D-2026-10-05-07). The audit row has no
-- column for the role, so the grant row holds it.
--
-- The grant insert comes first. The audit insert runs only when that insert
-- added a row, and finds the row by last_insert_rowid(), so both happen or
-- neither does.
INSERT INTO grants (id, subject_id, scope, role, org_id, expires_at)
SELECT
  lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' ||
    substr(lower(hex(randomblob(2))), 2) || '-' ||
    substr('89ab', 1 + (random() & 3), 1) ||
    substr(lower(hex(randomblob(2))), 2) || '-' || lower(hex(randomblob(6))),
  id, ':scope', ':role', NULLIF(':org_id', ''), NULLIF(':expires_at', '')
FROM accounts
WHERE id = ':subject_id' AND deleted_at IS NULL
  AND ':scope' IN ('enterprise', 'logistics', 'free_public')
  AND ':role' IN ('issuer', 'viewer', 'auditor')
  AND (
    ':org_id' = ''
    OR (length(':org_id') <= 64 AND ':org_id' NOT GLOB '*[^a-z0-9-]*')
  )
  AND (
    ':expires_at' = ''
    OR strftime('%Y-%m-%dT%H:%M:%fZ', ':expires_at') = ':expires_at'
  )
  AND (
    ':scope' = 'free_public'
    OR ':same_org' = ':scope'
    OR EXISTS (
      SELECT 1
      FROM grants g
      WHERE g.scope = ':scope' AND g.subject_id = ':subject_id'
        AND (
          g.expires_at IS NULL
          OR g.expires_at > strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
        )
    )
    OR NOT EXISTS (
      SELECT 1
      FROM grants g
      JOIN accounts a ON a.id = g.subject_id
      WHERE g.scope = ':scope' AND g.subject_id <> ':subject_id'
        AND a.deleted_at IS NULL
        AND (
          g.expires_at IS NULL
          OR g.expires_at > strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
        )
    )
  );

INSERT INTO audit_events (id, actor_id, action, target_type, target_id, result, created_at)
SELECT
  lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' ||
    substr(lower(hex(randomblob(2))), 2) || '-' ||
    substr('89ab', 1 + (random() & 3), 1) ||
    substr(lower(hex(randomblob(2))), 2) || '-' || lower(hex(randomblob(6))),
  NULL, 'grant.add', 'grant', id, 'ok',
  strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
FROM grants
WHERE changes() = 1 AND rowid = last_insert_rowid();

SELECT id, scope, role, org_id, expires_at
FROM grants
WHERE subject_id = ':subject_id'
ORDER BY scope, role, id;
