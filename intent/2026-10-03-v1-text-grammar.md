# Intent: v1 text grammar

Author: Zero State agents, accepted by Danny
Date: 2026-10-03
Status: accepted
Product: zzThis (`Zero-State-LLC/zzthis`)

This file is a proto-spec. It comes **before** specify.
The spec it gates is `docs/SPEC.md` Section 2.2a, with specs 002, 003, and 004.

## Problem / why now

The demo parser and the specs disagreed on case, separators, the circled `(zz)` marker, `@` handles, and the bare mark. Michael answered Q48 (issue #33) and Q49 (issue #34), so one text grammar can be fixed for v1 and every surface (demo, resolver, capture) can call one library. [verified: issues #33 and #34, Michael's replies of 2026-10-02]

## Proposed outcome

Observable done (a stranger can check this without reading the chat):

- `docs/SPEC.md` Section 2.2a defines the v1 grammar (G1 to G9), including the G1 near-word check and the G1a classifier vectors.
- Spec 003 owns the library (US3, FR-006 to FR-016, FR-020, FR-021). Specs 002 and 004 and the demo (001 T029) call it.
- Every G9 and G1a vector is a named test once the library lands.

## Affected users / systems

- Users: people writing, typing, photographing, or speaking codes; Michael's site copy.
- Systems: the demo parser (`src/lib/grammar.ts`), the resolver (spec 002), capture (spec 004), and the wordlist and check word library (spec 003).

## Constraints

Product-true locks (do not reopen in implement):

- Michael's Q48 and Q49 rules, used as given.
- The defaults for Q50 to Q56 (issues #36 to #42) stand until Michael answers those issues.
- ASCII only in v1; any-language codes are v2 (issue #35).
- Lowercase `zz` or the circled `(zz)` in our own materials; never a capital-letter zz mark.

Non-goals:

- Issued formats (which word counts the server issues) stay OPEN (Q27).
- Drawn symbols, macros that run, and handle verification are v2 candidates.

## Open questions

- Q50 to Q56 defaults (issues #36 to #42).
- The near-word edit-distance limit (2) until the real-photo test set measures it (spec 004 Q37).

## Claims

| Claim | Label |
|---|---|
| Danny accepted the v1 grammar in `docs/SPEC.md` Section 2.2a, and merging PR #43, on 2026-10-03 at 2:52 AM PT | `[verified: Danny's message to the operator agent, 2026-10-03 2:52 AM PT]` |
| The near-word check, the G1a vectors, and the whole-list check word test (spec 003 FR-020, FR-021) were added after the PR #43 review and are part of what is accepted here | `[assumed: added in the same PR before merge; Danny is reviewing the code rules and may ask for changes]` |

## Next

Specify is done (`docs/SPEC.md` Section 2.2a). Implement through spec 003 T010 to T013 and T008, then 001 T029.
