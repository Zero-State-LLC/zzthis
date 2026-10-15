-- Empty every application table on STAGING before a staging run
-- (D-2026-10-13-06, RM-013). It runs only against the staging D1 database
-- zzthis-staging, with the staging config, and NEVER against production
-- (zzthis): it deletes every account, code, record, and audit row.
--
-- Run it by hand from workers/api, with the staging Cloudflare account:
--
--   npx wrangler d1 execute zzthis-staging --remote \
--     --config wrangler.staging.toml --file scripts/staging-reset.sql
--
-- No workflow runs it. Use --file, not --command: the trigger bodies hold
-- semicolons. Afterwards every table below is empty and the schema and the
-- d1_migrations table are unchanged. The limiter's Durable Object windows
-- are not reset, so run RM-014 before RM-015 (D-2026-10-13-06).
--
-- The audit log is append-only: two triggers refuse any update or delete
-- (migrations/0001_init.sql). The reset drops them, deletes the rows, and
-- creates them again exactly as the migration defines them. The tables are
-- every table in migrations 0001 to 0003, children before the parents
-- their foreign keys name.
DROP TRIGGER audit_events_no_update;

DROP TRIGGER audit_events_no_delete;

DELETE FROM audit_events;

DELETE FROM reports;

DELETE FROM pending_revocations;

DELETE FROM auth_nonces;

DELETE FROM read_photos;

DELETE FROM grants;

DELETE FROM codes;

DELETE FROM record_versions;

DELETE FROM records;

DELETE FROM refresh_tokens;

DELETE FROM identities;

DELETE FROM accounts;

-- The audit log is append-only (spec 005 Data model): no update, no delete.
CREATE TRIGGER audit_events_no_update BEFORE UPDATE ON audit_events
BEGIN
  SELECT RAISE (ABORT, 'audit_events is append-only');
END;

CREATE TRIGGER audit_events_no_delete BEFORE DELETE ON audit_events
BEGIN
  SELECT RAISE (ABORT, 'audit_events is append-only');
END;
