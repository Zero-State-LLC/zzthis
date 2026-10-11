# zzThis consolidated threat model

Evidence classification: **OBSERVED** for statements describing current repository code/tests; **INFERRED** for governance, production gates, or design choices accepted by the convergence intent; **SPECULATIVE** only where explicitly marked as future research.

Status: pre-production security governance. This consolidates existing invariants; it does not authorize deployment.

## Assets
- authorization decisions and role-scoped records;
- code lifecycle state;
- account/provider/session material;
- signing and secret material;
- uploaded retry photos;
- audit integrity;
- future semantic dictionaries/namespaces.

## Trust boundaries
1. physical handwritten/printed code: public and copyable;
2. capture client: untrusted input producer;
3. grammar/canonicalization: deterministic syntax boundary;
4. resolver/API: authorization and disclosure boundary;
5. D1/R2/DO/cache: state/storage boundary;
6. Apple/Google: external identity providers;
7. operator SQL/runbooks: privileged administrative boundary;
8. future semantic/ZK layer: subordinate to resolver authority.

## Threats and required controls
| Threat | Required control/evidence |
|---|---|
| code guessing/enumeration | exact match; uniform not-found; no live-code hints; rate limits; tests |
| copied/replayed mark | possession is not auth; single-use/expiry where applicable |
| malformed/canonicalization bypass | server reparses with shared grammar; contract tests/vectors |
| concurrent double use/re-roll/refresh/revoke | conditional writes/batches; concurrency tests |
| unauthorized record/update/audit access | authenticated role/owner checks; same not-found where needed |
| cache disclosure/staleness | only eligible public resolves cached; no-store otherwise; purge/max-age tests |
| token theft/replay | short access lifetime, rotating refresh, reuse-family revoke, secure cookie rules |
| provider token confusion | issuer/audience/nonce/client-id binding tests |
| account deletion gaps | revoke sessions/codes/provider grants; pending-revocation retry; deletion tests |
| photo retention leak | disabled by default; explicit consent path; TTL+cron; no training use |
| operator privilege misuse | narrowly scoped SQL, audit event in same batch, no admin API in contract 1 |
| key compromise | production key storage/rotation/revocation runbook required before deploy |
| storage compromise | least privilege, encryption/platform controls, minimized retained data |
| provider outage | fail closed for new auth; do not broaden disclosure |
| logging/telemetry leak | redaction rules in OPERATIONS.md; no tokens/secrets/content in logs |
| equivocation/version drift | pinned contracts/versions; immutable future dictionary roots |
| future semantic disclosure | namespace/profile auth remains after resolver; non-enumerability preserved |
| ZK statement substitution/replay | S1 policy/audience/challenge/root bindings and negative vectors before promotion |
| IPv6 rotation around the IP limit; bulk guessing of public codes (added 2026-10-10) | /64 limiter keys (RM-030); zone rule (RM-031); growth monitor (RM-041); density trigger and residual-risk sign-off (D-2026-10-10-04, -05) |
| scope-wide grants read another organization's private records or audit events (added 2026-10-10) | one organization per scope until contract 2 (D-2026-10-10-06, RM-063); Organization entity (RM-080) |
| data-key rotation silently breaks Apple revocation (added 2026-10-10) | key ids on sealed values with a previous key (RM-021) |
| restore resurrects deleted personal data (added 2026-10-10) | deletion replay after any restore (RM-023) |
| issuer keeps re-rolling after losing its grant (added 2026-10-10) | scope check on re-roll (RM-032) |
| mint races account deletion or suspension (added 2026-10-10) | account guard in the mint batch (RM-033) |
| limiter or cache fault turns into an outage or a failed committed write (added 2026-10-10) | limiter timeout and per-route policy (RM-038); cache side effects off the request path (RM-034) |
| platform request logs capture codes from resolve URLs (added 2026-10-10) | invocation logs off and pinned in configuration (RM-001); log review (G7) |

## Review status (2026-10-10)

The [architecture review](../specs/analysis-2026-10-10-architecture-review.md) is a design review of the code, not a penetration test or runtime verification. It found no critical defect; its high and medium findings are the rows added above and BACKLOG items RM-021 and RM-030 to RM-039. The sign-off is BACKLOG RM-029.

## Security review gate

Before production, verify every V1 row above has automated evidence or an explicit operator control, and record unresolved risk acceptance. Before V1.x/V2 promotion, extend this model for namespace selection, contract negotiation, dictionary lifecycle, and verifier trust.
