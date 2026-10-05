# Plan: v1 API and web client

Feature: [spec.md](spec.md). Status: not built. This plan names the stack, the files, and the tests. Deepened 2026-10-04 for a one-shot build ([analysis](../analysis-2026-10-04.md), [brief](../../docs/ONE-SHOT-BRIEF.md)).

## Workflows (copied from the spec)

anti-slop-code, production-systems, google-developer-style. CI: `ci.yml`, `site-ci.yml`, `free-security-scan.yml`. A Worker deploy workflow is added only with Danny's yes, in the task that deploys.

## Technical context

| Item | Choice | Status |
|---|---|---|
| Where the server lives | This repo | [DANNY 2026-10-04]. Answers Q29 for the v1 API. |
| Runtime | Cloudflare Workers, TypeScript strict, Node 24 tooling, `wrangler` pinned in devDependencies | spec 002 plan [OPERATOR 2026-10-02] |
| Router | Hono | INFERRED |
| Tokens and ID-token checks | `jose` (HS256 sign and verify, remote JWKS for Apple and Google, ES256 for the Apple client secret) | INFERRED |
| Request checks | `zod` schemas written from openapi.yaml. Tests check every response body against openapi.yaml with `@cfworker/json-schema`, not Ajv: Ajv compiles with `new Function`, which workerd refuses with an EvalError. The test imports the generated `openapi.json` as a JSON module, calls `addSchema` once, and uses one helper, `expectMatchesSchema(res, operationId, status)`. It looks up `responses[status]` and fails the test on a status the operation does not declare. | INFERRED |
| API types | `openapi-typescript` writes `workers/api/src/generated/api.ts` from openapi.yaml. A check fails if it drifts. | INFERRED |
| Bundled data | The Worker cannot read files at run time. A script writes the wordlists into `packages/zz-core/src/generated/wordlists.ts` and the contract into `workers/api/src/generated/openapi.json`, as TS and JSON modules. The same drift check as `api.ts` covers them, and lint and `max-lines` skip them. | INFERRED |
| Database | D1, SQL migrations in `workers/api/migrations/`. Writes use `batch()` with the guard rule in FR-031. | spec 002 plan |
| Photos | R2 binding `ZZ_PHOTOS` | spec 002 plan |
| Rate limits | One Durable Object class, `Limiter`, one instance per key, fixed windows. Window counts live in the object's storage, so an evicted object does not reset a window. `wrangler.toml` declares `[[migrations]]` with `tag = "v1"` and `new_sqlite_classes = ["Limiter"]`. A SQLite-backed Durable Object needs no paid plan, so this adds no spend. The Workers rate-limit binding counts per data center and only over 10 or 60 seconds, so it cannot hold the hourly or per-user rows. | INFERRED (FR-011) |
| Edge cache | `caches.default`, rules in FR-018 and FR-019 | [DANNY 2026-10-04] (Q26) |
| Scheduled work | One cron trigger, daily at 03:17 UTC (FR-026) | INFERRED |
| Shared library | `packages/zz-core`: grammar (moved from `src/lib/grammar.ts`), classifier, check word, issuer, matching key, scanner, wordlist loader. The site, the Worker, and the web client import it. | spec 003 plan said "then shared as a package" once Q29 was answered |
| Web client | `apps/web`, Astro static output, served by the same Worker (FR-029). Calls `/v1` on its own origin. | INFERRED (Q69) |
| Design | `design/generated/tokens.css` and `design/copy.json`. The marketing site keeps `src/styles/tokens.css`. | design/README.md |
| Tests | Root, `packages/zz-core`, and `apps/web` unit tests stay on the root Vitest 5 with v8 coverage. `workers/api` has its own devDependencies: `vitest` 4.1.11 and `@vitest/coverage-istanbul` 4.1.11 (the same exact version), `@cloudflare/vitest-pool-workers` ^0.22.0 (its peer is vitest ^4.1; still maintained as of 2026-09-18), and `wrangler`. These are not at the root, and there is no `--legacy-peer-deps`. The pool gives the Worker tests D1, R2, Durable Objects, and outbound fetch stubs. Playwright for web end-to-end. | INFERRED. The pool needs Vitest 4 and cannot collect V8 coverage. |

## Repo layout

npm workspaces, in this order: `packages/*`, `apps/*`, `workers/*`. The web build then exists before a Worker step that reads the assets directory. The root `lint`, `typecheck`, `test`, and `build` scripts run every workspace, so the existing required checks cover the new code.

```
packages/zz-core/
  src/grammar.ts            moved here; src/lib/grammar.ts re-exports it
  src/classify.ts           G1 word, field, confirm, near-words
  src/checkword.ts          spec 003 verify
  src/issuer.ts             spec 003 draw, rejection sampling
  src/matchkey.ts           spec 005 Resolve step 6, and G10 for handles
  src/scanner.ts            spec 004 scanner rules
  src/wordlist.ts           loads a list by version id from src/generated/wordlists.ts
  src/generated/            wordlists.ts, written from wordlists/*.txt; drift-checked, not linted
  wordlists/fixture-7.txt
  wordlists/source/eff_large_wordlist.txt   the pinned EFF source (spec 003, Prototype defaults)
  wordlists/proto-v0.txt    built by scripts/build-wordlist.ts in the build (Q32 yes on #74), with proto-v0.report.md and proto-v0.report.json
  scripts/build-wordlist.ts the spec 003 pipeline; writes the list and the yield report
  test/vectors.test.ts      runs every row of specs/003-wordlist-checkword/vectors.json
workers/api/
  wrangler.toml             bindings; [assets] with directory ../../apps/web/dist, binding ASSETS, and run_worker_first = true; the Limiter migration; the cron; vars with safe defaults
  .dev.vars.example         names and local values only; every secret empty (spec.md Environment)
  vitest.config.ts          the Workers pool and istanbul coverage (Tests, below)
  scripts/dev.mjs           npm run dev:api (Local run, below)
  migrations/0001_init.sql  every table in spec.md
  src/index.ts              fetch: /v1/* to the router; anything else to env.ASSETS.fetch, with the security headers added (spec.md Web client); scheduled: retention
  src/env.ts                Env type and the settings check (fail closed)
  src/generated/            api.ts and openapi.json, written from openapi.yaml; drift-checked, not linted
  src/http/                 contract header, error bodies, no-store default, request id, logging
  src/auth/                 nonce, ID-token checks, Apple code exchange and revoke, tokens, refresh, dev
  src/codes/                mint, re-roll, revoke, owner list, handles
  src/resolve/              resolve steps and the cache
  src/records/              owner read, versions, signing
  src/reads/ src/reports/ src/audit/ src/account/ src/moderation/ src/limits/
  ops/                      operator SQL: suspend, revoke a reported code, add a grant
  test/                     one file per route group
apps/web/
  astro.config.mjs          output 'static', build.inlineStylesheets 'never', vite.build.assetsInlineLimit 0, no base path
  .env.example              the public build settings, all empty (spec.md Web client)
  src/pages/                index, create, codes, code, edit, signin, account, licenses; code and edit take ?id=<code id> (spec.md Web client)
  src/lib/api.ts            /v1 calls: contract header, bearer, ensureSession() with one shared refresh under navigator.locks, resolve with cache "no-store"
  src/lib/strings.ts        reads design/copy.json
  e2e/                      Playwright
NOTICE                      draft third-party credits (T036); merges only with Danny's legal yes
scripts/pin-zzthis.sh       replaces pin-design.sh for zzThat (manifest below)
```

Web templates use no `is:inline`, `define:vars`, `style=`, `on*=` attribute, or framework island. They do not import the marketing `ThemeToggle`, `Header`, `SwipeRow`, or `BaseLayout`. This keeps every page inside the spec.md CSP (INFERRED).

## What zzThat pins

`scripts/pin-zzthis.sh <dest> <sha>` copies these paths at one commit and writes `PIN`. zzThat keeps one pin for all of them.

| Path at the pin | Use in zzThat |
|---|---|
| `design/generated/Tokens.swift`, `design/generated/Tokens.kt` | Token files |
| `design/brand/` | Logos and the icon source |
| `design/fonts/` | IBM Plex TTF files and `OFL.txt` (added by the build, T030) |
| `design/copy.json` | String catalogs |
| `specs/005-v1-api/openapi.yaml` | Generated clients |
| `specs/003-wordlist-checkword/vectors.json` | Library tests on both platforms |
| `packages/zz-core/wordlists/*.txt` | The bundled list |
| `NOTICE` | The licenses screen (`account.licenses`), with `OFL.txt` (INFERRED; the text waits for Danny's legal yes, T036) |

## Worker request flow

1. `index.ts` sends `/v1/*` to the router. With `run_worker_first = true`, every other path also reaches the Worker, which calls `env.ASSETS.fetch`, copies the response, and adds the spec.md security headers.
2. Middleware, in order: settings check, request id, contract header, default `no-store`, error mapping, the log line (FR-027).
3. Each handler runs its limiter rule first, then its steps (spec.md Resolve and Mint).

## Local run

- `npm run dev:api` runs `node workers/api/scripts/dev.mjs` (INFERRED). The script handles every flag itself and passes none to wrangler. In order, it:
  1. Builds `apps/web` (`npm run build -w apps/web`) into the `[assets]` directory, every run, so Playwright never tests stale pages and a fresh checkout works.
  2. With `--fresh`, deletes `workers/api/.wrangler/state`.
  3. Writes a git-ignored `workers/api/.dev.vars` if it is missing: the values in `.dev.vars.example` (spec.md Environment, Local values), plus `ZZ_TOKEN_SECRET` and `ZZ_DATA_KEY` from `crypto.getRandomValues` and `ZZ_RECORD_SIGNING_KEY` from an Ed25519 key made with `crypto.subtle.generateKey`.
  4. Runs `wrangler d1 migrations apply ZZ_DB --local`.
  5. Runs `wrangler dev --port 8787` in `workers/api`, with local D1, R2, and Durable Objects.
- There is no separate `dev:web`. One command serves the API and the current web build on one origin.
- No `APPLE_*` or `GOOGLE_*` values run locally, so discovery lists only `dev`.
- `fixture-7` allows 30 codes in all, and retired words never come back, so each end-to-end run starts from an empty local database (`npm run dev:api -- --fresh`, which deletes the local state folder and applies the migrations).
- The iOS simulator reaches it at `http://localhost:8787`. The Android emulator reaches it at `http://10.0.2.2:8787`.

## Tests

| Layer | What | Where |
|---|---|---|
| zz-core | Every `vectors.json` row. Property tests: idempotence, case and separator invariance, and linear time (spec 003 US3 and T011). The invariance generator swaps `-`, space, and runs of them, and swaps `zz` and `(zz)`, inside every G9 success input; it passes once T035 lands. Check word: exhaustive on fixture-7, and 100,000 seeded cases on proto-v0 (spec 003 FR-020). | `packages/zz-core/test` |
| Worker | Every route and every error row in spec.md. Cache classes and purge (FR-018, FR-019). Limiter windows and `Retry-After`. Nonce used once. ID-token checks against keys and a JWKS generated at run time, with both Google issuer spellings. The JWT verifier takes a JWKS resolver: tests pass `jose` `createLocalJWKSet`, and production uses `createRemoteJWKSet`. Refresh reuse revokes the family, and two simultaneous refreshes with one token give one 200. Racing re-rolls and revokes (FR-031). A deleted account's token gets 401. Each deletion step. A failed audit insert stores nothing. Every response body checked against openapi.yaml with `expectMatchesSchema`, which fails on an undeclared status. Every timestamp matches the spec.md Data model form. The exact security headers on `/` and `/signin/`. | `workers/api/test` |
| Web | Unit tests for the page logic, including resolve with `cache: "no-store"` and one refresh for two concurrent expired-token calls. Playwright against `npm run dev:api -- --fresh` with developer sign-in, in one browser context: sign in, create, re-roll to the cap, sign out, resolve while signed out, sign in again, edit, revoke then not-found, report, delete the account. A second case opens two signed-in tabs at once, and both stay signed in. Any `securitypolicyviolation` event fails the run. | `apps/web/test`, `apps/web/e2e` |
| Web build | A dist check over `apps/web/dist/**/*.html` fails on a script without `src`, a `<style>` element, `style=`, an `on*=` attribute, a `data:` URI, or a provider origin outside `/signin/`. | `apps/web` build |
| Contract | `openapi.yaml` lints clean with Redocly. The generated types match. | `npm run lint` |

Playwright settings (INFERRED): `webServer` runs `npm run dev:api -- --fresh`, `baseURL` is `http://localhost:8787`, and `reuseExistingServer` is false. Projects are Chromium only, because the Secure `__Host-zz_refresh` cookie is set over plain `http://localhost` in local runs, and Playwright's WebKit drops it there. `e2e.yml` runs `npx playwright install --with-deps chromium`.

Coverage (INFERRED). The root, `packages/zz-core`, and `apps/web` keep the repo's 100% thresholds on root Vitest 5 with v8, and `packages/zz-core` excludes `src/generated/**`. `workers/api/vitest.config.ts` uses `cloudflareTest({ wrangler: { configPath: './wrangler.toml' } })` and applies migrations with `readD1Migrations` and `applyD1Migrations`. Its coverage uses provider `istanbul`, includes `src/**/*.ts`, excludes `src/generated/**`, and keeps 100% thresholds. The root `test` script becomes `vitest run --coverage && npm run test --workspaces --if-present`. The root `include` stays `tests/**`, so nothing runs twice.

Repo hygiene (INFERRED, T001). `.gitignore` covers `.wrangler/` and `.dev.vars`, and eslint and prettier skip the generated folders, so one `wrangler dev` run or one generator run never turns lint red and no local secret can be committed. These config edits are in scope and are not validator patches.

The Playwright run needs a Worker process, so it lives in a new workflow, `.github/workflows/e2e.yml`, named here before it lands. It triggers on `workflow_dispatch` and on `pull_request` (`labeled`, `synchronize`), and runs only when the PR has the `run-e2e` label. It has no schedule and is not a required check. This follows zzThat ZQ27 (CI spend), decided 2026-10-05: the no-spend path, accepted by Danny on Zero-State-LLC/zzthat#39. A manual or scheduled trigger alone cannot run a workflow that exists only on an unmerged branch, so the label run on the build PR is the run the brief links.

## Operator work without an admin route

The operator runs these with `wrangler d1 execute` against the production database. Each SQL file in `workers/api/ops/` writes its audit row in the same statement batch.

| Job | File |
|---|---|
| List open reports | `ops/reports.sql` |
| Suspend an account and revoke its codes (`revoked_reason` `operator`) | `ops/suspend.sql` |
| Revoke one reported code | `ops/revoke-code.sql` |
| Add an issuer or auditor grant | `ops/grant.sql` |

## Human-gated setup (not part of the build)

| Where | What |
|---|---|
| Cloudflare | The Worker, the D1 database, the R2 bucket, the Durable Object migration, the cron, and the secrets |
| Apple | The App ID with Sign in with Apple, a Services ID and domain check for the web, and a Sign in with Apple key |
| Google | OAuth clients for the web, iOS, and Android (with the release signing SHA-1) |
| Domain | Q69 |

## Constitution check

| Principle | Plan |
|---|---|
| I. Security lives in the resolver | Revoke, single use, expiry, rate limits, and the content check are server-side. |
| III. Exact match | Resolve is exact. One not-found body. |
| V. Do not invent the format | The issued format and the check word are the spec 003 prototype defaults, decided on #74. |
| VI. Public repo | Secrets are Worker secrets. The env table names them and holds no values. No private key, PEM, or JWK is committed. proto-v0 is committed with a draft EFF credit in `NOTICE` (Q32, #74). |
| VIII. Human gates | No Cloudflare resource and no OAuth client is created by an agent. |

## Risks

- Generators and OpenAPI 3.1. Swift OpenAPI Generator supports 3.1. The Kotlin generator's 3.1 support is partial. The contract avoids `const` and a bare `null` type, and zzThat CI generates both clients from the pin, so a generator problem is a red check, not a surprise.
- A purge clears one data center. Other data centers serve the old copy for up to 60 seconds (FR-019).
- One Durable Object call per request adds a few milliseconds. That is fine for the prototype.
- Enumeration by timing. The not-found path is one code path (spec 002).
- proto-v0 is permanent after the first production mint (spec 003). Before that mint, re-running the pipeline with `ZZ_BLOCKLIST` and checking the result is required, and the mint needs Danny's deploy yes (tasks T037).
