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
| Request checks | `zod` schemas written from openapi.yaml. Tests check every response body against openapi.yaml with Ajv (JSON Schema 2020-12). | INFERRED |
| API types | `openapi-typescript` writes `workers/api/src/generated/api.ts` from openapi.yaml. A check fails if it drifts. | INFERRED |
| Database | D1, SQL migrations in `workers/api/migrations/`. Writes use `batch()` (FR-031). | spec 002 plan |
| Photos | R2 binding `ZZ_PHOTOS` | spec 002 plan |
| Rate limits | One Durable Object class, `Limiter`, one instance per key, fixed windows. The Workers rate-limit binding counts per data center and only over 10 or 60 seconds, so it cannot hold the hourly or per-user rows. | INFERRED (FR-011) |
| Edge cache | `caches.default`, rules in FR-018 and FR-019 | [DANNY 2026-10-04] (Q26) |
| Scheduled work | One cron trigger, daily at 03:17 UTC (FR-026) | INFERRED |
| Shared library | `packages/zz-core`: grammar (moved from `src/lib/grammar.ts`), classifier, check word, issuer, matching key, scanner, wordlist loader. The site, the Worker, and the web client import it. | spec 003 plan said "then shared as a package" once Q29 was answered |
| Web client | `apps/web`, Astro static output, served by the same Worker (FR-029). Calls `/v1` on its own origin. | INFERRED (Q69) |
| Design | `design/generated/tokens.css` and `design/copy.json`. The marketing site keeps `src/styles/tokens.css`. | design/README.md |
| Tests | Vitest everywhere. `@cloudflare/vitest-pool-workers` for the Worker (D1, R2, Durable Objects, outbound fetch mocks). Playwright for web end-to-end. | INFERRED |

## Repo layout

npm workspaces: `packages/*`, `workers/*`, `apps/*`. The root `lint`, `typecheck`, `test`, and `build` scripts run every workspace, so the existing required checks cover the new code.

```
packages/zz-core/
  src/grammar.ts            moved here; src/lib/grammar.ts re-exports it
  src/classify.ts           G1 word, field, confirm, near-words
  src/checkword.ts          spec 003 verify
  src/issuer.ts             spec 003 draw, rejection sampling
  src/matchkey.ts           spec 005 Resolve step 6, and G10 for handles
  src/scanner.ts            spec 004 scanner rules
  src/wordlist.ts           loads a list by version id
  wordlists/fixture-7.txt
  wordlists/proto-v0.txt    built in the build (Q32 yes on #74), with its reports
  scripts/build-wordlist.ts the spec 003 pipeline; writes the list and the yield report
  test/vectors.test.ts      runs every row of specs/003-wordlist-checkword/vectors.json
workers/api/
  wrangler.toml             bindings, the assets directory, the cron, and vars with safe defaults
  .dev.vars.example         names and local values only
  migrations/0001_init.sql  every table in spec.md
  src/index.ts              fetch: /v1/* to the router, anything else to ASSETS; scheduled: retention
  src/env.ts                Env type and the settings check (fail closed)
  src/http/                 contract header, error bodies, no-store default, request id, logging
  src/auth/                 nonce, ID-token checks, Apple code exchange and revoke, tokens, refresh, dev
  src/codes/                mint, re-roll, revoke, owner list, handles
  src/resolve/              resolve steps and the cache
  src/records/              owner read, versions, signing
  src/reads/ src/reports/ src/audit/ src/account/ src/moderation/ src/limits/
  ops/                      operator SQL: suspend, revoke a reported code, add a grant
  test/                     one file per route group
apps/web/
  astro.config.mjs          output static, no base path
  src/pages/                index, create, codes, code, edit, signin, account
  src/lib/api.ts            /v1 calls: contract header, bearer, one refresh on 401
  src/lib/strings.ts        reads design/copy.json
  e2e/                      Playwright
scripts/pin-zzthis.sh       replaces pin-design.sh for zzThat (manifest below)
```

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

## Worker request flow

1. `index.ts` sends `/v1/*` to the router and every other path to `env.ASSETS`.
2. Middleware, in order: settings check, request id, contract header, default `no-store`, error mapping, the log line (FR-027).
3. Each handler runs its limiter rule first, then its steps (spec.md Resolve and Mint).

## Local run

- `npm run dev:api`: `wrangler dev` in `workers/api` with local D1, R2, and Durable Objects, migrations applied, and `.dev.vars` copied from the example: `ZZ_ENV=local`, `ZZ_DEV_AUTH=true`, `ZZ_FREE_PUBLIC=true`, `ZZ_MINT_ENABLED=true`, `ZZ_WORDLIST_VERSION=fixture-7`, `ZZ_PHOTO_READS=false`, and locally generated test secrets.
- `npm run dev:web`: builds `apps/web` into the Worker's assets and serves both on one origin.
- `fixture-7` allows 30 codes in all, and retired words never come back, so each end-to-end run starts from an empty local database (`npm run dev:api -- --fresh`, which deletes the local state folder and applies the migrations).
- The iOS simulator reaches it at `http://localhost:8787`. The Android emulator reaches it at `http://10.0.2.2:8787`.

## Tests

| Layer | What | Where |
|---|---|---|
| zz-core | Every `vectors.json` row. Property tests: idempotence and linear time (spec 003 US3). Check word: exhaustive on fixture-7, and 100,000 seeded cases on proto-v0 (spec 003 FR-020). | `packages/zz-core/test` |
| Worker | Every route and every error row in spec.md. Cache classes and purge (FR-018, FR-019). Limiter windows and `Retry-After`. Nonce used once. ID-token checks against a test key set through the fetch mock. Refresh reuse revokes the family. Each deletion step. A failed audit insert stores nothing. Every response body checked against openapi.yaml. | `workers/api/test` |
| Web | Unit tests for the page logic. Playwright against `npm run dev:api` with developer sign-in: sign in, create, re-roll to the cap, resolve while signed out, edit, revoke then not-found, report, delete the account. | `apps/web/test`, `apps/web/e2e` |
| Contract | `openapi.yaml` lints clean with Redocly. The generated types match. | `npm run lint` |

Coverage keeps the repo thresholds and extends them to `packages/zz-core/src` and `workers/api/src`.

The Playwright run needs a Worker process, so it lives in a new workflow, `.github/workflows/e2e.yml`, named here before it lands. It triggers on `workflow_dispatch` and on `pull_request` (`labeled`, `synchronize`), and runs only when the PR has the `run-e2e` label. It has no schedule and is not a required check. This follows zzThat ZQ27 (CI spend), decided 2026-10-05: the no-spend path, accepted by Danny on Zero-State-LLC/zzthat#39.

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
| V. Do not invent the format | The issued format and the check word are the spec 003 prototype defaults, behind Danny's yes. |
| VI. Public repo | Secrets are Worker secrets. The env table names them and holds no values. proto-v0 is committed in the build (Q32, #74). It is permanent only after the first production mint, which needs Danny's deploy yes. |
| VIII. Human gates | No Cloudflare resource and no OAuth client is created by an agent. |

## Risks

- Generators and OpenAPI 3.1. Swift OpenAPI Generator supports 3.1. The Kotlin generator's 3.1 support is partial. The contract avoids `const` and a bare `null` type, and zzThat CI generates both clients from the pin, so a generator problem is a red check, not a surprise.
- A purge clears one data center. Other data centers serve the old copy for up to 60 seconds (FR-019).
- One Durable Object call per request adds a few milliseconds. That is fine for the prototype.
- Enumeration by timing. The not-found path is one code path (spec 002).
- proto-v0 is permanent after the first production mint (spec 003).
