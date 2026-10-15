# Intent: v1.0 production path and the v1.1 server work from the accepted 2026-10-13 decisions

Author: Claude, for Luna's request to continue after Danny's answers
Date: 2026-10-14
Status: accepted (Danny, 2026-10-14, [#170](https://github.com/Zero-State-LLC/zzthis/issues/170#issuecomment-6175348667): "accept D-2026-10-10-07 to -10 and -20 plus the B4 implementation intent"; D-2026-10-13-01 to -09 yes as recommended)
Product: zzThis (`Zero-State-LLC/zzthis`), with zzThat follow-ups

## Problem / why now

The 2026-10-13 spec-depth audit found v1.0 and v1.1 items a builder could not do without guessing. Danny accepted every recommendation. The code can now follow the specs.

[verified: `specs/analysis-2026-10-13-spec-depth.md`, `specs/decisions-2026-10-13.md`]

## Proposed outcome

Each item below lands as its own pull request, after the spec pull request that records these decisions:

- RM-127 idle expiry and revive (D-2026-10-13-01): migration 0004, auth activity, daily run, re-roll guard.
- RM-125 5 re-rolls on plain codes (D-2026-10-13-02); RM-072 the daily mint cap (D-2026-10-13-03).
- RM-012 to RM-015 staging that can pass its own checks (D-2026-10-13-06).
- RM-023 and RM-027 operator deletion and access requests (D-2026-10-13-08).
- RM-020 and RM-028 the production wordlist build (D-2026-10-13-07), once Michael approves the letter groups.
- zzThat T106 enum tolerance (D-2026-10-13-09).

## Constraints

- Specs first: each code pull request follows the spec text and merges after it.
- No production deploy, resource, DNS, Access, OAuth, or spend action by an agent. Danny creates the staging host and Access policy (D-2026-10-13-06) and dispatches every deploy.
- Michael-owned content (letter groups, Terms wording) is not invented; placeholders stay marked.

## Non-goals

The zzThat recognition adapter (T023 to T025), until zzThat #77 is answered.
