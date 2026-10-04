# Intent: apply Michael's answers to Q63, Q64, and Q65

Author: Zero State agents (Grok Bot)
Date: 2026-10-04
Status: draft (accepted when Danny merges the PR that adds it)
Product: zzThis (`Zero-State-LLC/zzthis`)

This file records answers already given. The site change is in the same PR.

## Problem / why now

Issues #51, #54, and #55 asked Michael to check the language examples, the prototype microcopy, and whether Home should show the real handwritten photos. He answered on 2026-10-03 in a document sent through Danny. [verified: task brief quoting that document, 2026-10-04]

## Proposed outcome

- Q63: the Korean, Japanese, and Aramaic examples stay as written, including the glosses and the right-to-left Aramaic. Caveats that exist only for the native-reader check are removed. The console coming-later note stays, because it is about v1 resolver support.
- Q64: the prototype microcopy is approved as written, with three changes. Decision bands: Manual, Rescan, Confirm, Resolve. Console check line: "Check word: OK (demo; no algorithm runs)". Other console labels say demo instead of mock. Object storage: "photos for retries and review".
- Q65: no. Home stays as it is. The real handwritten photos stay on Applications.

## Affected users / systems

- Users: people reading Home.
- Systems: Home console copy, decision bands, architecture diagram, `docs/SPEC.md`, spec 001.

## Constraints

Product-true locks:

- Michael's answers, used as given [MICHAEL 2026-10-03].
- No em dash in site copy (Q62).

Non-goals:

- Moving photos onto Home, or off Applications or About.
- Changing the `/demo` mock records or the "Demo · mock data" badge.
- Changing the product sentence that says "another view" outside the band names.

## Open questions

- None for this change.

## Claims

| Claim | Label |
|---|---|
| Michael answered Q63, Q64, and Q65 on 2026-10-03 | `[verified: answers forwarded by Danny, 2026-10-04]` |

## Next

Danny reviews the pull request. Do not merge without his yes.
