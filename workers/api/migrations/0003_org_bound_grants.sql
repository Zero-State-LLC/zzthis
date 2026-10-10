-- Org-bound grants (D-2026-10-10-22, RM-074, #135). org_id is the interim
-- tenant key under contract 1: the operator sets it on accounts with
-- ops/set-org.sql and on grants with ops/grant.sql. A viewer or auditor
-- grant reaches only rows whose owner shares its non-null org_id, and a
-- grant with no org_id reaches only its holder's own rows (spec 005 FR-016,
-- FR-034, FR-035). The Organization entity replaces it in contract 2
-- (RM-080). Forward-only; existing rows keep a null org_id.
ALTER TABLE accounts ADD COLUMN org_id TEXT;

ALTER TABLE grants ADD COLUMN org_id TEXT;

CREATE INDEX grants_org ON grants (org_id, scope, role);

CREATE INDEX accounts_org ON accounts (org_id);
