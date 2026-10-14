-- The review-target check (spec 005 FR-025, D-2026-10-10-25 item 2,
-- RM-102): the open reports that arrived more than one day ago. The target
-- is zero rows. Read only. Run it as written, at least once a day:
--
--   npx wrangler d1 execute ZZ_DB --remote --command="$(cat ops/report-overdue.sql)"
--
-- A row is a missed target: act on the report now (docs/OPERATIONS.md,
-- Moderation). Columns as in ops/report-queue.sql, without the owner.
SELECT
  r.id,
  r.canonical,
  r.reason,
  r.created_at,
  CAST((julianday('now') - julianday(r.created_at)) * 24 AS INTEGER) AS hours_open
FROM reports r
WHERE r.closed_at IS NULL
  AND r.created_at < strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-1 day')
ORDER BY r.created_at, r.id;
