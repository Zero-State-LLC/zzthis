# Intent: spec-depth audit from the current tip

Author: Claude, for Luna's 2026-10-13 request ("ensure zzthis specs are deep enough from current tip", downstream complete per version)
Date: 2026-10-13
Status: draft (accepted when Danny merges the pull request that adds it)
Product: zzThis (`Zero-State-LLC/zzthis`), with a zzThat follow-up

## Problem / why now

v1.0 and v1.1 items are marked Ready, but a builder would have to guess on staging, the production wordlist, operator deletion, idle expiry, word count, terms, and confirm-only capture. Several documents also lag merged work (#146, #155, #157, #161, #162).

[verified: `specs/analysis-2026-10-13-spec-depth.md`]

## Proposed outcome

- Every gap that is fact at the tip is fixed in the specs.
- Every gap that needs a human has a PROPOSED record with a recommendation (`specs/decisions-2026-10-13.md`).
- The audit is recorded per version for zzThis and zzThat.

## Constraints

- Specifications, documentation, decision records, and copy keys for ADOPTED decisions only (the D-2026-10-10-23 retry reasons, INFERRED or verbatim and waiting for Michael's review).
- No runtime, OpenAPI, grammar, vector, migration, or workflow change.
- PROPOSED decisions stay PROPOSED; D-2026-10-10-21 is not flipped.
- No deploy, resource, DNS, spend, or legal action.

## Non-goals

Implementing any backlog item; merging open pull requests.
