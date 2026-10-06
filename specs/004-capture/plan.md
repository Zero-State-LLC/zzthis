# Plan: capture

Feature: [spec.md](spec.md). Status: proposal. Recognition qualification is governed by [ZZ-OCR-QUAL-001](../../intent/2026-10-06-v1-recognizer-qualification.md).

## Workflows (copied from the spec)

anti-slop-code, production-systems, google-developer-style. CI: `ci.yml`, `site-ci.yml`, `free-security-scan.yml`.

## Technical context

| Item | Choice | Status |
|---|---|---|
| Fiducial stage | Terminal `zz` regions are detected and paired before payload OCR; pair geometry defines ROI/orientation/rectification evidence. | v1 camera requirement |
| Recognition boundary | Engine-neutral `RecognitionResult`: candidates, confidence, geometry/line provenance when available, engine ID/version. Recognizers emit evidence only. | v1 requirement |
| iOS baseline | Apple Vision text recognition, on device. | v1 baseline; must pass ZZ-OCR-QUAL-001 |
| Android candidates | Google ML Kit Text Recognition and PP-OCR mobile/ONNX path, on device. | Benchmark both; promote from evidence |
| Shared decoder | Spec 003 grammar, closed wordlist, near-word rule, check word, and vectors. | Authoritative; recognizers do not duplicate it |
| Hard-case VLM | Qwen-class or equivalent vision model behind the same recognition boundary. | v2 research only |
| Custom zz recognizer | Small model trained/fine-tuned on consented/synthetic zz examples. | v2 candidate after corpus exists |
| Raw-photo transport | None in v1. | Raw photos stay on device |
| Qualification corpus | Team-made, consented, private; no faces/personal data; includes handwriting/print, blur, glare, rotation, wrapping, distance, and confusable glyphs/words. | ZZ-OCR-QUAL-001 |
| App platforms | iOS and Android together; web v1 is typed input. | Decided |

## RecognitionResult contract

The platform adapter normalizes vendor output before the shared capture pipeline consumes it. The contract is conceptual across Swift/Kotlin; each app may use native types internally.

```text
RecognitionResult
  engine_id
  engine_version
  candidates[]
    raw_text
    confidence
    regions[]? / line_provenance?
  fiducials[]?
    role: opening | closing
    region
    detection_score?
  roi?
  orientation? / rectification_transform?
  capture_quality?
```

Rules:
1. `raw_text` is recognizer evidence, not a canonical zz code.
2. Confidence is normalized only where the engine exposes a meaningful score. Missing confidence is explicit; it is never invented.
3. Geometry/provenance is preserved when available so multi-line/multi-code boxing remains possible.
4. The adapter cannot query live codes or resolver records.
5. Canonicalization, wordlist snapping, check-word verification, and decision bands happen after this boundary.

## ZZ-OCR-QUAL-001

The normative protocol is [qualification.md](qualification.md). Run every candidate recognizer on the same frozen corpus and expected canonical outputs.

Required measures:
- exact-code accuracy;
- per-part/word accuracy and character error rate;
- **false-valid-decode rate**: recognizer evidence leads the shared decoder to a different valid code than ground truth;
- Accept / Clarify / Retry / Abstain distribution;
- multi-code and wrapped-code detection behavior;
- latency on representative devices;
- package/runtime footprint where applicable.

Promotion rule: false-valid-decode behavior is the primary safety metric. No engine is promoted because of generic OCR benchmark claims alone. A lower raw accuracy engine can win if it safely abstains/clarifies rather than producing wrong valid codes. Numerical release thresholds are set only from the qualification evidence; this spec does not invent them.

Corpus stress buckets include ordinary handwriting and print plus 0/O, 1/I/l, 2/Z, 5/S-like confusions where applicable, poor pen contrast, glare, blur, skew/rotation, perspective, distance, two-line/wrapped codes, multiple codes, partial markers, running text, and field/handle cases.

## Platform flow

```text
camera
  -> zz fiducial detection + pairing
  -> ROI localization / optional rectification
  -> platform payload recognizer adapter
  -> RecognitionResult
  -> scanner / candidate extraction
  -> spec 003 classify + near-word rules
  -> check-word verification where applicable
  -> decision band
  -> ACCEPT | CLARIFY | RETRY | ABSTAIN
```

iOS starts with Apple Vision. Android carries ML Kit and PP-OCR as qualification candidates; only the promoted adapter ships enabled by default. Both feed the same shared semantics.

## Dependencies

- Spec 003 wordlist/check word and vectors are required before qualification can measure false-valid decoding.
- zzThat owns the native adapter implementations and platform packaging.
- Spec 002 resolver is downstream of an accepted canonical reading and is not recognition evidence.

## Traceability

| Requirement / risk | Contract or rule | Acceptance evidence | Task |
|---|---|---|---|
| Engine-neutral OCR | RecognitionResult | adapter contract tests | T001, T007-T009 |
| No semantic authority in OCR | spec 003 decoder boundary | replay harness + negative resolver-query test | T003-T006 |
| No raw-photo transport | v1 privacy invariant | network/log inspection + E2E | T015 |
| False valid / false Accept | qualification.md safety definitions | frozen-corpus receipt | T010-T013 |
| Fiducial localization/pairing | FR-018 to FR-021 | endpoint localization, pairing, false-finder, ROI/rectification metrics | T001, T006A, T010 |
| Multi-line / multi-code | scanner rules + geometry provenance | corpus buckets + vectors | T006, T010 |
| Missing confidence | explicit optional confidence | adapter/band mapping tests | T001, T005 |
| Android engine choice | promotion rule | PASS receipt + recorded pin | T012 |
| iOS baseline eligibility | same promotion rule | PASS receipt | T013 |
| Change/rollback safety | qualification.md change control | regression receipt or disable-camera-Accept path | T016 |
