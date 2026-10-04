# Feature spec: v1 API and later web client

Feature ID: 005-v1-api
Status: not built. This change publishes the contract only.
Phase: specify. The how is in [plan.md](plan.md). Tasks are in [tasks.md](tasks.md). The build brief is [docs/ONE-SHOT-BRIEF.md](../../docs/ONE-SHOT-BRIEF.md).
Wire shapes: [openapi.yaml](openapi.yaml). If a field and this prose disagree, the OpenAPI file is the field and this prose is the rule. File a bug rather than guessing.
Constitution: [.specify/memory/constitution.md](../../.specify/memory/constitution.md).
Intent: [intent/2026-10-04-v1-api-and-design-system.md](../../intent/2026-10-04-v1-api-and-design-system.md) (contract, accepted) and [intent/2026-10-04-one-shot-build.md](../../intent/2026-10-04-one-shot-build.md) (build, draft).
Deepened 2026-10-04 so the server, the web client, and both apps can be built in one pass: [analysis 2026-10-04](../analysis-2026-10-04.md). New choices are INFERRED. Choices that change an earlier decision say so and wait for Danny's yes (Q66 to Q69).

## Why

zzThis is the central server. The marketing site stays the public page (spec 001). The zzThat iOS and Android apps, and a later web client in this repo, are thin clients of one `/v1` API [DANNY 2026-10-04]. Spec 002 states resolver behavior. Section 10.6 of `docs/SPEC.md` was a sketch, not a contract. This spec is the contract.

zzThat pins this file as `contracts/zzthis-v1.openapi.yaml`, with the zzThis commit in `contracts/ZZTHIS-API-PIN`. This repo does not edit zzThat.

## Users

| User | Need | Source |
|---|---|---|
| Person with a code | Resolve it, or get one not-found answer | spec 002 US1 |
| Signed-in owner | Receive a server-chosen code, re-roll it, list codes, read and update a record, revoke | spec 002 US2 and US3 [DANNY 2026-10-04] |
| Signed-in person | Sign in with Apple or Google, and delete the account | zzThat ZQ7, ZQ18, FR-034 |
| Auditor | Read the append-only log | spec 002 US4 |
| Later web visitor | The same client jobs as the phone apps, in this repo | [DANNY 2026-10-04] |
| Operator (Danny) | Suspend an account, read reports, revoke a reported code | INFERRED. App Store review guideline 1.2 asks for these on user-written pages |

Partner machine auth stays OPEN (Q19). It is not a route in this contract.

## User stories

### US1. Resolve (P1)

As a person with a code, I get the record I am allowed to see, or one not-found answer.

Acceptance: spec 002 US1. The route is `GET /v1/resolve/{code}`. A signed-out caller can resolve a public record. Unknown, expired, used, revoked, and a private record read while signed out share one body: `{ "error": "not-found" }`. The steps are in Resolve, below.

### US2. Mint and re-roll (P1)

As a signed-in owner, I ask for a code. The server chooses the words and the check word, including when the scope is `free_public` [DANNY 2026-10-04] [spec 002 US2].

Acceptance:

1. `POST /v1/codes` with `kind` omitted or `plain` does not accept a word list. The response `canonical` is the code. `check_word` is the check word inside that canonical form, or null for a handle.
2. A new plain code has `rerolls_remaining` 3. `POST /v1/codes/{id}/reroll` retires that id (status revoked, words never issued again) and returns a new code with the count reduced by one. The record stays the same.
3. When the count is 0, or the code has already been resolved, the response is 403 `{ "error": "reroll-cap" }` and the current code stays.
4. `free_public` is off until `GET /v1` says `free_public: true`. Until then the response is 403 `{ "error": "scope-unavailable" }` and no code is stored.
5. A handle request sends `kind: "handle"` and the requested handle. The server canonicalizes it. It does not substitute a different name. Reserved or taken handles use spec 002 FR-019.

zzThat ZQ11 matches this: the server chooses the words.

### US3. Owner list, record, versions, revoke (P1)

`GET /v1/me/codes` returns the caller's codes with each record's current title (FR-030). `status` may be `active`, `used`, `expired`, or `revoked` for the owner. A public resolve of a revoked code is still not-found. Codes retired by a re-roll are not listed.

`GET /v1/records/{id}` returns the owner's current title and body, so a client can show and edit them. `POST /v1/records/{id}/versions` appends a signed version with `title` and `body`. `POST /v1/codes/{id}/revoke` revokes at the central server. A failed signature or audit write stores nothing (spec 002 FR-018).

### US4. Sign in and delete (P1)

Each client signs in with the provider's own sign-in on that platform, which returns an OpenID Connect ID token (FR-020). The client first asks `POST /v1/auth/nonce` for a one-time nonce and passes it to the provider. It then sends the ID token to `POST /v1/auth/token`. Access tokens last 900 seconds. Refresh tokens rotate (FR-021). `DELETE /v1/me` follows FR-023. Audit rows stay. The words are not issued again.

This changes the earlier exchange of an authorization code with PKCE and a redirect URI (zzThat ZQ18). Sign in with Apple on iPhone returns an ID token and a code, with a nonce and no PKCE. Android has no Sign in with Apple library. One ID-token contract fits iOS, Android, and the web (Q66).

### US5. Retry photo (P2)

`POST /v1/reads` accepts `image/jpeg` only after the person has accepted the sentence in [design/UX.md](../../design/UX.md). The response `band` is `accept`, `clarify`, `retry`, or `abstain`. The server may store the photo for review of that read, for 30 days (FR-026). It is not a training set.

Until Q18 picks a reader, `GET /v1` reports `photo_reads: false`, `POST /v1/reads` returns 503 `not-ready`, and clients do not offer the upload. Tests use a reader port that returns `abstain`.

### US6. Web client (P2)

A browser client in this repo, not the marketing site, does US1 to US4 with the same API and the same UX patterns. The Worker serves it on the API's own origin (FR-029). In v1 the web client reads codes by typing only: browsers have no dependable on-device handwriting reader, and the server read is off (US5). The camera arrives with Q18.

### US7. Operator safety (P2)

The server refuses record text that contains a blocklisted term (FR-024). The operator can suspend an account (FR-025) and revoke a reported code. Reports and photos follow FR-017 and FR-026. There is no admin route in contract 1. The operator works in D1 with the queries in [plan.md](plan.md).

## Functional requirements

| ID | Requirement | Source |
|---|---|---|
| FR-001 | Paths, headers, and JSON shapes are [openapi.yaml](openapi.yaml). Prefix `/v1`. Header `X-ZZ-Contract: 1` on every request and every response. A missing or other request value is 400 `{ "error": "contract-version" }`. | zzThat ZQ19 [DANNY 2026-10-04] |
| FR-002 | `GET /v1/openapi.json` returns this document as JSON. | zzThat ZQ19 |
| FR-003 | The server re-parses every code with the spec 003 grammar (`packages/zz-core`) and stores the canonical form. | spec 002 FR-013 |
| FR-004 | Plain codes: the server chooses the words and the check word with the spec 003 issuer (format and rules in spec 003, Prototype defaults). Until the issuer is configured (`ZZ_MINT_ENABLED` false), plain mint returns 503 `{ "error": "not-ready" }` and stores nothing. | spec 002 US2. The not-ready code is INFERRED so a builder has a status. |
| FR-005 | `free_public` defaults off. Discovery lists it in `scopes` only when the flag is on. | spec 002 FR-016 kept the scope out of the first deployment. [DANNY 2026-10-04] puts the shape in the contract. |
| FR-006 | Re-roll budget is 3 on mint, then one less per successful re-roll. Exhausted codes, and codes with `first_resolved_at` set, return `reroll-cap`. Retired words are not issued again. The retired code gets `revoked_reason` `reroll` and leaves the owner list. | zzThat runtime re-roll cap. Q36 default is never reissue. |
| FR-007 | Everyday fields are `title` (1 to 120 characters) and `body` (0 to 4000), counted in Unicode code points. Text is plain: no markup, and clients do not turn links into tappable links. The server trims the title and removes control characters other than line feed. There is no phone field, and no code string holds a phone number. The server does not scan the body for phone numbers (Q68). | zzThat ZQ5. Lengths INFERRED so the columns are closed. Plain-text rule INFERRED against phishing. |
| FR-008 | Public resolve needs no session. Writes need a bearer token. Contract 1 records are all public, because mint has no visibility field. Clients do not send `Authorization` on resolve. A resolve that carries one is answered the same way with `Cache-Control: no-store`. | zzThat ZQ6. spec 002 FR-020. Client rule INFERRED so signed-in reads stay cacheable. |
| FR-009 | One not-found body, identical for unknown, expired, used, revoked, and a signed-out read of a private record. | spec 002 FR-011 |
| FR-010 | Check-word failure is 400 `{ "error": "malformed", "reason": "check-mismatch" }`. A plain code whose parts are all on the list but whose part count is not the issued count is 400 `malformed` with reason `wrong-length`. Neither resolves, and neither suggests another code. | spec 002 FR-021. spec 003 FR-018. |
| FR-011 | Rate limits are the table below. They are global, not per data center. 429 body is `{ "error": "rate-limited" }` and does not depend on whether the code exists. `Retry-After` is whole seconds. | spec 002 FR-006. Numbers for the zzThat routes are the zzThat proposal. Other rows are INFERRED. |
| FR-012 | Account deletion revokes active codes and refresh tokens and keeps audit rows. The full steps are FR-023. | zzThat DEP-012. spec 002 FR-003 |
| FR-013 | Retry upload is jpeg, at most 8 MiB (8388608 bytes) (INFERRED). The server checks the JPEG signature (bytes FF D8 FF), not only the content type. Other types are 400 `{ "error": "malformed" }`. A body over 8 MiB is 413 `{ "error": "payload-too-large" }` and is refused before anything is written to R2. When `photo_reads` is false the call is 503 `not-ready` and stores nothing. | zzThat FR-005 |
| FR-014 | The web client is a thin client. It does not embed a resolver database. Screens follow [design/UX.md](../../design/UX.md) and use the strings in [design/copy.json](../../design/copy.json). | [DANNY 2026-10-04] |
| FR-015 | `share.url` is null. Share text is the canonical code. | zzThat ZQ9 |
| FR-016 | `GET /v1/audit` is limited to an auditor role (FR-034). The apps do not call it. | spec 002 US4 |
| FR-017 | Reports return 202 when the body parses, including when the code is unknown. `canonical` must pass the grammar. Reports are stored for the operator. | zzThat FR-035 |
| FR-018 | Edge-cache only an active, reusable, public, unauthenticated resolve. Header `Cache-Control: public, max-age=60, stale-while-revalidate=300`, stored with the Workers Cache API. The cache key is `https://cache.zzthis.internal/v1/resolve/{canonical}`, with the canonical form percent-encoded once. It is not the caller's URL. A record update, revoke, or expiry purges that key. If the purge fails, 60 seconds is the worst case. Single-use codes, short-expiry codes, private records, authenticated responses, 404 misses, and 429s are not stored and send `Cache-Control: no-store`. | [DANNY 2026-10-04] (Q26) |
| FR-019 | How FR-018 runs on Workers. (a) Cacheable means: code active, not single use, `expires_at` null, record public, and no `Authorization` on the request. Any code with an expiry counts as short-expiry, so expiry never needs a purge. (b) The key is `https://cache.zzthis.internal/v1/resolve/{canonical}`, with the canonical form percent-encoded once, so every spelling of a code shares one key. The lookup happens before the D1 read. A hit is returned as stored and does not classify the row again. (c) `cache.delete` clears only the data center that handles the write. Other data centers keep their copy until `max-age` ends, so 60 seconds is the normal worst case at the edge, not only when a purge fails. (d) The Workers Cache API ignores `stale-while-revalidate`. Clients still receive it. zzThat FR-041 keeps the apps from showing a stale record while online. (e) The rate limit runs before the cache, so a cached hit still counts. | INFERRED from the Workers Cache API documentation, checked 2026-10-04 |
| FR-020 | Sign-in. `POST /v1/auth/nonce` returns a random nonce that works once, for 10 minutes. `POST /v1/auth/token` takes `provider`, `client`, `id_token`, `nonce`, and, for Apple, `authorization_code`. The server consumes the nonce, then verifies the ID token: signature against the provider's published keys, issuer, audience in that provider's allowed client ids, expiry, and the nonce claim (Apple: the hex SHA-256 of the nonce; Google: the nonce itself). It finds or creates the account by provider and subject and stores no email or name. For Apple it exchanges the authorization code once and keeps the Apple refresh token, encrypted, only to revoke it at deletion (FR-023). If that exchange fails, sign-in still succeeds and the failure is logged. | INFERRED (Q66). Apple requires token revocation when an account is deleted. |
| FR-021 | Tokens. Access tokens are HS256 JWTs (`iss` `zzthis`, `sub` the account id, exactly 900 seconds). Verifiers accept only `alg` HS256 and reject `none` and every other `alg` before checking the signature. Refresh tokens are 32 random bytes, stored as a hash, valid 30 days. Each refresh returns a new pair and revokes the old token. Reusing a revoked refresh token revokes every token in its family and returns 401. iOS and Android receive the refresh token in the body. The web client receives it only as the cookie `__Host-zz_refresh` (HttpOnly, Secure, SameSite=Strict, Path=/, Max-Age 2592000), and the body field is null. Refresh and revoke on the web read that cookie. Revoke clears it with Max-Age 0. The server does not accept a redirect URI from the client. `APPLE_WEB_REDIRECT_URI` is the only return URL. | zzThat ZQ18 lifetimes. Family revoke and the web cookie are INFERRED. |
| FR-022 | Developer sign-in for tests and local runs. `provider: "dev"` with `id_token` `dev:<name>` (`<name>` is 1 to 40 of `a` to `z`, `0` to `9`, `-`) works only when `ZZ_DEV_AUTH` is `true` and `ZZ_ENV` is not `production`. If both are set in production, the Worker answers every request 503 `not-ready` and logs a configuration error. Discovery lists `dev` only when it works. | INFERRED, so CI can test every write without real Apple or Google clients |
| FR-023 | `DELETE /v1/me`: (1) revoke the stored Apple token through Apple's revoke endpoint, best effort, and log a failure; (2) in one D1 batch, revoke the account's active codes (`revoked_reason` `account-deleted`), mark its records deleted, empty the title and body of every version and set `erased_at`, delete its identities and read-photo rows, revoke its refresh tokens, set `accounts.deleted_at`, and append the audit event; (3) delete the photo objects and purge the cache keys of the revoked codes; (4) return 204. Signing in again later creates a new, empty account. | zzThat FR-034, DEP-012. Erasing record text is INFERRED for store deletion rules. |
| FR-024 | Content check. `ZZ_BLOCKLIST` holds lowercase terms, one per line, kept out of the repo. Mint and record versions check the title and body (case-folded, whole words). A match is 422 `{ "error": "content-refused" }`, stores nothing, and writes an audit event with result `denied`. The same list feeds the offensive-terms category of spec 002 FR-019 and the proto-v0 filter. | INFERRED for App Store review guideline 1.2 |
| FR-025 | Suspension. When `accounts.suspended_at` is set, every write and `GET /v1/me/codes` return 403 `forbidden`. Sign-in, `GET /v1/me`, and `DELETE /v1/me` still work, so the person can always delete the account. | INFERRED |
| FR-026 | Retention. A retry photo is deleted 30 days after upload. A daily scheduled run deletes expired photos and rows, used or expired nonces, and refresh tokens 30 days past expiry. | INFERRED. The privacy policy states the 30 days. |
| FR-027 | Logs hold the method, the route template, the status, the duration, cache hit or miss, the limiter rule, and the data center. Logs never hold a code, record text, a token, a nonce, a photo, or an IP address. Limiter keys use an HMAC of the IP. | INFERRED from Section 2.7 and zzThat's analytics-free rule |
| FR-028 | Every `/v1` response except a cacheable resolve sends `Cache-Control: no-store`. | INFERRED. Token and owner responses must never be cached. |
| FR-029 | One Worker serves `/v1/*` and the web client's static files on one origin. The API sends no CORS headers. The marketing site stays on GitHub Pages. | INFERRED (Q69). One origin removes CORS and lets the web refresh token live in a cookie. |
| FR-030 | Owner reads. `GET /v1/me/codes` items carry `title`, the current record title. `GET /v1/records/{id}` returns `id`, `version`, `title`, `body`, and `updated_at` to the record's owner, and the one not-found body to anyone else. | INFERRED. The zzThat Code detail and Edit record screens need them. |
| FR-031 | Every state change and its audit event are written in one D1 batch, which is all or nothing. Re-roll, revoke, single-use resolve, and the first-resolve mark use conditional updates (`WHERE status = 'active' ...`), so two racing calls cannot both win. | spec 002 FR-018 and US1 acceptance 6. D1 has no interactive transactions. |
| FR-032 | In contract 1, `match_key` is unique across every code in every scope, retired codes included, so resolve needs no scope. The issuer draws again on a conflict, up to 8 times, then returns 500 `failed`. | INFERRED. Per-scope duplicates are v2 (zzThat ZQ4, Q56). |
| FR-033 | Discovery also returns `wordlist_version` (`fixture-7` or `proto-v0`) and `photo_reads`. `auth_providers` lists only the providers this deployment accepts. | INFERRED. Clients skip the local check word when their bundled list version differs. |
| FR-034 | Scopes and roles. `free_public` minting needs `ZZ_FREE_PUBLIC`. `enterprise` and `logistics` minting need a `grants` row with role `issuer` for that scope and account, else 403 `forbidden`. The auditor role is a `grants` row with role `auditor`. The operator adds grants with SQL. | INFERRED. spec 002 FR-016 |

## Resolve

The server runs these steps for `GET /v1/resolve/{code}`, in order.

1. Check `X-ZZ-Contract`. Wrong or missing: 400 `contract-version`.
2. Rate limit (FR-011). Over the limit: 429.
3. Parse with the grammar. Failure: 400 `malformed` with the parser reason. A bare mark: 422 `unsupported`, reason `bare-mark-needs-context`.
4. For a plain code whose parts are all on the list: verify the check word. `check-mismatch` or `wrong-length`: 400 `malformed` with that reason.
5. With no `Authorization` header, look up the cache key (FR-019). A hit is returned as stored.
6. Look up `match_key` in D1. For a word code it is the canonical form. For a handle or a name it is the Section 2.2a G10 key of the canonical form, with the leading `@` dropped from a handle that is a name, so `zz-@vitalik.eth-zz` and `zz-vitalik.eth-zz` meet (spec 002 FR-022) and lookalike handles such as `@b0b` and `@bob` are one handle (spec 002 FR-016). No row, or a row that is revoked, used, expired, or deleted: 404.
7. Single-use code: mark it used with a conditional update. If the update changed no row, 404.
8. If `first_resolved_at` is null, set it with a conditional update, in the same batch as the audit event.
9. Build the body from the record's current version. Cacheable (FR-019): send the public header and put the response in the cache. Otherwise: `no-store`.

Every resolve that reaches step 6 writes an audit event with result `ok` or `not-found`. Cache hits and malformed calls write none. Malformed calls still count toward the limit (spec 002 FR-014).

## Mint

1. Check the header, the bearer token, suspension, and the rate limit.
2. Check the scope (FR-005, FR-034). `kind` plain: the issuer must be configured (FR-004).
3. Check the title and body (FR-007, FR-024).
4. Draw a code (spec 003 issuer rule). Build `match_key`.
5. One D1 batch: insert the record, version 1 (signed), the code with `rerolls_remaining` 3, and the audit event. A unique-key conflict draws again (FR-032).
6. Return 201 with the code.

Re-roll uses one batch too: a conditional update retires the old code (`status = 'active' AND rerolls_remaining > 0 AND first_resolved_at IS NULL AND owner_id = ?`), a new code is inserted for the same record with the budget less one, and the old code's `replaced_by` points at it. If the update changes no row, the server reads the row only to tell its own codes apart. No row, or a row owned by someone else, is the one not-found body. The caller's own row with no re-rolls left, or with `first_resolved_at` set, is `reroll-cap`. `forbidden` is the suspension check in step 1, and it does not depend on the id. Revoke uses the same split: not-found when the id is missing or not owned. Re-roll has no 409.

## Sign-in by platform

| Client | Apple | Google |
|---|---|---|
| iOS | Sign in with Apple (AuthenticationServices). The request nonce is the hex SHA-256 of the server nonce. Send the identity token and the authorization code. | Google Sign-In for iOS with the server nonce. Send the ID token. |
| Android | Not in v1 (Q67). Android has no Sign in with Apple library. | Credential Manager with the Sign in with Google option, the server nonce, and the web client id as the server client id. Send the ID token. |
| Web | Sign in with Apple JS in popup mode. The nonce is the hex SHA-256 of the server nonce. Send the ID token and the code. | Google Identity Services button with the server nonce. Send the credential, which is the ID token. |
| Tests and local runs | `dev` (FR-022) | `dev` (FR-022) |

Apple requires Sign in with Apple in an iOS app that offers Google sign-in, so iOS offers both.

## Data model

Portable SQL, SQLite-compatible for D1. Ids are UUID text. Times are ISO-8601 UTC text. This is the column list the first migration implements. It extends the spec 002 sketch.

| Table | Columns |
|---|---|
| accounts | id, created_at, suspended_at, deleted_at |
| identities | id, account_id, provider (`apple`, `google`, or `dev`), provider_subject, apple_refresh_token_enc (nullable), created_at. Unique (provider, provider_subject). |
| auth_nonces | nonce_hash (primary key), expires_at, used_at |
| refresh_tokens | id, account_id, family_id, client (`ios`, `android`, or `web`), token_hash, expires_at, revoked_at, replaced_by |
| codes | id, scope, canonical, match_key, kind, check_word, list_version, status (`active`, `used`, `revoked`, `expired`), revoked_reason (`owner`, `reroll`, `account-deleted`, `operator`), single_use, expires_at, record_id, owner_id, first_resolved_at, rerolls_remaining, replaced_by, created_at. Unique (match_key) across all rows, retired rows included. |
| records | id, owner_id, visibility (`public` or `private`), current_version_id, created_at, deleted_at |
| record_versions | id, record_id, version, title, body, signature, signing_key_id, created_by, created_at, erased_at |
| grants | id, subject_id, scope, role (`issuer`, `auditor`), expires_at |
| audit_events | id, actor_id, action, target_type, target_id, result, created_at. No update, no delete. |
| read_photos | id, account_id nullable, canonical nullable, object_key, created_at, expires_at |
| reports | id, canonical, code_id nullable, reason, note, created_at, closed_at |

`match_key` is defined in Resolve step 6. Field codes are never issued in contract 1, so no stored key is a field-code key. The reserved-handle check (spec 002 FR-019) compares the same G10 key.

Record signatures use one Ed25519 key from the Worker secret store (INFERRED, so the prototype can sign). The signed bytes are the UTF-8 of `JSON.stringify([record_id, version, title, body, created_at])`. The signature is stored as base64url. Versions start at 1. Rotation stays Q28 and is not in this prototype. Clients do not verify signatures until Q28 publishes keys.

## Errors

| Status | error | When |
|---|---|---|
| 200 | | Resolve, re-roll, revoke, read, discovery, sign-in, owner reads |
| 201 | | Mint, record version |
| 202 | | Report |
| 204 | | Auth revoke, delete account |
| 400 | contract-version | Bad or missing `X-ZZ-Contract` |
| 400 | malformed | Grammar failure (`reason` is the parser reason), check word (`check-mismatch`, `wrong-length`), a bad body, or a photo that is not jpeg |
| 401 | unauthorized | No usable bearer token, a bad ID token, a used nonce, or a bad refresh token |
| 403 | forbidden | Authenticated, not allowed, or suspended |
| 403 | scope-unavailable | Scope flag is off |
| 403 | reroll-cap | No re-rolls left, or the code was already resolved |
| 404 | not-found | The one not-found body |
| 409 | taken | Handle already exists. Body does not name the owner. |
| 413 | payload-too-large | Photo over 8 MiB |
| 422 | unsupported | Bare mark. `reason` is `bare-mark-needs-context`. |
| 422 | reserved-handle | Reserved handle, or shorter than 3 characters after `@` |
| 422 | content-refused | Title or body holds a blocklisted term (FR-024) |
| 429 | rate-limited | `Retry-After` set |
| 500 | failed | Signing, audit, or a unique draw failed. Nothing stored. |
| 503 | not-ready | Plain-code issuer, photo reader, or configuration not ready |

## Rate limits

Signed-in calls count against the user rows. Signed-out calls count against the IP rows. One Durable Object per key keeps the count, so a limit holds across data centers (plan).

| Call | Limit |
|---|---|
| `GET /v1/resolve/{code}` | 60 per minute per IP, and 120 per minute per signed-in user |
| `POST /v1/codes` and `POST /v1/codes/{id}/reroll` | 10 per hour per user, shared |
| `POST /v1/reads` | 5 per hour per IP, and 20 per hour per signed-in user |
| `POST /v1/reports` | 10 per hour per IP |
| `POST /v1/auth/nonce` and `POST /v1/auth/token` | 20 per minute per IP (INFERRED) |
| `POST /v1/auth/refresh` and `POST /v1/auth/revoke` | 30 per minute per IP (INFERRED) |
| `GET /v1/me`, `GET /v1/me/codes`, and `GET /v1/records/{id}` | 60 per minute per user (INFERRED) |
| `POST /v1/records/{id}/versions` and revoke | 30 per hour per user (INFERRED) |
| `DELETE /v1/me` | 5 per hour per user (INFERRED) |
| `GET /v1` and `GET /v1/openapi.json` | 60 per minute per IP (INFERRED) |
| `GET /v1/audit` | 60 per minute per user (INFERRED) |

## Environment

Names only. Values are not committed. Worker secrets hold the secrets. A missing required name fails closed: every request gets 503 `not-ready` and the log names the missing setting.

| Name | Kind | Purpose |
|---|---|---|
| ZZ_ENV | var | `local`, `staging`, or `production` |
| ZZ_CONTRACT | var, `1` | Contract this process serves |
| ZZ_FREE_PUBLIC | var, default `false` | Discovery flag |
| ZZ_MINT_ENABLED | var, default `false` | Plain-code issuer is configured |
| ZZ_WORDLIST_VERSION | var | `fixture-7` or `proto-v0`. Production refuses `fixture-7`. |
| ZZ_PHOTO_READS | var, default `false` | A reader port is configured (Q18) |
| ZZ_DEV_AUTH | var, default `false` | FR-022. Refused in production. |
| ZZ_TOKEN_SECRET | secret | HS256 access tokens, at least 32 random bytes |
| ZZ_DATA_KEY | secret | 32 random bytes. AES-GCM for stored Apple tokens. HMAC for IP limiter keys. |
| ZZ_RECORD_SIGNING_KEY | secret | Ed25519 private key, PKCS8, base64 |
| ZZ_RECORD_SIGNING_KEY_ID | var | Id stored on each version |
| ZZ_BLOCKLIST | secret | FR-024. May be empty outside production. |
| APPLE_TEAM_ID, APPLE_KEY_ID | var | Sign in with Apple client secret |
| APPLE_PRIVATE_KEY | secret | Sign in with Apple key (.p8) |
| APPLE_CLIENT_IDS | var | Allowed audiences: the iOS bundle id and the web Services ID |
| APPLE_WEB_REDIRECT_URI | var | The web return URL registered with Apple |
| GOOGLE_CLIENT_IDS | var | Allowed audiences: the web and iOS client ids. Android tokens carry the web client id. |
| D1 binding `ZZ_DB` | binding | SQL |
| R2 binding `ZZ_PHOTOS` | binding | Retry photos |
| Durable Object binding `ZZ_LIMITER` | binding | Rate limits |
| Assets binding `ASSETS` | binding | Web client files |

The server does not read a redirect URI from the request. `APPLE_WEB_REDIRECT_URI` is the only return URL, compared as an exact string. There is no client-supplied redirect and no redirect allowlist, and no Google client secret, so `ZZ_REDIRECT_ALLOWLIST` and `GOOGLE_CLIENT_SECRET` are gone. Creating the Worker, D1, R2, the Durable Object namespace, and the Apple or Google clients needs Danny's yes. This spec does not create them.

## Web client

Not built here. When it is built it lives in `apps/web` in this repo, is served by the same Worker (FR-029), and is not a route of the marketing site.

| Screen | Path | API | Pattern in design/UX.md |
|---|---|---|---|
| Type and resolve | `/` | resolve | Scan (typing), Resolve |
| Report | dialog on Resolve | `POST /v1/reports` | Report |
| Create | `/create/` | discovery, mint, re-roll | Create, Minted code |
| My codes | `/codes/` | `GET /v1/me/codes` | My codes |
| Code detail | `/code/?id=` | `GET /v1/records/{id}`, revoke | Code detail, Revoke confirm |
| Edit record | `/edit/?id=` | `GET /v1/records/{id}`, versions | Edit record |
| Sign in | `/signin/` | nonce, token | Sign in |
| Account | `/account/` | `GET /v1/me`, `DELETE /v1/me` | Account, Delete confirm |

The first web release has no camera and no microphone. Voice on the marketing demo stays a simulation and is not this client. The provider scripts (Google Identity Services and Sign in with Apple JS) load on `/signin/` only. The pages send a Content-Security-Policy of `default-src 'self'`, widened on `/signin/` to the provider origins their documentation names. No analytics. Fonts are self-hosted.

## Out of scope

- Implementing the Worker, the web client, or a vision vendor in this change.
- Person-chosen plain-code words (zzThat ZQ11).
- Partner auth (Q19), suggestion policy details (Q40), no-device linking (Q25), and signing-key rotation (Q28).
- Sign in with Apple on Android (Q67), linking two sign-in providers to one account, and admin routes.
- A global cache purge through the Cloudflare zone API.
- Payments, store submission, and production deploy.

## Open questions

| ID | Still open | Prototype default in this contract |
|---|---|---|
| Q19 | Partner auth | No partner route |
| Q25 | No-device linking | Not a route |
| Q27 | Which formats the issuer emits | Two data words and a check word (spec 003, Prototype defaults) |
| Q28 | Key rotation | One Ed25519 key. Clients do not verify. |
| Q30, Q31, Q32, Q35 | Check word, list size, source, filters | spec 003, Prototype defaults (proto-v0) |
| Q37 | Capture thresholds | spec 004, Client read pipeline (0.80 and 0.50) |
| Q18 | Which vision model | `photo_reads` false. `POST /v1/reads` returns `not-ready`. Tests use a port that returns `abstain`. |
| Q36 | Reissue of retired words | Never |
| Q66 ([#68](https://github.com/Zero-State-LLC/zzthis/issues/68)) | Replace the code and PKCE exchange with ID token and nonce sign-in (amends zzThat ZQ18) | Yes, FR-020 |
| Q67 ([#69](https://github.com/Zero-State-LLC/zzthis/issues/69)) | Sign in with Apple on Android | Not in v1. Android offers Google. |
| Q68 ([#70](https://github.com/Zero-State-LLC/zzthis/issues/70)) | May the body hold a phone number the owner typed? | Yes. The code never does. |
| Q69 ([#71](https://github.com/Zero-State-LLC/zzthis/issues/71)) | Hosting: one Worker serves the API and the web client on one origin. Which domain? | One Worker. Staging on its workers.dev name. The domain is Danny's. |

Q29 (where the code lives) is answered for this API: the server and the later web client live in this repo [DANNY 2026-10-04].

Q26 (edge cache) is answered [DANNY 2026-10-04]. Only an active, reusable, public, unauthenticated resolve is stored, with `Cache-Control: public, max-age=60, stale-while-revalidate=300` and the Workers Cache API. A record update, revoke, or expiry purges that code's cache key. The 60 second max-age is the worst case if a purge fails. Single-use codes, short-expiry codes, private records, authenticated responses, 404 misses, and 429s send `Cache-Control: no-store`. FR-019 records how that runs on Workers. Rate-limit numbers stay the table above.

## Workflows

| Item | Value |
|---|---|
| Governing workflows | anti-slop-code, production-systems, google-developer-style |
| Product owner | Michael Chung |
| Operator | Danny |
| CI to reuse | `.github/workflows/ci.yml` (required `build`), `site-ci.yml`, `free-security-scan.yml`. Root `npm run lint`, `typecheck`, `test`, and `build` cover the new workspaces, so `ci.yml` does not change. Do not add a deploy workflow until a human-gated deploy task. |
| Human gates | Cloudflare resources, OAuth client registration, the proto-v0 source and license, production deploy, spend |
