# Scope governance

Status: normative product-governance policy.
Date: 2026-10-06
Authority: constitution + accepted operator direction. This policy controls how new product ideas enter specs and releases; it does not discard source material.

## Purpose

zzThis has a deliberately broad product thesis. Product input may arrive incrementally, overlap earlier ideas, or describe a future system much larger than the current release. Preserve that breadth without allowing each new idea to expand the active implementation surface.

**Core rule: a new idea may expand the roadmap without expanding the current release.**

## Hierarchy

1. **Product thesis**: broad universe of possible zzThis uses. May expand freely.
2. **Canonical architecture**: long-lived boundaries, invariants, contracts, and authority. Changes deliberately.
3. **Release train**: a versioned, frozen product outcome such as v1 or v2.
4. **Capability bundle**: a cohesive set of related requirements promoted together.
5. **Implementation task**: buildable/testable work belonging to exactly one approved bundle.

An implementation task without a bundle and target release is invalid backlog.

## Intake dispositions

Every substantive new product input gets exactly one disposition before it changes implementation work.

| Disposition | Meaning | May change active release? |
|---|---|---|
| ASSIMILATE | Clarifies or completes an already-approved bundle without expanding its outcome | Yes, within frozen outcome |
| QUEUE | Valid capability, assigned to a future release/bundle | No |
| SHADOW | Preserve architectural compatibility/provenance; do not implement | No |
| RESEARCH | Evidence required before product commitment | No |
| REJECT | Conflicts with invariants, duplicates superseded behavior, or does not serve the product | No |

Do not use "defer" as an unowned dumping ground. QUEUE names a bundle/release. SHADOW names the compatibility boundary. RESEARCH names the evidence and promotion gate.

## Append-closed release rule

Once implementation of a release begins, its outcome is **append-closed**.

A new requirement enters the active release only when it:

1. fixes a security, privacy, safety, legal/compliance, or correctness defect;
2. resolves a contradiction that prevents the already-approved release outcome;
3. supplies missing acceptance evidence or implementation detail for already-approved scope; or
4. explicitly replaces equivalent existing scope without increasing the release outcome.

Everything else is QUEUE, SHADOW, RESEARCH, or REJECT.

"Useful", "easy", "already partly built", "Michael asked for it", or "fits the architecture" are not exceptions.

## Intake workflow

```text
source input
 -> preserve provenance
 -> normalize into atomic claims
 -> deduplicate against canonical decisions/bundles
 -> identify affected invariant/capability
 -> assign disposition
 -> assign bundle + target release when applicable
 -> dependency/security/privacy review
 -> acceptance contract
 -> tasks only if bundle is ACTIVE
```

Fragmented inputs that describe the same capability accumulate under one bundle. They do not create parallel features.

## Promotion

A bundle may move:

```text
IDEA -> SHADOW/RESEARCH/QUEUED -> READY -> ACTIVE -> QUALIFIED -> SHIPPED
                                  \-> REJECTED
```

- **QUEUED**: outcome is named but not implementation-authorized.
- **READY**: dependencies, contracts, states, privacy/security, acceptance evidence, and tasks are complete enough to start.
- **ACTIVE**: implementation is authorized; outcome is append-closed.
- **QUALIFIED**: required acceptance/empirical evidence passes.
- **SHIPPED**: release artifact is public/production as defined by that bundle.
- **SHADOW/RESEARCH** never silently become ACTIVE.

Only the operator may promote a bundle to ACTIVE or change a release outcome after it is append-closed.

## Required bundle record

Every bundle records:

- bundle id and name;
- target release;
- one-sentence outcome;
- disposition/status;
- included requirements;
- explicitly excluded adjacent ideas;
- upstream/downstream dependencies;
- security/privacy/governance impact;
- state/contract boundaries;
- acceptance/qualification gate;
- implementation task links;
- source/provenance links;
- promotion/rollback rule.

## Change budget

During ACTIVE implementation, new ASSIMILATE items must identify which existing requirement/task they clarify or replace. If they require a new user journey, new authority boundary, new persistent entity, new external integration, new sensitive-data class, or new deployment dependency, presume scope expansion and QUEUE them unless an append-closed exception applies.

## Website rule

Public website copy may describe the broad product thesis and clearly labeled explorations, but public content does not promote a capability into the active release. Product claims must distinguish current prototype/implemented behavior from planned, research, and exploration bundles.

## zzThat rule

zzThat consumes the release/bundle authority at its pinned zzThis commit. A future upstream idea does not enter native implementation until its bundle is ACTIVE for a release consumed by the pin. zzThat may preserve an adapter/interface for SHADOW compatibility only when that adds no active product behavior.

## Kanban rule

Board/card truth is organized by **release + capability bundle**, not a flat feature list. Every implementation issue names its bundle and release. Research/shadow issues stay visibly separate from active-release work. Closed/merged evidence updates bundle status; file presence alone does not.

## Scope-change test

Before adding an active-release task, answer:

1. Which existing bundle owns this?
2. Which existing release outcome does it complete?
3. Does it add a journey, authority boundary, entity, integration, sensitive-data class, or deploy dependency?
4. Which acceptance criterion proves it is done?
5. What work is removed/replaced if this is not merely clarification?

If 1 or 2 has no answer, it is not active-release work.
