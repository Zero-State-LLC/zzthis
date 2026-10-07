# Marketing site Cloudflare cutover runbook

Bundle: B4/B5. Status: marketing staging smoke check passed; route-parity and rollback evidence remain. No production DNS change is authorized by this file.

## Build and parity

1. Build the accepted site from the same commit.
2. Run existing dist/content checks.
3. Dry-run the Worker static-assets bundle with the staging-only Wrangler config.
4. Deploy to a non-production workers.dev/staging route only after operator authorization.
5. Compare every required route, asset, responsive layout, canonical URL, sitemap/robots behavior, CSP/security headers, and no-runtime-third-party-request invariant with the accepted GitHub Pages build.
6. Record git SHA and Worker version/deployment id.

## Recorded staging checkpoint (2026-10-07)

- Source: `b2350d47b67bcb4e5d1a8ed19354d92d3840596c`; [GitHub Actions run 37550094879](https://github.com/Zero-State-LLC/zzthis/actions/runs/37550094879).
- Worker: `zzthis-site-staging`; version `8da9a4ff-2e80-46c3-aec2-76c08edd5191`; workers.dev URL only.
- Basic behavior: root returned HTTP 200 and an unknown route returned HTTP 404.
- Still required: explicit route/asset/header comparison against the accepted GitHub Pages surface and a recorded Worker-version rollback rehearsal. Neither is a production cutover.

## Cutover prerequisites

- Site reconciliation is merged or explicitly superseded.
- Staging parity passes.
- Production custom-domain target and redirect behavior are approved.
- Canonical URL/base-path changes are implemented/tested. Current Astro config is GitHub-Pages-specific and must not be reused blindly for a root custom domain.
- Rollback target remains deployable.
- Operator approves DNS/domain/deploy.

## Cutover

Use approved Cloudflare domain/route configuration. Do not delete the previous serving path in the same change. Verify TLS, redirects, routes, assets, security headers, and external-link behavior after propagation.

## Rollback

If parity/security/routing checks fail, remove/disable the new production route/custom-domain binding and restore the prior serving path. Code rollback uses the recorded Worker version; DNS rollback follows the approved prior record/route. Worker rollback is not data rollback.

## After cutover

Update Astro canonical site/base configuration, README/deploy docs, monitoring, and the B4 resource inventory to observed production values. Only then retire GitHub Pages as runtime.
