# zzThis specification completeness audit - 2026-10-05

Scope: constitution, AGENTS contract, docs/SPEC.md governance surface, specs 001-005 and their plans/checklists/tasks, prior analyses, accepted one-shot intent, current main implementation, open issue lifecycle, and CANON-SHADOW PRs #82/#84.

## Executive result

**V1 functional contract: substantially complete.**
**Repository governance/operations/traceability: incomplete and drifting.**
**Semantic/ZK research: correctly isolated, but must not be promoted until the parent semantic-profile spec is merged and the research branch is reconciled.**

No evidence supports a new feature spec 006 today.

## Ranked findings

| # | Severity | Label | Finding | Required disposition |
|---|---|---|---|---|
| A1 | HIGH | OBSERVED | Constitution says v1.1.1 but remains `Ratified: pending`; specs/README says constitution v1.1.0. Accepted intents/spec work now depend on an unresolved governance state. | Human governance decision: ratify current constitution or amend+ratify. Then fix README version/status. |
| A2 | HIGH | OBSERVED | `specs/005-v1-api/checklists/requirements.md` still says “server is not built” and “build itself” unchecked, while 005 tasks Group 0-J are implemented/checked and runtime files exist. | Refresh checklist from observed main; separate built/tested from deployed/production-ready. |
| A3 | HIGH | OBSERVED | Issue lifecycle is stale. #60-#67 remain open although their 005 groups are checked complete. #13/#14 also remain open despite resolver/core and wordlist work being substantially implemented/subsumed. | Reconcile each issue against main, close only with evidence/commit/PR, or rewrite remaining scope. |
| A4 | HIGH | INFERRED | Journey -> Workflow -> State Transition -> Contract -> Acceptance Test -> Task is not explicit across specs. User stories and numbered flows contain much of it, but no traceability matrix makes coverage mechanically reviewable. | Add a cross-spec traceability artifact; do not duplicate requirements. |
| A5 | HIGH | OBSERVED | No canonical SLO/error budget, RTO/RPO, backup/restore verification, incident/runbook ownership, or production observability contract was found. | Add an operations/governance specification section before production authorization. |
| A6 | HIGH | OBSERVED | Privacy/retention rules exist in feature requirements, but there is no single retention/deletion matrix covering raw photos, derived reads, records, audit events, auth/session material, provider revocations, telemetry/logs, caches, backups, and future semantic/ZK artifacts. | Add canonical data lifecycle matrix and deletion evidence rules. |
| A7 | MEDIUM | OBSERVED | `docs/project-board.md` is stale and explicitly lists an old board inventory. It omits recent semantic/ZK issues and PRs. | Make board inventory dynamic or remove the enumerated list; keep workflow/field semantics. |
| A8 | MEDIUM | OBSERVED | Prior analyses are historically useful but their “next work” and “not built” statements are stale. No current converge report supersedes 2026-10-04 for main. | Add this audit as the new converge snapshot and point specs/README to it. |
| A9 | MEDIUM | OBSERVED | 002-004 plans/tasks still read as proposal/draft/unimplemented even though portions are implemented through spec 005. Ownership between legacy feature tasks and 005 build tasks is ambiguous. | Mark tasks as superseded, implemented-by-005, still-open, or deferred. Do not double-build. |
| A10 | MEDIUM | OBSERVED | Security is strong at route-level invariants, but there is no consolidated production threat model for auth, resolver enumeration, cache staleness, D1/R2/DO compromise, operator SQL, provider outage, key compromise/rotation, and recovery. | Consolidate existing security requirements into one threat-model artifact before deploy. |
| A11 | MEDIUM | OBSERVED | No explicit compatibility/versioning policy was found for contract evolution beyond contract 1, including client pin lifetime, deprecation, migration, and semantic-profile V2 negotiation. | Define compatibility/deprecation rules before contract 2 or namespace-aware resolution. |
| A12 | MEDIUM | OBSERVED | #81 semantic profile is branch-only in PR #82. #83/S1 depends conceptually on it; PR #84 was cut from main before #82 and is currently not mergeable. | Review/merge #82 first if clean, then rebase/reconcile #84. Keep both CANON-SHADOW. |
| A13 | MEDIUM | OBSERVED | Semantic-profile authority uses future `namespace` while current product uses `scope`. The distinction is documented but no domain-model relation exists. | Before V1.x implementation, define Scope vs Namespace identities, cardinality, authority, lifecycle, and migration. |
| A14 | MEDIUM | OBSERVED | ZK S1 formalizes the proof relation but its cryptographic primitives remain intentionally unfrozen. Leaf encoding, authority-root publication, revocation source, verifier trust bootstrap, and nullifier state ownership are promotion blockers. | Keep research-only; complete S1 gate before proof-system selection. |
| A15 | LOW | OBSERVED | `docs/BUILD-BRIEF.md` is a historical site-build brief and can be mistaken for current build authority. | Label historical/superseded or point clearly to current intent/one-shot brief. |
| A16 | LOW | INFERRED | Feature specs name tool/agent owners such as FORGE/ADVERSARY/SCRIBE. These are less durable than capability/role ownership. | Prefer durable role/capability ownership when next editing these sections. |

## Layer completeness

| Layer | Status | Audit note |
|---|---|---|
| Constitution | PARTIAL | Strong principles; ratification/version drift. |
| Domain model | PARTIAL | V1 data model strong in 005; Scope/Namespace/Profile/Dictionary need canonical relation. |
| Requirements | STRONG | 001-005 have extensive FRs and source labels. |
| Journeys | PARTIAL | Present as user stories/screens/flows, not canonical journey artifacts. |
| Workflows | PARTIAL | Workflows sections mostly name engineering workflows, not product/business workflows. |
| State machines | PARTIAL | Demo explicit; resolver/auth/code lifecycle states distributed through prose/tests. |
| Contracts | STRONG | Contract 1/OpenAPI and parser vectors are concrete. Future evolution policy missing. |
| Data model | STRONG V1 / PARTIAL FUTURE | D1 model concrete; semantic model reserved, not designed. |
| Security/privacy/governance | PARTIAL | Good local invariants; missing consolidated threat model, lifecycle matrix, ops/recovery, constitution closure. |
| Architecture | STRONG V1 / PARTIAL FUTURE | Boundaries clear; semantic/ZK tracks isolated. |
| Acceptance tests | STRONG V1 | Extensive done-when, vectors, route tests, E2E design. Traceability matrix missing. |
| Implementation tasks | STRONG 005 / DRIFT 002-004 | 005 detailed/largely checked; older tasks need reconciliation. |
| Operations | WEAK | Production SLO/RTO/RPO/backup/restore/incident/observability not canonicalized. |

## Required traceability shape

Do not rewrite existing requirements. Add one matrix:

```
Journey
 -> Workflow
 -> State transition(s)
 -> Requirement/FR
 -> Contract/schema/vector
 -> Acceptance test/evidence
 -> Implementation task
 -> Current status
```

Minimum journeys:
1. recognize/type and resolve;
2. create/mint and link;
3. re-roll;
4. update record/version;
5. revoke;
6. sign in/refresh/sign out;
7. delete account;
8. retry hard photo read;
9. report content/operator disposition;
10. operator suspend/unsuspend/grant/revoke;
11. structured semantic resolution (CANON-SHADOW);
12. ZK predicate verification (SPECULATIVE).

## Production-readiness additions

### Operations contract
Specify availability/SLO posture, measurement point, RTO/RPO, backup/restore method and test cadence, D1/R2/DO recovery, provider outage behavior, key/secret rotation and compromise response, incident severity/ownership/evidence, observability fields with PII redaction, and spend/capacity monitoring.

### Data lifecycle matrix
For every data class specify source, purpose, storage, encryption, access role, retention/TTL, deletion trigger/mechanism, cache/replica/backup behavior, audit evidence, export behavior, and external provider transfer.

## Semantic-profile completeness gate

Before #81 moves from CANON-SHADOW to V1.x implementation:
- Scope vs Namespace domain model;
- semantic profile schema/versioning;
- immutable dictionary-version rules;
- namespace/profile authorization;
- contract-2 negotiation/versioning;
- storage/migration model;
- disclosure/error/non-enumerability rules;
- lifecycle/revocation;
- acceptance vectors;
- client compatibility/deprecation plan;
- privacy/threat-model update.

## ZK completeness gate

Before #83/S1 selects a proof system:
- parent semantic-profile model stable enough to reference;
- canonical binary encoding;
- hash/commitment requirements and domain separation;
- authority-root publication/trust bootstrap;
- revocation/freshness source;
- replay/nullifier state owner and retention;
- reproducible synthetic fixture;
- signed selective-disclosure baseline;
- 20 machine-readable negative vectors;
- leakage analysis.

## Recommended repair order

1. Governance truth: ratification/version, stale README/checklist/project-board state.
2. Lifecycle reconciliation: #13/#14/#60-#67 and 002-004 tasks vs main.
3. Traceability matrix.
4. Production governance: operations contract, data lifecycle matrix, consolidated threat model.
5. Current converge report.
6. Semantic track: #82, then reconcile #84.
7. Future Scope/Namespace/Profile/Dictionary and S1 primitive work.

## Conclusion

The repo does not need more feature surface now. It needs convergence.

V1 has enough detailed functional specification to support implementation and verification. The material risk is that status, governance, operations, and cross-layer traceability lag behind implementation. Repair those surfaces before promoting semantic profiles or ZK from research into product architecture.
