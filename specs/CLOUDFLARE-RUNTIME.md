# Cloudflare runtime architecture

Status: canonical runtime architecture for v1 and the default substrate for later bundles.
Bundle: B4 Production Operations.
Date: 2026-10-06.

## Decision

Cloudflare is the default runtime substrate for zzThis. GitHub remains source control, pull-request review, specifications, and CI. Native iOS/Android recognition remains on device in v1.

A future bundle may introduce a non-Cloudflare runtime dependency only when it records a concrete requirement Cloudflare cannot meet, the migration/operational cost, security/privacy impact, and operator approval. Convenience alone is not sufficient.

## v1 topology

```text
GitHub
  source / PR / CI
       |
       v
Cloudflare
  DNS + TLS + security controls
       |
       +-- Marketing Worker + static assets
       |
       +-- zzThis application Worker
             +-- /v1 API
             +-- web-client static assets
             +-- D1: authoritative relational state
             +-- R2: governed object/blob storage
             +-- Durable Object: limiter/coordination where required
             +-- Cron Trigger: scheduled retention/retry work
             +-- Secrets / environment bindings
```

Cloudflare Workers bindings are the preferred in-platform access mechanism for D1, R2, Durable Objects, Assets, and later Cloudflare services. Application code does not embed Cloudflare API tokens to access bound runtime resources.

## v1 resource map

| Responsibility | Resource | Rule |
|---|---|---|
| Marketing site | dedicated Worker static assets | migrate from GitHub Pages only after parity/rollback evidence |
| Web client | application Worker static assets | same origin as /v1 |
| API | Workers | TypeScript/Hono implementation already in repo |
| Relational authority | D1 | codes, accounts, records, versions, grants, audit, reports, auth state per spec 005 |
| Object storage | R2 | only object classes explicitly allowed by current privacy spec; v1 camera scans are not uploaded |
| Rate limiting / coordination | Durable Object | use only for requirements needing consistent state beyond per-request Worker execution |
| Scheduled cleanup | Cron Trigger | current FR-026 daily job |
| Secrets | Worker secrets / approved Cloudflare secret facility | never vars/git |
| DNS/TLS/WAF | Cloudflare zone controls | human-gated production configuration |

## Environment isolation

At minimum: local, staging, production.

- Local uses Wrangler/local simulations and contains no production credentials.
- Staging uses distinct bindings/resources where data isolation matters.
- Production resources are not shared with preview/staging merely because Cloudflare supports remote bindings.
- Preview deployments must not share production D1/R2/queues/secrets unless a specific read-only test is explicitly authorized.

Resource names/ids are configuration, not source-level authority.

## Deployment

1. CI builds/tests/dry-runs without production credentials.
2. A candidate Worker version is uploaded only after the production gate permits it.
3. Production promotion is human-gated.
4. Record Worker version/deployment id and git SHA.
5. Storage migrations/backups are separate from Worker version rollback: Worker versions do not version D1/R2/DO state.
6. Prefer staged/gradual deployment where useful; rollback code to a known version and data through the separately tested recovery procedure.

## Marketing-site migration

GitHub Pages remains the current serving path until a dedicated migration task proves:

- Cloudflare Worker static build equals the accepted site content/routes/assets;
- custom domain/DNS/TLS plan is approved;
- canonical URLs, redirects, CSP/security headers, robots/sitemap, and analytics/no-analytics posture are preserved;
- preview/staging route exists;
- rollback to the prior serving path is documented;
- no production DNS change occurs without operator approval.

After successful migration, GitHub remains CI/source only for the site.

## Data and recovery

D1 Time Travel is the primary short-horizon point-in-time recovery mechanism on supported production D1 storage. A restore drill must establish product RTO and confirm the actual recovery point objective across every authoritative store. R2/export may provide longer-lived backup artifacts when the retention design requires it.

Worker code/version rollback is not a database rollback.

## Future Cloudflare capabilities

These are available architectural options, not active dependencies:

| Capability | Bundle/status | Promotion condition |
|---|---|---|
| Workers AI | B12 RESEARCH | accepted model/privacy/qualification contract; never silently replaces v1 local OCR |
| Vectorize | B10/B12 SHADOW | accepted semantic/retrieval role; never semantic authority |
| Hyperdrive | future portability | external SQL requirement accepted; D1 inadequacy demonstrated |
| Queues / Workflows | B4 or future bundle | asynchronous/durable job requirement exceeds current Cron/direct handling |
| Analytics Engine | B4 optional | operational-telemetry need and privacy/redaction contract accepted |
| Durable Objects beyond limiter | bundle-specific | consistent coordination requirement demonstrated |

No future Cloudflare product becomes a dependency merely because it is available.

## Portability

Business/domain contracts remain independent of Cloudflare-specific APIs. Cloudflare adapters live at infrastructure boundaries. SQL migrations and exported contracts remain portable where practical. If a sponsor later requires another accredited environment, migration is a deployment/substrate project rather than a rewrite of zz code semantics.

## Acceptance

B4 Cloudflare Runtime is implementation-complete when:
- resource inventory and environment map are versioned;
- staging resources exist and smoke tests pass;
- secret/key procedures are documented and tested;
- D1 migration and restore drill pass;
- R2 lifecycle/access rules pass where R2 is used;
- Worker deploy/rollback is tested;
- marketing migration parity/rollback passes if that move is included;
- observability/redaction and budget guardrails are accepted;
- production deploy remains explicitly operator-authorized.
