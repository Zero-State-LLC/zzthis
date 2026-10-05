-- List the open reports, and close one (spec 005 plan.md, Operator work).
--
-- As written, this closes nothing and lists every open report. To close a
-- report, put its id in place of :report_id, then run the file with
-- wrangler d1 execute:
--
--   npx wrangler d1 execute ZZ_DB --remote \
--     --command="$(sed 's/:report_id/REPORT_ID/g' ops/reports.sql)"
--
-- Closing sets closed_at. The daily run deletes the report 365 days later
-- (FR-026, D-2026-10-05-06), and its audit rows stay. Closing writes one
-- report.close audit event with no actor, in the same batch. A report that
-- is already closed keeps its closed_at, and no second event is written.
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
  NULL, 'report.close', 'report', id, 'ok',
  strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
FROM reports
WHERE id = ':report_id' AND closed_at IS NULL;

UPDATE reports
SET closed_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
WHERE id = ':report_id' AND closed_at IS NULL;

SELECT id, canonical, code_id, reason, note, created_at
FROM reports
WHERE closed_at IS NULL
ORDER BY created_at, id;
