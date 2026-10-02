# Plan: zzThis marketing site and scripted demo

Feature: [spec.md](spec.md). Status: implemented on `main` (OBSERVED 2026-10-02, 40dfa3b).

This plan records how the site is built. The detailed engineering rules stay in [`docs/SPEC.md` Sections 5 and 6](../../docs/SPEC.md#6-stack-repo-layout-and-engineering-rules), which this plan adopts without change.

## Workflows (copied from the spec)

anti-slop-code, production-systems, google-developer-style; stop-slop for copy edits. CI: `ci.yml` (required `build`), `site-ci.yml`, `free-security-scan.yml`, `pages.yml`.

## Technical context

| Item | Choice | Status |
|---|---|---|
| Framework | Astro, static output, base `/zzthis/` | OBSERVED (`astro.config.mjs`) |
| Language | TypeScript strict, `noUncheckedIndexedAccess`, no `any` | OBSERVED (`tsconfig.json`, `eslint.config.js`) |
| Runtime for tooling | Node 24 | OBSERVED (CI) |
| Client JavaScript | One island for `/demo` only | OBSERVED (`src/demo/`) |
| Content | Typed objects in `src/content/*.ts` | OBSERVED |
| Styling | CSS tokens in `src/styles/tokens.css`, base rules in `src/styles/base.css` | OBSERVED |
| Fonts | IBM Plex Sans and Plex Mono through `@fontsource`, self-hosted | OBSERVED (`package.json`) |
| Tests | Vitest, 100% line and branch coverage on `src/lib/**` and `src/demo/demoMachine.ts` | OBSERVED (`vitest.config.ts`) |
| Build checks | `scripts/check-dist.mjs`: required pages, one H1, heading order, base-path links, banned phrases and NSF figures, em dash rule, footer notice, banned browser APIs, size budgets | OBSERVED |
| Hosting | GitHub Pages through `pages.yml` on push to `main` | OBSERVED |

## Constitution check

| Principle | How the site meets it |
|---|---|
| III. Exact match, no live-code hints | Not met yet. Flow B suggests nearby codes. Tracked by issue #12 and T010. |
| IV. Honest status | `check-dist.mjs` blocks NSF figures and claim phrases; concept labels on panels. |
| VI. Public repo hygiene | `scripts/security-scan.sh` in CI. NSF-derived text in `docs/SPEC.md` is flagged for review (see `specs/analysis-2026-10-02.md`). |
| VII. Workflows in the spec | `spec.md` has `## Workflows`. |

## Structure

```
src/pages/        one file per route, plus 404.astro
src/components/   cards, steps, series, labels, header, footer, theme toggle
src/content/      all copy and image metadata (typed)
src/demo/         demo island: state machine and renderers
src/lib/          grammar parser, demo resolver mock, image and URL helpers
src/styles/       tokens.css, base.css
tests/            Vitest suites
scripts/          check-dist.mjs, security-scan.sh, check-agents-md.sh
```

## Risks

- The demo resolver mock teaches a "did you mean" pattern that the real resolver must never use (constitution III). Mitigation: T010.
- The demo grammar parser (`src/lib/grammar.ts`) is demo-only and INFERRED. It must not become the product grammar without spec 003.
