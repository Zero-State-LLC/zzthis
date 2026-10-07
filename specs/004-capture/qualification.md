# ZZ-OCR-QUAL-001: v1 recognizer qualification protocol

Status: normative qualification protocol. No engine is promoted by this document alone.
Parent: [spec 004](spec.md) · [plan](plan.md) · [tasks](tasks.md)
Machine contracts: [manifest schema](qualification/manifest.schema.json) · [adapter-result schema](qualification/adapter-result.schema.json) · [receipt schema](qualification/receipt.schema.json) · [scoring rules](qualification/scoring.md) · [fixture manifest](qualification/fixture-manifest.json) · [fixture adapter results](qualification/fixture-adapter-results.json)

## Purpose

Qualify a platform OCR adapter for handwritten and printed zz codes without moving zz semantics into the OCR engine. The result is an evidence receipt that another engineer can reproduce from the same corpus manifest, adapter build, decoder version, and configuration.

## Authority boundary

The recognizer may emit text, confidence when meaningful, geometry, and provenance. It may not canonicalize a zz code, snap to the wordlist, verify the check word, query the resolver, query live codes, or decide Accept/Clarify/Retry/Abstain. Those operations belong to the shared decoder defined by specs 003 and 004.

## Corpus contract

The qualification corpus is private. The repository stores only a manifest schema, synthetic/non-sensitive fixtures, aggregate results, and hashes needed for reproducibility. Raw private photographs never enter Git, pull-request attachments, Actions artifacts, logs, crash reports, analytics, or model-training sets.

Each sample is validated by `qualification/manifest.schema.json`. Each sample has:

| Field | Rule |
|---|---|
| sample_id | Opaque stable identifier with no person name |
| asset_sha256 | Hash of the exact image bytes |
| consent_class | team-made, synthetic, or separately-approved |
| writer_group | Pseudonymous writer group used for split isolation |
| device_class | Device/camera class, not a personal device identifier |
| ground_truth | Expected literal/canonical result kept with the private corpus |
| case_kind | valid-word, field, handle, partial, bare, invalid, multi-code, or no-code |
| stress_tags | Zero or more controlled stress buckets |
| fiducial_truth | Expected opening/closing endpoint boxes or `none`; pair membership for multi-code images |
| roi_truth | Expected payload ROI polygon for each complete visual code, keyed by the ground-truth fiducial `pair_id`; required for complete visual cases |
| expected_band_constraints | Allowed product states when the sample is intentionally ambiguous |
| notes | Non-identifying qualification notes only |

### Split rules

1. Split by writer group, not by image, so one writer cannot leak into both tuning and final qualification.
2. Freeze the final qualification split before comparing candidate engines.
3. Do not tune thresholds, preprocessing, prompts, or decoder rules on the final split.
4. Any post-freeze change to an adapter, model/version, preprocessing, decoder, wordlist, check-word implementation, or band mapping invalidates that engine receipt and requires a new run.
5. Synthetic images can broaden stress coverage but cannot be the only evidence for handwriting promotion.

## Stress matrix

The final set covers terminal-fiducial localization and pairing plus ordinary handwriting and print, low contrast, glare, blur, motion blur, perspective, rotation, distance, two-line/wrapped codes, multiple codes, partial/occluded fiducials, false `zz` marks in surrounding text, ambiguous endpoint pairing, unequal endpoint size, curved/wrapped surfaces, running text, confusable characters, near-word cases, invalid/reserved characters, no-code images, handles, and field-code parts. Record bucket counts in the receipt. A missing required bucket makes the run incomplete, not passing.

## Adapter input and output

Input is one still image plus immutable adapter configuration. Camera qualification measures two separable stages: (A) terminal-`zz` fiducial detection/pairing and ROI localization/rectification, then (B) payload recognition and shared decoding. Native platform types are serialized at the harness boundary using [adapter-result.schema.json](qualification/adapter-result.schema.json); [fixture-adapter-results.json](qualification/fixture-adapter-results.json) demonstrates the wire shape. Each result binds to `sample_id` and the manifest's image hash. The manifest hash must match exactly, and the result set must contain each manifest sample exactly once; missing, duplicate, extra, or hash-mismatched results make the run INCOMPLETE. Coordinates are normalized to the original image after orientation normalization, with origin at top-left. The adapter emits evidence only; product state and decoded codes are outputs of the shared local decoder, not adapter-owned policy.

The adapter-result contract must record:

- engine id and exact engine/model/runtime version;
- platform and OS version;
- preprocessing version and parameters;
- detected fiducial regions, endpoint role/pairing evidence, and detection score when meaningful;
- ROI/polygon, orientation/baseline, and rectification transform when used;
- candidate payload text in original recognizer order;
- confidence semantics, including "not available";
- geometry/line provenance when exposed;
- elapsed recognition time measured by the harness.

No network access is allowed during a v1 qualification read.

## State machine

```text
CAPTURED
  -> FIDUCIALS_DETECTED
  -> ROI_LOCALIZED
  -> RECOGNIZED
  -> DECODED
  -> ACCEPT | CLARIFY | RETRY | ABSTAIN

CAPTURED -> RETRY        no usable endpoint evidence
FIDUCIALS_DETECTED -> RETRY   one/cut/occluded endpoint or unusable geometry
FIDUCIALS_DETECTED -> CLARIFY multiple plausible pairings requiring selection
ROI_LOCALIZED -> RETRY        rectification/crop unusable
RECOGNIZED -> ABSTAIN    unsupported/invalid evidence
DECODED -> CLARIFY       ambiguity or confirmation required
DECODED -> RETRY         incomplete/low-quality recoverable read
DECODED -> ABSTAIN       invalid or unsafe-to-resolve result
DECODED -> ACCEPT        only when all shared decoder gates pass
```

Terminal states for one attempt are Accept, Clarify, Retry, and Abstain. A rescan creates a new attempt. After two Retry results in one scan flow, the UI continues to offer rescan or typed entry. It does not escalate to cloud OCR in v1.

## Measurements

For every engine and stress bucket report:

- fiducial endpoint detection precision/recall;
- complete-pair detection rate;
- endpoint pairing accuracy;
- false-finder and false-pair counts/rates, including prose `zz` distractors;
- ROI localization overlap/error and rectification success where ground truth exists;
- exact canonical-code accuracy;
- part/word accuracy;
- character error rate;
- false-valid-decode count and rate;
- Accept/Clarify/Retry/Abstain counts and rates;
- false Accept count and rate;
- no-code false-positive count;
- wrapped-code and multi-code behavior;
- median and p95 adapter latency on each representative device class;
- package/download-size delta and peak runtime memory where measurable;
- crash/exception count.

### Fiducial safety definitions

**False finder:** a region without a ground-truth terminal marker is emitted as a terminal `zz` fiducial.

**False pair:** two detected regions are paired as one code when they are not the ground-truth endpoints of the same code.

**Missed endpoint:** a ground-truth opening or closing fiducial is not detected. A missed endpoint cannot be synthesized from payload plausibility.

Fiducial errors are reported separately from payload OCR errors so a good OCR engine cannot hide unsafe localization.

### Safety definitions

**False valid decode:** ground truth is code A, but recognizer + shared decoder produces a different syntactically/check-word-valid code B.

**False Accept:** the product reaches Accept for an output that is not the ground-truth canonical code, or reaches Accept when the expected case has no valid code.

A False Accept is always counted even if the wrong record does not exist on the server. Resolver state is not allowed to hide a recognition failure.

## Promotion rule

The final numerical release gates are frozen in the qualification receipt before the final split is run. They may be derived from pilot/tuning evidence but may not be relaxed after seeing final results.

An engine is ineligible if:

1. it produces any uninvestigated False Accept or unsafe false-pair path;
2. it requires network/cloud inference in the v1 path;
3. it cannot reproduce its result from a pinned version/configuration;
4. its license or redistribution terms are not approved for the shipping use;
5. it leaks raw images, canonical codes, tokens, or private corpus data into logs/telemetry;
6. a required stress bucket or representative platform is missing.

Among eligible engines, choose the engine with the safer false-valid/false-Accept profile first, then usability (clarify/retry/abstain burden), latency, footprint, and operational complexity. Generic OCR benchmark scores are supporting context only.

If no engine qualifies, v1 camera recognition does not ship as an Accept-capable path. Typed entry remains available. Do not lower decoder or privacy requirements to create a winner.

## Receipt

Each run produces a machine-readable receipt validated by `qualification/receipt.schema.json` and a short Markdown report. Metric computation follows `qualification/scoring.md`. Schema validity alone does not make a run pass: the qualification validator also applies the cross-field, arithmetic, sample-coverage, and gate-consistency checks in scoring.md. The receipt contains:

- qualification id and UTC timestamp;
- corpus-manifest hash and sample counts by split/bucket;
- adapter commit, engine/model/runtime version, platform/OS/device class;
- preprocessing and band-mapping configuration hashes;
- zz decoder/spec 003 vector version, wordlist version, and check-word implementation version;
- all required aggregate metrics and per-bucket metrics, including fiducial localization/pairing and payload metrics;
- frozen release thresholds and a result for every required release gate;
- every False Accept/false-valid case by sample_id with disposition;
- dependency/license/security-review disposition;
- PASS, FAIL, INCOMPLETE, or NO_PROMOTION. PASS is valid only for a final-split run with complete sample/bucket coverage, all mandatory metrics, all required gates passing, and no undispositioned False Accept or false-valid case;
- promoted engine, or NO_PROMOTION;
- approver and linked pull request.

Private image bytes are not part of the receipt.

## Change control and rollback

A promoted adapter is pinned. Updating its engine/model/runtime, preprocessing, confidence mapping, or decoder integration requires regression qualification before release. Emergency rollback may return to the last qualified adapter or disable camera Accept and retain typed entry. Rollback never enables a cloud reader.

## Acceptance evidence

ZZ-OCR-QUAL-001 is complete only when the frozen final corpus has been run, the receipt is reproducible, all required buckets and devices are present, every False Accept has a disposition, license/security review is complete, and the promotion/no-promotion decision is recorded.
