-- Remove one grant (spec 005 FR-034, plan.md Operator work). Put the
-- grant id, from the grant.sql output, in place of :grant_id, then run the
-- file with wrangler d1 execute:
--
--   npx wrangler d1 execute ZZ_DB --remote \
--     --command="$(sed 's/:grant_id/GRANT_ID/g' ops/remove-grant.sql)"
--
-- This ends the grant now by setting its expires_at, and keeps the row.
-- Every grant check already treats an expired grant as absent (FR-034), and
-- the kept row still gives the grant's scope, so both the grant.add and the
-- grant.remove event stay listed for that scope's auditors (FR-016,
-- D-2026-10-05-07). One grant.remove audit event with no actor, whose
-- target is the grant, is written in the same batch. A grant that has
-- already expired, or an unknown id, is left alone, and no event is
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
  NULL, 'grant.remove', 'grant', id, 'ok',
  strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
FROM grants
WHERE id = ':grant_id'
  AND (expires_at IS NULL OR expires_at > strftime('%Y-%m-%dT%H:%M:%fZ', 'now'));

UPDATE grants
SET expires_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
WHERE id = ':grant_id'
  AND (expires_at IS NULL OR expires_at > strftime('%Y-%m-%dT%H:%M:%fZ', 'now'));

SELECT id, subject_id, scope, role, expires_at
FROM grants
WHERE id = ':grant_id';
