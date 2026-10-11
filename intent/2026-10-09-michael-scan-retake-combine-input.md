# Product input intake: Michael's scanner suggestion, retake guidance and combining photos (2026-10-09)

Author: Michael Chung (suggestion); intake written for Danny
Date: 2026-10-09
Status: dispositioned. Danny set every disposition on 2026-10-09 (D-2026-10-10-23). Accepted when the PR that adds it merges.
Product: zzThat scanner on the zzThis v1 grammar and bands (`Zero-State-LLC/zzthis`, spec 004)

Process: `specs/SCOPE-GOVERNANCE.md` and `intent/_PRODUCT-INPUT-TEMPLATE.md`.

## Source

- Source/person: Michael Chung (Mic), "Scanner: retake guidance and combining photos", October 9, 2026. A feature suggestion for Daniel: "add it only if it is reasonable and easy."
- The note says a patch with this file accompanied it; that patch was not available, so this file was written from the note's text.
- Exact claims preserved (Michael's words, quoted from the note):
  - "Let's say the scanner user images the zz code but it's not totally readable, or the confidence is low, 60 or 61 or something like that. In that event we can ask the user to take another image, perhaps get a little closer or from a better angle. Especially if it's under 60, that means they're too far away or took it from a wrong angle."
  - "The photos the scanner user takes of the target code, we can put them together: the first one doesn't read that well, so we ask for a second one, and we use whatever they took together ... the first image only showed some of the words; the second image might show the words that were obscured in the first photo."
  - "As in our POC, the app will eventually put a frame around the code, but we are not there yet."
  - From the note's summary: "MVP scanning matches on the words only. No image matching against the creator's photos yet; the photos are still kept for training."

## Normalize

| # | Claim [MICHAEL 2026-10-09] | Existing capability/bundle | Duplicate/conflict? |
|---|---|---|---|
| 1 | MVP scanning matches on the words only. | Spec 004: text codes only; drawn and object codes need image matching and are v2 candidates (`docs/SPEC.md` Section 12.2). | Duplicate: already the spec. |
| 2 | No image matching against the creator's photos yet. | None in v1. | Duplicate: later. |
| 3 | Scan photos are kept for training. | Spec 004 FR-002: the photo stays on the device; `docs/THREAT-MODEL.md`: no training use; Q34: real photos measure only, "until a training consent exists". | Conflict: the spec does not keep scan photos for training. |
| 4 | Low confidence asks for a retake with guidance: "move closer" or "try a better angle". | Spec 004 Retry band: "Take another photo" with the reason (marker cut off, blur, glare). | New reasons inside an existing band. |
| 5 | Retake threshold about 0.60. | Prototype values: a word below 0.50 gives Retry; 0.50 to 0.80 gives Clarify (Q37, parameters). | Conflict with the prototype value. |
| 6 | Combine the readings of several photos in one scan, word by word. | Not in the spec; a retake replaces the earlier photo. | New. |
| 7 | A frame around the code. | FR-013: the scanner draws a box around each candidate. | Duplicate: already specified. |

## Disposition

Danny, 2026-10-09 (D-2026-10-10-23).

| # | Claim | Disposition | Bundle | Target release | Reason |
|---|---|---|---|---|---|
| 1 | Words-only MVP | ASSIMILATE (no change needed) | B2 | v1.1 | Matches spec 004. |
| 2 | Image matching against the creator's photos | QUEUE | B12 | v2.2, research (BACKLOG RM-097) | Later. Needs reference photos, a new persistent entity and data class. |
| 3 | Scan photos kept for training | No change; already covered | B2 | none | The spec keeps no scan photo for training: photos stay on the device (FR-002), the threat model forbids training use, and Q34 limits real photos to measurement until a training consent exists. Any future training use needs consent wording and a retention limit first; that rule already stands, so no new backlog item is added. |
| 4 | "Move closer" and "Try a better angle" | ASSIMILATE | B2 | v1.1 | Added as Retry-band reasons in spec 004, chosen by signal: a small code in the frame gives "Move closer"; skew or perspective gives "Try a better angle". |
| 5 | Threshold about 0.60 | REJECT for now (considered) | B2 | v1.1 | Keep 0.50 (Q37 parameter) until real scan data tunes it. Mic's 0.60 is recorded as considered. |
| 6 | Combine retakes | QUEUE | B2, B3 | v1.1 (BACKLOG RM-096) | Later, as live camera multi-frame reading with word-by-word voting instead of a second photo. Fits FR-013's frame. Needs a shared zz-core merge or vote function with test vectors, an overlap and grammar guard so two different codes are never joined (otherwise "Incomplete code. Rescan."), and only within one scan session. |
| 7 | Frame around the code | ASSIMILATE (no change needed) | B2 | v1.1 | FR-013 already specifies it. |

## Scope-change test

For item 4, the only ASSIMILATE with a spec change:

- Existing ACTIVE bundle: B2 (camera capture).
- Existing release outcome completed: v1.1 camera capture.
- Existing requirement/task clarified or replaced: spec 004 Retry band rows; tasks T004.
- New journey? no
- New authority boundary? no
- New persistent entity? no
- New external integration? no
- New sensitive-data class? no
- New deploy dependency? no

## Evidence / gates

- Research/evidence needed: size and skew limits for the new reasons, tuned with Q37 on real scan data (ZZ-OCR-QUAL-001 corpus).
- Security/privacy/governance impact: none; no photo leaves the device.
- Acceptance/qualification evidence: spec 004 T004 band tests include the new reasons.
- Blocking dependency: none in this repository; zzThat implements the scanner.
- Human approval needed: given by Danny on 2026-10-09.

## Implementation authorization

- Bundle status: B2 ACTIVE.
- Implementation authorized: yes for item 4; no for items 2 and 6.
- If yes, task/spec links: `specs/004-capture/spec.md` (Decision bands, Prototype band values, Retry reasons); `specs/004-capture/tasks.md` T004.
- If no, where the idea is preserved: `specs/BACKLOG.md` RM-096 and RM-097; `specs/decisions-2026-10-10.md` D-2026-10-10-23.
