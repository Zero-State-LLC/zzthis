# Intent: serve the marketing site from the root of zzthis.com (#6)

Author: Grok Bot (for Danny)
Date: 2026-10-08
Status: draft (accepted when Danny merges the PR that adds it)
Product: zzThis (`Zero-State-LLC/zzthis`)

## Problem / why now

The site is built for the GitHub Pages project path `https://zero-state-llc.github.io/zzthis/`. Danny said yes to the domain flip on 2026-10-08 (issue #6), and Michael is setting the DNS records at the registrar: apex `A` and `AAAA` to the GitHub Pages addresses, `www` as a `CNAME` to `zero-state-llc.github.io`. Once Danny sets the Pages custom domain, the project-path build would load its assets from `/zzthis/...` on zzthis.com, where they do not exist. [verified: `astro.config.mjs` on `main` at f78edb6]

## Proposed outcome

- `astro.config.mjs` sets `site` to `https://zzthis.com` and the default `base` to `/`. `ASTRO_BASE` still overrides the base, and the Cloudflare staging workflows keep setting `ASTRO_BASE=/`.
- `npm run build` emits root paths such as `/_astro/...`; `scripts/check-dist.mjs` fails on a leftover `/zzthis/` path or a link to `zero-state-llc.github.io`.
- README, `docs/SPEC.md`, spec 001, and the board mirror say the site lives at zzthis.com once DNS and the Pages custom domain are set.
- After the cutover: `https://zzthis.com/` serves Home over HTTPS, and `www.zzthis.com` and `zero-state-llc.github.io/zzthis/` redirect to it.

## Constraints

- The PR stays a draft until DNS is live and the Pages custom domain is set. Danny merges it; agents do not merge, change repo settings, or change the Pages custom domain.
- No `CNAME` file: GitHub ignores it for Actions-built Pages sites; the custom domain lives in Settings > Pages.
- No change to `apps/web`, the `/v1` Worker, or the Cloudflare runtime.

Non-goals:

- Moving the marketing site to Cloudflare (`docs/cloudflare-site-cutover.md` still governs that).
- The web client domain (`zz.zer0state.com`, spec 005 FR-029).

## Affected users / systems

- Users: visitors with old `zero-state-llc.github.io/zzthis/` links (redirected by GitHub after the cutover).
- Systems: `astro.config.mjs`, `scripts/check-dist.mjs`, `pages.yml` output (unchanged workflow), GitHub Pages settings (by Danny), DNS at the registrar (by Michael).
