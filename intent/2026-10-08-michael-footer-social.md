# Intent: Footer social icons; Omer removed for now

Author: Claude (working with Michael)
Date: 2026-10-08
Status: draft (accepted when Danny merges the PR that adds it)
Product: zzThis (`Zero-State-LLC/zzthis`)

## Proposed outcome

- **About:** Omer F. Yalcin's advisor card and photo are removed until his employer gives permission [MICHAEL 2026-10-08]. Restore the entry and photo from #118 when it does.
- **Every page's footer** gets small, discreet icon links between the page links and the notice [MICHAEL 2026-10-08]:
  - X for zzThis: `https://x.com/zzthisapp`.
  - A small zzthat wordmark (the lowercase logo already used on About), followed by zzThat's Discord (`https://discord.gg/sp7smSzq7`, a permanent invite) and Instagram (`https://www.instagram.com/zzthatcom/`). Only X belongs to zzThis; Discord and Instagram belong to zzThat.
- Icons are inline SVG (no third-party requests), 18px, in 44px tap targets, muted ink that brightens on hover and focus, with accessible names. A link left empty in `navigation.ts` is not shown.

## Affected systems

`src/content/people.ts`, `public/images/people/omer-yalcin.webp` (deleted), `src/content/navigation.ts`, `src/content/contact.ts` (exports `zzthatLogo`), `src/components/Footer.astro`, `src/styles/b-bands.css`, `tests/content.test.ts`.

## Checks

lint, typecheck, test and build (check-dist) pass. Footer checked in dark and light at 1280px and at 390px.
