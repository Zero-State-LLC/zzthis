# Intent: architecture review, versioned roadmap, and backlog

Author: Claude, for the requesting maintainer's 2026-10-10 review request
Date: 2026-10-10
Status: accepted (documentation, specification, and kanban scope only)
Accepted-by: the 2026-10-10 session request, which authorized specifications, documentation, decision records, and kanban changes plus read-only checks, and did not authorize implementing the roadmap or making external commitments. Decisions marked PROPOSED in `specs/decisions-2026-10-10.md` still need Danny's or Michael's yes.
Product: zzThis (`Zero-State-LLC/zzthis`)

## Problem / why now

The v1 server, shared library, and web client are implemented and tested, but no document assigns every capability to a numbered release, the kanban mirror is stale, several specs still say "not built" or "proposal", production gates have no ordered task list, and the `security` check has been red on `main` since 2026-10-08.

[verified: `specs/analysis-2026-10-10-architecture-review.md` Sections 2 and 3]

## Proposed outcome

- Every capability the repository describes has a release, a research phase, or a deferred entry with a trigger (`specs/RELEASE-ROADMAP.md`).
- Every release-blocking gap has an actionable item with acceptance and verification (`specs/BACKLOG.md`).
- Material decisions are recorded with evidence, alternatives, sources, and revisit conditions (`specs/decisions-2026-10-10.md`, `docs/SPEC.md` Section 9a).
- Stale status claims are corrected; traceability runs journey to task.

## Constraints

- No runtime, OpenAPI, grammar, vector, copy, or workflow change.
- No deploy, resource, DNS, OAuth, spend, or legal action.
- No bundle promotion; QUEUED, SHADOW, and RESEARCH stay so.
- Michael's site copy is not edited; copy gaps become items for him.

## Non-goals

Implementing backlog items, merging open pull requests, or editing zzThat.

## Next

Danny reviews the PROPOSED decisions. Implementation starts from `specs/BACKLOG.md` v1.0 items under their own pull requests.
