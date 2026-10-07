# Requirements checklist: 005-v1-api

Checked 2026-10-05 against the current repository after the one-shot implementation stream. The V1 server/web implementation and tests are present on main; production deployment and external Cloudflare/OAuth resources remain human-gated.

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
- [x] Q66 to Q69 have GitHub issues ([#68](https://github.com/Zero-State-LLC/zzthis/issues/68) to [#71](https://github.com/Zero-State-LLC/zzthis/issues/71)), on the family board.

## Not done

- [x] The implementation itself: tasks Group 0 through Group J are checked in `tasks.md`, with runtime files and tests present on main.
- [x] Danny's yes on Q66 ([#68](https://github.com/Zero-State-LLC/zzthis/issues/68)): native Apple and Google sign-in, provider ID token with a server nonce [DANNY 2026-10-04].
- [x] Danny's yes on Q67 to Q71, the spec 003 prototype defaults, and the spec 004 pipeline ([#74](https://github.com/Zero-State-LLC/zzthis/issues/74), 2026-10-04).
- [ ] Danny's explicit production setup/deploy approval for Cloudflare resources, OAuth clients, secrets, and deployment (T023). This remains a human gate and is not implied by implementation completion.
- [ ] Production-readiness governance in `docs/OPERATIONS.md`, `docs/DATA-LIFECYCLE.md`, and `docs/THREAT-MODEL.md` has its evidence gates completed (numeric RTO/RPO/SLO posture, restore test, incident contacts, observability/redaction, key lifecycle).

## Consistency

- [x] Plain codes are server-chosen, including `free_public` (spec 002 US2, Danny 2026-10-04). zzThat ZQ11 matches.
- [x] Re-roll uses `rerolls_remaining` and `reroll-cap`, matching the zzThat runtime.
- [x] FR-018 keeps Danny's Q26 text. FR-019 adds how it runs on Workers and does not change the header.
- [x] User-facing strings in `design/UX.md` and `design/copy.json` say demo and check word, and the new prose has no em dash.
- [x] The OpenAPI has no `const` and no bare `null` type, so both app generators can read it.
