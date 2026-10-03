# Feature spec: capture by camera, typing, or voice

Feature ID: 004-capture
Status: not built. Recognition approach decision OPEN (Q18). Deepened 2026-10-03: grammar path, decision-band triggers, error states, and edge cases. v1 reads English (ASCII) codes with Option A; trained models and other scripts are v2 (issue #35).
Phase: specify (what and why). The how is in [plan.md](plan.md).
Constitution: [.specify/memory/constitution.md](../../.specify/memory/constitution.md).

## Why

A person reads a code by camera, typing, or voice [BRIEF]. Handwriting and print recognition of zz codes is untested [PRODUCT]. Capture must turn a messy real-world mark into exactly one code, or ask for help, and never silently pick the wrong one [PRODUCT] [OPERATOR 2026-10-02].

## User stories

### US1. Read a handwritten code with the phone camera (P1)

As a field user, I point the phone at a handwritten code and get the code, or a request to confirm or retry, so that I can open its record [BRIEF] [OPERATOR 2026-10-02].

Acceptance: recognition runs on the device; only the decoded code goes to the API; every reading is snapped to the closed wordlist and the check word is verified [OPERATOR 2026-10-02].

1. Given a photo of `zz-copper-lantern-sky-zz` written across two lines of tape, the reader returns one code, `zz-copper-lantern-sky-zz` (FR-009).
2. Given a photo of `zz copper lantern sky zz` written in capitals, the reader returns the canonical lowercase form (FR-008).
3. Given a photo with two codes, the reader shows both and the person picks one; it never picks for them (FR-014).
4. Given a reading where one word is uncertain, the person sees a clarify step that asks about that word only, using wordlist candidates, never live codes (FR-006).

### US2. Type or say a code (P1)

As a user without a usable photo, I type or say the words, so that I can still resolve the code [BRIEF].

Acceptance:

1. Typed input goes through the same grammar library as the demo and the resolver; every `docs/SPEC.md` Section 2.2a G9 vector gives the same result here (FR-008).
2. Spoken words are joined into a code and shown back before lookup. If the person says only the words, the client adds the `zz` markers in what it shows back, and lookup waits for the person to confirm (INFERRED; the closing-marker rule applies to written codes, and the confirm step stands in for it in speech).

### US3. Retry a hard case (P2)

As a user whose reading failed, I can send the photo for a server-side read, so that hard cases still work [OPERATOR 2026-10-02].

Acceptance: the photo leaves the device only on a retry or hard case [OPERATOR 2026-10-02].

## Functional requirements

| ID | Requirement | Source |
|---|---|---|
| FR-001 | Inputs: camera, typing, voice. | [BRIEF] |
| FR-002 | On-device recognition first; photo stays on the device by default. | [OPERATOR 2026-10-02]; whether Option A must include an on-device model is OPEN (Q18) |
| FR-003 | Every reading is snapped to the closed wordlist (spec 003) and the check word is verified. | [OPERATOR 2026-10-02] |
| FR-004 | Calibrated confidence decides accept, clarify, retry, or abstain, separately for voice, image, and typed input. | [PRODUCT]; thresholds OPEN (Q37) |
| FR-005 | A person confirms low-confidence readings. | [OPERATOR 2026-10-02] [PRODUCT] |
| FR-006 | Correction happens on the client against the wordlist and check word, never by asking the server for nearby codes. | [OPERATOR 2026-10-02] |
| FR-007 | Read-back confirmation errors are measured, not assumed away. | [PRODUCT]; method OPEN (Q37) |
| FR-008 | Every reading, from camera, typing, or voice, passes through the v1 grammar library (spec 003 US3) before snapping, and the client sends only the canonical form. | [MICHAEL 2026-10-02 #33] [MICHAEL 2026-10-02 #34] |
| FR-009 | A code written across two lines, or wrapped around an edge, reads as one code when both markers are found. | [MICHAEL 2026-10-02 #33] |
| FR-010 | Wordlist snapping applies only to parts expected to be wordlist words. Handle parts and field-code parts (names, numbers) are read as written, never snapped, and always shown back for confirmation. | INFERRED, so a name is never turned into a dictionary word |
| FR-011 | A bare mark is reported as a bare mark. v1 does not resolve it; the client says so and offers typed entry. Linking a bare mark by photo, place, and time is a v2 candidate. | [MICHAEL 2026-10-02 #33]; v1 split INFERRED |
| FR-012 | A reading with letters outside ASCII, or with a reserved symbol (`#`, `$`, `/`, `:`), abstains with the grammar reason. It is never snapped to the nearest valid code. | [MICHAEL 2026-10-02 #34]; abstain rule INFERRED |
| FR-013 | Codes inside running text: the scanner finds every marker pair; a lone `zz` is offered as a bare mark only after the person confirms it. | Q55 default (issue #41) |
| FR-014 | When a photo holds more than one code, the client lists them all and the person chooses. | INFERRED from "never silently pick the wrong one" |

## Decision bands and error states

Thresholds stay OPEN (Q37). The triggers below say which band applies; they set no numbers.

| Band | Trigger | What the person sees |
|---|---|---|
| Accept | Grammar passes, every snapped word is above the accept threshold, and the check word verifies (word codes) | The canonical code, then the record view |
| Clarify | Grammar passes, but one or more words fall between the thresholds, or the check word fails with one uncertain word | The uncertain word with wordlist candidates; confirm or type it |
| Retry | A marker is missing or cut off, the photo is blurred, or glare hides part of the code | "Take another photo" with the reason; after a set number of retries, offer the server read (US3) |
| Abstain | Grammar fails for any reason other than a missing or cut-off marker (that is Retry), including `unsupported-script` and `reserved-symbol` (FR-012). A bare mark also lands here in v1 (FR-011) | The reason in plain words, and typed entry |

Handles and field codes never reach Accept without a person confirming them (FR-010).

## Edge cases

- Markers written in capitals: accepted and shown in lowercase (FR-008). The display rule bars a capital-letter zz in our own materials, not in what people write.
- A circled `(zz)` at one end and a plain `zz` at the other: one code (`docs/SPEC.md` Section 2.2a G3).
- Only the opening marker visible: Retry, not a guess.
- A smiley or star drawn next to the code: ignored by the text reader; drawn symbols are a separate v2 mode.
- Korean, Japanese, or other non-ASCII words between markers: Abstain with `unsupported-script` in v1 (issue #35 for v2).
- Voice input that sounds like two different wordlist words: Clarify with both candidates, never auto-pick.

## Success criteria

Not set for this feature. Research accuracy targets are not acceptance criteria and are not kept in this repo (Q24). Option A and B are compared on the same test set before any switch [OPERATOR 2026-10-02].

## Out of scope

The phone and web apps as products (not yet specified; Q33), the resolver (spec 002), and the wordlist (spec 003).

## Open questions

| ID | Question | Default |
|---|---|---|
| Q18 | Fine-tune our own small model (Option B)? Also: must Option A include an on-device model, or may US1 fall back to cloud vision? | Deferred; ship Option A, run a 2-week Option B benchmark [OPERATOR 2026-10-02]. On-device part of Option A: none chosen |
| Q33 | Scope of the zzThat app (web, Android, iOS) as a product: which features ship first? | Not specified |
| Q34 | Where the test set of real photos comes from, and consent for using them | None chosen |
| Q37 | Confidence thresholds for accept, clarify, retry, and abstain, and how read-back errors are measured | None chosen |
| Q38 | Where voice input is processed, and whether audio leaves the device | None chosen |
| Q55 | How is a `zz` inside running text treated? (issue #41) | Scanner finds marker pairs; a lone `zz` needs a confirm |

## Workflows

| Item | Value |
|---|---|
| Governing workflows | anti-slop-code, production-systems, google-developer-style |
| Owners | Spec: Opus 5.5 through Grok Bot. Decomposition: FORGE. Implementation: cloud coding agent. Filing: SCRIBE. |
| CI to reuse | `.github/workflows/ci.yml`, `site-ci.yml`, `free-security-scan.yml`. Model training runs outside CI; a training workflow needs Danny's yes and a named file. |
