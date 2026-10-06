# zzThis cross-spec traceability

Status: current convergence artifact. This file links existing requirements; it does not create product behavior.

| Journey | Workflow | State transitions | Requirements/contracts | Acceptance evidence | Implementation task/status |
|---|---|---|---|---|---|
| Recognize/type and resolve | capture -> canonicalize -> resolve -> disclose/not-found | candidate -> canonical -> authorized/not-found | 003 US3; 004 US1/US2; 002 US1; 005 US1/OpenAPI | vectors.json; 005 T012; resolver/cache tests | implemented under 005 Group E; production deploy gated |
| Mint and link | authenticate -> choose scope -> server mint -> persist/audit | none -> active code | 002 US2; 003 issuer/check word; 005 US2 | 005 T008/T010/T011 tests | implemented under 005 Group D |
| Re-roll | owner request -> guarded retirement -> new mint | active -> revoked(reroll); successor active | 005 US2, FR-031 | concurrent re-roll and cap tests | implemented under 005 Group D |
| Update record | owner read -> append version -> purge cache | version N -> N+1 | 002 US3; 005 US3 | signature/audit rollback and purge tests | implemented under 005 Group E |
| Revoke code | owner/operator revoke -> audit -> purge | active -> revoked | 002 US3; 005 US3/operator SQL | idempotent/concurrent revoke tests | implemented under 005 Group E/J |
| Sign in / refresh / sign out | nonce -> provider token/dev -> session -> rotation/revoke | signed-out -> signed-in -> rotated/revoked | 005 US4, FR-020/021/022; OpenAPI | auth/session tests | implemented under 005 Group C |
| Delete account | authenticated delete -> provider revoke/pending -> code revoke -> record soft-delete -> session clear | account active -> deleted | 005 FR-023 | deletion and cross-client invalidation tests | implemented under 005 Group C |
| Retry hard photo read | local recognition fails -> optional upload when enabled -> read -> TTL purge | retry -> band result -> purged | 004 US3; 005 US5, FR-026 | T017/T031 tests | server path implemented but discovery keeps photo_reads false in V1 |
| Report/operator disposition | report -> operator query -> close/suspend/revoke/grant | report open -> closed; account active/suspended | 005 US7, FR-024/025/026; operator SQL | T038 ops tests | implemented; production operator runbook still gated |
| Structured semantic resolution | canonical code -> resolver authz -> profile/dictionary binding -> disclosure | V1 identifier -> profile-bound semantic interpretation | #81; PR #82 | semantic-profile acceptance checklist | CANON-SHADOW, no runtime authority |
| ZK predicate verification | authorized semantic resolution -> committed predicate proof -> verifier | proof absent -> generated -> accepted/rejected | #83; PR #84 S1 | 20 negative vectors planned | SPECULATIVE, no runtime authority |

## Coverage rule

Every future feature or contract change must add or update a row before implementation. A row is incomplete if it cannot point to all of: governing requirement, contract/schema/vector, acceptance evidence, implementation task, and current status.

## Status semantics

- **implemented** means code/tests exist on the repository branch described by the governing build stream.
- **deployed** is separate and requires the human production gate.
- **CANON-SHADOW/SPECULATIVE** means documentation/research only.
