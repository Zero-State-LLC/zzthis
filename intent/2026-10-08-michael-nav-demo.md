# Intent: Demo in the top menu, larger menu links

Author: Claude (working with Michael)
Date: 2026-10-08
Status: draft (accepted when Danny merges the PR that adds it)
Product: zzThis (`Zero-State-LLC/zzthis`)

## Proposed outcome

- The top menu adds **Demo** between Applications and About, matching the footer order. The Demo page marks it as the current page.
- Menu links are about 30% larger (`calc(var(--text-sm) * 1.3)`), keeping the header height the same (64px) [MICHAEL 2026-10-08: 25 to 33%, header height unchanged].
- The logo no longer shrinks (`.nav__mark { flex-shrink: 0 }`). The full menu still shows from 64rem; checked at 1024px with the logo intact and no overflow.

## Affected systems

`src/content/navigation.ts`, `src/pages/demo.astro`, `src/styles/b-base.css`, `tests/content.test.ts`.
