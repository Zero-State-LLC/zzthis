# Intent: apply Michael's answers to Q50 to Q61

Author: Zero State agents (Grok Bot)
Date: 2026-10-03
Status: draft (accepted when Danny merges the PR that adds it)
Product: zzThis (`Zero-State-LLC/zzthis`)

This file is a proto-spec. It comes **before** specify.
The spec it gates is the update to `docs/SPEC.md` Sections 2.2, 2.2a, 9, 9a, and 12, with specs 001 to 004.

## Problem / why now

The accepted v1 grammar ([`2026-10-03-v1-text-grammar.md`](2026-10-03-v1-text-grammar.md)) carried defaults for Q50 to Q56 (issues #36 to #42), and Q57 to Q61 (issues #44 to #48) were filed after PR #43. Michael answered all twelve on 2026-10-03 in a document sent through Danny. Several answers change the grammar: no part limit, qualifiers after a handle, `.eth` names without `@`, and stricter bare marks. [verified: Michael's answers document, 2026-10-03; issues #36 to #48]

## Proposed outcome

Observable done:

- `docs/SPEC.md` Section 2.2a G1 to G11 reflect the answers, with updated G9 vectors and new G10 (field-code matching key) and G11 (no-device field formats).
- `docs/SPEC.md` Section 9 marks Q50 to Q61 RESOLVED, and Section 9a starts the running decisions log.
- Specs 001 to 004 carry the new FRs: 002 FR-016, FR-019 to FR-022; 003 FR-009, FR-010, FR-012, FR-022 to FR-024; 004 FR-013, FR-016, FR-017; 001 FR-019, T030, T031.

## Affected users / systems

- Users: people writing, typing, photographing, or speaking codes; handle owners; Michael's site.
- Systems: the grammar library (spec 003), the resolver (spec 002), capture (spec 004), and the demo parser (001 T029).

## Constraints

Product-true locks:

- Michael's answers, used as given. His `[Claude]` notes are suggestions, used only where his answer leaves a gap, and marked INFERRED.
- Letter case: any case is accepted; one case-folded canonical form is stored; what we generate shows lowercase zz (Section 9a D-2026-10-03-01).
- No phone number or other personal data inside a code in any spec example (Section 9a D-2026-10-03-11).
- ASCII only in v1; any-language codes stay v2 (issue #35).

Non-goals:

- Free public duplicate codes with local priority, reusable postal account codes, premium handle pricing, drawn and object codes: v2 (Section 12.2).
- No code change in this PR. The demo parser moves with 001 T029.

## Open questions

- None new that blocks the build. Michael expects firmer rules later, by context and language.

## Claims

| Claim | Label |
|---|---|
| Michael answered Q50 to Q61 on 2026-10-03 | `[verified: answers document received through Danny, 2026-10-03 PT]` |
| The EFF long wordlist has 7,776 words; BIP39 has 2,048 words and official lists in nine more languages | `[verified: eff.org eff_large_wordlist.txt and github.com/bitcoin/bips bip-0039, fetched 2026-10-03]` |
| The English BIP39 list has 13,138 word pairs closer than edit distance 3, so it fails spec 003 FR-003 as is | `[verified: computed 2026-10-03]` |

## Next

Danny reviews and merges the draft PR. Then implement through spec 003 T010 to T013 and 001 T029.
