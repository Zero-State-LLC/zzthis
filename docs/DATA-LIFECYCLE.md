# zzThis data lifecycle matrix

Status: pre-production governance. Existing feature requirements remain authoritative where more specific. Evidence labels classify current behavior separately from inferred production policy and speculative future data.

| Data class | Evidence | Store/path | Purpose | Current retention/deletion | Production requirement |
|---|---|---|---|---|---|
| Account identity/provider binding | OBSERVED | D1 | auth/account | soft-delete/account deletion rules in spec 005 | document retained tombstone fields and provider identifiers after deletion |
| Account last activity (`accounts.last_active_at`) | OBSERVED (PR #177) | D1 `accounts` | idle expiry of `free_public` codes (spec 005 FR-036, D-2026-10-13-01, RM-127) | set by sign-in and refresh at most once per UTC day; a scan never changes it; migration 0004 backfills it to the migration time; kept with the account row | no finer activity record (no per-request or per-code timestamps); covered by the account tombstone rule above |
| Organization id (`org_id`) | OBSERVED | D1 `accounts` and `grants` | interim tenant key for viewer and auditor reach (D-2026-10-10-22) | operator-set with `ops/set-org.sql` (audit event `account.org.set`) and `ops/grant.sql`; kept with the row | replaced by the Organization entity in contract 2 (RM-080) |
| Access tokens | OBSERVED | client/server verification | session auth | short-lived (spec 005) | never log; expire naturally |
| Refresh tokens | OBSERVED | D1, hashed | session rotation | revoke/rotate/delete per FR-021/023; the daily run deletes rows 30 days past expiry (FR-026) | verify the daily delete on staging (G6, RM-035) |
| Auth nonces | OBSERVED | D1/runtime | replay protection | one-time/expiry per auth spec | periodic cleanup and no raw provider token logging |
| Codes | OBSERVED | D1 | resolver identifier | retired codes never reissued; deletion revokes; idle `free_public` codes expire and revive (row below), never reissued | define long-term tombstone retention and export behavior |
| Idle-expiry mark (`codes.idle_expired_at`) | OBSERVED (PR #177) | D1 `codes` | hides an idle `free_public` code from the public (spec 005 FR-036) | set by the daily run when the owner's `last_active_at` is more than 90 days old; cleared by the owner's next sign-in or refresh unless suspended; `code.expire` and `code.revive` audit events; the code is never reissued | no warning is sent (no email is stored); the Terms state the rule (RM-124) |
| Record versions | OBSERVED | D1 | linked record | append-only in ordinary history; account deletion erases title, body, and signature and records `erased_at` per FR-023 | define retention of the erased/tombstone row and deletion propagation before production |
| Audit events | OBSERVED | D1 | accountability/security | retained across account deletion; append-only triggers block deletion | retained through v1.1; Danny decides minimization at 1 GB of D1 or 6 months after launch (D-2026-10-10-10, RM-041) |
| Reports/moderation state | OBSERVED | D1 | safety operations | the daily run deletes a report 365 days after `closed_at`; open reports are never deleted; the report's audit rows stay (FR-026); triaged with `ops/report-queue.sql` and `ops/report-overdue.sql` (RM-102) | named moderator and one-day review before `ZZ_FREE_PUBLIC` turns on (RM-102) |
| Uploaded retry photos | OBSERVED | R2 + D1 row | hard-read review | 30-day expiry in spec 005; cron deletes; none are written while `ZZ_PHOTO_READS` is false (all of v1) | verify object+row deletion and failed-cleanup alert before photo reads turn on (v2.2) |
| Derived read result/canonical candidate | OBSERVED | D1/response as specified | read result | feature-specific | do not retain beyond stated need without explicit rule |
| Cache entries | OBSERVED | Workers Cache | public resolve acceleration | max-age/purge rules in FR-018/019 | purge failure monitoring; no private/authenticated caching |
| zzThat device lists: hidden codes, blocked creators, Saved | INFERRED | zzThat app storage on the device only | hide, block, and save without the server (RM-101, RM-115) | never sent to the server; cleared by account deletion and by the Account actions `account.unhide_all` (hidden and blocked) and `account.clear_saved` (Saved) | zzThat tests show no network call and the clears (RM-101, RM-115) |
| Mint-cap subject key | OBSERVED (PR #178) | limiter Durable Object | the `free_public` daily mint cap (spec 005 FR-011, D-2026-10-13-03, RM-072) | HMAC (label `mint-subject`) of `provider:provider_subject`, never the raw subject; the window is the UTC day; it survives account deletion for that window only, then clears with the window | tests show no raw provider subject in storage or logs (RM-072); rotating `ZZ_DATA_KEY` restarts the caps (OPERATIONS) |
| Rate-limit state | OBSERVED | Durable Object | abuse control | window-bound | define cleanup/expiry behavior from limiter implementation |
| Accepted terms version | INFERRED (accepted 2026-10-14, not built) | the client device only (zzThat app storage; web browser storage) | shows that the person on this device confirmed 18+ and accepted the current Terms before the first create (D-2026-10-13-04, RM-103, RM-120) | never sent to the server, which neither stores nor checks it; asked again when `terms.version` in `design/copy.json` changes; cleared by account deletion | client tests show no network call and the clear on deletion |
| Pending provider revocations | OBSERVED | D1 | account deletion recovery | retried by cron until success | alert on age/retry exhaustion; document manual escalation |
| Operator SQL inputs/results | OBSERVED | operator workstation/D1 | admin actions | audit event persists | do not store command transcripts with sensitive record content unless required |
| Operational logs | INFERRED | Cloudflare/logging | reliability/security | not yet production-authorized | redact sensitive fields; define TTL and access roles |
| Backups/exports | INFERRED | D1 Time Travel (30 days on Workers Paid) | recovery | platform-managed point-in-time history | a restore re-creates rows deleted after the restore point, including erased record text and sealed Apple tokens; the restore runbook must replay those deletions (D-2026-10-10-10, BACKLOG RM-023) |
| Semantic profile/dictionary data | SPECULATIVE | future | V1.x meaning | CANON-SHADOW only | immutable version/lifecycle model before implementation |
| ZK proofs/nullifiers/commitments | SPECULATIVE | future | privacy-preserving verification | SPECULATIVE only | explicit verifier/nullifier retention and revocation model before implementation |

## Deletion evidence

For every production deletion flow, tests or runbook evidence must show which primary rows/objects, caches, provider grants, replicas/exports, and backups are affected. “Deleted” must never mean only hidden from the UI.

## External processors

Current identity flows may contact Apple or Google as specified. Retry-photo upload remains disabled in normal V1 discovery. Any future vision provider, analytics system, or proof service requires an explicit update to this matrix before use. The zzThat Android app links Google ML Kit text recognition (bundled model), which sends Google diagnostics and usage data (device and app information, per-installation identifiers, performance metrics) and no image or text; store disclosures list it as collected by the SDK and not shared (D-2026-10-10-25). Vision on iOS sends nothing.

## Export

Account/data export behavior is not established by this document. If required by product/legal policy, specify authenticated scope, included fields, format, timing, and audit behavior before claiming support.

For v1.0, access and deletion requests received outside the app are handled by an operator runbook (BACKLOG RM-027); self-service export is a v2.0 capability (RM-085). A published privacy policy is a v1.0 gate (D-2026-10-10-16, RM-026); FR-026 already refers to it.
