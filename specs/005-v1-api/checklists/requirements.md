# Requirements checklist: 005-v1-api

Checked 2026-10-04 against this folder. The server is not built.

## Completeness

- [x] Spec has a `## Workflows` section naming workflows and CI files.
- [x] Each user story has acceptance or a route.
- [x] OpenAPI lists the routes in the spec.
- [x] Data model, errors, rate limits, and env names are in the spec.
- [x] Out of scope is stated.
- [x] OPEN items that remain name a prototype default.

## Not done

- [ ] Worker, migration, and tests (tasks T001 to T018).
- [ ] Web client (T019 to T022).
- [ ] Danny's yes for Cloudflare and OAuth clients (T023).

## Consistency

- [x] Plain codes are server-chosen, including `free_public` (spec 002 US2, Danny 2026-10-04).
- [x] Person-chosen plain words (zzThat ZQ11) are out of scope.
- [x] Re-roll uses `rerolls_remaining` and `reroll-cap`, matching the zzThat runtime proposal.
- [x] User-facing strings in `design/UX.md` say demo and check word, and the new prose has no em dash.
