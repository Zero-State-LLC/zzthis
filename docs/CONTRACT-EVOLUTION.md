# zzThis contract evolution policy

Status: governing compatibility policy for future contracts. Contract 1 behavior is unchanged.

## Rules
1. Contract 1 is immutable except for backward-compatible bug fixes that do not change accepted wire shapes or security semantics.
2. A breaking route, field, error, auth, scope/namespace, uniqueness, or disclosure change requires a new contract version.
3. Clients send the contract version explicitly and fail closed on unsupported versions.
4. A server may support multiple contract versions during migration; behavior must be tested independently for each.
5. Client pins identify the exact zzThis contract/design commit used to build them.
6. No contract version is removed until every supported client cohort has a documented upgrade/deprecation path.
7. Security fixes may accelerate deprecation, but the operator must record the compatibility impact and emergency policy.
8. Contract-2 design must define migration for persisted data, cache keys, auth/session compatibility, client discovery, and rollback.

## Semantic-profile implications

Namespace-aware resolution or tenant-dependent interpretation cannot be added to contract 1. Contract 2 (or later) must define:
- how namespace/profile is selected or proven;
- whether visible-code uniqueness remains global;
- error/non-enumerability behavior;
- version negotiation;
- old-client behavior;
- persisted mapping migration;
- rollback and coexistence.

## Deprecation record

Every future deprecation must state: version, affected client cohort, announcement date, minimum supported client, end-of-support date, security rationale if any, migration test, rollback plan, and operator approval.

## Research boundary

CANON-SHADOW semantic/ZK research may reference hypothetical future contracts but must not imply support until a versioned contract is accepted.
