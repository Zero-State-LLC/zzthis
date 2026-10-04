# Requirements checklist: 005-v1-api

Checked 2026-10-04 against this folder, after the deepening in [analysis 2026-10-04](../../analysis-2026-10-04.md). The server is not built.

## Completeness

- [x] Spec has a `## Workflows` section naming workflows and CI files.
- [x] Each user story has acceptance or a route.
- [x] OpenAPI lists the routes in the spec, including `POST /v1/auth/nonce` and `GET /v1/records/{id}`.
- [x] Data model, errors, rate limits, and env names are in the spec.
- [x] Resolve and Mint have numbered steps a builder can follow.
- [x] Sign-in works on iOS, Android, and the web, and tests can sign in without Apple or Google (FR-022).
- [x] The issued format, the list, and the check word have prototype defaults (spec 003), with shared test vectors.
- [x] Out of scope is stated.
- [x] OPEN items that remain name a prototype default.

## Not done

- [ ] The build itself (tasks Group 0 to Group I).
- [ ] Danny's yes on Q66 to Q69, the spec 003 prototype defaults, and the spec 004 pipeline.
- [ ] Danny's yes for Cloudflare and OAuth clients (T023).
- [ ] GitHub issues for Q66 to Q69.

## Consistency

- [x] Plain codes are server-chosen, including `free_public` (spec 002 US2, Danny 2026-10-04). zzThat ZQ11 matches.
- [x] Re-roll uses `rerolls_remaining` and `reroll-cap`, matching the zzThat runtime.
- [x] FR-018 keeps Danny's Q26 text. FR-019 adds how it runs on Workers and does not change the header.
- [x] User-facing strings in `design/UX.md` and `design/copy.json` say demo and check word, and the new prose has no em dash.
- [x] The OpenAPI has no `const` and no bare `null` type, so both app generators can read it.
