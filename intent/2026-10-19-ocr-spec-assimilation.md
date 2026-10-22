# Intent: assimilate the OCR read-path research into specs 003 and 004

Author: Grok Bot, for Danny's 2026-10-19 request ("audit specs and assimilate useful concepts from this research so we can fix")
Date: 2026-10-19
Status: accepted (Danny, 2026-10-19 1:56 AM PT: "Yes to my defaults. Open the spec PRs and send Prabu his decisions."; merge yes 2:20 AM PT: "admin merge all prs"). P-1 to P-7 stay PROPOSED for Prabu.
Product: zzThis (`Zero-State-LLC/zzthis`), with a zzThat follow-up

## Problem / why now

The read-path specs contradict each other on correction: they require it, but they also ban selecting a reading by validity. They gate nothing on negative samples, which matters because confirm-only makes the False Accept gate vacuous. And they say nothing about handwritten markers, top-N, preprocessing, wordlist hygiene, or claims.

[verified: `specs/analysis-2026-10-19-ocr-spec-audit.md`]

## Proposed outcome

- Specs 003 and 004, `docs/SPEC.md`, and the qualification protocol carry the amendments. Every amendment that needs Prabu says `PENDING P-n (default: …)`.
- D-2026-10-19-01 to -09 are recorded as ADOPTED and -10 to -16 as PROPOSED.
- The `ZZ-OCR-QUAL-002` gate set is specified but not implemented. The eight-gate set stays authoritative until a single pull request changes the schemas and the gate script together.

## Constraints

- Specification and decision text only: no runtime, schema, gate script, OpenAPI, grammar, vector, or workflow change.
- No camera path reaches Accept from any new rule. Tolerant markers and decoder offers are Clarify-capped.
- PROPOSED decisions stay PROPOSED.
- No deploy, resource, DNS, spend, or legal action.

## Non-goals

Implementing the decoder, tolerant markers, or the protocol bump. Touching zzThis #188 or zzThat #96, #98, and #102.

## Open questions

- P-1 to P-7 (Prabu).

## Claims

| Claim | Label |
|---|---|
| The check word fixes the third word from any two | `[verified: spec 003 check formula]` |
| A per-part floor cut synthetic false valids on random triples from 17% to 1 in 400 | `[verified: audit synthetic run; not handwriting]` |
| The release apps bundle `fixture-7` | `[verified: zzThat project.yml, build.gradle.kts]` |

## Next

Prabu answers P-1 to P-7. The FIX-PLAN packets follow as separate pull requests.
