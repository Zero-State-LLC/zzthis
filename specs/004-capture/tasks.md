# Tasks: capture

Bundle: **B2 Camera Capture** · Target: **v1** · Status: **ACTIVE / qualification-gated**. Scope expansion follows `specs/SCOPE-GOVERNANCE.md`; T017-T018 belong to B12 Advanced Recognition and are not v1 implementation authority.

Feature: [spec.md](spec.md) · Plan: [plan.md](plan.md) · Recognition intent: [2026-10-06 v1 recognizer qualification](../../intent/2026-10-06-v1-recognizer-qualification.md)
Workflows for every implementing task: anti-slop-code, production-systems, google-developer-style.

This qualification-gated task list supersedes the earlier capture decomposition. It keeps v1 on-device and no-cloud for raw photos; unchecked tasks are planned work, not implementation evidence. Use [TRACEABILITY](../TRACEABILITY.md) and current product specs before scheduling work.

## Phase 0: Contract and corpus

- [ ] T001 Define the Swift and Kotlin `RecognitionResult` adapters from the plan, including optional terminal-fiducial boxes/roles, pair evidence, ROI, orientation/rectification provenance. Preserve engine ID/version, raw candidates, confidence when available, and geometry/line provenance when available. Missing confidence stays missing.
- [ ] T002 Implement one private corpus manifest containing both tuning and final samples, split by writer group. Validate that writer groups are disjoint across splits. Freeze expected outputs, the complete required stress-bucket set and minimum counts, and the manifest hash. Use team-made/synthetic/separately-approved images with no faces or personal data. Do not commit private photos to Git or CI artifacts.
- [ ] T003 Implement the qualification harness against the manifest, device-matrix, evidence-only adapter-result, sealed candidate-bundle, gate-config, pre-run-attestation, execution-attestation, receipt schemas, and scoring rules. It validates the whole corpus and per-device-matrix sample coverage, verifies bundle/matrix JCS hashes and receipt-to-bundle/matrix identity equality, and verifies both detached Sigstore Cosign bundles using the Sigstore public-good TUF trust root plus the protected verifier policy's exact GitHub Actions OIDC issuer/workflow identity allowlist. It computes per-split/per-bucket metrics, replays normalized evidence through spec 003 without network access, derives product state locally, validates ground truth through the pinned decoder, and emits a schema-valid receipt plus Markdown summary. Synthetic fixtures must validate; absent/untrusted policy or attestations, malformed inputs, or incomplete evidence must never produce PASS. Add negative semantic-validation tests for schema-valid receipts with device or bucket observations below their frozen minima, gate results inconsistent with recomputed metrics/thresholds, missing per-device final latency, and undispositioned false-accept/false-valid cases; each must return INCOMPLETE or NO_PROMOTION and must not authorize promotion.

- [ ] T003A Add one documented local command for the harness (target: `npm run qual:ocr`) that accepts whole-corpus manifest, device matrix, sealed candidate bundle, gate-config, pre-run attestation and its Sigstore bundle, execution attestation and its Sigstore bundle, adapter-result, and output paths. The protected workflow must verify pre-run Rekor inclusion/timestamp before starting final-split evaluation; it captures start and finish from its trusted runner clock, not caller input. The execution attestation binds the same bundle, pre-run attestation, matrix, resulting evidence hash, and captured times. Do not upload corpus images, per-sample private corpus data, or adapter outputs; hash-only publication metadata may be published through the protected workflow. If the required verifier policy, identity allowlist, or trust material is absent, output INCOMPLETE/NO_PROMOTION only.

### Current implementation status (2026-10-07)

The isolated implementation branch has a local preflight and a partial decoder-replay slice for T003/T003A. The preflight validates the manifest, device matrix, adapter-result, candidate bundle, gate-config, and attestation JSON schemas; uses exact-byte hashes for the manifest, gate config, and adapter results plus RFC 8785 JCS hashes for the device matrix, candidate bundle, and unsigned attestations; and checks cross-document identities, writer split isolation, final bucket minima, and exact per-device/sample coverage. Decoder replay uses the shared zz-core parser, pinned wordlist loader, classifier, check-word verifier, and decision-band function; it validates ground truth and reports per-split band counts. The harness now recomputes the four declared decoder component hashes, compares the bundle's full commit to the current checkout, and requires a clean worktree before reporting `EXECUTED_PINNED`; mismatches are surfaced and keep the replay unpinned. A standalone fail-closed Sigstore verifier helper and exact-identity policy file exist; `npm run qual:ocr` now verifies both exact bundle byte streams against the RFC 8785 attestation bytes and reports per-attestation outcomes. When both signatures verify, it compares the verified Rekor integrated times against the signed execution start/finish and reports those trusted publication times; invalid ordering is incomplete. Tests mock Cosign and do not demonstrate real signature verification. Deterministic normalized-box IoU, maximum-weight one-to-one fiducial matching, predicted-pair-to-truth reconciliation, and top-1 payload scoring for exact-code accuracy/CER/false-valid decode now exist as tested primitives. Text scoring only uses correctly linked truth pairs, counts missing hypotheses as failures for exact/CER, and uses NFC code-point CER. These components are not yet aggregated into per-device/split/bucket metrics, release-gate decisions, or a receipt. Even if both signatures and timestamp ordering verify, the report stays `INCOMPLETE` / `NO_PROMOTION` because main-branch policy protection and the trusted workflow are not yet established. There is no trusted workflow clock, integrated metric/scoring implementation, or receipt writer; no policy/branch protection is yet verified on `main`. This slice is not completion evidence for T003/T003A and cannot authorize camera Accept or promotion.

## Phase 1: Shared decoder path

- [ ] T004 Snap-to-wordlist, near-word handling, and check-word verification remain shared with spec 003. Every camera reading passes through the same grammar/vectors; recognizers cannot query live codes or resolver records.
- [x] T005 Decision bands: Accept, Clarify, Retry, Abstain. Preserve the accepted prototype thresholds as parameters. Add explicit tests proving a wrong-but-valid decoded code is never silently corrected by resolver lookup.
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
