# Cloudflare resource inventory

Status: staging plan; production identifiers/credentials are not stored here. Bundle: B4.

| Environment | Resource | Binding/name | State |
|---|---|---|---|
| local | API Worker | wrangler local | existing |
| local | D1 | ZZ_DB local simulation | existing |
| local | R2 | ZZ_PHOTOS local simulation | existing; photo reads disabled |
| local | Durable Object | ZZ_LIMITER / Limiter | existing |
| staging | API Worker | zzthis-api-staging | to create after authorization |
| staging | D1 | ZZ_DB / zzthis-staging | to create |
| staging | R2 | ZZ_PHOTOS / zzthis-photos-staging | create only if required by remote staging tests; no camera scans |
| staging | Durable Object | ZZ_LIMITER / Limiter | to create with Worker |
| staging | marketing Worker | zzthis-site-staging | config ready; remote deploy gated |
| production | API Worker | zzthis-api | human-gated |
| production | D1 | ZZ_DB / zzthis | human-gated |
| production | R2 | ZZ_PHOTOS / zzthis-photos | human-gated; authorized object classes only |
| production | marketing Worker | final name/domain TBD at cutover | human-gated |

## Secrets

Record names and owners after staging setup, never values. Use Worker secret storage, not wrangler vars or repository files.

## Isolation

Staging uses distinct D1/R2 state and secrets. No preview/staging Worker may bind production stateful resources by default.

## Remote-resource creation gate

This branch prepares configuration and dry-run checks only. Creating remote Cloudflare resources, deploying, changing routes/custom domains, or enabling paid features requires explicit operator authorization.
