# Cloudflare resource inventory

Status: staging evidence recorded 2026-10-07; production identifiers/credentials are not stored here. Bundle: B4.

| Environment | Resource | Binding/name | State |
|---|---|---|---|
| local | API Worker | wrangler local | existing |
| local | D1 | ZZ_DB local simulation | existing |
| local | R2 | ZZ_PHOTOS local simulation | existing; photo reads disabled |
| local | Durable Object | ZZ_LIMITER / Limiter | existing |
| staging | API Worker | zzthis-api-staging | deployed 2026-10-07; public readiness remains fail-closed pending configuration diagnosis |
| staging | D1 | ZZ_DB / zzthis-staging (`b2f73070-69a2-4066-9e7e-963f8e1b0b06`) | created, health-checked, and bound only to the staging API Worker |
| staging | R2 | ZZ_PHOTOS / zzthis-photos-staging | created and bound only to the staging API Worker; photo reads remain disabled |
| staging | Durable Object | ZZ_LIMITER / Limiter | created with the staging API Worker |
| staging | marketing Worker | zzthis-site-staging | deployed and smoke-checked; no custom domain/route |
| production | API Worker | zzthis-api | human-gated |
| production | D1 | ZZ_DB / zzthis | human-gated |
| production | R2 | ZZ_PHOTOS / zzthis-photos | human-gated; authorized object classes only |
| production | marketing Worker | final name/domain TBD at cutover | human-gated |

## Secrets

Record names and owners after staging setup, never values. Use Worker secret storage, not wrangler vars or repository files.

## Isolation

Staging uses distinct D1/R2 state and secrets. No preview/staging Worker may bind production stateful resources by default.

## Observed staging evidence

- Deployment workflow: [run 37550094879](https://github.com/Zero-State-LLC/zzthis/actions/runs/37550094879), dispatched from `main` at source SHA `b2350d47b67bcb4e5d1a8ed19354d92d3840596c`.
- Marketing Worker: `zzthis-site-staging`, deployed version `8da9a4ff-2e80-46c3-aec2-76c08edd5191`.
- Preview URL: `https://zzthis-site-staging.zer0state-noema.workers.dev`.
- Smoke check: `/` returned HTTP 200 with the expected HTML; an unknown route returned HTTP 404. The Worker has no configured custom route.
- D1 check: `SELECT 1 AS staging_health` succeeded against `zzthis-staging` (`b2f73070-69a2-4066-9e7e-963f8e1b0b06`) on 2026-10-07.
- R2 check: `zzthis-photos-staging` was created 2026-10-07 with Standard storage, default jurisdiction, and WNAM location; it contains no application data.
- API deployment: [run 37553276969](https://github.com/Zero-State-LLC/zzthis/actions/runs/37553276969) completed successfully from `main` at `89c2e3b659d04fa83eed8b010508a161489a9ed7`. The deployed Worker is `zzthis-api-staging` at `https://zzthis-api-staging.zer0state-noema.workers.dev`.
- API secret names stored in Cloudflare Worker secret storage: `ZZ_TOKEN_SECRET`, `ZZ_DATA_KEY`, and `ZZ_RECORD_SIGNING_KEY`; values are not recorded here.
- API readiness check: `GET /v1` returned HTTP 503 with `{"error":"not-ready"}` after deployment. This is an intentional fail-closed result; staging API behavior is not verified and requires configuration diagnosis before any further promotion.
- No production Worker, D1, R2, DNS, or custom-domain configuration was created or changed in this staging milestone.

## Remote-resource creation gate

Completed under explicit authorization: creation and health verification of `zzthis-staging`, creation of `zzthis-photos-staging`, and deployment of the isolated marketing and API staging Workers on workers.dev URLs. The API remains fail-closed and is not a completed verification milestone. Every future remote resource change—including readiness remediation, routes/custom domains, paid features, and all production changes—remains separately operator-gated.
