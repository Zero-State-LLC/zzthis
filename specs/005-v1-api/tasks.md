# Tasks: v1 API and web client

Feature: [spec.md](spec.md). Plan: [plan.md](plan.md). Wire: [openapi.yaml](openapi.yaml). Brief: [docs/ONE-SHOT-BRIEF.md](../../docs/ONE-SHOT-BRIEF.md).
Workflows for every implementing task: anti-slop-code, production-systems, google-developer-style. CI: `ci.yml`, `site-ci.yml`, `free-security-scan.yml`.

The groups run in this order in one build. Each group ends with a "done when" line that a stranger can check. Do not start a group by editing tests to match a missing route.

## Group 0. Shared library ([#14](https://github.com/Zero-State-LLC/zzthis/issues/14))

- [ ] T026 npm workspaces. Move `src/lib/grammar.ts` into `packages/zz-core`, and keep `src/lib/grammar.ts` as a re-export so the site and its tests do not change.
- [ ] T027 Classifier, check word, issuer, matching key, scanner, and the wordlist loader (plan, Repo layout).
- [ ] T028 Run every row of `specs/003-wordlist-checkword/vectors.json`, plus the spec 003 property tests and the FR-020 check-word tests.
- [ ] T029 The spec 003 pipeline script and `fixture-7.txt`. Run the pipeline on the EFF long list and commit `proto-v0` with its yield report only after Danny's yes in the PR (spec 003 gate).

Done when: `npm run test` passes every vector row, and the site build is unchanged.

## Group A. Contract shell ([#60](https://github.com/Zero-State-LLC/zzthis/issues/60))

- [x] T025 Policy tests in `tests/edgeCache.test.ts`. The Worker keeps these true.
- [ ] T001 Worker skeleton in `workers/api` with lint, typecheck, and tests wired into the root scripts. No new required workflow.
- [ ] T002 `GET /v1` (with `wordlist_version` and `photo_reads`) and `GET /v1/openapi.json`. Every route rejects a bad `X-ZZ-Contract` with `contract-version`. Every response carries the header and, except a cacheable resolve, `no-store`.
- [ ] T003 The settings check from the spec Environment table. A missing setting, `fixture-7` in production, or developer sign-in in production fails closed with 503 `not-ready`.

Done when: a test calls every path in openapi.yaml with a wrong header and gets 400 `contract-version`.

## Group B. Data model ([#61](https://github.com/Zero-State-LLC/zzthis/issues/61))

- [ ] T004 Migration for every table in the spec. Unique `match_key` across all rows. One audit writer used by every state change, inside the same `batch()`.

Done when: a test forces the audit insert to fail and shows that nothing else was stored.

## Group C. Sign-in ([#62](https://github.com/Zero-State-LLC/zzthis/issues/62))

- [ ] T005 `POST /v1/auth/nonce` and `POST /v1/auth/token` for Apple, Google, and dev (FR-020, FR-022). Test keys stand in for Apple and Google.
- [ ] T006 Refresh rotation, family revoke on reuse, revoke, and the web cookie (FR-021).
- [ ] T007 `GET /v1/me` and `DELETE /v1/me` with every FR-023 step, including the Apple revoke call (mocked), and a failed revoke that lands in `pending_revocations`.

Done when: tests cover a wrong issuer, a wrong audience, an expired token, a reused nonce, a reused refresh token, and deletion followed by not-found for the account's codes.

## Group D. Mint and re-roll ([#63](https://github.com/Zero-State-LLC/zzthis/issues/63))

- [ ] T008 `POST /v1/codes` for `kind: plain` with the spec 003 issuer, the content check (FR-024), and scope rules (FR-034).
- [ ] T009 `POST /v1/codes/{id}/reroll` with the conditional update in spec.md Mint. `reroll-cap` at 0 or after the first resolve.
- [ ] T010 `free_public` off returns `scope-unavailable` and stores nothing. `ZZ_MINT_ENABLED` false returns `not-ready`.
- [ ] T011 Handle issuance: authenticated owner, canonical form, 409 `taken` without an owner, 422 `reserved-handle`.

Done when: a test mints, re-rolls three times, gets `reroll-cap`, and finds three retired codes that never come back.

## Group E. Resolve and owner records ([#64](https://github.com/Zero-State-LLC/zzthis/issues/64))

- [ ] T012 `GET /v1/resolve/{code}` with the ten steps in spec.md Resolve, including the private-record check (FR-035) and the cache rules in FR-018 and FR-019.
- [ ] T024 Purge that code's cache key on record update, revoke, and account deletion.
- [ ] T013 `GET /v1/me/codes` with cursor and titles. Codes retired by a re-roll are not listed.
- [ ] T034 `GET /v1/records/{id}` for the owner (FR-030).
- [ ] T014 Record versions and revoke. A failed signature or audit stores nothing. `share.url` is null.
- [ ] T015 `GET /v1/audit` for the auditor role only.
- [ ] T016 `POST /v1/reports` returns 202 for a parsed body even when the code is unknown.

Done when: a test shows the same 404 body, status, and headers for unknown, revoked, used, and expired codes, and shows a cache hit, then a purge on revoke.

## Group F. Retry photo ([#65](https://github.com/Zero-State-LLC/zzthis/issues/65))

- [ ] T017 `POST /v1/reads`: 503 `not-ready` while `photo_reads` is false. With a test port, store the jpeg in R2 with a 30-day expiry and return the port's band. The photo is not added to a training set.
- [ ] T031 The daily cron from FR-026, including the pending Apple revocation retries.

Done when: a test runs the cron and shows an expired photo and its row are gone, and a pending revocation is retried and then removed.

## Group G. Rate limits ([#66](https://github.com/Zero-State-LLC/zzthis/issues/66))

- [ ] T018 The `Limiter` Durable Object with one rule per row of the spec table. 429 body is `rate-limited` and `Retry-After` is set. Tests show the body does not change between an unknown code and a live code.

Done when: tests cover a per-minute IP rule and the hourly per-user mint rule.

## Group H. Web client ([#67](https://github.com/Zero-State-LLC/zzthis/issues/67))

- [ ] T019 `apps/web`, Astro static, served by the Worker on the same origin.
- [ ] T020 The screens in the spec Web client table. Typing only.
- [ ] T021 Patterns from `design/UX.md` and strings from `design/copy.json`. The demo badge is only for scripted demo data.
- [ ] T022 `design/generated/tokens.css` and self-hosted fonts. No second palette.
- [ ] T032 Playwright end-to-end run from plan.md Tests, and `.github/workflows/e2e.yml` (manual and nightly).

Done when: the Playwright run passes against `npm run dev:api`, and the PR links that run.

## Group I. Files zzThat pins

- [ ] T030 `design/fonts/` with the IBM Plex Sans, Sans Condensed, and Mono TTF files the token files name, from the IBM Plex release, with `OFL.txt`.
- [ ] T033 `scripts/pin-zzthis.sh` from plan.md, What zzThat pins. Keep `pin-design.sh` until zzThat moves to the new script.

Done when: running the script at the build commit produces every path in that table.

## Human gate

- [ ] T023 Danny's yes before any Cloudflare resource, OAuth client, deploy workflow, or the proto-v0 commit.
