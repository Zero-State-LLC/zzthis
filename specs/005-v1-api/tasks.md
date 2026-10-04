# Tasks: v1 API and later web client

Feature: [spec.md](spec.md). Plan: [plan.md](plan.md). Wire: [openapi.yaml](openapi.yaml).
Workflows for every implementing task: anti-slop-code, production-systems, google-developer-style. CI: `ci.yml`, `site-ci.yml`, `free-security-scan.yml`.

Each group below is one buildable issue. Do not start a group by editing tests to match a missing route.

## Group A. Contract shell ([#60](https://github.com/Zero-State-LLC/zzthis/issues/60))

- [ ] T001 Worker skeleton in `workers/api` with lint, typecheck, and tests wired into the existing CI scripts. No new workflow file.
- [ ] T002 `GET /v1` and `GET /v1/openapi.json`. Every route rejects a bad `X-ZZ-Contract` with `contract-version`.
- [ ] T003 Env bindings from the spec table. The process refuses to boot when a required secret name is missing. No secret value in the tree.

## Group B. Data model ([#61](https://github.com/Zero-State-LLC/zzthis/issues/61))

- [ ] T004 SQL migration for every table in the spec. Unique (scope, canonical) includes revoked rows. Audit writer used by every state change. A failed audit write rolls back.

## Group C. Sign-in ([#62](https://github.com/Zero-State-LLC/zzthis/issues/62))

- [ ] T005 `POST /v1/auth/token` for Apple and Google. PKCE verifier is sent to the provider. `redirect_uri` must be on `ZZ_REDIRECT_ALLOWLIST`.
- [ ] T006 Refresh rotation and revoke. The previous refresh token stops working.
- [ ] T007 `GET /v1/me` and `DELETE /v1/me`. Delete revokes refresh tokens and active codes, keeps audit rows, and does not reissue the words.

## Group D. Mint and re-roll ([#63](https://github.com/Zero-State-LLC/zzthis/issues/63))

- [ ] T008 `POST /v1/codes` for `kind: plain`. The spec 003 issuer chooses the words. The response includes `canonical`, `check_word`, and `rerolls_remaining: 3`. No client word list is read.
- [ ] T009 `POST /v1/codes/{id}/reroll`. Decrements the budget, retires the old id, returns the new code. `reroll-cap` when the budget is 0 or `resolve_count` is not 0. Old words stay unique.
- [ ] T010 `free_public` off returns `scope-unavailable` and stores nothing. `ZZ_MINT_ENABLED` false returns `not-ready` for plain codes.
- [ ] T011 Handle issuance: authenticated owner, canonical form, 409 `taken` without an owner, 422 `reserved-handle`.

## Group E. Resolve and owner records ([#64](https://github.com/Zero-State-LLC/zzthis/issues/64))

- [ ] T012 `GET /v1/resolve/{code}`: re-parse, exact canonical match, one not-found body, check-word failure before lookup, bare mark 422. Edge cache per FR-018: Workers Cache API; store only an active, reusable, public, unauthenticated 200 with `Cache-Control: public, max-age=60, stale-while-revalidate=300`; the cache key is that code's resolve request.
- [ ] T024 Purge that code's cache key on record update, revoke, or expiry. If the purge fails, 60 seconds is the worst case.
- [x] T025 Policy tests in `tests/edgeCache.test.ts`: a cache hit for a public code, purge on revoke, `Cache-Control: no-store` for single-use, short-expiry, private, authenticated, 404, and 429, and identical 404 and 429 bodies. The Worker keeps these tests true.
- [ ] T013 `GET /v1/me/codes` with cursor. Owner may see `revoked`. Public resolve of that code stays not-found.
- [ ] T014 Record versions and revoke. Failed signature or audit stores nothing. `share.url` is null.
- [ ] T015 `GET /v1/audit` for the auditor role only.
- [ ] T016 `POST /v1/reports` returns 202 for a parsed body even when the code is unknown.

## Group F. Retry photo ([#65](https://github.com/Zero-State-LLC/zzthis/issues/65))

- [ ] T017 `POST /v1/reads` stores jpeg at most 8 MiB in R2 and calls a read port. The test port returns `abstain`. A missing port returns `not-ready`. The photo is not added to a training set.

## Group G. Rate limits ([#66](https://github.com/Zero-State-LLC/zzthis/issues/66))

- [ ] T018 One limiter per row of the spec table. 429 body is `rate-limited` and `Retry-After` is set. Tests show the body does not change between an unknown code and a live code.

## Group H. Web client ([#67](https://github.com/Zero-State-LLC/zzthis/issues/67))

Depends on Groups A to E for live calls. Screens can be built against fixtures first.

- [ ] T019 `apps/web` Astro app, separate from the marketing routes, reading `PUBLIC_API_ORIGIN`.
- [ ] T020 Sign in, scan or type, resolve, create with re-roll, my codes, share text, retry confirm, delete account.
- [ ] T021 Copy and empty states from `design/UX.md`. The demo badge is only for scripted demo data.
- [ ] T022 The web client imports `design/generated/tokens.css`. It does not invent a second palette.

## Human gate

- [ ] T023 Danny's yes before any Cloudflare resource, OAuth client, or deploy workflow.
