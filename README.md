# zzThis site

This repository holds the zzThis marketing site and a scripted click-through
demo. It is a static Astro site published on GitHub Pages at
https://zero-state-llc.github.io/zzthis/.

The demo uses mock data only. It runs no recognition, makes no network
requests, uses no camera or microphone, and stores nothing.

## Requirements

- Node 24 (CI uses Node 24; Node 22.12 or later also works).
- npm.

## Commands

```sh
npm ci              # install exact versions from package-lock.json
npm run dev         # start the dev server
npm run lint        # ESLint and Prettier check
npm run typecheck   # astro check and tsc --noEmit
npm run test        # Vitest with enforced 100% coverage on src/lib and the demo state machine
npm run build       # build to dist/ and run scripts/check-dist.mjs
npm run preview     # serve dist/ locally
```

## Base path

The site is served under `/zzthis/`. `astro.config.mjs` sets
`base: '/zzthis/'`, and every internal link and asset URL goes through
`src/lib/url.ts`, which joins `import.meta.env.BASE_URL` with a relative path.
Do not write root-absolute paths such as `/images/...` or `/demo`.

`npm run build` runs `scripts/check-dist.mjs` after the Astro build. The check
fails on root-absolute links and on other spec checks against `dist/`.

To verify the base path locally, run `npm run build && npm run preview`, then
open http://localhost:4321/zzthis/.

## Project layout

- `src/pages/`: one file per route, plus `404.astro`.
- `src/components/`: shared Astro components.
- `src/content/*.ts`: all copy and image metadata. This is the single source of
  truth; edit copy here, not in pages.
- `src/lib/`: code grammar, resolver mock, and URL helper.
- `src/demo/`: the demo state machine and its browser island.
- `src/styles/`: design tokens and base styles.
- `tests/`: Vitest suites.
- `public/images/`: optimized WebP images.

## Deploying

`.github/workflows/pages.yml` deploys to GitHub Pages only after a push to
`main` or a manual workflow dispatch. Pull requests never deploy. The operator
enables Pages in the repository settings.

`.github/workflows/ci.yml` runs the required `build` check (lint and build).
`.github/workflows/site-ci.yml` runs typecheck and tests on pull requests.

## Documentation

- `docs/SPEC.md`: the source of truth for content, layout, and behavior.
- `docs/BUILD-BRIEF.md`: build constraints and the definition of done.
- `docs/ASSETS.md`: image paths and the panels they map to.
