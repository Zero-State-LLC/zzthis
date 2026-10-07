# Intent: apply Michael's 2026-10-06 content changes (Home, About, Applications)

Author: Claude (working with Michael)
Date: 2026-10-06
Status: draft (accepted when Danny merges the PR that adds it)
Product: zzThis (`Zero-State-LLC/zzthis`)

This file records changes Michael already asked for. The site change is in the same PR.

## Problem / why now

Michael sent three change documents on 2026-10-06 (Home, About, Applications) ahead of the xTechSearch 10 submission on 2026-10-17. Applying them here saves Daniel's agent from reading the Word files and finding each spot. [verified: Michael's three .docx change lists, 2026-10-06]

## Proposed outcome

- Home: "Why the zz markers matter" and "zz- In any language -zz" use the specimen's monospace type and size; the first heading is orange, and the second is framed by orange zz markers.
- Home and Applications: the batched (wrapped) pallet moves to second place in Field logistics; Pack and ship moves ahead of the parcel photo.
- Applications: a new page intro (five kinds of use and three AI principles); a Field logistics paragraph on the planned structured profile and resolver design; clearer titles and captions for the no-device, batched-pallet, unreadable-barcode, and pack-and-ship panels; the super-identifier image shown at the same size as the photos above, with a new three-letter postage image beside it.
- About: new prototypes heading, label, and zzThat line; founder bio ending replaced as given; Daniel and Adam first among advisors; Adam's bio and headshot; new Hacker Dojo paragraph; captions for the four handwritten photos; new location line.
- Tests that pinned the old copy and order are updated to the new decisions.

## Affected users / systems

- Users: people reading Home, About, and Applications.
- Systems: `src/content/*`, `src/components/Anatomy.astro`, `src/styles/b-console.css`, two new images under `public/images/`, `tests/content.test.ts`, `tests/homeApps.test.ts`.

## Constraints

Product-true locks:

- Michael's wording, used as given where he supplied it [MICHAEL 2026-10-06].
- No em dash in site copy (Q62). No standalone capital ZZ in rendered text (`scripts/check-dist.mjs`): Michael's captions say "ZZ" and "(ZZ)"; they render as "zz" and "(zz)" so the check stays green. Changing that rule is Danny's call.
- The structured-profile paragraph describes the design as planned; it does not claim shipped behavior.

Non-goals:

- zzthing.com content (Michael: after 10/17).
- Replacing the framed-print photo or the carrier-logo image (flagged in the PR).

## Open questions

- Whether the site should allow capital ZZ now that Michael allows it in the protocol.
