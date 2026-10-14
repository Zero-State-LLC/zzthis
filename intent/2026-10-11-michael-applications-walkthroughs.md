# Intent: two clickable walkthroughs on the Applications page

Author: Claude (working with Michael)
Date: 2026-10-11
Status: draft (accepted when Danny merges the PR that adds it)
Product: zzThis (`Zero-State-LLC/zzthis`)

## Problem / why now

Michael wants two new five-image walkthroughs on the Applications page, between Field logistics and Postal and parcel: the pallet set made on 2026-10-10 and a new household set made on 2026-10-11. The pallet patch sent on 2026-10-10 was not merged, so this one change carries both. [verified: Michael, 2026-10-11]

## Proposed outcome

- Applications: a new block after Field logistics with two walkthroughs, side by side on wide screens and stacked on phones (pallet first).
  - "Smart force-multiplier automation" (pallet): lead, explainer, five images.
  - "Smart packing and handling" (household): lead, explainer, five images.
- Each walkthrough, top to bottom: header, bold lead, explainer, a row of five thumbnails, then the large image. Michael: no explainer under the large image; the caption text is in the images.
- Thumbnails are about 3/8 inch (36px) high, and all five fit on one row on a small phone with room at the sides. They shrink together on the narrowest screens.
- Viewers can tap a thumbnail, use the previous and next buttons, swipe, or use the arrow keys. A "2 / 5 · Generator" counter shows the position. Without JavaScript the large image is still a swipeable strip.
- The jump links at the top of the page list the two walkthroughs right after Field logistics.
- The household images carry the zzthat badge (Michael's lowercase logo, orange zz, teal that); the pallet images keep the zzthis badge.

## Constraints

- Michael's wording is used as given [MICHAEL 2026-10-11]; no em dash.
- Copy lives in `src/content/walkthroughs.ts`, not in the page.
- No browser storage (check-dist).
- Blockchain and ledger lines are stated as options ("can be"), consistent with the Field logistics paragraph.

Non-goals:

- No change to the existing application sections, the home page, or `applications.ts`.
- Daniel's consumer video is not used here (Michael, 2026-10-11).

## Affected users / systems

`src/content/walkthroughs.ts` (new), `src/components/Walkthroughs.astro` (new), `src/pages/applications.astro`, `public/images/walkthroughs/` (10 images, 10 thumbnails, WebP), `tests/content.test.ts` (adds the new module to the hygiene checks and two tests).

## Open questions

- None blocking. Michael may adjust image text later; the images are files under `public/images/walkthroughs/`.

## Claims

| Claim | Label |
|---|---|
| Both walkthrough texts and the image captions are Michael's final wording | `[verified: Michael, chat 2026-10-11]` |
| The 2026-10-10 pallet patch is not live | `[verified: Michael, 2026-10-11]` |

## Next

Danny reviews and merges. Merging the PR that adds this file accepts it.
