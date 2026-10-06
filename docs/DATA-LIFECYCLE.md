# zzThis data lifecycle matrix

Status: pre-production governance. Existing feature requirements remain authoritative where more specific.

| Data class | Store/path | Purpose | Current retention/deletion | Production requirement |
|---|---|---|---|---|
| Account identity/provider binding | D1 | auth/account | soft-delete/account deletion rules in spec 005 | document retained tombstone fields and provider identifiers after deletion |
| Access tokens | client/server verification | session auth | short-lived (spec 005) | never log; expire naturally |
| Refresh tokens | D1, hashed | session rotation | revoke/rotate/delete per FR-021/023 | define row cleanup cadence after expiry/revoke |
| Auth nonces | D1/runtime | replay protection | one-time/expiry per auth spec | periodic cleanup and no raw provider token logging |
| Codes | D1 | resolver identifier | retired codes never reissued; deletion revokes | define long-term tombstone retention and export behavior |
| Record versions | D1 | linked record | immutable versions; account deletion marks deleted | define legal/product retention after account deletion before production |
| Audit events | D1 | accountability/security | retained across account deletion | define retention period, access/export and minimization |
| Reports/moderation state | D1 | safety operations | close/delete rules in FR-026/operator SQL | define retention after closure and audit linkage |
| Uploaded retry photos | R2 + D1 row | hard-read review | 30-day expiry in spec 005; cron deletes | verify object+row deletion and failed-cleanup alert |
| Derived read result/canonical candidate | D1/response as specified | read result | feature-specific | do not retain beyond stated need without explicit rule |
| Cache entries | Workers Cache | public resolve acceleration | max-age/purge rules in FR-018/019 | purge failure monitoring; no private/authenticated caching |
| Rate-limit state | Durable Object | abuse control | window-bound | define cleanup/expiry behavior from limiter implementation |
| Pending provider revocations | D1 | account deletion recovery | retried by cron until success | alert on age/retry exhaustion; document manual escalation |
| Operator SQL inputs/results | operator workstation/D1 | admin actions | audit event persists | do not store command transcripts with sensitive record content unless required |
| Operational logs | Cloudflare/logging | reliability/security | not yet production-authorized | redact sensitive fields; define TTL and access roles |
| Backups/exports | future | recovery | not yet specified | retention, encryption, deletion propagation, restore testing required |
| Semantic profile/dictionary data | future | V1.x meaning | CANON-SHADOW only | immutable version/lifecycle model before implementation |
| ZK proofs/nullifiers/commitments | future | privacy-preserving verification | SPECULATIVE only | explicit verifier/nullifier retention and revocation model before implementation |

## Deletion evidence

For every production deletion flow, tests or runbook evidence must show which primary rows/objects, caches, provider grants, replicas/exports, and backups are affected. “Deleted” must never mean only hidden from the UI.

## External processors

Current identity flows may contact Apple or Google as specified. Retry-photo upload remains disabled in normal V1 discovery. Any future vision provider, analytics system, or proof service requires an explicit update to this matrix before use.

## Export

Account/data export behavior is not established by this document. If required by product/legal policy, specify authenticated scope, included fields, format, timing, and audit behavior before claiming support.
