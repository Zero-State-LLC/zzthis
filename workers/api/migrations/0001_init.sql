-- spec 005 Data model: every table and column the first migration implements.
-- Ids are UUID text. Times are RFC 3339 UTC with exactly three fractional
-- digits and Z, written by the Worker (Date.prototype.toISOString). No column
-- uses CURRENT_TIMESTAMP or datetime('now').

CREATE TABLE accounts (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  suspended_at TEXT,
  deleted_at TEXT
);

CREATE TABLE identities (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL REFERENCES accounts (id),
  provider TEXT NOT NULL CHECK (provider IN ('apple', 'google', 'dev')),
  provider_subject TEXT NOT NULL,
  -- The Apple refresh token (AES-GCM) and the verified ID token's aud are
  -- written and replaced together (FR-020).
  apple_refresh_token_enc TEXT,
  apple_client_id TEXT,
  created_at TEXT NOT NULL,
  UNIQUE (provider, provider_subject),
  CHECK ((apple_refresh_token_enc IS NULL) = (apple_client_id IS NULL))
);

CREATE INDEX identities_account ON identities (account_id);

CREATE TABLE auth_nonces (
  nonce_hash TEXT PRIMARY KEY,
  expires_at TEXT NOT NULL,
  used_at TEXT
);

CREATE TABLE refresh_tokens (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL REFERENCES accounts (id),
  family_id TEXT NOT NULL,
  client TEXT NOT NULL CHECK (client IN ('ios', 'android', 'web')),
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TEXT NOT NULL,
  revoked_at TEXT,
  replaced_by TEXT,
  write_id TEXT
);

CREATE INDEX refresh_tokens_family ON refresh_tokens (family_id);
CREATE INDEX refresh_tokens_account ON refresh_tokens (account_id);

CREATE TABLE records (
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL REFERENCES accounts (id),
  visibility TEXT NOT NULL CHECK (visibility IN ('public', 'private')),
  -- Points at record_versions.id. No foreign key, because a record and its
  -- first version are written in one batch, record first.
  current_version_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  deleted_at TEXT
);

CREATE INDEX records_owner ON records (owner_id);

CREATE TABLE record_versions (
  id TEXT PRIMARY KEY,
  record_id TEXT NOT NULL REFERENCES records (id),
  version INTEGER NOT NULL CHECK (version >= 1),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  signature TEXT NOT NULL,
  signing_key_id TEXT NOT NULL,
  created_by TEXT NOT NULL REFERENCES accounts (id),
  created_at TEXT NOT NULL,
  erased_at TEXT,
  UNIQUE (record_id, version)
);

CREATE TABLE codes (
  id TEXT PRIMARY KEY,
  scope TEXT NOT NULL CHECK (scope IN ('enterprise', 'logistics', 'free_public')),
  canonical TEXT NOT NULL,
  -- FR-032: unique across every code in every scope, retired rows included.
  match_key TEXT NOT NULL UNIQUE,
  kind TEXT NOT NULL CHECK (kind IN ('plain', 'handle')),
  check_word TEXT,
  list_version TEXT,
  status TEXT NOT NULL CHECK (status IN ('active', 'used', 'revoked', 'expired')),
  revoked_reason TEXT CHECK (
    revoked_reason IN ('owner', 'reroll', 'account-deleted', 'operator')
  ),
  single_use INTEGER NOT NULL CHECK (single_use IN (0, 1)),
  expires_at TEXT,
  record_id TEXT NOT NULL REFERENCES records (id),
  owner_id TEXT NOT NULL REFERENCES accounts (id),
  first_resolved_at TEXT,
  rerolls_remaining INTEGER NOT NULL CHECK (rerolls_remaining BETWEEN 0 AND 3),
  replaced_by TEXT,
  write_id TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX codes_owner ON codes (owner_id, created_at, id);
CREATE INDEX codes_record ON codes (record_id);

CREATE TABLE grants (
  id TEXT PRIMARY KEY,
  subject_id TEXT NOT NULL REFERENCES accounts (id),
  scope TEXT NOT NULL CHECK (scope IN ('enterprise', 'logistics', 'free_public')),
  role TEXT NOT NULL CHECK (role IN ('issuer', 'viewer', 'auditor')),
  expires_at TEXT
);

CREATE INDEX grants_subject ON grants (subject_id, role, scope);

CREATE TABLE audit_events (
  id TEXT PRIMARY KEY,
  actor_id TEXT,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  result TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX audit_events_created ON audit_events (created_at, id);
CREATE INDEX audit_events_target ON audit_events (target_type, target_id);

-- The audit log is append-only (spec 005 Data model): no update, no delete.
CREATE TRIGGER audit_events_no_update BEFORE UPDATE ON audit_events
BEGIN
  SELECT RAISE (ABORT, 'audit_events is append-only');
END;

CREATE TRIGGER audit_events_no_delete BEFORE DELETE ON audit_events
BEGIN
  SELECT RAISE (ABORT, 'audit_events is append-only');
END;

CREATE TABLE read_photos (
  id TEXT PRIMARY KEY,
  account_id TEXT REFERENCES accounts (id),
  canonical TEXT,
  object_key TEXT NOT NULL,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL
);

CREATE INDEX read_photos_expires ON read_photos (expires_at);
CREATE INDEX read_photos_account ON read_photos (account_id);

-- Holds no account id, so an erased account stays erased (FR-023).
CREATE TABLE pending_revocations (
  id TEXT PRIMARY KEY,
  provider TEXT NOT NULL CHECK (provider IN ('apple')),
  client_id TEXT NOT NULL,
  token_enc TEXT NOT NULL,
  attempts INTEGER NOT NULL,
  next_attempt_at TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE reports (
  id TEXT PRIMARY KEY,
  canonical TEXT NOT NULL,
  code_id TEXT,
  reason TEXT NOT NULL CHECK (reason IN ('spam', 'harassment', 'personal-data', 'other')),
  note TEXT NOT NULL,
  created_at TEXT NOT NULL,
  closed_at TEXT
);
