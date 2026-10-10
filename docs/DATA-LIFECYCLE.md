# zzThis data lifecycle matrix

Status: pre-production governance. Existing feature requirements remain authoritative where more specific. Evidence labels classify current behavior separately from inferred production policy and speculative future data.

| Data class | Evidence | Store/path | Purpose | Current retention/deletion | Production requirement |
|---|---|---|---|---|---|
| Account identity/provider binding | OBSERVED | D1 | auth/account | soft-delete/account deletion rules in spec 005 | document retained tombstone fields and provider identifiers after deletion |
| Access tokens | OBSERVED | client/server verification | session auth | short-lived (spec 005) | never log; expire naturally |
| Refresh tokens | OBSERVED | D1, hashed | session rotation | revoke/rotate/delete per FR-021/023 | define row cleanup cadence after expiry/revoke |
| Auth nonces | OBSERVED | D1/runtime | replay protection | one-time/expiry per auth spec | periodic cleanup and no raw provider token logging |
| Codes | OBSERVED | D1 | resolver identifier | retired codes never reissued; deletion revokes | define long-term tombstone retention and export behavior |
| Record versions | OBSERVED | D1 | linked record | append-only in ordinary history; account deletion erases title, body, and signature and records `erased_at` per FR-023 | define retention of the erased/tombstone row and deletion propagation before production |
| Audit events | OBSERVED | D1 | accountability/security | retained across account deletion; append-only triggers block deletion | retained through v1.1; Danny decides minimization at 1 GB of D1 or 6 months after launch (D-2026-10-10-10, RM-041) |
| Reports/moderation state | OBSERVED | D1 | safety operations | close/delete rules in FR-026/operator SQL | define retention after closure and audit linkage |
| Uploaded retry photos | OBSERVED | R2 + D1 row | hard-read review | 30-day expiry in spec 005; cron deletes; none are written while `ZZ_PHOTO_READS` is false (all of v1) | verify object+row deletion and failed-cleanup alert before photo reads turn on (v2.2) |
| Derived read result/canonical candidate | OBSERVED | D1/response as specified | read result | feature-specific | do not retain beyond stated need without explicit rule |
| Cache entries | OBSERVED | Workers Cache | public resolve acceleration | max-age/purge rules in FR-018/019 | purge failure monitoring; no private/authenticated caching |
| Rate-limit state | OBSERVED | Durable Object | abuse control | window-bound | define cleanup/expiry behavior from limiter implementation |
| Pending provider revocations | OBSERVED | D1 | account deletion recovery | retried by cron until success | alert on age/retry exhaustion; document manual escalation |
| Operator SQL inputs/results | OBSERVED | operator workstation/D1 | admin actions | audit event persists | do not store command transcripts with sensitive record content unless required |
| Operational logs | INFERRED | Cloudflare/logging | reliability/security | not yet production-authorized | redact sensitive fields; define TTL and access roles |
| Backups/exports | INFERRED | D1 Time Travel (30 days on Workers Paid) | recovery | platform-managed point-in-time history | a restore re-creates rows deleted after the restore point, including erased record text and sealed Apple tokens; the restore runbook must replay those deletions (D-2026-10-10-10, BACKLOG RM-023) |
| Semantic profile/dictionary data | SPECULATIVE | future | V1.x meaning | CANON-SHADOW only | immutable version/lifecycle model before implementation |
| ZK proofs/nullifiers/commitments | SPECULATIVE | future | privacy-preserving verification | SPECULATIVE only | explicit verifier/nullifier retention and revocation model before implementation |

## Deletion evidence

For every production deletion flow, tests or runbook evidence must show which primary rows/objects, caches, provider grants, replicas/exports, and backups are affected. “Deleted” must never mean only hidden from the UI.

## External processors

Current identity flows may contact Apple or Google as specified. Retry-photo upload remains disabled in normal V1 discovery. Any future vision provider, analytics system, or proof service requires an explicit update to this matrix before use.

## Export

Account/data export behavior is not established by this document. If required by product/legal policy, specify authenticated scope, included fields, format, timing, and audit behavior before claiming support.

For v1.0, access and deletion requests received outside the app are handled by an operator runbook (BACKLOG RM-027); self-service export is a v2.0 capability (RM-085). A published privacy policy is a v1.0 gate (D-2026-10-10-16, RM-026); FR-026 already refers to it.
