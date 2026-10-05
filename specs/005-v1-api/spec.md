# Feature spec: v1 API and later web client

Feature ID: 005-v1-api
Status: not built. This change publishes the contract only.
Phase: specify. The how is in [plan.md](plan.md). Tasks are in [tasks.md](tasks.md). The build brief is [docs/ONE-SHOT-BRIEF.md](../../docs/ONE-SHOT-BRIEF.md).
Wire shapes: [openapi.yaml](openapi.yaml). If a field and this prose disagree, the OpenAPI file is the field and this prose is the rule. File a bug rather than guessing.
Constitution: [.specify/memory/constitution.md](../../.specify/memory/constitution.md).
Intent: [intent/2026-10-04-v1-api-and-design-system.md](../../intent/2026-10-04-v1-api-and-design-system.md) (contract, accepted) and [intent/2026-10-04-one-shot-build.md](../../intent/2026-10-04-one-shot-build.md) (build, draft).
Deepened 2026-10-04 so the server, the web client, and both apps can be built in one pass: [analysis 2026-10-04](../analysis-2026-10-04.md). New choices are INFERRED. Danny answered Q66 directly and said yes to every other open decision on issue #74 (2026-10-04, `docs/SPEC.md` Section 9a D-2026-10-04-01). The pre-build audit (2026-10-04) added the settings rules, the refresh and D1 guard rules, the web session and CSP rules, and the test toolchain. Each of those engineering choices is INFERRED.

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

This changes the earlier exchange of an authorization code with PKCE and a redirect URI (zzThat ZQ18). Sign in with Apple on iPhone returns an ID token and a code, with a nonce and no PKCE. Android has no Sign in with Apple library. One ID-token contract fits iOS, Android, and the web [DANNY 2026-10-04] (Q66).

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
| FR-001 | Paths, headers, and JSON shapes are [openapi.yaml](openapi.yaml). Prefix `/v1`. Header `X-ZZ-Contract: 1` on every request and every response. A missing or other request value is 400 `{ "error": "contract-version" }`. The value must be exactly `1`, so a doubled header that arrives as `1, 1` is 400 `contract-version` too (INFERRED). | zzThat ZQ19 [DANNY 2026-10-04] |
| FR-002 | `GET /v1/openapi.json` returns this document as JSON. | zzThat ZQ19 |
| FR-003 | The server re-parses every code with the spec 003 grammar (`packages/zz-core`) and stores the canonical form. | spec 002 FR-013 |
| FR-004 | Plain codes: the server chooses the words and the check word with the spec 003 issuer (format and rules in spec 003, Prototype defaults). Until the issuer is configured (`ZZ_MINT_ENABLED` false), plain mint returns 503 `{ "error": "not-ready" }` and stores nothing. | spec 002 US2. The not-ready code is INFERRED so a builder has a status. |
| FR-005 | `free_public` defaults off. Discovery lists it in `scopes` only when the flag is on. | spec 002 FR-016 kept the scope out of the first deployment. [DANNY 2026-10-04] puts the shape in the contract. |
| FR-006 | Re-roll budget is 3 on a plain mint, then one less per successful re-roll. A handle has `rerolls_remaining` 0, so its re-roll returns `reroll-cap` (INFERRED). Exhausted codes, and codes with `first_resolved_at` set, return `reroll-cap`. Retired words are not issued again. The retired code gets `revoked_reason` `reroll` and leaves the owner list. | zzThat runtime re-roll cap. Q36 default is never reissue. |
| FR-007 | Everyday fields are `title` (1 to 120 characters) and `body` (0 to 4000), counted in Unicode code points after the server trims the title. Clients stop input at those limits, so the person never sends a too-long text: the web uses `maxlength` (which counts UTF-16 units, so it never allows more than the limit) or counts with `[...s].length` (INFERRED). A whitespace-only title is checked after trim and shows `create.title_required`, so it is not sent. Text is plain: no markup, and clients do not turn links into tappable links. The server trims the title and removes control characters other than line feed. There is no phone field, and no code string holds a phone number. The server does not scan the body for phone numbers, and Create shows `create.public_hint` so the owner knows anyone who scans can read the page. | zzThat ZQ5. Q68 [DELEGATED 2026-10-04, #74]. Lengths INFERRED so the columns are closed. Plain-text rule INFERRED against phishing. |
| FR-008 | A public record resolves with no session. Writes need a bearer token. A private record resolves only as FR-035 says. The everyday apps and the web client mint only public records and do not send `Authorization` on resolve. A resolve that carries one is answered with `Cache-Control: no-store`. | zzThat ZQ6. spec 002 FR-020. Q70 [DELEGATED 2026-10-04, #74]. Client rule INFERRED so signed-in reads stay cacheable. |
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
| FR-020 | Sign-in. `POST /v1/auth/nonce` returns a random nonce that works once, for 10 minutes. `POST /v1/auth/token` takes `provider`, `client`, `id_token`, `nonce`, and, for Apple, `authorization_code`. The server consumes the nonce, then verifies the ID token: signature against the provider's published keys, issuer, audience, expiry, and the nonce claim (Apple: the hex SHA-256 of the nonce; Google: the nonce itself). Issuers and key URLs are in Provider constants, below. Google `aud` must be one of `GOOGLE_CLIENT_IDS`. Apple `aud` must be `APPLE_BUNDLE_ID` when `client` is `ios` and `APPLE_SERVICES_ID` when `client` is `web`. Any other `aud`, or a provider that discovery does not list, is 401 (INFERRED). It finds or creates the account by provider and subject and stores no email or name. For Apple it exchanges the authorization code once, with `client_id` set to the token's `aud` and a client secret whose `sub` is that `aud`. It sends `redirect_uri` (`APPLE_WEB_REDIRECT_URI`) only when `aud` is `APPLE_SERVICES_ID`. It keeps the Apple refresh token, encrypted, and that `aud` as `identities.apple_client_id`, written and replaced together, only to revoke it at deletion (FR-023). If that exchange fails, sign-in still succeeds and the failure is logged. | [DANNY 2026-10-04] (Q66). Apple requires token revocation when an account is deleted. |
| FR-021 | Tokens. Access tokens are HS256 JWTs (`iss` `zzthis`, `sub` the account id, exactly 900 seconds). Verifiers accept only `alg` HS256 and reject `none` and every other `alg` before checking the signature. After the signature and expiry checks, the verifier loads `accounts` by `sub`. A missing row, or `deleted_at` set, makes the token unusable: 401 `unauthorized` on every owner route, checked before suspension (FR-025). On resolve, reads, and reports, an unusable bearer counts as no bearer for the D1 lookup and the rate limit: there is no 401, and a private record gets the one not-found body. The cache is skipped, because the request carries `Authorization` (Resolve step 5), and the response sends `no-store` (FR-008). Refresh tokens are 32 random bytes, stored as a hash, valid 30 days. Each refresh returns a new pair and revokes the old token with one guarded update, `UPDATE refresh_tokens SET revoked_at = ?, replaced_by = ?, write_id = ?req WHERE token_hash = ? AND revoked_at IS NULL`, and the new token's insert is gated on it (FR-031). When that update changes no row, the call takes the reuse path: reusing a revoked refresh token revokes every token in its family and returns 401. There is no grace window for a token that was just rotated (INFERRED: not adopted, listed for Danny as a possible follow-up). Each client runs at most one refresh at a time. A request that gets a 401 while a refresh runs waits for it, then retries once with the new access token. The client signs out only when the refresh itself returns 401 (INFERRED; the web rule is in Web client). iOS and Android receive the refresh token in the body. The web client receives it only as the cookie `__Host-zz_refresh` (HttpOnly, Secure, SameSite=Strict, Path=/, Max-Age 2592000), and the body field is null. Refresh and revoke on the web read that cookie. Revoke, a 401 from refresh, and the 204 from `DELETE /v1/me` clear it with Max-Age 0. The server does not accept a redirect URI from the client. `APPLE_WEB_REDIRECT_URI` is the only return URL. | [DANNY 2026-10-04] (Q66). Access and refresh lifetimes follow zzThat ZQ18. |
| FR-022 | Developer sign-in for tests and local runs. `provider: "dev"` with `id_token` `dev:<name>` (`<name>` is 1 to 40 of `a` to `z`, `0` to `9`, `-`) works only when `ZZ_DEV_AUTH` is `true` and `ZZ_ENV` is not `production`. If both are set in production, the Worker answers every request 503 `not-ready` and logs a configuration error. Discovery lists `dev` only when it works. Developer sign-in uses the FR-020 nonce flow: the client calls `POST /v1/auth/nonce` first and sends that nonce, and the server consumes it like any other (unknown, expired, or used is 401). A dev token is not a JWT, so there is no signature, issuer, audience, expiry, or nonce-claim check. The account is found or created by provider `dev` and subject `<name>`. | INFERRED, so CI can test every write without real Apple or Google clients |
| FR-023 | `DELETE /v1/me`: (1) revoke the stored Apple token through Apple's revoke endpoint, with `client_id` set to `identities.apple_client_id` and a client secret whose `sub` equals it (Provider constants); if the call fails, copy the still-encrypted token and that `client_id` into `pending_revocations` so the daily run can retry it with the stored `client_id` (FR-026); (2) in one D1 batch, revoke the account's active codes (`revoked_reason` `account-deleted`), mark its records deleted, empty the title and body of every version and set `erased_at`, delete its identities, `grants`, and read-photo rows, revoke its refresh tokens, set `accounts.deleted_at`, and append the audit event; (3) delete the photo objects and purge the cache keys of the revoked codes; (4) return 204. For a web session, the 204 also clears `__Host-zz_refresh` with Max-Age 0. Signing in again later creates a new, empty account. | zzThat FR-034, DEP-012. Erasing record text is INFERRED for store deletion rules. |
| FR-024 | Content check. `ZZ_BLOCKLIST` holds lowercase terms, one per line, kept out of the repo. Mint and record versions check the title and body (case-folded, whole words). A match is 422 `{ "error": "content-refused" }`, stores nothing, and writes an audit event with result `denied`. The same list feeds the offensive-terms category of spec 002 FR-019, and the proto-v0 filter in the required re-run before the first production mint (spec 003, Prototype defaults). | INFERRED for App Store review guideline 1.2 |
| FR-025 | Suspension. When `accounts.suspended_at` is set, every write and `GET /v1/me/codes` return 403 `forbidden`. Sign-in, `GET /v1/me`, and `DELETE /v1/me` still work, so the person can always delete the account. | INFERRED |
| FR-026 | Retention. A retry photo is deleted 30 days after upload. A daily scheduled run deletes expired photos and rows, used or expired nonces, and refresh tokens 30 days past expiry. It also retries each pending Apple revocation, with the wait doubling after each failure, until Apple accepts it or 30 days pass, then deletes the token and logs the outcome. | INFERRED. The privacy policy states the 30 days. |
| FR-027 | Logs hold the method, the route template, the status, the duration, cache hit or miss, the limiter rule, and the data center. Logs never hold a code, record text, a token, a nonce, a photo, or an IP address. Limiter keys use an HMAC of the IP. | INFERRED from Section 2.7 and zzThat's analytics-free rule |
| FR-028 | Every `/v1` response except a cacheable resolve sends `Cache-Control: no-store`. | INFERRED. Token and owner responses must never be cached. |
| FR-029 | One Worker serves `/v1/*` and the web client's static files on one origin: `https://zz.zer0state.com` in production, and the Worker's workers.dev name for staging. The zer0state.com zone is already on Cloudflare, so the custom domain needs no purchase; Danny adds it at deploy. The API sends no CORS headers. The marketing site stays on GitHub Pages. | Q69 [DELEGATED 2026-10-04, #74]. One origin removes CORS and lets the web refresh token live in a cookie. |
| FR-030 | Owner reads. `GET /v1/me/codes` items carry `title`, the current record title. `GET /v1/records/{id}` returns `id`, `version`, `title`, `body`, and `updated_at` to the record's owner, and the one not-found body to anyone else. Code detail and Edit record take a code id and find its row, and so its `record_id`, in `GET /v1/me/codes` (Web client). Contract 1 adds no route for this. | INFERRED. The zzThat Code detail and Edit record screens need them. |
| FR-031 | Every state change and its audit event are written in one D1 batch. A D1 batch rolls back only on a statement error. An UPDATE that matches no rows does not roll it back. Every statement after a guard selects its rows through the guard's effect, and the response is decided from statement 1's `meta.changes`. Re-roll, revoke, single-use resolve, the first-resolve mark, and refresh rotation use guarded updates (`WHERE status = 'active' ...`). Re-roll gates its inserts on `replaced_by = ?new`. Revoke, the single-use mark, and refresh rotation set `write_id = ?req`, a fresh id per request, and gate their dependent inserts on it (`INSERT ... SELECT ... WHERE EXISTS (SELECT 1 FROM ... WHERE id = ? AND write_id = ?req)`). So two racing calls cannot both win. | spec 002 FR-018 and US1 acceptance 6. D1 has no interactive transactions. Guard rule INFERRED from D1 batch behavior. |
| FR-032 | In contract 1, `match_key` is unique across every code in every scope, retired codes included, so resolve needs no scope. The issuer draws again on a conflict, up to 8 times, then returns 500 `failed`. | Q71 [DELEGATED 2026-10-04, #74]. A handwritten code carries no scope, so two scopes with one handle would make resolve ambiguous. Per-scope duplicates come with a scope-aware resolve (Q56 v2 items, zzThat ZQ4). |
| FR-033 | Discovery also returns `wordlist_version` (`fixture-7` or `proto-v0`) and `photo_reads`. `auth_providers` lists only the providers this deployment accepts. | INFERRED. Clients skip the local check word when their bundled list version differs. |
| FR-034 | Scopes and roles. `free_public` minting needs `ZZ_FREE_PUBLIC`. `enterprise` and `logistics` minting need a `grants` row with role `issuer` for that scope and account, else 403 `forbidden`. The auditor role is a `grants` row with role `auditor`, and a `viewer` grant lets an account read that scope's private records (FR-035). The operator adds grants with SQL. | INFERRED. spec 002 FR-016 |
| FR-035 | Private records. Mint takes `visibility`, `public` or `private`. `free_public` is always public, and a `private` request there is 400 `malformed`. `visibility` defaults to `public` in every scope, and only `enterprise` and `logistics` records can be `private`. A private record resolves only when the bearer token belongs to the owner (view `owner`) or to an account with a `viewer` grant on the code's scope (view `viewer`). Anyone else, signed in or not, gets the one not-found body. Private responses are never cached (FR-018, FR-019). | Q70 [DELEGATED 2026-10-04, #74]. spec 002 FR-007 and FR-020 |

## Resolve

The server runs these steps for `GET /v1/resolve/{code}`, in order.

1. Check `X-ZZ-Contract`. Wrong or missing: 400 `contract-version`.
2. Rate limit (FR-011). Over the limit: 429.
3. Parse with the grammar. Failure: 400 `malformed` with the parser reason. A bare mark: 422 `unsupported`, reason `bare-mark-needs-context`.
4. For a plain code whose parts are all on the list: verify the check word. `check-mismatch` or `wrong-length`: 400 `malformed` with that reason.
5. With no `Authorization` header, look up the cache key (FR-019). A hit is returned as stored.
6. Look up `match_key` in D1. For a word code it is the canonical form. For a handle or a name it is the Section 2.2a G10 key of the canonical form, with the leading `@` dropped from a handle that is a name, so `zz-@vitalik.eth-zz` and `zz-vitalik.eth-zz` meet (spec 002 FR-022) and lookalike handles such as `@b0b` and `@bob` are one handle (spec 002 FR-016). No row, or a row that is revoked, used, expired, or deleted: 404.
7. Private record: without a bearer token for the owner or for a `viewer` grant on the code's scope, 404 (FR-035).
8. Single-use code: one batch marks it used (`UPDATE codes SET status = 'used', write_id = ?req WHERE id = ? AND status = 'active'`), sets `first_resolved_at` (step 9), and writes the `ok` audit event gated on `write_id = ?req` (FR-031). If statement 1 changed no row, the call lost: it writes its `not-found` audit event in a separate statement and returns 404.
9. Reusable code: if `first_resolved_at` is null, set it with a conditional update, in the same batch as the `ok` audit event.
10. Build the body from the record's current version, with `view` set to `public`, `owner`, or `viewer`. Cacheable (FR-019): send the public header and put the response in the cache. Otherwise: `no-store`. Resolve does not check the version signature on read in contract 1. The spec 002 edge case that does is superseded until Q28 publishes keys.

Every resolve that reaches step 6 writes an audit event with result `ok` or `not-found`. A `not-found` event has `target_type` `code` and `target_id` set to the HMAC of the `match_key`, keyed with `ZZ_DATA_KEY` like the limiter keys (INFERRED). Cache hits and malformed calls write none. Malformed calls still count toward the limit (spec 002 FR-014).

## Mint

1. Check the header, the bearer token and its account (FR-021, including the deleted-account check), suspension, and the rate limit.
2. Check the scope (FR-005, FR-034). `kind` plain: the issuer must be configured (FR-004).
3. Check the title and body (FR-007, FR-024).
4. Draw a code (spec 003 issuer rule). Build `match_key`.
5. One D1 batch: insert the record, version 1 (signed), the code with `rerolls_remaining` 3 (0 for a handle), and the audit event. A unique-key conflict draws again (FR-032).
6. Return 201 with the code.

Re-roll is one batch too, where `?new` is a fresh id made per request (FR-031):

1. `UPDATE codes SET status = 'revoked', revoked_reason = 'reroll', replaced_by = ?new WHERE id = ?old AND owner_id = ?caller AND status = 'active' AND rerolls_remaining > 0 AND first_resolved_at IS NULL`
2. `INSERT INTO codes (...) SELECT ?new, ..., o.rerolls_remaining - 1, ... FROM codes o WHERE o.id = ?old AND o.replaced_by = ?new`, with the newly drawn code for the same record.
3. The audit insert: `INSERT INTO audit_events (...) SELECT ... WHERE EXISTS (SELECT 1 FROM codes WHERE id = ?old AND replaced_by = ?new)`.

A `match_key` conflict in statement 2 is a statement error, so the whole batch rolls back and the server draws again (FR-032). If statement 1 changes no row, nothing was written. Only then does the server read the row, to tell its own codes apart. No row, or a row owned by someone else, is the one not-found body. The caller's own row that the guard refused is `reroll-cap`: no re-rolls left (a handle always), `first_resolved_at` set, or a code that is no longer active, such as the loser of two racing re-rolls (INFERRED). `forbidden` is the suspension check in step 1, and it does not depend on the id. Re-roll has no 409.

Revoke is one guarded update, `UPDATE codes SET status = 'revoked', revoked_reason = 'owner', write_id = ?req WHERE id = ? AND owner_id = ?caller AND status = 'active'`, with its audit insert gated on `write_id = ?req`. If it changes no row, the server reads the row. No row, or a row owned by someone else, is the one not-found body. The caller's own code that is already revoked returns 200 `{ "status": "revoked" }` again and writes no second `ok` audit event. The caller's own used or expired code is the one not-found body (INFERRED).

## Sign-in by platform

| Client | Apple | Google |
|---|---|---|
| iOS | Sign in with Apple (AuthenticationServices). The request nonce is the hex SHA-256 of the server nonce. Send the identity token and the authorization code. | Google Sign-In for iOS with the server nonce. Send the ID token. |
| Android | Not in v1 (Q67). Android has no Sign in with Apple library. | Credential Manager with the Sign in with Google option, the server nonce, and the web client id as the server client id. Send the ID token. |
| Web | Sign in with Apple JS in popup mode. The nonce is the hex SHA-256 of the server nonce. Send the ID token and the code. | Google Identity Services button with the server nonce. Send the credential, which is the ID token. |
| Tests and local runs | `dev` (FR-022) | `dev` (FR-022) |

Apple requires Sign in with Apple in an iOS app that offers Google sign-in, so iOS offers both.

### Provider constants

INFERRED from the Apple and Google sign-in documentation, so a builder does not guess them. T005 tests both Google issuer spellings.

| Provider | Value |
|---|---|
| Apple issuer (`iss`) | `https://appleid.apple.com` |
| Apple keys (JWKS) | `https://appleid.apple.com/auth/keys` |
| Apple code exchange | `POST https://appleid.apple.com/auth/token` with `client_id` (the token's `aud`), `client_secret`, `code`, `grant_type=authorization_code`, and `redirect_uri` only for `APPLE_SERVICES_ID` |
| Apple revoke | `POST https://appleid.apple.com/auth/revoke` with `client_id` (`identities.apple_client_id`), `client_secret`, `token` (the decrypted refresh token), and `token_type_hint=refresh_token` |
| Apple client secret | An ES256 JWT. Header `kid` is `APPLE_KEY_ID`. Claims: `iss` `APPLE_TEAM_ID`, `aud` `https://appleid.apple.com`, `sub` the `client_id` of that call, `iat` now, and `exp` at most 6 months after `iat`. Signed with `APPLE_PRIVATE_KEY`. |
| Google issuer (`iss`) | `https://accounts.google.com` or `accounts.google.com`. Accept both. |
| Google keys (JWKS) | `https://www.googleapis.com/oauth2/v3/certs` |

## Data model

Portable SQL, SQLite-compatible for D1. Ids are UUID text. Times on the wire and in D1 are RFC 3339 UTC with exactly three fractional digits and `Z`, as `Date.prototype.toISOString()` writes them (`2026-10-04T00:00:00.000Z`). Do not use SQLite `CURRENT_TIMESTAMP` or `datetime("now")` defaults (INFERRED). A Worker test checks every timestamp in every response against that form. This is the column list the first migration implements. It extends the spec 002 sketch.

| Table | Columns |
|---|---|
| accounts | id, created_at, suspended_at, deleted_at |
| identities | id, account_id, provider (`apple`, `google`, or `dev`), provider_subject, apple_refresh_token_enc (nullable), apple_client_id (nullable: the verified Apple ID token's `aud`, written and replaced together with the token), created_at. Unique (provider, provider_subject). |
| auth_nonces | nonce_hash (primary key), expires_at, used_at |
| refresh_tokens | id, account_id, family_id, client (`ios`, `android`, or `web`), token_hash, expires_at, revoked_at, replaced_by, write_id (nullable, FR-031) |
| codes | id, scope, canonical, match_key, kind, check_word, list_version, status (`active`, `used`, `revoked`, `expired`), revoked_reason (`owner`, `reroll`, `account-deleted`, `operator`), single_use, expires_at, record_id, owner_id, first_resolved_at, rerolls_remaining, replaced_by, write_id (nullable, FR-031), created_at. Unique (match_key) across all rows, retired rows included. |
| records | id, owner_id, visibility (`public` or `private`), current_version_id, created_at, deleted_at |
| record_versions | id, record_id, version, title, body, signature, signing_key_id, created_by, created_at, erased_at |
| grants | id, subject_id, scope, role (`issuer`, `viewer`, `auditor`), expires_at |
| audit_events | id, actor_id, action, target_type, target_id, result, created_at. No update, no delete. |
| read_photos | id, account_id nullable, canonical nullable, object_key, created_at, expires_at |
| pending_revocations | id, provider (`apple`), client_id, token_enc, attempts, next_attempt_at, created_at. Holds no account id, so an erased account stays erased. |
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
| 401 | unauthorized | On an owner route, no usable bearer token (bad, expired, or for a missing or deleted account). Also a bad ID token, a used nonce, or a bad refresh token. Resolve, reads, and reports never return 401 (FR-021). |
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

| Name | Kind | Required | Purpose |
|---|---|---|---|
| ZZ_ENV | var | Always | `local`, `staging`, or `production` |
| ZZ_CONTRACT | var, `1` | Always | Contract this process serves |
| ZZ_FREE_PUBLIC | var, default `false` | No | Discovery flag |
| ZZ_MINT_ENABLED | var, default `false` | No | Plain-code issuer is configured |
| ZZ_WORDLIST_VERSION | var | Always | `fixture-7` or `proto-v0`. Production refuses `fixture-7`. |
| ZZ_PHOTO_READS | var, default `false` | No | A reader port is configured (Q18) |
| ZZ_DEV_AUTH | var, default `false` | No | FR-022. Refused in production. |
| ZZ_TOKEN_SECRET | secret | Always | HS256 access tokens. base64url of at least 32 random bytes. |
| ZZ_DATA_KEY | secret | Always | base64url of exactly 32 random bytes. AES-GCM for stored Apple tokens. HMAC for IP limiter keys and not-found audit targets. |
| ZZ_RECORD_SIGNING_KEY | secret | Always | Ed25519 private key: base64 of the PKCS8 DER, with no PEM armor |
| ZZ_RECORD_SIGNING_KEY_ID | var | Always | Id stored on each version |
| ZZ_BLOCKLIST | secret | Non-empty in production only | FR-024. May be missing or empty outside production. |
| APPLE_TEAM_ID, APPLE_KEY_ID | var | Apple group | Sign in with Apple client secret |
| APPLE_PRIVATE_KEY | secret | Apple group | Sign in with Apple key: the .p8 PEM text |
| APPLE_BUNDLE_ID | var | Apple group | The iOS audience. Its code exchange sends no `redirect_uri`. |
| APPLE_SERVICES_ID | var | Apple group | The web audience. Its code exchange sends `APPLE_WEB_REDIRECT_URI`. |
| APPLE_WEB_REDIRECT_URI | var | Apple group | The web return URL registered with Apple |
| GOOGLE_CLIENT_IDS | var | Google group | Allowed audiences, comma-separated: the web and iOS client ids. Android tokens carry the web client id. |
| D1 binding `ZZ_DB` | binding | Always | SQL |
| R2 binding `ZZ_PHOTOS` | binding | Always | Retry photos |
| Durable Object binding `ZZ_LIMITER` | binding | Always | Rate limits |
| Assets binding `ASSETS` | binding | Always | Web client files |

Settings rules (INFERRED, so T003 has one exact list):

- Always: missing or empty gives 503 `not-ready` on every request, and the log names the setting.
- `ZZ_BLOCKLIST` must be non-empty in production only.
- A var with a default is optional.
- The Apple group (`APPLE_TEAM_ID`, `APPLE_KEY_ID`, `APPLE_PRIVATE_KEY`, `APPLE_BUNDLE_ID`, `APPLE_SERVICES_ID`, `APPLE_WEB_REDIRECT_URI`) is all or none. The Google group is `GOOGLE_CLIENT_IDS`.
- A provider whose group is unset is left out of `auth_providers`, and its token gets 401. A partly set group gives 503 `not-ready`.
- Encodings: `ZZ_TOKEN_SECRET` and `ZZ_DATA_KEY` are base64url, and a `ZZ_DATA_KEY` that does not decode to 32 bytes fails closed. `ZZ_RECORD_SIGNING_KEY` is base64 of the PKCS8 DER. `APPLE_PRIVATE_KEY` is the .p8 PEM. `*_CLIENT_IDS` values are comma-separated.

Local values. `workers/api/.dev.vars.example` holds `ZZ_ENV=local`, `ZZ_CONTRACT=1`, `ZZ_DEV_AUTH=true`, `ZZ_FREE_PUBLIC=true`, `ZZ_MINT_ENABLED=true`, `ZZ_WORDLIST_VERSION=fixture-7`, `ZZ_PHOTO_READS=false`, `ZZ_RECORD_SIGNING_KEY_ID=local-1`, and `ZZ_BLOCKLIST=`. Every secret is listed with an empty value. It has no `APPLE_*` or `GOOGLE_*` names, so discovery lists only `dev`. `npm run dev:api` writes a git-ignored `.dev.vars` with generated secrets (plan.md, Local run). Tests generate every key and JWKS at run time. No private key, PEM, or JWK is ever committed, because the security scan (gitleaks) reads the full history, so deleting a committed key does not fix it.

The server does not read a redirect URI from the request. `APPLE_WEB_REDIRECT_URI` is the only return URL, compared as an exact string. There is no client-supplied redirect and no redirect allowlist, and no Google client secret, so `ZZ_REDIRECT_ALLOWLIST` and `GOOGLE_CLIENT_SECRET` are gone. Creating the Worker, D1, R2, the Durable Object namespace, and the Apple or Google clients needs Danny's yes. This spec does not create them.

## Web client

Not built here. When it is built it lives in `apps/web` in this repo, is served by the same Worker (FR-029), and is not a route of the marketing site.

| Screen | Path | API | Pattern in design/UX.md |
|---|---|---|---|
| Type and resolve | `/` | resolve | Scan (typing), Resolve |
| Report | dialog on Resolve | `POST /v1/reports` | Report |
| Create | `/create/` | discovery, mint, re-roll | Create, Minted code |
| My codes | `/codes/` | `GET /v1/me/codes` | My codes |
| Code detail | `/code/?id=<code id>` | `GET /v1/me/codes` (`limit` 50, following `next_cursor`) to find the row, then `GET /v1/records/{record_id}`, then `POST /v1/codes/{id}/revoke` | Code detail, Revoke confirm |
| Edit record | `/edit/?id=<code id>` | The same lookup, then `GET /v1/records/{record_id}` and `POST /v1/records/{record_id}/versions` | Edit record |
| Sign in | `/signin/` | nonce, token | Sign in |
| Account | `/account/` | `GET /v1/me`, `DELETE /v1/me` | Account, Delete confirm |
| Licenses | `/licenses/` | none | Account (`account.licenses`). Shows `NOTICE` and `OFL.txt` as plain text (INFERRED). |

`id` in a web query string is always a code id. When no row matches after the last page, or the record read returns 404, the page shows `resolve.not_found`, the one not-found state. Revoke uses the code id, and versions use the row's `record_id`. Contract 1 adds no route for this (INFERRED).

The first web release has no camera and no microphone. Voice on the marketing demo stays a simulation and is not this client. The provider scripts (Google Identity Services and Sign in with Apple JS) load on `/signin/` only. No analytics. Fonts are self-hosted.

### Web session (D-2026-10-05-02)

- The access token and its expiry live in memory only, never in `sessionStorage` or `localStorage` (D-2026-10-05-02, RFC 10017). Each page load gets a new access token from the refresh cookie the first time it needs one.
- `ensureSession()` in `apps/web/src/lib/api.ts` runs before any call that sends a bearer token. It refreshes inside `navigator.locks.request('zz-refresh', ...)`, re-checks the in-memory token inside the lock, and keeps one shared promise per page. Two calls or two tabs then make one refresh (FR-021).
- A 401 from refresh clears the in-memory token and shows the signed-out copy. `/` sends no bearer token and never refreshes.
- Sign-out and account deletion clear the in-memory token. The server clears the cookie (FR-021, FR-023).
- The web keeps no resolve cache. `api.ts` calls resolve with `fetch(url, { cache: "no-store" })`, so the browser's HTTP cache never answers a resolve. The edge cache (FR-018) is the only resolve cache for the web.
- Write errors: a 400 `malformed` on mint, a record version, or a report shows `error.nothing_saved` and keeps the fields as typed. Only a 400 `malformed` on resolve shows `type.malformed` ([design/UX.md](../../design/UX.md) Errors).

### Build settings (INFERRED)

These are public Astro build settings, not secrets. `apps/web/.env.example` lists them, all empty, and a release build gets them injected. Discovery does not carry client ids, so the contract does not change.

| Setting | Value |
|---|---|
| `PUBLIC_GOOGLE_WEB_CLIENT_ID` | One of `GOOGLE_CLIENT_IDS`: the web client id, which Android also uses as its server client id |
| `PUBLIC_APPLE_SERVICES_ID` | Equal to `APPLE_SERVICES_ID` |
| `PUBLIC_APPLE_REDIRECT_URI` | Equal to `APPLE_WEB_REDIRECT_URI` |
| `PUBLIC_SUPPORT_EMAIL` | The address `account.support` shows (zzThat ZQ25) |
| `PUBLIC_PRIVACY_URL` | The policy `account.privacy` opens |

`/signin/` shows a provider button only when `GET /v1` lists that provider and its settings are set. A local build therefore shows only `signin.dev`.

### Security headers (INFERRED)

One mechanism sends them. `wrangler.toml` `[assets]` sets `run_worker_first = true`. The Worker sends `/v1/*` to the router. Every other request goes to `env.ASSETS.fetch`, and the Worker copies that response and adds the headers. There is no `_headers` file, no Astro `security.csp`, and no meta CSP.

| Pages | Content-Security-Policy |
|---|---|
| Every page except `/signin/` | `default-src 'self'; img-src 'self' data:; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'` |
| `/signin/` | `default-src 'self'; script-src 'self' https://accounts.google.com/gsi/client https://appleid.cdn-apple.com; frame-src https://accounts.google.com/gsi/; connect-src 'self' https://accounts.google.com/gsi/; style-src 'self' 'unsafe-inline' https://accounts.google.com/gsi/style; font-src 'self' data:; img-src 'self' data:; object-src 'none'; base-uri 'self'; frame-ancestors 'none'` |

`'unsafe-inline'` is on `/signin/` only, because Apple's button injects inline styles. `/signin/` also sends `Cross-Origin-Opener-Policy: same-origin-allow-popups` (never `same-origin`, which breaks the provider popups) and `Referrer-Policy: strict-origin-when-cross-origin`. The Astro settings and the checks are in plan.md and tasks T019, T022, and T032.

## Out of scope

- Implementing the Worker, the web client, or a vision vendor in this change.
- Person-chosen plain-code words (zzThat ZQ11).
- Partner auth (Q19), suggestion policy details (Q40), no-device linking (Q25), and signing-key rotation (Q28).
- Sign in with Apple on Android (Q67), linking two sign-in providers to one account, and admin routes.
- A global cache purge through the Cloudflare zone API.
- Payments, store submission, and production deploy.

## Decisions

Every question that was open here was decided on 2026-10-04. Danny answered Q26, Q29, and Q66 himself. The rest are [DELEGATED 2026-10-04, #74]: Danny asked for best-practice decisions and said yes to this list on #74. Danny or Michael can reopen any of them in `docs/SPEC.md` Section 9.

| ID | Decision |
|---|---|
| Q18 | Apple Vision and ML Kit on the device. No cloud reader in v1: `photo_reads` is false and `POST /v1/reads` returns `not-ready`. Tests use a port that returns `abstain`. |
| Q19 | No partner route in contract 1. v2 uses OAuth 2.0 client credentials, one client per partner. |
| Q25 | No-device linking is a v2 claim flow, not a route here. |
| Q27, Q30, Q31, Q32, Q35 | spec 003, Prototype defaults (proto-v0), now decided. Q32 is the license yes. |
| Q28 | One Ed25519 key with its id on every version. Contract 2 publishes keys at `GET /v1/keys` and rotates at least yearly. Clients do not verify in contract 1. |
| Q36 | Never reissue retired words. |
| Q37 | spec 004, Client read pipeline (0.80 and 0.50), as parameters. |
| Q40 | Suggestions are off everywhere in v1. |
| Q67 ([#69](https://github.com/Zero-State-LLC/zzthis/issues/69)) | No Sign in with Apple on Android in v1. Android offers Google. |
| Q68 ([#70](https://github.com/Zero-State-LLC/zzthis/issues/70)) | The body may hold a phone number the owner typed. Create shows `create.public_hint`. The code never holds one. |
| Q69 ([#71](https://github.com/Zero-State-LLC/zzthis/issues/71)) | One Worker at `zz.zer0state.com` (FR-029). |
| Q70 | Private records for `enterprise` and `logistics` (FR-035). |
| Q71 | Handles are unique across all scopes in contract 1 (FR-032). |

Q29 (where the code lives) is answered for this API: the server and the later web client live in this repo [DANNY 2026-10-04].

Q26 (edge cache) is answered [DANNY 2026-10-04]. Only an active, reusable, public, unauthenticated resolve is stored, with `Cache-Control: public, max-age=60, stale-while-revalidate=300` and the Workers Cache API. A record update, revoke, or expiry purges that code's cache key. The 60 second max-age is the worst case if a purge fails. Single-use codes, short-expiry codes, private records, authenticated responses, 404 misses, and 429s send `Cache-Control: no-store`. FR-019 records how that runs on Workers. Rate-limit numbers stay the table above.

Q66 ([#68](https://github.com/Zero-State-LLC/zzthis/issues/68), sign-in) is answered [DANNY 2026-10-04]. Native Apple and Google sign-in send the provider ID token with a server nonce (FR-020, FR-021). The earlier authorization-code exchange with PKCE and a redirect URI (zzThat ZQ18) stays replaced.

## Workflows

| Item | Value |
|---|---|
| Governing workflows | anti-slop-code, production-systems, google-developer-style |
| Product owner | Michael Chung |
| Operator | Danny |
| CI to reuse | `.github/workflows/ci.yml` (required `build`), `site-ci.yml`, `free-security-scan.yml`. Root `npm run lint`, `typecheck`, `test`, and `build` cover the new workspaces, so `ci.yml` does not change. Do not add a deploy workflow until a human-gated deploy task. |
| Human gates | Cloudflare resources, OAuth client registration, the `NOTICE` text and the LICENSE sentence (legal, T036), production deploy, spend |
