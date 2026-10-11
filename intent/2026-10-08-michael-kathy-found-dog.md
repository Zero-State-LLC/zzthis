# Intent: About, zz-Kathy-found-dog-zz image set and zzPage note

Author: Claude (working with Michael)
Date: 2026-10-08 (v2, with Michael's second mark-up the same evening)
Status: draft (accepted when Danny merges the PR that adds it)
Product: zzThis (`Zero-State-LLC/zzthis`)

## Proposed outcome

- Under the four real photos in "Codes written by hand" on About, a set of three images in Michael's order [MICHAEL 2026-10-08]: the zz-Kathy-found-dog-zz card with the plush corgi; a phone that scanned it, showing "Record found" and zzpage.com/zz/Kathy-found-dog; the card on a store community board beside the phone. (The middle image comes after the board in the story; Michael chose this order for phones and progressive viewing.)
- One explainer under the set (on phones, under the last image):
  - "Concept images. zz-code words, hand printed, for any thing or object. Then scanned, and more."
  - "Every zz-code can optionally have its own zzPage (here, zzpage.com/zz/Kathy-found-dog), hosted by zzThis or in the user's own cloud storage: Google Drive or Docs, OneDrive, Dropbox, iCloud, or Box." [MICHAEL 2026-10-08; Michael owns zzpage.com]
- The set is about 2/3 the height of the photos above [MICHAEL 2026-10-08: not too large], at every width. Checked: 248px vs 373px at 1280px; 192px vs 287px at 1024px (one row); 152px vs 228px at 390px (two rows).
- All three are concept images (status `concept`), labeled as such, since the section label above says "Real photos". The zzPage address is plain text, not a link.

## Affected systems

`public/images/handwritten/hw-kathy-found-dog.webp`, `hw-kathy-phone.webp`, `hw-kathy-board-phone.webp`, `src/content/images.ts`, `src/content/contact.ts`, `src/pages/about.astro`, `src/styles/b-about.css`.

## Checks

lint, typecheck, test and build (check-dist) pass. Independent of PR #125.
