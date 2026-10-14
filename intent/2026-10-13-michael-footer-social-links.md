# Intent: footer social links grouped by brand

Author: Claude (working with Michael)
Date: 2026-10-13
Status: draft (accepted when Danny merges the PR that adds it)
Product: zzThis (`Zero-State-LLC/zzthis`)

## Problem / why now

Michael set up the brand social accounts on 2026-10-12 and 2026-10-13 and wants them in the site footer, grouped by brand. [verified: Michael's account tracker, zz-social-accounts-2026-10-12-v2-cd.xlsx, status column]

## Proposed outcome

- Footer, every page: a zzThis group (zzthis logo, then its links) followed by a zzThat group (zzthat logo, then its links).
- zzThis: Twitter (twitter.com/zzthiscom), LinkedIn (linkedin.com/company/zzthis), YouTube (@zzthiscom), Telegram (t.me/zzthisapp).
- zzThat: Twitter (twitter.com/zzthatcom), Instagram (@zzthatcom), TikTok (@zzthatcom), YouTube (@zzthat), Discord (existing invite), Telegram (t.me/zzthat).
- Twitter uses the classic bird icon and twitter.com addresses, not the X mark (Michael's preference).
- The zzthis footer logo follows the theme (dark and light versions), like the header.

## Constraints

- Icons are inline SVG; no third-party requests.
- Not added yet: Reddit (communities not confirmed), Bluesky (Michael: not important for now), Threads (same handle as Instagram).

## Affected users / systems

`src/content/navigation.ts`, `src/components/Footer.astro`, `src/styles/b-bands.css`, `tests/content.test.ts`.

## Claims

| Claim | Label |
|---|---|
| The handles above are the accounts Michael created | `[verified: Michael's tracker, 2026-10-13]` |
| zzThis YouTube handle is @zzthiscom | `[verified: Michael's tracker note; confirm before merge]` |

## Next

Danny reviews and merges. Merging the PR that adds this file accepts it.
