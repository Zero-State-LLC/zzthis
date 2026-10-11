# zzThis contract evolution policy

Status: governing compatibility policy for future contracts. Contract 1 behavior is unchanged.

## Rules

Evidence level: **INFERRED**, accepted as future compatibility policy by `intent/2026-10-05-spec-convergence-governance.md`. These rules do not change observed contract 1 behavior.

1. Contract 1 is immutable except for backward-compatible bug fixes that do not change accepted wire shapes or security semantics.
2. A breaking route, field, error, auth, scope/namespace, uniqueness, or disclosure change requires a new contract version.
3. Clients send the contract version explicitly and fail closed on unsupported versions.
4. A server may support multiple contract versions during migration; behavior must be tested independently for each.
5. Client pins identify the exact zzThis contract/design commit used to build them.
6. No contract version is removed until every supported client cohort has a documented upgrade/deprecation path.
7. Security fixes may accelerate deprecation, but the operator must record the compatibility impact and emergency policy.
8. Contract-2 design must define migration for persisted data, cache keys, auth/session compatibility, client discovery, and rollback.

## Proposed amendment: additive revisions and tolerant readers (2026-10-10)

Status: PROPOSED (D-2026-10-10-12). Until Danny accepts it, rule 1 stands unchanged.

- Contract 1 does not change through v1.1.
- After v1.1, contract 1 may take an additive revision (new optional request fields, new response fields, new routes) only when every supported client cohort is verified as a tolerant reader: generated clients ignore unknown JSON keys and accept unknown enum values. kotlinx.serialization rejects unknown keys unless `ignoreUnknownKeys` is set, and Swift decoders fail on an unknown enum case without a fallback, so this is a real constraint, not a formality.
- An additive revision changes OpenAPI `info.version`, keeps `X-ZZ-Contract: 1`, and advertises the feature in discovery.
- Everything else is contract 2.

## Semantic-profile implications

Evidence level: **INFERRED** future-contract constraint.


Namespace-aware resolution or tenant-dependent interpretation cannot be added to contract 1. Contract 2 (or later) must define:
- how namespace/profile is selected or proven;
- whether visible-code uniqueness remains global;
- error/non-enumerability behavior;
- version negotiation;
- old-client behavior;
- persisted mapping migration;
- rollback and coexistence.

## Deprecation record

Evidence level: **INFERRED** governance requirement.


Every future deprecation must state: version, affected client cohort, announcement date, minimum supported client, end-of-support date, security rationale if any, migration test, rollback plan, and operator approval.

## Research boundary

Evidence level: **OBSERVED** status boundary for the current research tracks.


CANON-SHADOW semantic/ZK research may reference hypothetical future contracts but must not imply support until a versioned contract is accepted.
