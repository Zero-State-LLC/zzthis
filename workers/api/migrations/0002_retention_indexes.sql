-- RM-035 (issue #130): indexes for the daily retention run (FR-026), so its
-- deletes and its pending-revocation scan read only the rows they remove.

CREATE INDEX auth_nonces_expires ON auth_nonces (expires_at);
CREATE INDEX auth_nonces_used ON auth_nonces (used_at) WHERE used_at IS NOT NULL;
CREATE INDEX refresh_tokens_expires ON refresh_tokens (expires_at);
CREATE INDEX pending_revocations_next ON pending_revocations (next_attempt_at);
CREATE INDEX pending_revocations_created ON pending_revocations (created_at);
CREATE INDEX reports_closed ON reports (closed_at) WHERE closed_at IS NOT NULL;
