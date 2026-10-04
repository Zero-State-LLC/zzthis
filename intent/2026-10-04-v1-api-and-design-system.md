# Intent: v1 API contract and shared design system

Author: cloud agent, from Danny's 2026-10-04 task
Date: 2026-10-04
Status: accepted
Product: zzThis (`Zero-State-LLC/zzthis`)

This file is a proto-spec. It comes **before** specify.
Next stage is `spec.md` (spec-kit specify). Do not skip to code.

One committed intent per change stream. Live under `intent/` or
`docs/intent/`. Do not invent product work in the template pack.

## Problem / why now

zzThat is a thin client of this repo, and the family has no shared design
source and no `/v1` contract a builder can implement. The site README also
described design tokens that no longer match `src/styles/tokens.css`.

[verified: Danny's task, 2026-10-04, and the token mismatch between README.md and src/styles/tokens.css]

## Proposed outcome

Observable done (a stranger can check this without reading the chat):

- `specs/005-v1-api/` has a spec, plan, tasks, checklist, and OpenAPI document for `/v1`.
- `design/` holds tokens extracted from the site, generated CSS, Swift, and Kotlin, brand files, and a UX note.
- `npm run design:check` fails if those generated files drift.
- `docs/project-board.md` records the board the org project should use.

## Affected users / systems

- Users: people who will use zzThat, and builders of the server and the later web client
- Systems: this repo, the zzThat apps (they copy `design/`), GitHub issues

## Constraints

Product-true locks (do not reopen in implement):

- The server chooses the words for a plain code, including free public codes (spec 002 US2, Danny 2026-10-04).
- User-facing copy says demo and check word, and it has no em dashes.
- No production deploy, no paid spend, no edit to the zzThat repo.

Non-goals:

- Implementing the Worker, the web client, or a vision model in this change.
- Merging the pull request.

## Open questions

- None for this change. Resolver questions that stay open are listed in spec 005 and are not answered here.

## Claims

| Claim | Label |
|---|---|
| Danny assigned this change on 2026-10-04 and it is the accept for this intent | `[verified: the task text]` |
| Token values come from the stylesheets | `[verified: scripts/design-tokens/extract.mjs]` |
| zzThat PR 31 asked for person-chosen words (ZQ11) | `[verified: zzthat specs/001-zzthat-apps/decisions.md on cursor/zzthat-spec-kit-af66]` |
| This contract follows server-chosen words instead of ZQ11 | `[verified: Danny's task and spec 002 US2]` |

## Next

Specify in `specs/005-v1-api/`. Do not implement the server from this file alone.
