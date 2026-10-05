-- Revoke one reported code (spec 005 plan.md, Operator work). Put the code
-- id, the report's code_id, in place of :code_id, then run the file with
-- wrangler d1 execute:
--
--   npx wrangler d1 execute ZZ_DB --remote \
--     --command="$(sed 's/:code_id/CODE_ID/g' ops/revoke-code.sql)"
--
-- Only an active code is revoked, with revoked_reason operator, and one
-- code.revoke audit event with no actor is written in the same batch. A
-- code that is already revoked, used, or expired is left alone, and no
-- event is written. SQL cannot purge the edge cache, so a cached resolve
-- can last 60 seconds, the worst case in FR-018. This does not close the
-- report: reports.sql does that.
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
  NULL, 'code.revoke', 'code', id, 'ok',
  strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
FROM codes
WHERE id = ':code_id' AND status = 'active';

UPDATE codes
SET status = 'revoked', revoked_reason = 'operator'
WHERE id = ':code_id' AND status = 'active';

SELECT id, canonical, scope, status, revoked_reason
FROM codes
WHERE id = ':code_id';
