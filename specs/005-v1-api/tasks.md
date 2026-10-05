# Tasks: v1 API and web client

Feature: [spec.md](spec.md). Plan: [plan.md](plan.md). Wire: [openapi.yaml](openapi.yaml). Brief: [docs/ONE-SHOT-BRIEF.md](../../docs/ONE-SHOT-BRIEF.md).
Workflows for every implementing task: anti-slop-code, production-systems, google-developer-style. CI: `ci.yml`, `site-ci.yml`, `free-security-scan.yml`. A workflow skill named here that is not installed where the build runs is style guidance, and each PR body says so (INFERRED).

The groups run in this order in one build. Each group ends with a "done when" line that a stranger can check. Do not start a group by editing tests to match a missing route.

## Group 0. Shared library ([#14](https://github.com/Zero-State-LLC/zzthis/issues/14))

- [x] T035 First commit of Group 0, before any port: the grammar changes from `docs/SPEC.md` Section 9a D-2026-10-04-04 (the `@` rule on split parts) and D-2026-10-04-10 (the G2 character sets), both INFERRED. They change parser output, so this commit changes `src/lib/grammar.ts`:
  - D-2026-10-04-04: add that decision's G9 rows, `vectors.json` grammar rows, and the scanner row `zz@ AgentSmith neo zz` to `zz-@agentsmith-neo-zz`.
  - D-2026-10-04-10, as decided 2026-10-05: check the 256 guard on the raw input in UTF-16 code units first; then map fullwidth U+FF01 to U+FF5E to ASCII and normalize to NFC (JavaScript `normalize("NFC")`, Swift `precomposedStringWithCanonicalMapping`, Kotlin `java.text.Normalizer` with `Form.NFC`); whitespace and separators use the explicit Unicode White_Space set from G2 step 1, in place of `trim()` and `\s`; lowercase with the Unicode mapping without locale rules; a letter that is still not ASCII fails with `unsupported-script`. Move the `vectors.json` `grammar_pending` rows into `grammar`, delete `grammar_pending`, move the G9 rows that wait for T035 into the main G9 table, and add them to `tests/grammar.test.ts`.
  - Every existing grammar row must still pass. The other readings (D-2026-10-04-03, -05, -06, -07, -08, -09, and -11) already have their spec text and rows. All of these readings were decided on 2026-10-05 by established practice (`docs/SPEC.md` Section 9a).
- [x] T026 npm workspaces, in the order `packages/*`, `apps/*`, `workers/*`. Move `src/lib/grammar.ts` into `packages/zz-core`, and keep `src/lib/grammar.ts` as a re-export so the site and its tests do not change.
- [x] T027 Classifier, check word, issuer, matching key, scanner, and the wordlist loader (plan, Repo layout). The loader reads the generated `src/generated/wordlists.ts` module, with its drift check (plan, Bundled data).
- [x] T028 Run every row of `specs/003-wordlist-checkword/vectors.json`, plus the spec 003 property tests and the FR-020 check-word tests.
- [x] T029 The spec 003 pipeline script and `fixture-7.txt`. Commit the EFF source at `packages/zz-core/wordlists/source/eff_large_wordlist.txt`. Run the pipeline and commit `proto-v0.txt`, `proto-v0.report.md`, `proto-v0.report.json`, and a draft root `NOTICE` with the EFF credit (completed in T036). Q32 on #74 is the license yes, so no further gate applies before the commit. The run fails unless the source SHA-256 matches spec 003. The private blocklist is not applied, and the report records `blocklist: not applied`. Local runs use `fixture-7`.

Done when: `npm run test` passes every vector row, and the site build, `check-dist`, and the site tests pass. Only the T035 parser change differs.

## Group A. Contract shell ([#60](https://github.com/Zero-State-LLC/zzthis/issues/60))

- [x] T025 Policy tests in `tests/edgeCache.test.ts`. The Worker keeps these true.
- [x] T001 Worker skeleton in `workers/api` with lint, typecheck, and tests wired into the root scripts. No new required workflow. Use the test toolchain in plan.md (Technical context, Tests): Vitest 4.1.11 with `@vitest/coverage-istanbul` 4.1.11 and `@cloudflare/vitest-pool-workers` ^0.22.0 in `workers/api` only, and the root `test` script from plan.md Coverage. These config edits are in scope and are not validator patches:
  - `.gitignore` adds `**/.wrangler/`, `**/.dev.vars`, `**/.dev.vars.*`, and `!**/.dev.vars.example`.
  - `eslint.config.js` `globalIgnores` becomes `["**/dist/", "**/node_modules/", "**/.astro/", "**/coverage/", "**/.wrangler/", "public/", "workers/api/src/generated/", "packages/zz-core/src/generated/"]`.
  - `.prettierignore` adds `workers/api/src/generated` and `packages/zz-core/src/generated`.
  - An `api:types` script writes `api.ts` with `openapi-typescript` and `openapi.json` from openapi.yaml, then runs `git diff --exit-code workers/api/src/generated/`. The wordlist module has the same drift check.
- [x] T002 `GET /v1` (with `wordlist_version` and `photo_reads`) and `GET /v1/openapi.json`, served from the generated module. Every route rejects a bad `X-ZZ-Contract` with `contract-version`, including a doubled header that arrives as `1, 1`. Every response carries the header and, except a cacheable resolve, `no-store`.
- [x] T003 The settings check from the spec Environment table and its settings rules. Tests cover: each always-required name missing, a partial Apple group, `ZZ_BLOCKLIST` missing or empty in production, `fixture-7` in production, developer sign-in in production (each 503 `not-ready`), and discovery with no provider groups set, which lists only `dev` while an `apple` or `google` token gets 401.

Done when: a test calls every path in openapi.yaml with a wrong header and gets 400 `contract-version`. `git check-ignore` matches `workers/api/.dev.vars` and `workers/api/.wrangler/state`, and `./scripts/security-scan.sh` passes.

## Group B. Data model ([#61](https://github.com/Zero-State-LLC/zzthis/issues/61))

- [x] T004 Migration for every table in the spec. Unique `match_key` across all rows. One audit writer used by every state change, inside the same `batch()`.

Done when: a test forces the audit insert to fail and shows that nothing else was stored.

## Group C. Sign-in ([#62](https://github.com/Zero-State-LLC/zzthis/issues/62))

- [x] T005 `POST /v1/auth/nonce` and `POST /v1/auth/token` for Apple, Google, and dev (FR-020, FR-022), with the spec.md Provider constants. Keys and a JWKS generated at test run time stand in for Apple and Google; no key file is committed. Both Google issuer spellings pass. An iOS-aud and a web-aud Apple identity each exchange with their own `client_id` and a secret whose `sub` matches it, and only the web one sends `redirect_uri`.
- [x] T006 Refresh rotation with the guarded update, family revoke on reuse, revoke, and the web cookie (FR-021). No grace window. Two simultaneous refreshes with one token give one 200, then the other call revokes the family.
- [x] T007 `GET /v1/me` and `DELETE /v1/me` with every FR-023 step, including the Apple revoke call (stubbed) with the stored `apple_client_id`, a failed revoke that lands in `pending_revocations` with that `client_id`, the `grants` rows deleted, and the web cookie cleared with Max-Age 0.

Done when: tests cover a wrong issuer, a wrong audience, an expired token, a reused nonce, a dev sign-in with an unknown or reused nonce (401), a reused refresh token, and deletion followed by not-found for the account's codes. After `DELETE /v1/me` from one client, the other client's still-valid access token gets 401 on mint, `GET /v1/me`, and `GET /v1/me/codes`, and no new rows appear in `records` or `codes`. An iOS-aud and a web-aud identity each revoke with their own `client_id`.

## Group D. Mint and re-roll ([#63](https://github.com/Zero-State-LLC/zzthis/issues/63))

- [x] T008 `POST /v1/codes` for `kind: plain` with the spec 003 issuer, the content check (FR-024), and scope rules (FR-034).
- [x] T009 `POST /v1/codes/{id}/reroll` with the three-statement guarded batch in spec.md Mint (FR-031). `reroll-cap` at 0, after the first resolve, or for the caller's own code that is no longer active.
- [x] T010 `free_public` off returns `scope-unavailable` and stores nothing. `ZZ_MINT_ENABLED` false returns `not-ready`.
- [x] T011 Handle issuance: authenticated owner, canonical form, 409 `taken` without an owner, 422 `reserved-handle`. A handle has `rerolls_remaining` 0, so its re-roll is `reroll-cap`.

Done when: a test mints, re-rolls three times, gets `reroll-cap`, and finds three retired codes that never come back. Two re-rolls of one code sent with `Promise.all` give exactly one 200 and one `reroll-cap`, and the record ends with exactly one active code. A re-roll at the cap leaves the count of `codes` rows unchanged. A re-roll of another account's code id returns 404 and adds no row.

## Group E. Resolve and owner records ([#64](https://github.com/Zero-State-LLC/zzthis/issues/64))

- [x] T012 `GET /v1/resolve/{code}` with the ten steps in spec.md Resolve, including the private-record check (FR-035), the cache rules in FR-018 and FR-019, the step 8 batch, and the not-found audit target. An unusable bearer counts as no bearer and never gets 401 (FR-021).
- [x] T024 Purge that code's cache key on record update, revoke, and account deletion.
- [x] T013 `GET /v1/me/codes` with cursor and titles. Codes retired by a re-roll are not listed.
- [x] T034 `GET /v1/records/{id}` for the owner (FR-030).
- [x] T014 Record versions and revoke. A failed signature or audit stores nothing. `share.url` is null. Revoke follows spec.md Mint: an own code that is already revoked returns 200 `revoked` again, and an own used or expired code is not-found.
- [x] T015 `GET /v1/audit` for the auditor role only.
- [x] T016 `POST /v1/reports` returns 202 for a parsed body even when the code is unknown.

Done when: a test shows the same 404 body, status, and headers for unknown, revoked, used, and expired codes, and shows a cache hit, then a purge on revoke. Two revokes of one code sent with `Promise.all` write exactly one revoke audit event with result `ok`.

## Group F. Retry photo ([#65](https://github.com/Zero-State-LLC/zzthis/issues/65))

- [x] T017 `POST /v1/reads`: 503 `not-ready` while `photo_reads` is false. With a test port, store the jpeg in R2 with a 30-day expiry and return the port's band. The photo is not added to a training set.
- [x] T031 The daily cron from FR-026, including the pending Apple revocation retries.

Done when: a test runs the cron and shows an expired photo and its row are gone, and a pending revocation is retried and then removed.

## Group G. Rate limits ([#66](https://github.com/Zero-State-LLC/zzthis/issues/66))

- [x] T018 The `Limiter` Durable Object with one rule per row of the spec table. 429 body is `rate-limited` and `Retry-After` is set. Tests show the body does not change between an unknown code and a live code.

Done when: tests cover a per-minute IP rule and the hourly per-user mint rule.

## Group H. Web client ([#67](https://github.com/Zero-State-LLC/zzthis/issues/67))

- [ ] T019 `apps/web`, Astro static, served by the Worker on the same origin. `wrangler.toml` `[assets]` sets `run_worker_first = true`, and the Worker adds the spec.md security headers to every asset response. `astro.config.mjs` sets `output: 'static'`, `build.inlineStylesheets: 'never'`, and `vite.build.assetsInlineLimit: 0`. A Worker test asserts the exact headers on `/` and `/signin/`.
- [ ] T020 The screens in the spec Web client table, including `/licenses/`. Typing only. Sign in and Account read the build settings; no client id is hard-coded. The web session rules (spec.md Web client): `ensureSession()` under `navigator.locks`, resolve with `cache: "no-store"`, and the write-error mapping. Unit tests cover the `no-store` option and one refresh for two concurrent expired-token calls.
- [ ] T021 Patterns from `design/UX.md` and strings from `design/copy.json`. The demo badge is only for scripted demo data.
- [ ] T022 `design/generated/tokens.css` and self-hosted fonts. No second palette. No inline script or style, per plan.md Repo layout. The dist check in plan.md Tests (Web build) runs in the `apps/web` build.
- [ ] T032 Playwright end-to-end run from plan.md Tests, with its settings, and `.github/workflows/e2e.yml`. The workflow triggers on `workflow_dispatch` and on `pull_request` (`labeled`, `synchronize`), runs only with the `run-e2e` label, has no schedule, and is not a required check. This follows zzThat ZQ27, decided 2026-10-05: the no-spend path, accepted by Danny on Zero-State-LLC/zzthat#39. Any `securitypolicyviolation` fails the run, and two signed-in tabs both stay signed in.

Done when: the Playwright run passes against `npm run dev:api -- --fresh`, and the PR links that run: the URL of the `run-e2e` label run, or local evidence listed under "could not verify".

## Group I. Files zzThat pins

- [x] T030 `design/fonts/`. Pin `@ibm/plex-sans@1.1.0`, `@ibm/plex-sans-condensed@2.0.0`, and `@ibm/plex-mono@2.5.0` (OFL-1.1) as exact devDependencies. Those packages ship WOFF and WOFF2 only, and iOS and Android load neither, so `npm run fonts:build` (`scripts/build-fonts.mjs`) unwraps each WOFF 1 file, which is a zlib wrapper around the original TrueType tables, into the original `.ttf`: Regular, Medium, SemiBold, and Bold for each family, plus `OFL.txt`. `npm run build` runs `fonts:check`, which fails if a committed font differs from the pinned packages.
- [x] T033 `scripts/pin-zzthis.sh` from plan.md, What zzThat pins. Keep `pin-design.sh` until zzThat moves to the new script.
- [x] T036 (drafted; Danny's legal yes still OPEN) Complete the draft root `NOTICE`: the EFF Long Wordlist credit from T029 (CC BY 3.0 US, adapted: filtered and reordered, see `proto-v0.report.md`) and IBM Plex from T030 (SIL Open Font License 1.1, `design/fonts/OFL.txt`). Draft one sentence for `LICENSE`: "Third-party materials listed in NOTICE are licensed under their own terms." Flag both in the PR body. OPEN: Danny's legal yes on both texts. Default: the drafts are committed in the build PR, and the PR does not merge without his yes.

Done when: running the script at the build commit produces every path in that table.

## Human gate

- [ ] T023 Danny's yes before any Cloudflare resource, OAuth client, or deploy workflow, and his legal yes on the `NOTICE` text and the LICENSE sentence (T036) before the build PR merges.
- [ ] T037 Required before the first production mint: re-run the spec 003 pipeline with `ZZ_BLOCKLIST`, check the yield report (the removed words and the new N), and commit the new list. The mint itself needs Danny's deploy yes, and after it proto-v0 is permanent.
