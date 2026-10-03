# Intent: home page redesign

Author: Zero State agents (draft for human accept)
Date: 2026-10-03
Status: draft
Product: zzThis (`Zero-State-LLC/zzthis`)

This file is a proto-spec. It comes **before** specify.
The spec it would change is `specs/001-marketing-site` (visual system and Home layout). Do not skip to code.

## Problem / why now

The live home page is accessible and honest, but every section has the same shape: a numbered eyebrow, an H2, and a grid of equal cards, eight times over. Its central idea (a person writes a code by hand; a machine reads it) never happens on the page. [verified: Hallmark audit in `docs/redesign-2026-10-03/README.md`, live site checked 2026-10-03 at 320, 390, and 1440 px]

The site is the xTechSearch launch surface, so first impressions matter now. [assumed: xTechSearch timing per issue #11; confirm with Danny]

## Proposed outcome

Observable done (a stranger can check this without reading the chat):

- A direction is chosen from samples A (Tape), B (Resolver), and C (Hi-Vis Manifesto) in `docs/redesign-2026-10-03/`, or a named mix of them.
- `specs/001-marketing-site` records the chosen visual system and Home layout before any `src/` change.
- Home is rebuilt in `src/` to that spec, with copy still sourced from `src/content/` and every existing check (lint, typecheck, 100% coverage on `src/lib`, `check-dist.mjs`) green.

## Affected users / systems

- Users: xTechSearch visitors, possible investors, and collaborators (spec section 1).
- Systems: `src/pages/index.astro`, `src/components/`, `src/styles/`, and new `@fontsource` font packages.

## Constraints

Product-true locks (do not reopen in implement):

- Copy in `docs/SPEC.md` `copy:` blocks ships verbatim, including the H1's spaced hyphen.
- No capital-letter zz in site copy. Uppercase heading styles must exempt the brand name.
- Concept labels, "Demo · mock data", "Patent pending", and no unmeasured metrics, as in spec sections 1 and 3.1a.
- Fonts are self-hosted. The site makes no runtime requests to other origins.
- Exact-match resolving only, with no "did you mean" suggestions (issue #12).

Non-goals:

- Changing the code grammar, the resolver, or product behavior.
- Redesigning pages other than Home in this change stream. They follow once the system is chosen.

## Open questions

- Which direction, or which mix?
- Does Michael approve the new lines each sample adds (listed in the samples README, section 4)?
- Should the real handwritten photos move onto Home (sample A)? Should the proposed architecture be shown on Home, labelled "Proposal, not built" (sample B)?

## Claims

| Claim | Label |
|---|---|
| Home repeats one eyebrow + H2 + equal-card-grid section shape eight times | `[verified: src/pages/index.astro:70–140]` |
| The samples use only spec copy, plus the new lines listed in their README | `[verified: docs/redesign-2026-10-03/README.md section 4]` |
| All three samples pass WCAG AA text contrast in light and dark | `[verified: computed in headless Chromium, 2026-10-03]` |
| None of the samples scrolls horizontally from 320 to 1440 px | `[verified: headless Chromium at 320, 375, 390, 414, 768, and 1440 px]` |

## Next

A human accepts this file (`Status: accepted`) and names a direction. Then specify the change in spec 001. Do not implement from this file alone.
