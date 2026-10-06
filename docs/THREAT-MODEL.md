# zzThis consolidated threat model

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

## Security review gate

Before production, verify every V1 row above has automated evidence or an explicit operator control, and record unresolved risk acceptance. Before V1.x/V2 promotion, extend this model for namespace selection, contract negotiation, dictionary lifecycle, and verifier trust.
