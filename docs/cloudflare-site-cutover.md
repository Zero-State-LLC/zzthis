# Marketing site Cloudflare cutover runbook

Bundle: B4/B5. Status: marketing staging rollback rehearsal passed; route-parity and security review remain partial. No production DNS change is authorized by this file.

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
- Still required: explicit route/asset/header comparison against the accepted GitHub Pages surface. The staging Worker-version rollback rehearsal is recorded below; neither parity testing nor rollback evidence is a production cutover.

## Parity checkpoint (2026-10-07)

- Compared `/`, `/about/`, `/applications/`, `/contact/`, `/demo/`, and `/how-it-works/`: all returned HTTP 200 on both the staging Worker and GitHub Pages. All 137 page-local asset references checked on each surface returned HTTP 200. An unknown route returned HTTP 404 on both.
- Live source/bundle recheck (2026-10-07): all six routes returned HTTP 200 on both surfaces with matching titles and H1s. Root/demo CSS and JavaScript assets plus the shared resolver module returned HTTP 200; CSS and JS contents matched after normalizing GitHub Pages' `/zzthis/` base path to the Worker's `/` path. The CSS bundles contain the same 39 responsive media queries. The inspected HTML and bundles had no external script/stylesheet references or network-request primitives; the demo's `zzthing.com` and `zzthat.com` links are user navigation. This is static inspection, not a browser network trace or a visual overflow check; mobile/desktop layout remains unverified.
- Normalized live HTTP recheck (2026-10-07 05:32 UTC): GitHub Pages was serving `main` at `25b4e2a5266f2056d782756261e07e61bffea3ab`; the staging Worker was serving version `8da9a4ff-2e80-46c3-aec2-76c08edd5191` via rollback deployment `433dfe1f-b66d-4e59-9f7d-e4e0faccc0f3`. With the Pages base path preserved as `/zzthis/`, `/`, `/applications/`, `/about/`, `/how-it-works/`, `/contact/`, and `/demo/` all returned HTTP 200 on both hosts. A reproducible same-origin asset pass counted 93 HTML asset-reference occurrences and 51 deduplicated direct assets; following local CSS `url()` dependencies produced 71 unique assets total. All 71 returned 2xx on each host, with no failures. The earlier 137-reference figure is retained as a separate prior check because its extraction scope was not recorded; do not compare it directly with these defined counts.
- Header recheck at the same checkpoint: staging `/robots.txt` returned 200 while Pages returned 404; `/sitemap-index.xml` returned 404 on both; Pages sent HSTS (`max-age=31556952`) and staging sent no HSTS; CSP was absent on both. This HTTP/asset check does not replace browser visual, responsive, or runtime-network review.
- Visual/mobile checkpoint (2026-10-07): compared the currently served staging Worker with the current Pages baseline at a 390×844 viewport on `/`, `/applications/`, `/how-it-works/`, `/about/`, `/contact/`, and `/demo/`. Rendered content/layout matched on the inspected pages; each had `scrollWidth=390` and the expected responsive viewport meta, with no browser console errors. Separately, Flow A advanced from Intro to Mark and Photo via the explicitly simulated, prewritten controls on both surfaces; no camera capture or external submission occurred. This does **not** verify PR #91: staging was not deployed from that branch, and the currently served Pages baseline is not the final post-#91 baseline. Final marketing parity stays open until #91 is accepted, its candidate is staged, and these comparisons are repeated. This remains distinct from a full runtime-network trace.
- Clef visual and Browser Run resource checkpoint: compared paired 390×844 screenshots for all six required routes against the currently served Pages baseline. Clef judged each pair equivalent (confidence: home 0.898, applications 0.888, how-it-works 0.881, about 0.867, contact 0.840, demo 0.913). Browser Run post-load resource inventories found no external origins on either host; same-origin resource counts were staging/Pages: home 15/15, applications 14/13, about 11/10, how-it-works 14/10, contact 8/8, demo 12/12. This is a bounded initial-load audit, not a complete request trace across interactions, redirects, or all viewport states. It checks the older currently served content only, not PR #91.
- The `/robots.txt` difference is confirmed to be Cloudflare-generated platform behavior on the staging workers.dev hostname, not an app-provided static asset; do not override it merely to imitate Pages' 404. The staging response remains a documented platform-specific difference. HSTS remains an actionable mismatch: Pages returns `Strict-Transport-Security: max-age=31556952`, while the staging Worker does not. CSP, X-Content-Type-Options, Referrer-Policy, and Permissions-Policy remain absent on both in the checked responses.
- The root HTML contains no third-party `src`/`href` hosts. This is not a complete runtime-network audit of every script or responsive browser rendering.
- Parity is **partial, not passed**: the current six-route visual comparison and bounded initial-load resource inventory are recorded above, but they are not against the final post-#91 baseline and are not a complete interactive network trace. `/robots.txt` differs due to Cloudflare-generated staging-host behavior; `/sitemap-index.xml` is 404 on both. HSTS remains absent on staging while present on Pages; the other checked security headers are absent on both. Review/resolve the HSTS mismatch and repeat checks after #91 is accepted and staged before any cutover.
- Rollback rehearsal (2026-10-07): [main-only staging workflow run 37566504258](https://github.com/Zero-State-LLC/zzthis/actions/runs/37566504258) passed lint, typecheck, tests, build, security scan, and dry run before deploying from `main` at `bf891bddc1d60a05f7d5af9cd158770250d95035`. It created version `4523a9db-9579-42c7-9afb-75e715985cee` and deployment `ccedc99f-acaa-457a-a2ec-e4be2cf8347b` at 100%; the staging root returned HTTP 200 and an unknown path HTTP 404. Wrangler then rolled the staging Worker back to prior version `8da9a4ff-2e80-46c3-aec2-76c08edd5191`, creating deployment `433dfe1f-b66d-4e59-9f7d-e4e0faccc0f3` at 100%. Post-rollback root/unknown-route checks remained 200/404. This verifies staging code deployment rollback, not resource-data rollback or marketing parity.
- These checks do not authorize production DNS, custom domains, routes, or deployment.

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
