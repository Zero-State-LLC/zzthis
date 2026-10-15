# Intent: new home page top (hero and consumer how-it-works)

Author: Claude (working with Michael)
Date: 2026-10-14
Status: draft (accepted when Danny merges the PR that adds it)
Product: zzThis (`Zero-State-LLC/zzthis`)

## Problem / why now

First-time visitors, mostly on mobile, were not grasping what zzThis is from the current hero. Michael wants them to get it within the first screen and one swipe. [verified: Michael, 2026-10-14]

## Proposed outcome

Hero, in order [MICHAEL 2026-10-14]:

- Eyebrow: "The next evolution of the barcode".
- Headline: "A barcode/QR code you can write by hand".
- Sub-headline: the barcode/QR comparison with `zz-Kathy-found-dog-zz` set in mono and accent orange.
- The two hero buttons stay, right under the sub-headline, now with How it works first (primary) and See field logistics second [MICHAEL 2026-10-15, at Danny's request].
- Two photos: the Kathy cork-board polaroid and the phone showing "Record found" (new assets under `public/images/hero/`).
- Hero body: the roadmap caveats (typed-only prototype, camera in v1, voice later) are removed; the paragraph now ends "zzThis makes things readable-writable-smart."

New section right under the hero: "How it works - consumer" [MICHAEL 2026-10-14]:

- Eyebrow "Physical-to-digital addressing"; headline "Skip the printer. Grab a marker." (Michael wrote "Ditch the printer" and asked for a less casual verb; swap back if preferred).
- His protocol sub-headline, the lead line, and the three steps (Create it / Write it / Look it up). No button in this block [MICHAEL 2026-10-15].

The home "How it works" section heading becomes "How it works - field" to distinguish the two. The rest of the page is unchanged, same sequence.

## Constraints and flags for Danny

- The hero no longer states that the prototype is typed-lookup only; the sub-headline and steps say "scan". Michael chose to move caveats off the top of the page. If a Status/Roadmap note is still wanted lower on the page, that is a follow-up.
- "highly secure" in the consumer sub-headline is Michael's wording.
- No em dash; spaced hyphens used. Copy lives in `src/content/hero.ts`.

## Affected users / systems

`src/content/hero.ts`, `src/content/workflows.ts`, `src/pages/index.astro`, `src/styles/b-base.css`, `public/images/hero/` (2 images), `tests/content.test.ts`, `tests/hero.test.ts` (new, for the max-lines rule).

## Claims

| Claim | Label |
|---|---|
| All headline, sub-headline, step and body wording is Michael's, as given or minimally cleaned | `[verified: Michael's doc, 2026-10-14]` |

## Next

Danny reviews and merges. Merging the PR that adds this file accepts it.
