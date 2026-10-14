-- Idle expiry and revive (D-2026-10-13-01, RM-127). accounts.last_active_at
-- is set by POST /v1/auth/token and POST /v1/auth/refresh, at most once per
-- UTC day. The FR-026 daily run sets codes.idle_expired_at on each active
-- free_public code whose owner's last_active_at is more than 90 days old;
-- the owner's next sign-in or refresh clears it. Forward-only.
ALTER TABLE accounts ADD COLUMN last_active_at TEXT;

ALTER TABLE codes ADD COLUMN idle_expired_at TEXT;

-- Every existing account counts as active at the migration time, so no code
-- expires until 90 days after this migration. The spec 005 time form: RFC
-- 3339 UTC, three fractional digits, Z (%f is SS.SSS).
UPDATE accounts SET last_active_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now');

-- The daily run finds idle owners by last_active_at, then their codes
-- through codes_owner.
CREATE INDEX accounts_last_active ON accounts (last_active_at);

-- The daily run's audit insert and cache purge read the codes it just
-- expired by idle_expired_at; a revive reads an owner's idle-expired codes.
-- Both indexes hold only idle-expired rows.
CREATE INDEX codes_idle_expired ON codes (idle_expired_at)
WHERE idle_expired_at IS NOT NULL;

CREATE INDEX codes_idle_owner ON codes (owner_id)
WHERE idle_expired_at IS NOT NULL;
