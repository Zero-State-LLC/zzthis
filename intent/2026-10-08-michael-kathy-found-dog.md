# Intent: About, zz-Kathy-found-dog-zz image pair

Author: Claude (working with Michael)
Date: 2026-10-08
Status: draft (accepted when Danny merges the PR that adds it)
Product: zzThis (`Zero-State-LLC/zzthis`)

## Proposed outcome

- Under the four real photos in "Codes written by hand" on About, a pair of images [MICHAEL 2026-10-08]: the zz-Kathy-found-dog-zz card with the plush corgi, then the same card pinned on a store community board.
- One explainer spans both: "Concept images. zz-code words, hand printed, for any thing or object. Then scanned, and more." On phones it sits under the second image.
- The pair is about 2/3 the height of the photos above [MICHAEL 2026-10-08: not too large], at every width (2 columns on phones, 4 from 64rem). Checked: 248px vs 373px at 1280px; 152px vs 228px at 390px.
- Both images are concept images (status `concept`), labeled as such, since the section label above says "Real photos".

## Affected systems

`public/images/handwritten/hw-kathy-found-dog.webp`, `public/images/handwritten/hw-kathy-community-board.webp`, `src/content/images.ts`, `src/content/contact.ts`, `src/pages/about.astro`, `src/styles/b-about.css`.

## Checks

lint, typecheck, test and build (check-dist) pass. Independent of PR #125.
