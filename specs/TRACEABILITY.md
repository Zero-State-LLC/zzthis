# zzThis cross-spec traceability

Evidence classification: **OBSERVED** for statements describing current repository code/tests; **INFERRED** for governance, production gates, or design choices accepted by the convergence intent; **SPECULATIVE** only where explicitly marked as future research.

Status: current convergence artifact, deepened 2026-10-10 by the [architecture review](analysis-2026-10-10-architecture-review.md). This file links existing requirements; it does not create product behavior.

Chain: **Journey -> Workflow -> State transition -> Contract -> Acceptance test -> Implementation task -> Release and status.** State ids (`C1`, `A2`, ...) are defined in [DOMAIN-MODEL.md](DOMAIN-MODEL.md). Test paths are relative to the workspace named. Backlog items are in [BACKLOG.md](BACKLOG.md). "Staging" names evidence recorded on Cloudflare staging; everything else is local test evidence only.

## Journeys

| Id | Journey | Workflow | State transitions | Contract and requirements | Acceptance evidence | Tasks and items | Release and status |
|---|---|---|---|---|---|---|---|
| J1 | Type a code and resolve it | type -> zz-core parse -> classify -> local check word -> `GET /v1/resolve/{code}` -> rate limit -> cache or D1 -> view or one not-found | C1 active stays C1 (reusable; `first_resolved_at` set once); C1 -> C2 used (single use) | spec 005 Resolve, FR-008 to FR-011, FR-018, FR-019, FR-035; 003 US3; 002 US1; OpenAPI `resolveCode` | `packages/zz-core/test/vectors.test.ts`; `workers/api/test/resolve.test.ts`, `cache.test.ts`, `limits.test.ts`; `apps/web/test/resolve.test.ts`; `apps/web/e2e/web.spec.ts` | 005 T012, T018, T024; RM-016, RM-030, RM-034, RM-038 | v1.0. Implemented; cache unverified on Cloudflare; IPv6 limit defect |
| J2 | Create a code and link a record | sign in -> discovery -> `POST /v1/codes` -> scope check -> content check -> issuer draw -> one batch (record, version 1, code, audit) | none -> C1; record none -> R1 version 1 | spec 005 US2, Mint, FR-004 to FR-007, FR-024, FR-032, FR-034; 003 issuer; OpenAPI `mintCode` | `workers/api/test/mint.test.ts`, `handles.test.ts`, `data.test.ts`; `apps/web/test/create.test.ts`; e2e | 005 T008, T010, T011; RM-020, RM-033 | v1.0. Implemented; mint off on staging; account-state race |
| J3 | Re-roll a fresh code | owner -> `POST /v1/codes/{id}/reroll` -> guarded three-statement batch | C1 -> C4 revoked (`reroll`); successor none -> C1; budget 3 -> 0 | spec 005 US2, FR-006, FR-031 | `workers/api/test/reroll.test.ts` | 005 T009; RM-032 | v1.0. Implemented; scope-check defect |
| J4 | Update a record | owner -> `GET /v1/records/{id}` -> `POST .../versions` -> sign -> append -> purge | R1 version N -> N+1 | spec 005 US3, FR-030; 002 US3 | `workers/api/test/versions.test.ts`, `owner.test.ts`, `cache.test.ts`; `apps/web/test/owner-pages.test.ts`; e2e | 005 T014, T034, T024; RM-034 | v1.0. Implemented |
| J5 | Revoke a code (owner) | owner -> `POST /v1/codes/{id}/revoke` -> guarded update -> audit -> purge | C1 -> C4 revoked (`owner`); idempotent on C4 | spec 005 Mint (revoke), FR-018; 002 US3 | `workers/api/test/owner.test.ts`, `cache.test.ts`; e2e | 005 T014, T024; RM-034, RM-016 | v1.0. Implemented |
| J5b | Revoke a code (operator) | operator -> `ops/revoke-code.sql` -> audit in the same batch -> cache ages out | C1 -> C4 revoked (`operator`); cached public copy lives up to max-age | spec 005 plan Operator work | `workers/api/test/ops.test.ts` | 005 T038 | v1.0. Implemented; SQL cannot purge the cache |
| J6 | Sign in, refresh, sign out | nonce -> provider sign-in -> `POST /v1/auth/token` -> session -> rotate -> revoke | S0 signed out -> S1 signed in; T1 active -> T2 rotated / T3 revoked; reuse -> family T3 | spec 005 US4, FR-020 to FR-022 | `workers/api/test/auth.test.ts`, `providers.test.ts`, `session.test.ts`; `apps/web/test/signin-account.test.ts`, `api.test.ts`; e2e (dev provider) | 005 T005, T006; RM-011, RM-017, RM-037 | v1.0. Implemented; real providers unverified |
| J7 | Delete the account | `DELETE /v1/me` -> Apple revoke or pending row -> one batch -> photos and cache purge -> 204 | A1 active -> A3 deleted; C1 -> C4 (`account-deleted`); R1 -> R2 erased; T1 -> T3 | spec 005 FR-012, FR-023; DATA-LIFECYCLE | `workers/api/test/account.test.ts`; e2e | 005 T007; RM-017, RM-021, RM-033, RM-035 | v1.0. Implemented; fan-out and key-rotation defects |
| J8 | Daily retention | cron -> photos, nonces, refresh tokens, closed reports, pending Apple revocations | P1 pending -> P2 done / P3 abandoned; N1 -> deleted | spec 005 FR-026 | `workers/api/test/cron.test.ts`; staging: one zero-work run 2026-10-07 | 005 T031; RM-035 | v1.0. Implemented; unbounded |
| J9 | Issue a private, single-use, or expiring code | issuer grant -> mint with `visibility`, `single_use`, `expires_at` -> resolve with bearer | none -> C1; C1 -> C2 used; C1 -> C3 expired | spec 005 FR-034, FR-035; 002 FR-004, FR-020 | `workers/api/test/resolve.test.ts` (private, single use), `mint.test.ts` (scopes) | RM-063, RM-078 | Server v1.0; web UI v1.3 |
| J10 | Report and moderate | `POST /v1/reports` -> operator `reports.sql` -> close / suspend / revoke / grant | RP1 open -> RP2 closed -> deleted after 365 days; A1 -> A2 suspended -> A1 | spec 005 US7, FR-017, FR-024 to FR-026; plan Operator work | `workers/api/test/reports.test.ts`, `ops.test.ts`, `ops-grants.test.ts`, `suspension.test.ts` | 005 T016, T038; RM-063, RM-068 | v1.0. Implemented; triage commitment for v1.1 |
| J11 | Audit a scope | auditor grant -> `GET /v1/audit` | none | spec 005 FR-016, FR-034 | `workers/api/test/audit.test.ts` | 005 T015; RM-079, RM-088, RM-089 | Server v1.0; UI v1.3 |
| J12 | Scan a handwritten code with the camera | on-device recognition -> RecognitionResult evidence -> zz-core scanner -> classify -> bands -> person picks -> J1 | candidate -> Accept / Clarify / Retry / Abstain (spec 004 bands) | spec 004 US1, FR-008 to FR-017, Client read pipeline; ZZ-OCR-QUAL-001 (draft PR #89) | `packages/zz-core/test/scanner.test.ts`, `vectors.test.ts` (scanner rows); zzThat tests | RM-060 to RM-065, RM-070 | v1.1. Scanner implemented; engine unqualified |
| J13 | Retry a hard photo read | local read fails -> consent -> `POST /v1/reads` -> band -> 30-day purge | photo stored -> purged | spec 005 US5, FR-013, FR-026 | `workers/api/test/reads.test.ts`; discovery reports `photo_reads: false` | 005 T017; RM-092 | v2.2. Route disabled |
| J14 | Client discovers the contract | `GET /v1`, `GET /v1/openapi.json`, `X-ZZ-Contract: 1` | none | spec 005 FR-001, FR-002, FR-033 | `workers/api/test/contract.test.ts`, `settings.test.ts`; `tests/openapiContract.test.ts`; staging: discovery 200 | 005 T002, T003; RM-075, RM-087 | v1.0. Implemented and verified on staging |
| J15 | Recover from an incident | declare -> contain -> restore D1 to bookmark -> replay deletions -> restore secrets -> verify | service degraded -> restored | OPERATIONS; D-2026-10-10-10 | staging: empty-table D1 restore 2026-10-07 | RM-022 to RM-025 | v1.0. Runbooks missing |
| J16 | Structured semantic resolution | canonical code -> resolver authorization -> profile and dictionary binding -> disclosure | V1 identifier -> profile-bound interpretation | #81; PR #82 | semantic-profile acceptance checklist (planned) | RM-080, RM-091 | v2.1. CANON-SHADOW, no runtime authority |
| J17 | ZK predicate verification | authorized semantic resolution -> committed predicate proof -> verifier | proof absent -> generated -> accepted / rejected | #83; PR #84 S1 | 20 negative vectors (planned) | R-B15 | Research. SPECULATIVE, no runtime authority |

## Release-gate trace

Each v1.0 gate in [RELEASE-ROADMAP.md](RELEASE-ROADMAP.md) maps to journeys:

| Gate | Journeys |
|---|---|
| G2 staging write path | J1 to J7, J10 |
| G3 edge cache | J1, J4, J5 |
| G4 identity | J6, J7 |
| G5 recovery | J15, J7 |
| G6 retention | J8 |
| G7 observability | J1 to J15 (log fields) |

## Coverage rule

Every future feature or contract change must add or update a row before implementation. A row is incomplete if it cannot point to all of: governing requirement, contract/schema/vector, acceptance evidence, implementation task, and current status.

## Status semantics

- **implemented** means code/tests exist on the repository branch described by the governing build stream.
- **verified on staging** names evidence recorded on Cloudflare staging; it is not production evidence.
- **deployed** is separate and requires the human production gate.
- **CANON-SHADOW/SPECULATIVE** means documentation/research only.
