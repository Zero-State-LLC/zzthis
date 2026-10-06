# Tasks: capture

Feature: [spec.md](spec.md) · Plan: [plan.md](plan.md) · Recognition intent: [2026-10-06 v1 recognizer qualification](../../intent/2026-10-06-v1-recognizer-qualification.md)
Workflows for every implementing task: anti-slop-code, production-systems, google-developer-style.

## Phase 0: Contract and corpus

- [ ] T001 Define the Swift and Kotlin `RecognitionResult` adapters from the plan. Preserve engine ID/version, raw candidates, confidence when available, and geometry/line provenance when available. Missing confidence stays missing.
- [ ] T002 Freeze ZZ-OCR-QUAL-001 corpus manifest and expected canonical outputs under private test-data handling. Use team-made photos with written consent, no faces/personal data. Record stress-bucket tags; do not commit private photos to the public repo.
- [ ] T003 Add a qualification harness/fixture format that can replay normalized recognition evidence through the shared spec 003 scanner/classifier/check-word path without network access.

## Phase 1: Shared decoder path

- [ ] T004 Snap-to-wordlist, near-word handling, and check-word verification remain shared with spec 003. Every camera reading passes through the same grammar/vectors; recognizers cannot query live codes or resolver records.
- [ ] T005 Decision bands: Accept, Clarify, Retry, Abstain. Preserve the accepted prototype thresholds as parameters. Add explicit tests proving a wrong-but-valid decoded code is never silently corrected by resolver lookup.
- [ ] T006 Multi-line, multi-code, partial-marker, bare-mark, non-ASCII, reserved-symbol, running-text, handle, and field-code cases use the existing spec 004 rules.

## Phase 2: Platform adapters

- [ ] T007 iOS Apple Vision adapter. On-device only. Normalize output to RecognitionResult; do not put Vision objects into shared grammar code.
- [ ] T008 Android ML Kit Text Recognition adapter. On-device only. Normalize output to RecognitionResult.
- [ ] T009 Android PP-OCR mobile/ONNX prototype adapter for qualification. On-device only. Dependency/package/security review is required before it can become a shipping dependency.

## Phase 3: ZZ-OCR-QUAL-001

- [ ] T010 Run Apple Vision, ML Kit, and PP-OCR candidates against the same frozen corpus where platform execution permits. Produce machine-readable results plus a short qualification report.
- [ ] T011 Report exact-code accuracy, part/word accuracy, CER, false-valid-decode rate, band distribution, wrapped/multi-code behavior, latency, and package/runtime footprint.
- [ ] T012 Android promotion decision: choose ML Kit or PP-OCR from ZZ-OCR-QUAL-001 evidence. False-valid-decode behavior is the primary safety metric; generic vendor benchmark claims are not promotion evidence. Record the decision and engine/version pin.
- [ ] T013 iOS release gate: Apple Vision must pass the same product-level qualification. If it does not, stop and open a replacement-engine decision; do not lower validation requirements to make it pass.

## Phase 4: v1 integration

- [ ] T014 Creation check and ordinary scan both use the promoted platform adapter plus the same shared decoder.
- [ ] T015 Verify raw photos never leave the device in v1 and no cloud/server vision path is reachable or advertised.
- [ ] T016 End-to-end evidence on representative iOS and Android devices: camera -> recognizer -> shared decoder -> band -> canonical code/clarify/retry/abstain.

## Deferred v2

- [ ] T017 Evaluate a Qwen-class VLM only as a hard-case verifier behind RecognitionResult; no v1 dependency.
- [ ] T018 Evaluate a custom zz-specific recognizer after enough governed data exists. Compare it against the frozen qualification baseline before promotion.
