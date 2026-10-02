## Goal
Build the zzThis marketing site and scripted click-through demo as a static Astro site for GitHub Pages, per `docs/SPEC.md`, and open a DRAFT PR into `main`.

## Start here
- Branch from `assets` (already on origin; based on current `main` b6e94e1). It contains:
  - `docs/SPEC.md`: the full spec (Opus 5.5, with source citations). It is the source of truth. Follow its sections 3 (site), 3.1a (layout from wireframes), 4 (demo), 5 (visual system), 6 (stack + Pages), 8 (acceptance criteria).
  - `docs/ASSETS.md`: every image path and the brief panel (a–o) it maps to.
  - `docs/wireframes/wireframes-page-1..7.webp`: Michael Chung's wireframes, the LAYOUT SOURCE (pages 1–3 mobile Home in 3 scroll segments, 4–5 desktop Home in 2 segments, 6–7 About). Open and follow them. Reference only; do not ship them in the site.
  - `public/images/**`: optimized WebP panels, demo frames, real handwritten photos, logos (light/dark).
- Work branch: `feat/site-and-demo` (from `assets`). PR base: `main`. Mark the PR DRAFT.
- Implementation is authorized by the operator (Danny, 2026-10-01 PT); `docs/SPEC.md` is the spec stage AGENTS.md asks for. Do not edit `intent/` status.

## Constraints (hard)
- Astro, `output: 'static'`, `site: 'https://zero-state-llc.github.io'`, `base: '/zzthis/'`. Every internal link and asset URL goes through `import.meta.env.BASE_URL` (helper `src/lib/url.ts`). No root-absolute `/images/...` or `/demo` in source or `dist/`.
- Add `.github/workflows/pages.yml`: on `push` to `main` + `workflow_dispatch`; permissions `pages: write`, `id-token: write`, `contents: read`; concurrency `pages`; Node 24; `npm ci`, `npm run build`; `actions/configure-pages`, `actions/upload-pages-artifact` (path `dist`), `actions/deploy-pages`. PRs never deploy.
- Do NOT edit or duplicate `.github/workflows/ci.yml` (job `build`, the required check: AGENTS.md check, Node 24, `npm ci`, then `npm run lint` and `npm run build`). Both scripts must pass. Commit `package-lock.json`. Optional `site-ci.yml` for typecheck + test only.
- `src/pages/404.astro` → `dist/404.html`. No service worker, no analytics, no runtime requests to other origins. IBM Plex Sans + Plex Mono self-hosted via `@fontsource`.
- Visual system (spec §5): charcoal/cream, light AND dark (respect `prefers-color-scheme` + toggle), one sparing accent = zzThis brand orange from the logo (~#F85000), cut lower-right corner cards with fine edge and separate floating shadow, equal footprints per series, thin construction lines, golden ratio 1:1.618 for hero split/card aspect/spacing where it does not break responsive layout. Check 320/390/900/1440 px; contrast ≥ 4.5:1.
- Copy: use spec copy verbatim (it is cited to Michael's brief and wireframes). No em dashes in rendered copy (hero uses the comma default, spec Q1). Never present NSF Phase I numbers as results; do not publish them at launch (Q7). No claims of pilots, customers, endorsement, or adoption. Do not quote private source documents on the site. Panel images are concept renderings: one concept label per page per spec §3.1a; handwritten photos are real.
- Advisors: Patrick Muggler, Arshi Chadha, Ridham Bhagat, Daniel Meyer, plus a Future space card. Jim White is removed. Initials cards, no portraits, no LinkedIn scraping.
- Demo `/demo` (spec §4): fully scripted, no camera, no fetch, no storage, mock data only, "Demo · mock data" badge on every step. Flow A crate → photo → detected code + checksum → linked record → AI-suggested handling (tap or simulated voice chip) → prepared turn-in form for REVIEW (nothing submits). Flow B typed resolver lookup: resolve / did-you-mean + confirm / abstain. Keyboard and screen reader operable; reduced motion respected.
- Code quality (anti-slop-code): TypeScript strict, zero `any`, files < 500 lines, functions under complexity 22, no dead code. Vitest with 100% line+branch coverage on `src/lib/*` (grammar, resolver mock, url) and the demo state machine. ESLint + Prettier. Do not disable lint rules to pass.
- Repo lean: images ≤ 15 MB, no file > 2 MB. Never add private source documents, the original PNGs, or any password/token.
- README: what it is, `npm ci`, `npm run dev|lint|test|build`, base-path note, Pages deploy note (deploys only after merge; enabling Pages is done by the operator).

## Out of scope
Custom domain/DNS, Vercel, real recognition/resolver/backend, analytics, the technology page (typed stub only, unlinked), founder history page, merging, enabling Pages.

## Done when
- DRAFT PR from `feat/site-and-demo` to `main` is open, required `build` check green, all spec §8 criteria addressed (list any you could not verify in the PR body, with reason).
- PR body: summary, screenshots at 390 and 1440 px in light and dark (Home, About, demo step A5), how base path was verified (`npm run build && npx astro preview` under `/zzthis/`), and open questions from spec §9.

## Do not
Push to `main`, merge, deploy, enable Pages, touch DNS/domains, weaken CI or tests, invent copy or product behavior beyond the spec.

## Workflows (from spec §7)
anti-slop-code, production-systems, google-developer-style, frontend-inspiration-lock (HANCORE principles only), stop-slop (copy).
