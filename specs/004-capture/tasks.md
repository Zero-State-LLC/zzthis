# Tasks: capture

Bundle: **B2 Camera Capture** · Target: **v1** · Status: **ACTIVE / qualification-gated**. Scope expansion follows `specs/SCOPE-GOVERNANCE.md`; T017-T018 belong to B12 Advanced Recognition and are not v1 implementation authority.

Feature: [spec.md](spec.md) · Plan: [plan.md](plan.md) · Recognition intent: [2026-10-06 v1 recognizer qualification](../../intent/2026-10-06-v1-recognizer-qualification.md)
Workflows for every implementing task: anti-slop-code, production-systems, google-developer-style.

This qualification-gated task list supersedes the earlier capture decomposition. It keeps v1 on-device and no-cloud for raw photos; unchecked tasks are planned work, not implementation evidence. Use [TRACEABILITY](../TRACEABILITY.md) and current product specs before scheduling work.

## Phase 0: Contract and corpus

- [ ] T001 Define the Swift and Kotlin `RecognitionResult` adapters from the plan, including optional terminal-fiducial boxes/roles, pair evidence, ROI, orientation/rectification provenance. Preserve engine ID/version, raw candidates, confidence when available, and geometry/line provenance when available. Missing confidence stays missing.
- [ ] T002 Implement the private corpus manifest from qualification.md, split by writer group. Freeze tuning and final splits, expected outputs, required stress-bucket counts, and the manifest hash. Use team-made/synthetic/separately-approved images with no faces or personal data. Do not commit private photos to Git or CI artifacts.
- [ ] T003 Implement the qualification harness against `qualification/manifest.schema.json`, `receipt.schema.json`, and `scoring.md`. It validates manifests, scores fiducials/ROIs/payload/decoder states deterministically, replays normalized recognition evidence through spec 003 without network access, and emits a schema-valid receipt plus Markdown summary. The synthetic fixture manifest must pass; malformed manifests/receipts must fail closed.

- [ ] T003A Add one documented local command for the harness (target: `npm run qual:ocr`) that accepts a manifest path, an adapter-result path, and an output directory. It must not discover private corpus paths implicitly or upload artifacts.

## Phase 1: Shared decoder path

- [ ] T004 Snap-to-wordlist, near-word handling, and check-word verification remain shared with spec 003. Every camera reading passes through the same grammar/vectors; recognizers cannot query live codes or resolver records.
- [ ] T005 Decision bands: Accept, Clarify, Retry, Abstain. Preserve the accepted prototype thresholds as parameters. Add explicit tests proving a wrong-but-valid decoded code is never silently corrected by resolver lookup.
- [ ] T006 Multi-line, multi-code, partial-marker, bare-mark, non-ASCII, reserved-symbol, running-text, handle, and field-code cases use the existing spec 004 rules.
- [ ] T006A Implement terminal-`zz` fiducial detection/pairing before payload OCR. Preserve opening/closing regions and ROI/rectification evidence. Test one endpoint, occlusion, false `zz` prose, ambiguous pairing, multiple codes, rotation/skew/perspective, wrapping, and no-code images. Pairing cannot consult resolver/live-code state or payload wordlist proximity.

## Phase 2: Platform adapters

- [ ] T007 iOS Apple Vision adapter. On-device only. Normalize output to RecognitionResult; do not put Vision objects into shared grammar code.
- [ ] T008 Android ML Kit Text Recognition adapter. On-device only. Normalize output to RecognitionResult.
- [ ] T009 Android PP-OCR mobile/ONNX prototype adapter for qualification. On-device only. Dependency/package/security review is required before it can become a shipping dependency.

## Phase 3: ZZ-OCR-QUAL-001

- [ ] T010 Run the fiducial stage plus Apple Vision, ML Kit, and PP-OCR payload candidates under qualification.md against the frozen final corpus where platform execution permits. Produce the machine-readable receipt and Markdown report with version/configuration hashes, device/OS evidence, per-bucket metrics, and PASS/FAIL/INCOMPLETE.
- [ ] T011 Report every metric required by qualification.md, including fiducial precision/recall, pair accuracy, false-finder/false-pair, ROI/rectification performance, false-valid-decode, False Accept, no-code false positives, band distribution, crash count, median/p95 latency, and footprint. Disposition every False Accept by sample_id; resolver state cannot hide it.
- [ ] T012 Android promotion decision: choose ML Kit or PP-OCR from ZZ-OCR-QUAL-001 evidence. False-valid-decode behavior is the primary safety metric; generic vendor benchmark claims are not promotion evidence. Record the decision and engine/version pin.
- [ ] T013 iOS release gate: Apple Vision must pass the same product-level qualification. If it does not, stop and open a replacement-engine decision; do not lower validation requirements to make it pass.

## Phase 4: v1 integration

- [ ] T014 Creation check and ordinary scan both use the promoted platform adapter plus the same shared decoder.
- [ ] T015 Verify raw photos never leave the device in v1 and no cloud/server vision path is reachable or advertised.
- [ ] T016 End-to-end evidence on representative iOS and Android devices: camera -> recognizer -> shared decoder -> band -> canonical code/clarify/retry/abstain. Verify two-retry behavior, typed-entry fallback, local photo deletion, no raw-photo network request, and the rollback/disable-camera-Accept path.

## Deferred v2 — B12 Advanced Recognition (RESEARCH; not active v1 tasks)

- [ ] T017 Evaluate a Qwen-class VLM only as a hard-case verifier behind RecognitionResult; no v1 dependency.
- [ ] T018 Evaluate a custom zz-specific recognizer after enough governed data exists. Compare it against the frozen qualification baseline before promotion.

## Definition of done

Capture v1 is implementation-ready only when every normative rule has a task and test owner, no OPEN item blocks implementation, qualification.md can produce a reproducible receipt without inventing fields, and zzThat consumes the same boundary. Camera Accept is release-ready only after a PASS receipt for that platform's pinned adapter. NO_PROMOTION is a valid qualification outcome and leaves typed entry available.
