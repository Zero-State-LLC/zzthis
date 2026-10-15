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

## Accepted exception: RM-112 (2026-10-09 PT, D-2026-10-10-25)

Status: ACCEPTED (Danny, 2026-10-09 PT) as a named exception to D-2026-10-10-12.

- One additive, optional Resolve response field, `creator`, inside contract 1: an opaque HMAC of the owner's account id, null for private records.
- Shipped in PR #161 with OpenAPI `info.version` 1.1, `X-ZZ-Contract: 1` unchanged, and discovery `creator_refs: true`.
- RM-075 tolerant readers: the unknown-key half passes on both apps (zzThat PR #58), which covers the new keys `creator` and `creator_refs`. The unknown-enum half merged in zzThat #79 (T106) and closed #54 at 2026-10-15T02:21:04Z. This field adds no enum value. The first store build has not happened.
- No other contract-1 change is allowed under rule 1 until D-2026-10-10-12 is decided, except the named exception below.

## Accepted exception: five re-rolls (2026-10-14, D-2026-10-13-02)

Status: ACCEPTED (Danny, 2026-10-14, [#170](https://github.com/Zero-State-LLC/zzthis/issues/170#issuecomment-6175348667)) as a narrow exception to D-2026-10-10-12.

- A new plain code gets `rerolls_remaining` 5 instead of 3 (spec 005 FR-006), so one creation offers six candidates. This is a server rule change.
- The OpenAPI `rerolls_remaining` `maximum` changed from 3 to 5 in PR #178 (RM-125). Neither generated client enforces `maximum`, so shipped apps keep working. No field, route, error, or enum value is added. zzThat demo and cap tests still start at 3, and the API pin was not bumped.
- Word count does not change in contract 1: one-word and three-word codes stay `wrong-length`. Three-word codes come with contract 2 at v2.0 (spec 003, Code length).

## Rule until tolerant readers pass (2026-10-14, D-2026-10-13-09)

Status: ACCEPTED (Danny, 2026-10-14, [#170](https://github.com/Zero-State-LLC/zzthis/issues/170#issuecomment-6175348667)).

- No new value is added to any existing response enum within contract 1 until a store build carries zzThat's unknown-enum tolerance (RM-075). The decoder merged in zzThat #79 and closed #54 at 2026-10-15T02:21:04Z. Android sets the generator's `enumUnknownDefaultCase=true`; iOS decodes an unknown value to a fallback case.
- That tolerance is a gate on the first store build, not on any server change: once an app version is in a store, any later enum value would break that cohort.
- Evidence 2026-10-15: zzThat #79 merged the unknown-enum decoder (T106) on both platforms. The first store build has not happened. zzThat #54 was closed by #79 at 2026-10-15T02:21:04Z. The store build remains the RM-075 gate.
- Idle expiry (spec 005 FR-036) follows this rule: it reuses the existing `expired` status and adds no enum value.

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
