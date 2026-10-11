# Cloudflare resource inventory

Status: staging evidence recorded 2026-10-07; production identifiers/credentials are not stored here. Bundle: B4.

| Environment | Resource | Binding/name | State | Owner |
|---|---|---|---|---|
| local | API Worker | wrangler local | existing; local simulation only | zzThis developers |
| local | D1 | ZZ_DB local simulation | existing | zzThis developers |
| local | R2 | ZZ_PHOTOS local simulation | existing; photo reads disabled | zzThis developers |
| local | Durable Object | ZZ_LIMITER / Limiter | existing local simulation | zzThis developers |
| staging | API Worker | zzthis-api-staging | deployed and API-contract smoke-checked; isolated bindings; workers.dev and preview subdomains enabled | Cloudflare operator (resource/access); API service maintainer (code/config) |
| staging | D1 | ZZ_DB / zzthis-staging | created, health-checked, and bound only to the staging API Worker | Cloudflare operator (resource); API service maintainer (schema/data use) |
| staging | R2 | ZZ_PHOTOS / zzthis-photos-staging | created and bound only to the staging API Worker; photo reads remain disabled | Cloudflare operator (resource); API service maintainer (data use) |
| staging | Durable Object | ZZ_LIMITER / `zzthis-api-staging_Limiter` (`Limiter`) | created with the staging API Worker | Cloudflare operator (resource); API service maintainer (class/behavior) |
| staging | Cron Trigger | `zzthis-api-staging` / `17 3 * * *` UTC | configured; one scheduled retention/retry execution verified without errors | Cloudflare operator (trigger); API service maintainer (handler) |
| staging | marketing Worker | zzthis-site-staging | deployed and smoke-checked; workers.dev and preview subdomains enabled; no custom domain/route | Cloudflare operator (resource/access); site service maintainer (assets/config) |
| production | API Worker | zzthis-api | not present in the account inventory; human-gated | Operator approval required before creation/assignment |
| production | D1 | ZZ_DB / zzthis | not present in the account inventory; human-gated | Operator approval required before creation/assignment |
| production | R2 | ZZ_PHOTOS / zzthis-photos | not present in the account inventory; human-gated | Operator approval required before creation/assignment |
| production | marketing Worker | final name/domain TBD at cutover | not present in the account inventory; human-gated | Operator approval required before creation/assignment |

## Secrets

The Cloudflare account operator owns secret values, access, and rotation. The API service maintainer owns the application binding/use. Verified on `zzthis-api-staging`: `ZZ_TOKEN_SECRET`, `ZZ_DATA_KEY`, and `ZZ_RECORD_SIGNING_KEY`. Names only; values are never recorded here. Use Worker secret storage, not Wrangler vars or repository files.

## Staging binding ownership

Read-only Cloudflare API inventory verified on 2026-10-07. “API maintainer” and “site maintainer” are service roles; the Cloudflare operator controls account-level provisioning, access, and remote resource lifecycle.

| Worker | Binding/config | Type | Target or current setting | Owner |
|---|---|---|---|---|
| `zzthis-api-staging` | `ASSETS` | Static assets | API/web-client asset bundle | API service maintainer |
| `zzthis-api-staging` | `ZZ_BLOCKLIST` | Plain-text setting | Empty | API service maintainer |
| `zzthis-api-staging` | `ZZ_CONTRACT` | Plain-text setting | `1` | API service maintainer |
| `zzthis-api-staging` | `ZZ_DATA_KEY` | Secret binding | Value held only in Cloudflare | Cloudflare operator (value/access); API service maintainer (use) |
| `zzthis-api-staging` | `ZZ_DB` | D1 binding | `zzthis-staging` | API service maintainer |
| `zzthis-api-staging` | `ZZ_DEV_AUTH` | Plain-text setting | `false` | API service maintainer |
| `zzthis-api-staging` | `ZZ_ENV` | Plain-text setting | `staging` | API service maintainer |
| `zzthis-api-staging` | `ZZ_FREE_PUBLIC` | Plain-text setting | `false` | API service maintainer |
| `zzthis-api-staging` | `ZZ_LIMITER` | Durable Object binding | `zzthis-api-staging_Limiter` / class `Limiter` | API service maintainer |
| `zzthis-api-staging` | `ZZ_MINT_ENABLED` | Plain-text setting | `false` | API service maintainer |
| `zzthis-api-staging` | `ZZ_PHOTO_READS` | Plain-text setting | `false` | API service maintainer |
| `zzthis-api-staging` | `ZZ_PHOTOS` | R2 binding | `zzthis-photos-staging` | API service maintainer |
| `zzthis-api-staging` | `ZZ_RECORD_SIGNING_KEY` | Secret binding | Value held only in Cloudflare | Cloudflare operator (value/access); API service maintainer (use) |
| `zzthis-api-staging` | `ZZ_RECORD_SIGNING_KEY_ID` | Plain-text setting | `staging-2026-10-07` | API service maintainer |
| `zzthis-api-staging` | `ZZ_TOKEN_SECRET` | Secret binding | Value held only in Cloudflare | Cloudflare operator (value/access); API service maintainer (use) |
| `zzthis-api-staging` | `ZZ_WORDLIST_VERSION` | Plain-text setting | `fixture-7` | API service maintainer |
| `zzthis-site-staging` | Static assets | Asset configuration | Marketing build; no script bindings | Site service maintainer |
| `zzthis-api-staging` | Cron Trigger | Scheduled event | `17 3 * * *` UTC | Cloudflare operator (trigger); API service maintainer (handler) |

## Isolation

Staging uses distinct D1/R2 state and secrets. No preview/staging Worker may bind production stateful resources by default.

## Observed staging evidence

- Deployment workflow: [run 37550094879](https://github.com/Zero-State-LLC/zzthis/actions/runs/37550094879), dispatched from `main` at source SHA `b2350d47b67bcb4e5d1a8ed19354d92d3840596c`.
- Marketing Worker: `zzthis-site-staging`, deployed version `8da9a4ff-2e80-46c3-aec2-76c08edd5191`.
- Preview URL: `https://zzthis-site-staging.zer0state-noema.workers.dev`.
- Smoke check: `/` returned HTTP 200 with the expected HTML; an unknown route returned HTTP 404. The Worker has no configured custom route.
- Rollback rehearsal: [workflow run 37566504258](https://github.com/Zero-State-LLC/zzthis/actions/runs/37566504258) passed lint, typecheck, tests, build, security scan, and dry run from `main` at `bf891bddc1d60a05f7d5af9cd158770250d95035`. Version `4523a9db-9579-42c7-9afb-75e715985cee` was deployed to staging at 100% (deployment `ccedc99f-acaa-457a-a2ec-e4be2cf8347b`), then rolled back to prior version `8da9a4ff-2e80-46c3-aec2-76c08edd5191` at 100% (deployment `433dfe1f-b66d-4e59-9f7d-e4e0faccc0f3`). The staging root/unknown-route checks passed before and after rollback (200/404). No production route, domain, or DNS changed.
- D1 check: `SELECT 1 AS staging_health` succeeded against `zzthis-staging` (`b2f73070-69a2-4066-9e7e-963f8e1b0b06`) on 2026-10-07.
- R2 check: `zzthis-photos-staging` was created 2026-10-07 with Standard storage, default jurisdiction, and WNAM location; it contains no application data. Public development URL, custom domain, and CORS are disabled. The default incomplete-multipart cleanup remains enabled at seven days. An enabled lifecycle rule expires only `reads/` objects after 30 days, matching the application photo-retention policy. The 2026-10-07 verification found zero objects, so expiry behavior remains unexercised; no disposable object was added.
- R2 recheck (before lifecycle probe): on 2026-10-07, Cloudflare API reads reconfirmed the bucket metadata (Standard, default jurisdiction, WNAM), the seven-day incomplete-multipart cleanup, and the enabled 30-day expiry for the `reads/` prefix. `zzthis-api-staging` settings show `ZZ_PHOTOS` bound to `zzthis-photos-staging` and `ZZ_PHOTO_READS=false`; the endpoint is therefore not accepting application read-photo uploads. At that check, the bucket had zero objects, no R2 development-domain access, no custom domains, and no CORS policy (the API reports that no CORS configuration exists). A subsequent controlled lifecycle probe uploaded the non-sensitive 93-byte object `reads/b4-lifecycle-probe-20261007T050522Z.txt` at 2026-10-07 05:05:32 UTC; the API confirmed it was listed in the staging bucket. No lifecycle or access settings were changed. Observe after 2026-11-06 05:05 UTC plus Cloudflare lifecycle processing and verify the object is absent before marking deletion behavior tested. This verifies configuration and exposure controls plus successful staging upload, not lifecycle deletion execution.
- API deployment: [run 37553276969](https://github.com/Zero-State-LLC/zzthis/actions/runs/37553276969) completed successfully from `main` at `89c2e3b659d04fa83eed8b010508a161489a9ed7`. The deployed Worker is `zzthis-api-staging` at `https://zzthis-api-staging.zer0state-noema.workers.dev`.
- API secret names stored in Cloudflare Worker secret storage: `ZZ_TOKEN_SECRET`, `ZZ_DATA_KEY`, and `ZZ_RECORD_SIGNING_KEY`; values are not recorded here.
- Secret rotation drill: on 2026-10-07, a fresh 32-byte `ZZ_TOKEN_SECRET` was staged in Cloudflare and deployed only to `zzthis-api-staging` as version `d3c02f9c-63c0-4137-abc9-1b1365d5de06` (deployment `59f86597-97db-4f27-9ee0-d739c5de623f`, 100%). Before rotation, staging D1 had zero `accounts` and zero `refresh_tokens`; afterward, `GET /v1` with `X-ZZ-Contract: 1` returned HTTP 200. The secret value is not stored in this repository. This verifies staging replacement and readiness, not production key ownership, emergency response, recovery, or rotation cadence.
- API readiness check: a corrected Base64URL 32-byte `ZZ_DATA_KEY` secret was promoted in Worker version `4254460f`. `GET /v1` with `X-ZZ-Contract: 1` then returned HTTP 200 and the expected staging discovery payload. Without the header it returns the expected HTTP 400 `contract-version` gate. Free-public minting, developer sign-in, minting, and photo reads remain disabled. Resolution of any separately-created public record is a distinct, intentionally unauthenticated feature and has not been exercised in staging.
- D1 recovery drill: on 2026-10-07, a disposable marker table and row were created in `zzthis-staging`, then the database was restored in place to the immediately preceding D1 Time Travel bookmark. The marker-table query returned no data after the restore; core application tables (`accounts`, `audit_events`, `codes`, and `records`) were present; and the API discovery endpoint still returned HTTP 200 with `X-ZZ-Contract: 1`. This verifies the isolated staging D1 recovery path only; it does not establish product RTO/RPO or recover R2, Durable Object, configuration, or secret material.
- Measured D1 recovery recheck: on 2026-10-07 at 04:46 UTC, Cloudflare API reads confirmed all 12 application data tables were empty and staging feature flags were off. A unique disposable probe table/row was created after capturing the current bookmark, verified present, and `zzthis-staging` was restored in place to that bookmark. The restore request returned in 1.287 seconds; the first verification query completed 0.448 seconds later (1.735 seconds from request start). Verification confirmed the probe table was absent and all application table counts remained zero. This is a measured staging D1 restore-to-query interval, not an end-to-end service RTO or product RPO; no production data or other backing store was involved.
- Durable Object check: the staging API Worker has `ZZ_LIMITER` bound to the distinct `zzthis-api-staging_Limiter` namespace. Persisted Worker logs remain enabled, but invocation logs are disabled so request URLs (which may contain raw zz codes on `/v1/resolve/{canonical}`) are not captured by the baseline. On 2026-10-07 a bounded staging discovery check sent 61 requests to `GET /v1` with `X-ZZ-Contract: 1`: requests 1–60 returned HTTP 200 and request 61 returned HTTP 429 `rate-limited` with a 16-second `Retry-After`. This confirms the configured discovery threshold only, not other route limits or Durable Object recovery.
- Retention schedule: Cloudflare reports the staging API Worker Cron Trigger `17 3 * * *` UTC, created 2026-10-07. A filtered Workers telemetry event confirms the scheduled handler ran at 2026-10-07 03:17:58 UTC on version `d3c02f9c-63c0-4137-abc9-1b1365d5de06`; the count-only report showed zero photos, nonces, refresh tokens, reports, revoked tokens, retries, or abandonments, with zero logged errors. This verifies one scheduled execution, not nonzero cleanup behavior; production trigger configuration remains human-gated.
- No production Worker, D1, R2, DNS, or custom-domain configuration was created or changed in this staging milestone.

## Remote-resource creation gate

Completed under explicit authorization: creation and health verification of `zzthis-staging`, creation of `zzthis-photos-staging`, and deployment plus contract-level smoke verification of the isolated marketing and API staging Workers on workers.dev URLs. Every future remote resource change (including broader endpoint testing, routes/custom domains, paid features, and all production changes) remains separately operator-gated.
