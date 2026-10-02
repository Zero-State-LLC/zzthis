# Feature spec: capture by camera, typing, or voice

Feature ID: 004-capture
Status: not built. Recognition approach decision OPEN (Q18).
Phase: specify (what and why). The how is in [plan.md](plan.md).
Constitution: [.specify/memory/constitution.md](../../.specify/memory/constitution.md).

## Why

A person reads a code by camera, typing, or voice [BRIEF]. Handwriting and print recognition of zz codes is untested [NSF]. Capture must turn a messy real-world mark into exactly one code, or ask for help, and never silently pick the wrong one [NSF] [OPERATOR 2026-10-02].

## User stories

### US1. Read a handwritten code with the phone camera (P1)

As a field user, I point the phone at a handwritten code and get the code, or a request to confirm or retry, so that I can open its record [BRIEF] [OPERATOR 2026-10-02].

Acceptance: recognition runs on the device; only the decoded code goes to the API; every reading is snapped to the closed wordlist and the check word is verified [OPERATOR 2026-10-02].

### US2. Type or say a code (P1)

As a user without a usable photo, I type or say the words, so that I can still resolve the code [BRIEF].

### US3. Retry a hard case (P2)

As a user whose reading failed, I can send the photo for a server-side read, so that hard cases still work [OPERATOR 2026-10-02].

Acceptance: the photo leaves the device only on a retry or hard case [OPERATOR 2026-10-02].

## Functional requirements

| ID | Requirement | Source |
|---|---|---|
| FR-001 | Inputs: camera, typing, voice. | [BRIEF] |
| FR-002 | On-device recognition first; photo stays on the device by default. | [OPERATOR 2026-10-02]; whether Option A must include an on-device model is OPEN (Q18) |
| FR-003 | Every reading is snapped to the closed wordlist (spec 003) and the check word is verified. | [OPERATOR 2026-10-02] |
| FR-004 | Calibrated confidence decides accept, clarify, retry, or abstain, separately for voice, image, and typed input. | [NSF]; thresholds OPEN (Q37) |
| FR-005 | A person confirms low-confidence readings. | [OPERATOR 2026-10-02] [NSF] |
| FR-006 | Correction happens on the client against the wordlist and check word, never by asking the server for nearby codes. | [OPERATOR 2026-10-02] |
| FR-007 | Read-back confirmation errors are measured, not assumed away. | [NSF]; method OPEN (Q37) |

## Success criteria

Not set for this feature. Accuracy targets in `docs/SPEC.md` Section 2.7 are NSF research targets and are flagged for removal from the public repo. Option A and B are compared on the same test set before any switch [OPERATOR 2026-10-02].

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

## Workflows

| Item | Value |
|---|---|
| Governing workflows | anti-slop-code, production-systems, google-developer-style |
| Owners | Spec: Opus 5.5 through Grok Bot. Decomposition: FORGE. Implementation: cloud coding agent. Filing: SCRIBE. |
| CI to reuse | `.github/workflows/ci.yml`, `site-ci.yml`, `free-security-scan.yml`. Model training runs outside CI; a training workflow needs Danny's yes and a named file. |
