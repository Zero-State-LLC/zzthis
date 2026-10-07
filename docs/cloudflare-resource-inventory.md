# Cloudflare resource inventory

Status: staging evidence recorded 2026-10-07; production identifiers/credentials are not stored here. Bundle: B4.

| Environment | Resource | Binding/name | State |
|---|---|---|---|
| local | API Worker | wrangler local | existing |
| local | D1 | ZZ_DB local simulation | existing |
| local | R2 | ZZ_PHOTOS local simulation | existing; photo reads disabled |
| local | Durable Object | ZZ_LIMITER / Limiter | existing |
| staging | API Worker | zzthis-api-staging | configuration and least-privilege CI permission still required; not deployed |
| staging | D1 | ZZ_DB / zzthis-staging (`b2f73070-69a2-4066-9e7e-963f8e1b0b06`) | created and health-checked 2026-10-07; not yet bound to the API Worker |
| staging | R2 | ZZ_PHOTOS / zzthis-photos-staging | create only if required by remote staging tests; no camera scans |
| staging | Durable Object | ZZ_LIMITER / Limiter | to create with Worker |
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
- No production Worker, D1, R2, DNS, or custom-domain configuration was created or changed in this staging milestone.

## Remote-resource creation gate

Completed under explicit authorization: creation and health verification of `zzthis-staging`, and deployment of the `zzthis-site-staging` marketing Worker on its workers.dev URL. Every future remote resource change—including the API Worker, R2, Durable Object state, routes/custom domains, paid features, and all production changes—remains separately operator-gated.
