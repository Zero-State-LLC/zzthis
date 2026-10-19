# Intent: drop the site hedges, section 03, Contact matches About

Author: Cursor cloud agent (recording Michael's 2026-10-18 site copy)
Date: 2026-10-18
Status: accepted (by Danny, repo owner, 2026-10-18: the native zz apps are live)
Product: zzThis (`Zero-State-LLC/zzthis`)

This file is a proto-spec. It comes **before** specify.
Next stage is `spec.md` (spec-kit specify). Do not skip to code.

One committed intent per change stream. Live under `intent/` or
`docs/intent/`. Do not invent product work in the template pack.

## Problem / why now

Michael's 2026-10-18 site copy removes the planned/available hedges, the concept-renderings page note, and the uncertain-reading material, and it adds How it works section 03. The copy says a visitor can scan the mark. The roadmap and site spec still said the native apps were absent and that copy must not imply camera recognition works. Those docs were stale. [verified: Danny, repo owner, 2026-10-18, confirmed the native zz apps are live]

## Proposed outcome

Observable done (a stranger can check this without reading the chat):

- How it works drops the page intro hedge, the concept-renderings note, and the planned/available labels. Step 04 is Speak. Section 03 is the drone-feed and recovery-site panels. Section 04 is "Your Super Lens to the Physical World".
- Home tour, field logistics, and the photo-to-action pipeline drop the concept labels and the uncertain-reading / decision-band material. The photo-to-action pipeline keeps Michael's heading and steps, and says "Future exploration, not a live workflow."
- About invites military and civilian logistics partners and engineers. Contact uses the same invite and collaboration lines as About. Arshi's bio notes the OWASP GenAI Security Project.
- The footer image note does not call the About "Real photos" photographs concept renderings.
- `specs/RELEASE-ROADMAP.md`, `docs/SPEC.md`, and `docs/site-reconciliation-2026-10-06.md` say the native apps are live and that site copy may say a visitor can scan the mark.

## Affected users / systems

- Users: people reading zzthis.com, including visitors who scan a mark with the native apps.
- Systems: marketing site copy (`src/content/`, `src/pages/how-it-works.astro`) and the site spec docs named above.

## Constraints

Product-true locks (do not reopen in implement):

- Michael's 2026-10-18 wording stays, except the photo-to-action future qualifier Danny required and the About line that zzThat is live.
- The native zz apps exist and are live. Site copy may say a visitor can scan the mark. About says zzThat is live. [verified: Danny, repo owner, 2026-10-18]
- Voice stays future scope. This file does not say voice recognition is shipped.
- AI photo-to-action (photograph an item, confirm an identification, prepare an action) is not live. The pipeline keeps a future qualifier. [verified: Danny, 2026-10-18 5:51 PM PT]

Non-goals:

- No production deploy, DNS change, or spend.
- No camera-engine PASS receipt, store-review record, or v1.1 release-gate claim.
- No claim that the marketing site's scripted demo runs camera recognition.

## Open questions

- None from these two rulings. AI photo-to-action is not live [verified: Danny, 2026-10-18 5:51 PM PT]. zzThat is live, so About does not say "launching soon" [verified: Danny, repo owner, 2026-10-18].

## Claims

Label every non-obvious claim. Prefer a table when there are several.

| Claim | Label |
|---|---|
| The native iOS and Android zz apps exist and are live | `[verified: Danny, repo owner, 2026-10-18]` |
| Site copy may say a visitor can scan the mark | `[verified: Danny, repo owner, 2026-10-18]` |
| The 2026-10-18 page wording is Michael's | `[verified: Michael's site copy patch, 2026-10-18, PR #188]` |
| AI photo-to-action is not live | `[verified: Danny, 2026-10-18 5:51 PM PT]` |
| About says zzThat is live, not "launching soon" | `[verified: Danny, repo owner, 2026-10-18]` |
| This repository holds a camera-engine PASS receipt | `[verified: no PASS receipt is recorded; the apps are not in this repo]` |

## Next

Danny (repo owner) accepted this file on 2026-10-18 to the extent the native apps are live and the site may say a visitor can scan the mark. On 2026-10-18 at 5:51 PM PT he ruled that AI photo-to-action is not live. About now says zzThat is live. The photo-to-action pipeline carries the future qualifier.
