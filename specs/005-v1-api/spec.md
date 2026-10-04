# Feature spec: v1 API and later web client

Feature ID: 005-v1-api
Status: not built. This change publishes the contract only.
Phase: specify. The how is in [plan.md](plan.md). Tasks are in [tasks.md](tasks.md).
Wire shapes: [openapi.yaml](openapi.yaml). If a field and this prose disagree, the OpenAPI file is the field and this prose is the rule. File a bug rather than guessing.
Constitution: [.specify/memory/constitution.md](../../.specify/memory/constitution.md).
Intent: [intent/2026-10-04-v1-api-and-design-system.md](../../intent/2026-10-04-v1-api-and-design-system.md).

## Why

zzThis is the central server. The marketing site stays the public page (spec 001). The zzThat iOS and Android apps, and a later web client in this repo, are thin clients of one `/v1` API [DANNY 2026-10-04]. Spec 002 states resolver behavior. Section 10.6 of `docs/SPEC.md` was a sketch, not a contract. This spec is the contract.

The zzThat proposal on branch `cursor/zzthat-spec-kit-af66` (`contracts/zzthis-v1.openapi.yaml`) is replaced by [openapi.yaml](openapi.yaml) when that repo regenerates its client. This file does not edit zzThat.

## Users

| User | Need | Source |
|---|---|---|
| Person with a code | Resolve it, or get one not-found answer | spec 002 US1 |
| Signed-in owner | Receive a server-chosen code, re-roll it, list codes, update a record, revoke | spec 002 US2 and US3 [DANNY 2026-10-04] |
| Signed-in person | Sign in with Apple or Google, and delete the account | zzThat ZQ7, ZQ18, FR-034 |
| Auditor | Read the append-only log | spec 002 US4 |
| Later web visitor | The same client jobs as the phone apps, in this repo | [DANNY 2026-10-04] |

Partner machine auth stays OPEN (Q19). It is not a route in this contract.

## User stories

### US1. Resolve (P1)

As a person with a code, I get the record I am allowed to see, or one not-found answer.

Acceptance: spec 002 US1. The route is `GET /v1/resolve/{code}`. A signed-out caller can resolve a public record. Unknown, expired, used, revoked, and a private record read while signed out share one body: `{ "error": "not-found" }`.

### US2. Mint and re-roll (P1)

As a signed-in owner, I ask for a code. The server chooses the words and the check word, including when the scope is `free_public` [DANNY 2026-10-04] [spec 002 US2].

Acceptance:

1. `POST /v1/codes` with `kind` omitted or `plain` does not accept a word list. The response `canonical` is the code. `check_word` is the check word inside that canonical form, or null for a handle.
2. A new plain code has `rerolls_remaining` 3. `POST /v1/codes/{id}/reroll` retires that id (status revoked, words never issued again) and returns a new code with the count reduced by one. The record stays the same.
3. When the count is 0, or the code has already been resolved, the response is 403 `{ "error": "reroll-cap" }` and the current code stays.
4. `free_public` is off until `GET /v1` says `free_public: true`. Until then the response is 403 `{ "error": "scope-unavailable" }` and no code is stored.
5. A handle request sends `kind: "handle"` and the requested handle. The server canonicalizes it. It does not substitute a different name. Reserved or taken handles use spec 002 FR-019.

zzThat ZQ11 asked for the person to choose the words. This contract does not. The server chooses plain-code words [DANNY 2026-10-04].

### US3. Owner list, versions, revoke (P1)

`GET /v1/me/codes` returns the caller's codes. `status` may be `active` or `revoked` for the owner. A public resolve of a revoked code is still not-found.

`POST /v1/records/{id}/versions` appends a signed version with `title` and `body`. `POST /v1/codes/{id}/revoke` revokes at the central server. A failed signature or audit write stores nothing (spec 002 FR-018).

### US4. Sign in and delete (P1)

Sign-in is OAuth 2.0 and OpenID Connect with PKCE, through Sign in with Apple and Sign in with Google. Access tokens last 900 seconds. Refresh tokens rotate. `DELETE /v1/me` revokes refresh tokens and active codes. Audit rows stay. The words are not issued again.

### US5. Retry photo (P2)

`POST /v1/reads` accepts `image/jpeg` only after the person has accepted the sentence in [design/UX.md](../../design/UX.md). The response `band` is `accept`, `clarify`, `retry`, or `abstain`. The server may store the photo for review of that read. It is not a training set.

### US6. Later web client (P2)

A browser client in this repo, not the marketing site, performs US1 to US5 with the same API and the same UX patterns. It is not built in this change.

## Functional requirements

| ID | Requirement | Source |
|---|---|---|
| FR-001 | Paths, headers, and JSON shapes are [openapi.yaml](openapi.yaml). Prefix `/v1`. Header `X-ZZ-Contract: 1` on every request. A missing or other value is 400 `{ "error": "contract-version" }`. | zzThat ZQ19 [DANNY 2026-10-04] |
| FR-002 | `GET /v1/openapi.json` returns this document as JSON. | zzThat ZQ19 |
| FR-003 | The server re-parses every code with the spec 003 grammar and stores the canonical form. | spec 002 FR-013 |
| FR-004 | Plain codes: the server chooses the words and the check word. The issuer is the spec 003 library. Until that library is configured, plain mint returns 503 `{ "error": "not-ready" }` and stores nothing. | spec 002 US2. The not-ready code is INFERRED so a builder has a status. |
| FR-005 | `free_public` defaults off. Discovery lists it in `scopes` only when the flag is on. | spec 002 FR-016 kept the scope out of the first deployment. [DANNY 2026-10-04] puts the shape in the contract. |
| FR-006 | Re-roll budget is 3 on mint, then one less per successful re-roll. Exhausted or already-resolved codes return `reroll-cap`. Retired words are not issued again. | zzThat runtime re-roll cap. Q36 default is never reissue. |
| FR-007 | Everyday fields are `title` (1 to 120 characters) and `body` (0 to 4000). No phone number. Lengths are INFERRED so the columns are closed. | zzThat ZQ5 |
| FR-008 | Public resolve needs no session. Writes need a bearer token. | zzThat ZQ6. spec 002 FR-020 |
| FR-009 | One not-found body, identical for unknown, expired, used, revoked, and a signed-out read of a private record. | spec 002 FR-011 |
| FR-010 | Check-word failure is 400 `{ "error": "malformed", "reason": "check-mismatch" }`. It does not resolve and it does not suggest another code. | spec 002 FR-021 |
| FR-011 | Rate limits are the table below. 429 body is `{ "error": "rate-limited" }` and does not depend on whether the code exists. `Retry-After` is whole seconds. | spec 002 FR-006. Numbers for the zzThat routes are the zzThat proposal. Other rows are INFERRED. |
| FR-012 | Account deletion revokes active codes and refresh tokens and keeps audit rows. | zzThat DEP-012. spec 002 FR-003 |
| FR-013 | Retry upload is jpeg, at most 8 MiB (INFERRED). Other types are 400 `{ "error": "malformed" }`. Larger bodies are 413 `{ "error": "payload-too-large" }`. | zzThat FR-005 |
| FR-014 | The later web client is a thin client. It does not embed a resolver database. Screens follow [design/UX.md](../../design/UX.md). | [DANNY 2026-10-04] |
| FR-015 | `share.url` is null. Share text is the canonical code. | zzThat ZQ9 |
| FR-016 | `GET /v1/audit` is limited to an auditor role. The apps do not call it. | spec 002 US4 |
| FR-017 | Reports return 202 when the body parses, including when the code is unknown. | zzThat FR-035 |

## Data model

Portable SQL, SQLite-compatible for D1. Ids are UUID text. This is the column list a migration implements. It extends the spec 002 sketch.

| Table | Columns |
|---|---|
| accounts | id, created_at |
| identities | id, account_id, provider (`apple` or `google`), provider_subject. Unique (provider, provider_subject). |
| refresh_tokens | id, account_id, token_hash, expires_at, revoked_at, replaced_by |
| codes | id, scope, canonical, match_key, kind, check_word, status (`active`, `used`, `revoked`, `expired`), single_use, expires_at, record_id, owner_id, resolve_count, rerolls_remaining, created_at. Unique (scope, canonical) including retired rows. |
| records | id, owner_id, visibility (`public` or `private`), current_version_id, created_at |
| record_versions | id, record_id, version, title, body, signature, signing_key_id, created_by, created_at |
| grants | id, subject_id, scope, role (`owner`, `public`, `auditor`), expires_at |
| audit_events | id, actor_id, action, target_type, target_id, result, created_at. No update, no delete. |
| read_photos | id, account_id nullable, canonical nullable, object_key, created_at |
| reports | id, canonical, reason, note, created_at |

`match_key` is the spec 003 key. The algorithm stays in spec 003.

Record signatures use one Ed25519 key from the Worker secret store (INFERRED, so the prototype can sign). Rotation stays Q28 and is not in this prototype. Access tokens are HS256 JWTs signed with `ZZ_TOKEN_SECRET`, claim `sub` the account id, lifetime 900 seconds (INFERRED). Refresh tokens are opaque, stored as a hash, lifetime 30 days (INFERRED), and the previous token stops working on refresh.

## Errors

| Status | error | When |
|---|---|---|
| 200 | | Resolve, re-roll, revoke, read |
| 201 | | Mint, record version |
| 202 | | Report |
| 204 | | Auth revoke, delete account |
| 400 | contract-version | Bad or missing `X-ZZ-Contract` |
| 400 | malformed | Grammar failure. `reason` is the parser reason. Check-word failure uses reason `check-mismatch`. |
| 401 | unauthorized | Write or account call without a usable bearer token |
| 403 | forbidden | Authenticated, not allowed |
| 403 | scope-unavailable | Scope flag is off |
| 403 | reroll-cap | No re-rolls left, or the code was already resolved |
| 404 | not-found | The one not-found body |
| 409 | taken | Handle already in the scope. Body does not name the owner. |
| 413 | payload-too-large | Photo over 8 MiB |
| 422 | unsupported | Bare mark. `reason` is `bare-mark-needs-context`. |
| 422 | reserved-handle | Reserved handle, or shorter than 3 characters after `@` |
| 429 | rate-limited | `Retry-After` set |
| 500 | failed | Signing or audit failed. Nothing stored. |
| 503 | not-ready | Plain-code issuer or photo reader is not configured |

## Rate limits

| Call | Limit |
|---|---|
| `GET /v1/resolve/{code}` | 60 per minute per IP, and 120 per minute per signed-in user |
| `POST /v1/codes` and `POST /v1/codes/{id}/reroll` | 10 per hour per user |
| `POST /v1/reads` | 5 per hour per IP, and 20 per hour per signed-in user |
| `POST /v1/reports` | 10 per hour per IP |
| `POST /v1/auth/token` | 20 per minute per IP (INFERRED) |
| `POST /v1/auth/refresh` | 30 per minute per user (INFERRED) |
| `GET /v1/me/codes` | 60 per minute per user (INFERRED) |
| `POST /v1/records/{id}/versions` and revoke | 30 per hour per user (INFERRED) |
| `DELETE /v1/me` | 5 per hour per user (INFERRED) |
| `GET /v1` and `GET /v1/openapi.json` | 60 per minute per IP (INFERRED) |
| `GET /v1/audit` | 60 per minute per user (INFERRED) |

## Environment

Names only. Values are not committed. Worker secrets hold the secrets.

| Name | Kind | Purpose |
|---|---|---|
| ZZ_CONTRACT | var, `1` | Contract this process serves |
| ZZ_FREE_PUBLIC | var, default `false` | Discovery flag |
| ZZ_MINT_ENABLED | var, default `false` | Plain-code issuer is configured |
| ZZ_REDIRECT_ALLOWLIST | var | Comma-separated redirect URIs. Includes `zzthat://auth` when the apps are enabled. |
| ZZ_TOKEN_SECRET | secret | HS256 access tokens |
| ZZ_RECORD_SIGNING_KEY | secret | Ed25519 private key |
| ZZ_RECORD_SIGNING_KEY_ID | var | Id stored on each version |
| APPLE_TEAM_ID, APPLE_KEY_ID, APPLE_CLIENT_ID | var | Sign in with Apple |
| APPLE_PRIVATE_KEY | secret | Apple client secret JWT |
| GOOGLE_CLIENT_ID | var | Google |
| GOOGLE_CLIENT_SECRET | secret | Google |
| D1 binding `ZZ_DB` | binding | SQL |
| R2 binding `ZZ_PHOTOS` | binding | Retry photos |

Edge cache of reusable public records stays off until Q26 sets a purge window. Single-use and short-expiry codes are never cached (spec 002). Creating the Worker, D1, R2, and the Apple or Google clients needs Danny's yes. This spec does not create them.

## Web client

Not built here. When it is built it lives in `apps/web` in this repo and is not a route of the marketing site.

| Screen | API | Pattern in design/UX.md |
|---|---|---|
| Sign in | `POST /v1/auth/token` | Account |
| Scan or type | device parse, then resolve | Scan |
| Resolve | `GET /v1/resolve/{code}` | Resolve |
| Create | discovery, then mint, then re-roll | Create |
| My codes | `GET /v1/me/codes`, versions, revoke | Empty states, Errors |
| Share | `share.text` only | Share |
| Retry photo | `POST /v1/reads` after the confirm sentence | Scan |
| Delete account | `DELETE /v1/me` | Account |

The first web release has no microphone. Voice on the marketing demo stays a simulation and is not this client.

Redirect URI is an https URL on `ZZ_REDIRECT_ALLOWLIST`, not `zzthat://auth`.

## Out of scope

- Implementing the Worker, the web client, or a vision vendor in this change.
- Person-chosen plain-code words (zzThat ZQ11).
- Partner auth (Q19), suggestion policy details (Q40), no-device linking (Q25), signing-key rotation (Q28), and the purge-window number (Q26).
- Payments, store submission, and production deploy.

## Open questions

| ID | Still open | Prototype default in this contract |
|---|---|---|
| Q19 | Partner auth | No partner route |
| Q25 | No-device linking | Not a route |
| Q26 | Purge window and the original unset limits | Cache off. Limits are the table above. |
| Q27 | Which formats the issuer emits | Whatever spec 003 emits. This contract stores that canonical string. |
| Q28 | Key rotation | One Ed25519 key |
| Q18 | Which vision model | `POST /v1/reads` calls a port. Tests use a fixture that returns `abstain`. |
| Q36 | Reissue of retired words | Never |

Q29 (where the code lives) is answered for this API: the server and the later web client live in this repo [DANNY 2026-10-04].

## Workflows

| Item | Value |
|---|---|
| Governing workflows | anti-slop-code, production-systems, google-developer-style |
| Product owner | Michael Chung |
| Operator | Danny |
| CI to reuse | `.github/workflows/ci.yml` (required `build`), `site-ci.yml`, `free-security-scan.yml`. Do not add a Worker workflow until a human-gated deploy task. |
| Human gates | Cloudflare resources, OAuth client registration, production deploy, spend |
