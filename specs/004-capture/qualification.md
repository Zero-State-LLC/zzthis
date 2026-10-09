# ZZ-OCR-QUAL-001: v1 recognizer qualification protocol

Status: normative qualification protocol. No engine is promoted by this document alone.
Parent: [spec 004](spec.md) · [plan](plan.md) · [tasks](tasks.md)
Machine contracts: [corpus manifest schema](qualification/manifest.schema.json) · [device-matrix schema](qualification/device-matrix.schema.json) · [adapter-result schema](qualification/adapter-result.schema.json) · [sealed candidate-bundle schema](qualification/candidate-bundle.schema.json) · [frozen gate-config schema](qualification/gate-config.schema.json) · [pre-run attestation schema](qualification/pre-run-attestation.schema.json) · [execution attestation schema](qualification/execution-attestation.schema.json) · [receipt schema](qualification/receipt.schema.json) · [scoring rules](qualification/scoring.md) · synthetic fixtures in `qualification/`

## Purpose

Qualify a platform OCR adapter for handwritten and printed zz codes without moving zz semantics into the OCR engine. The result is an evidence receipt that another engineer can reproduce from the same corpus manifest, adapter build, decoder version, and configuration.

## Authority boundary

The recognizer may emit text, confidence when meaningful, geometry, and provenance. It may not canonicalize a zz code, snap to the wordlist, verify the check word, query the resolver, query live codes, or decide Accept/Clarify/Retry/Abstain. Those operations belong to the shared decoder defined by specs 003 and 004.

## Corpus contract

The qualification corpus is private. The repository stores only a manifest schema, synthetic/non-sensitive fixtures, aggregate results, and hashes needed for reproducibility. Raw private photographs never enter Git, pull-request attachments, Actions artifacts, logs, crash reports, analytics, or model-training sets.

One corpus manifest contains both tuning and final samples. Each sample is validated by `qualification/manifest.schema.json` and identifies its split. This whole-corpus form lets the validator check writer isolation across both splits before accepting final results. Each sample has:

| Field | Rule |
|---|---|
| sample_id | Opaque stable identifier with no person name |
| split | `tuning` or `final`; the corpus manifest contains both values |
| asset_sha256 | Hash of the exact image bytes |
| consent_class | team-made, synthetic, or separately-approved |
| writer_group | Pseudonymous writer group used for split isolation |
| device_class | Device/camera class, not a personal device identifier |
| ground_truth_codes | Per-candidate `pair_id`, literal payload without boundary markers, canonical code when valid, and kind; partial/invalid candidates retain literal text with a null canonical code |
| case_kind | valid-word, field, handle, partial, bare, invalid, multi-code, or no-code |
| stress_tags | Zero or more controlled stress buckets |
| fiducials | Expected opening/closing endpoint boxes or `none`; pair membership for multi-code images |
| roi_truth | Expected payload ROI polygon for each complete visual code, keyed by the ground-truth fiducial `pair_id`; required for complete visual cases |
| expected_band_constraints | Allowed product states when the sample is intentionally ambiguous |
| notes | Non-identifying qualification notes only |

### Split rules

1. Split by writer group, not by image, so one writer cannot leak into both tuning and final qualification.
2. Freeze the whole corpus manifest and its hash before comparing candidate engines.
3. Freeze a separate gate-config file, bound to that exact manifest hash, before evaluating the final split. It sets minimum sample counts for each split, minimum counts for each canonical required stress bucket, numeric release thresholds, fiducial IoU threshold, and CER normalization.
4. Freeze one `device-matrix.json` conforming to `device-matrix.schema.json`, with pseudonymous matrix-entry IDs, exact OS versions/device classes, and a positive minimum sample count per entry. Freeze one `candidate-bundle.json` conforming to `candidate-bundle.schema.json`; its `device_matrix_sha256` is SHA-256 of the matrix's RFC 8785 JCS canonical bytes. The bundle identifies the exact adapter artifact, engine/runtime, platform, preprocessing and confidence mapping, plus decoder commit, wordlist, check-word implementation, vectors, and band mapping. Its own identity is SHA-256 over its JCS canonical bytes. Obtain the signed pre-run attestation defined by `pre-run-attestation.schema.json`; it binds that bundle hash and the exact manifest and gate-config hashes, and must be published with an independently verifiable timestamp before final evaluation. Caller-entered `frozen_at_utc` values are not accepted.
5. The trusted evaluation workflow must verify successful pre-run publication before starting the final evaluation process; it emits an unsigned execution-attestation JSON payload bound to the same candidate-bundle hash, pre-run attestation, exact device-matrix hash, exact adapter-results hash, and UTC start/finish claims. The allowlisted workflow itself captures start immediately before and finish immediately after the evaluation process, using its trusted runner clock; it accepts no caller-provided timestamps. Sign the exact JCS bytes as a detached Sigstore Cosign blob and retain the standard Sigstore bundle as a separate artifact. Every sample result identifies a matrix entry and repeats its OS/device class; the validator checks those values against the frozen matrix and enforces its per-entry sample minimum. The verifier checks both bundles under the trust and identity policy below and confirms the signed start claim follows the verified pre-run Rekor timestamp. The receipt's adapter/decoder identities and device-coverage rows must reconcile to the sealed bundle/matrix. Any missing or mismatched identity, or unverifiable signature bundle, forces INCOMPLETE, never PASS.
6. Do not tune thresholds, preprocessing, prompts, or decoder rules on the final split.
7. Any post-freeze change to the manifest, gate config, adapter, model/version, preprocessing, decoder, wordlist, check-word implementation, or band mapping invalidates that engine receipt and requires a new run.
8. Synthetic images can broaden stress coverage but cannot be the only evidence for handwriting promotion.

### Attestation signing and publication policy

**Decision:** sign each complete, unsigned attestation payload with Sigstore Cosign keyless blob signing. Canonicalize the entire payload with the [JSON Canonicalization Scheme (RFC 8785)](https://www.rfc-editor.org/rfc/rfc8785.html); the detached signature and standard Sigstore bundle are separate files and are not fields in the signed JSON. Retain the bundle bytes alongside the evidence packet and record their exact SHA-256 hashes and references in the receipt.

- Verification uses the Sigstore public-good instance and its TUF-managed trust root, bootstrapped from verifier software/policy independent of candidate inputs. The verifier policy itself is pinned from protected `main` before a run; it must allowlist the exact GitHub Actions OIDC issuer (`https://token.actions.githubusercontent.com`) and the qualification workflow identity on protected `refs/heads/main`. A broad repository-only identity is insufficient. If the exact workflow identity or trust policy is absent, the run is INCOMPLETE.
- Require a valid signature, identity/issuer match, Rekor signed entry timestamp, and inclusion proof for each attestation. The pre-run bundle's verified Rekor integrated time is the publication/freeze time. The trusted workflow must gate final-process start on pre-run publication, record start/finish from its runner clock rather than inputs, and bind those claims in the execution payload; `started_at_utc` must be later than the pre-run Rekor time, and the execution bundle timestamp must be no earlier than signed `finished_at_utc`. Keep both bundles for offline verification. A caller-supplied time or URI alone is never evidence.
- RFC 3161 timestamp authority tokens are not required for this v1 qualification policy. If a legal or external assurance requirement later calls for an independent TSA, that is a separate trust-policy change.

Sigstore's documented flow uses short-lived identity-bound certificates and a transparency log; bundles carry material needed to verify the artifact and log evidence after signing. See [Sigstore signing overview](https://docs.sigstore.dev/cosign/signing/overview/), [bundle format](https://docs.sigstore.dev/about/bundle/), and [security model](https://docs.sigstore.dev/about/security/).

## Stress matrix

The final set covers terminal-fiducial localization and pairing plus ordinary handwriting and print, low contrast, glare, blur, motion blur, rotation, distance, flat two-line payloads, multiple codes, partial/occluded fiducials, false `zz` marks in surrounding text, ambiguous endpoint pairing, unequal endpoint size, running text, confusable characters, near-word cases, invalid/reserved characters, no-code images, handles, and field-code parts. Pairing is same-baseline-only; the versioned candidate bundle freezes the baseline tolerance and hard maximum counts for fiducial and pair candidates before final evaluation. Exceeding a cap must produce a whole-frame fail-closed result: no truncation/ranking and no payload OCR. The v1 adapter may crop and rotate an ROI, but perspective/projective rectification is unsupported. Perspective-dependent, curved/wrapped-surface, and candidate-overflow samples are required **fail-closed safety probes**, not supported-geometry OCR accuracy cases. Their safe-refusal/no-OCR evidence is scored separately; they remain in the corpus. Any probe that invokes payload OCR, emits payload candidates, or reaches Accept makes the result `NO_PROMOTION`, independent of other aggregate metrics; any False Accept on them also blocks the run. They do not inflate or reduce supported-geometry OCR accuracy denominators. Flat two-line payloads remain supported when both markers form a valid same-baseline pair and the interior ROI is safe. `manifest.schema.json` defines canonical stress tags; `clean` and `single-code` are descriptive coverage tags, not stress requirements. `gate-config.schema.json` requires every canonical stress bucket and freezes a positive minimum sample count for each before the final split; the receipt records each minimum and observed count. A missing or under-count bucket makes the run incomplete, not passing.

## Adapter input and output

Input is one still image plus immutable adapter configuration. Camera qualification measures two separable stages: (A) terminal-`zz` fiducial detection/pairing and safe ROI localization/crop-or-rotation normalization, then (B) payload recognition. Same-baseline tolerance, candidate caps, and any permitted orientation-normalization parameters are immutable candidate-bundle inputs and must be frozen before the final split. The adapter must not apply perspective/projective rectification. Native platform types are serialized at the harness boundary using [adapter-result.schema.json](qualification/adapter-result.schema.json); [fixture-adapter-results.json](qualification/fixture-adapter-results.json) demonstrates the wire shape. Each result binds to `sample_id`, its tuning/final split, the manifest's image hash, and one frozen device-matrix entry. The whole-manifest and matrix hashes must match exactly, and every required `(device_matrix_entry_id, sample_id)` pair must occur exactly once; missing, duplicate, extra, split-mismatched, environment-mismatched, or hash-mismatched results make the run INCOMPLETE. Coordinates are normalized to the original image after orientation normalization, with origin at top-left. The adapter emits evidence only: fiducials, geometry, raw payload candidates, confidence evidence, and timing. It must not supply decoded codes, canonical codes, validity, or product state. For a safety-probe sample or a frame over a candidate cap, it must record the unsupported/overflow disposition and produce no payload candidates. The harness derives decoder outputs through the pinned shared local decoder and band mapping.

Qualification exercises the recognizer on every complete **predicted** pair independently, keyed to the adapter's `pair_id`, including all predicted pairs in multi-code samples. This is measurement coverage, not runtime behavior: in the app, payload OCR waits for a human selection whenever more than one plausible complete pair remains, as required by FR-020/FR-021. Qualification must not use ground-truth pair identity to choose which ROI to OCR, and runtime must not use qualification's all-pair reads to bypass selection. A pair with unusable or unsafe geometry is recorded as such and is not payload-OCRed.

The adapter-result contract must record:

- engine id and exact engine/model/runtime version;
- platform and OS version;
- preprocessing version and parameters;
- detected fiducial regions, endpoint role/pairing evidence, and detection score when meaningful;
- ROI/polygon, orientation/baseline, and crop/rotation normalization provenance when used; any transform must be non-projective (a perspective/projective transform is invalid for this v1 contract);
- candidate payload text in original recognizer order;
- confidence semantics, including "not available";
- geometry/line provenance when exposed;
- elapsed recognition time measured by the harness.
- exact device-matrix entry ID, OS version, and device class for each sample result; no personal device identifier.

When an adapter emits multiple text hypotheses for one ROI, `candidates` preserves the engine's original result order; the harness must not reorder by confidence or decoder outcome. For a pair with more than one hypothesis, the product outcome is `CLARIFY` and presents the hypotheses in that preserved order; it never silently selects a decoder-valid or ground-truth-matching candidate. Zero hypotheses follow the configured retry/abstain policy. Qualification's primary OCR accuracy uses the first engine-ordered hypothesis (top-1); all-hypothesis coverage may be reported descriptively but is not a release gate. Ground truth is used only for scoring, never to select a candidate or determine runtime behavior.

No network access is allowed during a v1 qualification read or decoder replay. Verification of detached pre-run/execution attestations is a separate offline validation step using trust roots pinned before the candidate run.

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
ROI_LOCALIZED -> RETRY        ROI unsafe or crop/rotation normalization unsupported
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
- ROI localization overlap/error and safe crop/rotation normalization success where ground truth exists;
- exact canonical-code accuracy;
- part/word accuracy;
- character error rate;
- false-valid-decode count and rate;
- Accept/Clarify/Retry/Abstain counts and rates;
- false Accept count and rate;
- no-code false-positive count;
- wrapped-code and multi-code behavior;
- median and p95 adapter latency for every frozen device-matrix entry, separately for tuning and final;
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

The final numerical release gates are frozen in a separate `gate-config.json` validated by `gate-config.schema.json`, then bound by a signed pre-run attestation before final-split execution. It includes the exact required gate-id set, thresholds, the fiducial IoU threshold, CER normalization, minimum tuning/final sample counts, and minimum counts for every required bucket. The receipt has exactly one final-split result for each required gate id and no others. Gates may be derived from pilot/tuning evidence but may not be relaxed after seeing final results. A post-result edit requires a new config hash, a new pre-run attestation, and a new candidate run; a caller-supplied or backdated timestamp is not evidence.

The false-valid-decode gate is quantitative: every wrong-but-valid top-1 observation is counted under the frozen scoring denominator, and every reported false-valid case requires a non-empty reviewer disposition. A dispositioned case does not independently force NO_PROMOTION when the measured final rate is within the frozen threshold; exceeding that threshold fails the gate and prevents promotion. The false-Accept limit remains zero.

An engine is ineligible if:

1. it produces any uninvestigated False Accept or unsafe false-pair path;
2. it requires network/cloud inference in the v1 path;
3. it cannot reproduce its result from a pinned version/configuration;
4. its license or redistribution terms are not approved for the shipping use;
5. it leaks raw images, canonical codes, tokens, or private corpus data into logs/telemetry;
6. a required stress bucket or representative platform is missing.

Among eligible engines, choose the engine with the safer false-valid/false-Accept profile first, then usability (clarify/retry/abstain burden), latency, footprint, and operational complexity. The final p95 latency gate is the maximum of each frozen matrix entry's final-split p95; every entry must meet the frozen threshold, so aggregate performance cannot hide a slow device class. Generic OCR benchmark scores are supporting context only.

If no engine qualifies, v1 camera recognition does not ship as an Accept-capable path. Typed entry remains available. Do not lower decoder or privacy requirements to create a winner.

## Receipt

Each run produces a machine-readable receipt validated by `qualification/receipt.schema.json` and a short Markdown report. Metric computation follows `qualification/scoring.md`. Schema validity alone does not make a run pass: the qualification validator verifies the canonical candidate-bundle and device-matrix hashes, signed pre-run and execution attestations, and exact receipt-to-bundle/matrix identity equality, then applies cross-field, arithmetic, writer-isolation, sample-coverage, and gate-consistency checks. The receipt contains:

- qualification id, candidate id, and UTC timestamp;
- whole-corpus manifest hash and sample counts by split/bucket;
- sealed candidate-bundle hash and adapter artifact/commit, engine/model/runtime version, platform, and device-matrix hash;
- one device-coverage row per frozen matrix entry with OS version, device class, required/observed sample counts, and complete tuning/final metric sets (including per-entry p50/p95 latency);
- preprocessing and band-mapping configuration hashes;
- zz decoder/spec 003 vector version, wordlist version, and check-word implementation version;
- separate tuning/final aggregate metrics and per-split bucket metrics, including fiducial localization/pairing and payload metrics; release gates use final-only metrics;
- pre-run and execution attestation references/hashes plus separate Sigstore bundle references/hashes, the bound gate-config hash, verified pre-run Rekor freeze timestamp, required bucket minima and observed counts, frozen IoU/CER parameters, all thresholds, and a result for every required final-only release gate;
- every False Accept/false-valid case keyed by device-matrix entry, sample, and pair (pair may be null only for sample-level/no-code False Accepts), with expected/observed values and disposition;
- dependency/license/security-review disposition;
- PASS, FAIL, INCOMPLETE, or NO_PROMOTION. PASS is valid only for a final-split run with writer-isolated splits, complete sample/bucket coverage, all mandatory metrics, all required gates passing, and no undispositioned False Accept or false-valid case;
- promoted engine, or NO_PROMOTION;
- approver and linked pull request.

Private image bytes and per-sample private corpus data are not part of the receipt or attestation. The publication record contains hashes and candidate identity only.

## Change control and rollback

A promoted adapter is pinned. Updating its engine/model/runtime, preprocessing, confidence mapping, or decoder integration requires regression qualification before release. Emergency rollback may return to the last qualified adapter or disable camera Accept and retain typed entry. Rollback never enables a cloud reader.

## Acceptance evidence

ZZ-OCR-QUAL-001 is complete only when the frozen final corpus has been run, the receipt is reproducible, all required buckets and devices are present, every False Accept has a disposition, license/security review is complete, and the promotion/no-promotion decision is recorded.
