-- The moderation queue (spec 005 FR-025, D-2026-10-10-25 item 2, RM-102):
-- every open report, oldest first, with what the moderator needs to act on
-- it. Read only: it changes nothing and writes no audit row. Run it as
-- written with wrangler d1 execute:
--
--   npx wrangler d1 execute ZZ_DB --remote --command="$(cat ops/report-queue.sql)"
--
-- Columns:
--   id, canonical, reason, note, created_at  the report
--   hours_open       whole hours since the report arrived
--   overdue          1 when the report has been open for more than one day,
--                    the review target (FR-025); ops/report-overdue.sql
--                    lists only these
--   open_for_code    open reports on the same code, this one included
--   code_id, code_status, owner_id
--                    the reported code and its owner, when the code exists
--                    (a report of a code that was never issued has none)
--   owner_suspended  1 when the owner is already suspended
--
-- Act on a report with ops/revoke-code.sql (the code), ops/suspend.sql (the
-- owner and all their codes), then close it with ops/reports.sql. The
-- runbook is docs/OPERATIONS.md, Moderation.
SELECT
  r.id,
  r.canonical,
  r.reason,
  r.note,
  r.created_at,
  CAST((julianday('now') - julianday(r.created_at)) * 24 AS INTEGER) AS hours_open,
  CASE
    WHEN r.created_at < strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-1 day') THEN 1
    ELSE 0
  END AS overdue,
  (
    SELECT count(*) FROM reports o
    WHERE o.canonical = r.canonical AND o.closed_at IS NULL
  ) AS open_for_code,
  c.id AS code_id,
  c.status AS code_status,
  c.owner_id,
  CASE
    WHEN a.suspended_at IS NOT NULL THEN 1
    WHEN a.id IS NOT NULL THEN 0
  END AS owner_suspended
FROM reports r
LEFT JOIN codes c ON c.id = r.code_id
LEFT JOIN accounts a ON a.id = c.owner_id
WHERE r.closed_at IS NULL
ORDER BY r.created_at, r.id;
