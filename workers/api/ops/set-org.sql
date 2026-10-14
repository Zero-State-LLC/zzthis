-- Set the organization of one account (spec 005 FR-034, D-2026-10-10-22,
-- RM-074). Put the account id in place of :account_id, the organization id
-- in place of :org_id, and yes or nothing in place of :revoke_grants and
-- :move_owner, then run the file with wrangler d1 execute:
--
--   npx wrangler d1 execute ZZ_DB --remote --command="$(sed \
--     -e 's/:account_id/ACCOUNT_ID/g' -e 's/:org_id/ORG_ID/g' \
--     -e 's/:revoke_grants//g' -e 's/:move_owner//g' ops/set-org.sql)"
--
-- Set an account's organization before ops/grant.sql gives it a grant:
-- grant.sql refuses an org_id that is not the holder's own (RM-098).
--
-- An org_id is 1 to 64 characters of a-z, 0-9, and -. Until the
-- Organization entity (RM-080), it is the interim tenant key: viewer and
-- auditor grants with the same org_id (ops/grant.sql) reach this account's
-- private records and events, and no other grant does (FR-016, FR-035).
-- Empty clears the organization, so only the account itself reaches its
-- rows. Nothing is written for an unknown or deleted account, an org_id in
-- another form, or an account that already has that org_id.
--
-- Moving an account (D-2026-10-10-24, RM-099). Nothing is written when:
--
-- - the account holds an active grant, in any scope, whose org_id is not
--   the new one, because the grant would keep reaching the old
--   organization. With :revoke_grants set to yes, those grants end now in
--   the same batch, each with one grant.remove event, the way
--   ops/remove-grant.sql ends a grant, and the account moves.
-- - the account owns an enterprise or logistics code, revoked or not.
--   Membership is read live, so a moved owner takes its history, including
--   the old organization's actor ids on its codes, to the new
--   organization's auditors, and the old organization loses it. To keep
--   that history, create a new account instead. With :move_owner set to
--   yes, the account moves anyway.
--
-- Any other value of :revoke_grants or :move_owner, or the placeholder left
-- as written, means no.
--
-- One account.org.set audit event with no actor, whose target is the
-- account, is written in the same batch. Like every account event it is
-- listed for no auditor (FR-016). The audit row has no column for the
-- org_id; the account row holds it.
--
-- Each audit insert comes first and checks the same condition as the
-- update after it, so both happen or neither does. The grants end before
-- the move is checked, so the move goes ahead only once no grant for
-- another organization is still active.
INSERT INTO audit_events (id, actor_id, action, target_type, target_id, result, created_at)
SELECT
  lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' ||
    substr(lower(hex(randomblob(2))), 2) || '-' ||
    substr('89ab', 1 + (random() & 3), 1) ||
    substr(lower(hex(randomblob(2))), 2) || '-' || lower(hex(randomblob(6))),
  NULL, 'grant.remove', 'grant', g.id, 'ok',
  strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
FROM grants g
JOIN accounts a ON a.id = g.subject_id
WHERE a.id = ':account_id' AND a.deleted_at IS NULL
  AND ':revoke_grants' = 'yes'
  AND (
    ':org_id' = ''
    OR (length(':org_id') <= 64 AND ':org_id' NOT GLOB '*[^a-z0-9-]*')
  )
  AND a.org_id IS NOT NULLIF(':org_id', '')
  AND (
    ':move_owner' = 'yes'
    OR NOT EXISTS (
      SELECT 1 FROM codes c
      WHERE c.owner_id = a.id AND c.scope IN ('enterprise', 'logistics')
    )
  )
  AND (
    g.expires_at IS NULL
    OR g.expires_at > strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
  )
  AND g.org_id IS NOT NULLIF(':org_id', '');

UPDATE grants
SET expires_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
WHERE id IN (
  SELECT g.id
  FROM grants g
  JOIN accounts a ON a.id = g.subject_id
  WHERE a.id = ':account_id' AND a.deleted_at IS NULL
    AND ':revoke_grants' = 'yes'
    AND (
      ':org_id' = ''
      OR (length(':org_id') <= 64 AND ':org_id' NOT GLOB '*[^a-z0-9-]*')
    )
    AND a.org_id IS NOT NULLIF(':org_id', '')
    AND (
      ':move_owner' = 'yes'
      OR NOT EXISTS (
        SELECT 1 FROM codes c
        WHERE c.owner_id = a.id AND c.scope IN ('enterprise', 'logistics')
      )
    )
    AND (
      g.expires_at IS NULL
      OR g.expires_at > strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
    )
    AND g.org_id IS NOT NULLIF(':org_id', '')
);

INSERT INTO audit_events (id, actor_id, action, target_type, target_id, result, created_at)
SELECT
  lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' ||
    substr(lower(hex(randomblob(2))), 2) || '-' ||
    substr('89ab', 1 + (random() & 3), 1) ||
    substr(lower(hex(randomblob(2))), 2) || '-' || lower(hex(randomblob(6))),
  NULL, 'account.org.set', 'account', a.id, 'ok',
  strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
FROM accounts a
WHERE a.id = ':account_id' AND a.deleted_at IS NULL
  AND (
    ':org_id' = ''
    OR (length(':org_id') <= 64 AND ':org_id' NOT GLOB '*[^a-z0-9-]*')
  )
  AND a.org_id IS NOT NULLIF(':org_id', '')
  AND (
    ':move_owner' = 'yes'
    OR NOT EXISTS (
      SELECT 1 FROM codes c
      WHERE c.owner_id = a.id AND c.scope IN ('enterprise', 'logistics')
    )
  )
  AND NOT EXISTS (
    SELECT 1 FROM grants g
    WHERE g.subject_id = a.id
      AND (
        g.expires_at IS NULL
        OR g.expires_at > strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
      )
      AND g.org_id IS NOT NULLIF(':org_id', '')
  );

UPDATE accounts
SET org_id = NULLIF(':org_id', '')
WHERE id = ':account_id' AND deleted_at IS NULL
  AND (
    ':org_id' = ''
    OR (length(':org_id') <= 64 AND ':org_id' NOT GLOB '*[^a-z0-9-]*')
  )
  AND org_id IS NOT NULLIF(':org_id', '')
  AND (
    ':move_owner' = 'yes'
    OR NOT EXISTS (
      SELECT 1 FROM codes c
      WHERE c.owner_id = accounts.id
        AND c.scope IN ('enterprise', 'logistics')
    )
  )
  AND NOT EXISTS (
    SELECT 1 FROM grants g
    WHERE g.subject_id = accounts.id
      AND (
        g.expires_at IS NULL
        OR g.expires_at > strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
      )
      AND g.org_id IS NOT NULLIF(':org_id', '')
  );

SELECT id, org_id
FROM accounts
WHERE id = ':account_id';
