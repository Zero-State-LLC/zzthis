# Plan: zzThis marketing site and scripted demo

Feature: [spec.md](spec.md). Status: implemented on `main` (OBSERVED 2026-10-02, 40dfa3b).

This plan records how the site is built. The detailed engineering rules stay in [`docs/SPEC.md` Sections 5 and 6](../../docs/SPEC.md#6-stack-repo-layout-and-engineering-rules), which this plan adopts without change.

## Workflows (copied from the spec)

anti-slop-code, production-systems, google-developer-style; stop-slop for copy edits. CI: `ci.yml` (required `build`), `site-ci.yml`, `free-security-scan.yml`, `pages.yml`.

## Technical context

| Item | Choice | Status |
|---|---|---|
| Framework | Astro, static output, `site` `https://zzthis.com`, base `/` (`ASTRO_BASE` overrides; `/zzthis/` before the cutover, issue #6) | OBSERVED (`astro.config.mjs`) |
| Language | TypeScript strict, `noUncheckedIndexedAccess`, no `any` | OBSERVED (`tsconfig.json`, `eslint.config.js`) |
| Runtime for tooling | Node 24 | OBSERVED (CI) |
| Content | Typed objects in `src/content/*.ts` | OBSERVED |
| Styling | Direction B tokens in `src/styles/tokens.css` (OKLCH field instrument). Legacy token names alias them. Home, About, and Applications use the B layout CSS. Other pages keep their components. | Direction B, Section 3.1b |
| Fonts | IBM Plex Sans, Plex Sans Condensed, Plex Mono, and Hebrew through `@fontsource`. Korean and Japanese are committed woff2 glyph subsets. All self-hosted | Direction B |
| Client JavaScript | `/demo` island, plus the Home console island. Neither uses the network, camera, microphone, or storage. | FR-011, FR-020 |
| Tests | Vitest, 100% line and branch coverage on `src/lib/**` and `src/demo/demoMachine.ts` | OBSERVED (`vitest.config.ts`) |
| Build checks | `scripts/check-dist.mjs`: required pages, one H1, heading order, base-path links, banned phrases and unmeasured performance figures, em dash rule, footer notice, banned browser APIs, size budgets | OBSERVED |
| Hosting | GitHub Pages through `pages.yml` on push to `main`; custom domain zzthis.com set in Settings > Pages (no `CNAME` file for an Actions-built site), live once DNS and the custom domain are set | OBSERVED (Pages); zzthis.com pending issue #6 |

## Constitution check

| Principle | How the site meets it |
|---|---|
| III. Exact match, no live-code hints | Met by T010 (issue #12) on `/demo`, and by FR-020 on the Home console. A miss shows no other code. |
| IV. Honest status | `check-dist.mjs` blocks unmeasured performance figures and claim phrases; concept labels on panels. |
| VI. Public repo hygiene | `scripts/security-scan.sh` in CI. Research targets and pitch-only text were removed (Q24). |
| VII. Workflows in the spec | `spec.md` has `## Workflows`. |

## Structure

```
src/pages/        one file per route, plus 404.astro
src/components/   cards, steps, series, labels, header, footer, theme toggle
src/content/      all copy and image metadata (typed)
src/demo/         demo island: state machine and renderers
src/console/      Home console island (uses src/lib grammar and resolver)
src/lib/          grammar parser, demo resolver mock, other-script note, image and URL helpers
src/styles/       tokens.css, base.css
tests/            Vitest suites
scripts/          check-dist.mjs, security-scan.sh, check-agents-md.sh
```

## Risks

- The demo resolver mock taught a "did you mean" pattern that the real resolver must never use (constitution III). Removed by T010; `scripts/check-dist.mjs` now fails the build if the phrase returns.
- The demo grammar parser (`src/lib/grammar.ts`) is demo-only and INFERRED. It must not become the product grammar without spec 003.
