# Plan: capture

Feature: [spec.md](spec.md). Status: proposal. Recognition qualification is governed by [ZZ-OCR-QUAL-001](../../intent/2026-10-06-v1-recognizer-qualification.md).

## Workflows (copied from the spec)

anti-slop-code, production-systems, google-developer-style. CI: `ci.yml`, `site-ci.yml`, `free-security-scan.yml`.

## Technical context

| Item | Choice | Status |
|---|---|---|
| Option A | Off-the-shelf vision: on-device model first where good enough, cloud vision for retries and hard cases | Recommended to ship first [OPERATOR 2026-10-02]. The cloud part is superseded by Q18: no cloud reader in v1 |
| Option B | Fine-tuned small model (for example TrOCR-small or a small vision-language model with LoRA) trained on the closed wordlist. The list size was settled by Q31 (the proto-v0 yield). | 2-week benchmark first [OPERATOR 2026-10-02]; research phase R-B12 |
| Training data for B | Synthetic renders of the wordlist with blur, warping, and tape and cardboard textures, then real photos | [OPERATOR 2026-10-02] |
| Retry photo storage | R2 (spec 002 plan) | [OPERATOR 2026-10-02] |
| App platform | iOS and Android together in zzThat; the web client is typing only | RESOLVED (Q33) |
| Fiducial stage | Terminal `zz` regions are detected and paired before payload OCR; only same-baseline pairs in reading order are eligible. The adapter defines a validated ROI; v1 permits crop/rotation normalization but no perspective/projective rectification. Candidate caps and baseline tolerance are versioned, frozen config. | v1 camera requirement; accepted 2026-10-08 |
| Recognition boundary | Engine-neutral `RecognitionResult`: candidates, confidence, geometry/line provenance when available, engine ID/version. Recognizers emit evidence only. | v1 requirement |
| iOS baseline | Apple Vision text recognition, on device. | v1 baseline; must pass ZZ-OCR-QUAL-001 |
| Android candidates | Google ML Kit Text Recognition and PP-OCR mobile/ONNX path, on device. | Benchmark both; promote from evidence |
| Shared decoder | Spec 003 grammar, closed wordlist, near-word rule, check word, and vectors. | Authoritative; recognizers do not duplicate it |
| Hard-case VLM | Qwen-class or equivalent vision model behind the same recognition boundary. | v2 research only; no cloud reader in v1 (Q18) |
| Custom zz recognizer | Small model trained/fine-tuned on consented/synthetic zz examples. | v2 candidate after corpus exists |
| Raw-photo transport | None in v1. | Raw photos stay on device |
| Qualification corpus | Team-made, consented, private; no faces/personal data. Covers supported OCR conditions and separately tagged fail-closed safety probes for perspective-dependent/curved wrapping and candidate-cap overflow. | ZZ-OCR-QUAL-001 |

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
| Fiducial localization/pairing | FR-018 to FR-021 | endpoint localization, same-baseline pairing, false-finder, safe ROI/crop-or-rotation metrics, fail-closed overflow/unsupported-geometry probes | T001, T006A, T010 |
| Multi-line / multi-code | scanner rules + geometry provenance | corpus buckets + vectors | T006, T010 |
| Missing confidence | explicit optional confidence | adapter/band mapping tests | T001, T005 |
| Android engine choice | promotion rule | PASS receipt + recorded pin | T012 |
| iOS baseline eligibility | same promotion rule | PASS receipt | T013 |
| Change/rollback safety | qualification.md change control | regression receipt or disable-camera-Accept path | T016 |
