# ZZ-OCR-QUAL-001 scoring rules

These rules make the qualification harness deterministic. They do not set release thresholds.

## Matching

1. All image boxes use normalized image coordinates in [0,1].
2. A predicted fiducial matches a ground-truth fiducial only when roles match and IoU is at least `thresholds.fiducial_iou_threshold` in the frozen gate config. The value is greater than 0 and at most 1, and cannot be selected after final results are viewed.
3. Matching is one-to-one. Choose the assignment that maximizes total IoU. An unmatched prediction is a false finder. An unmatched truth endpoint is a missed endpoint.
4. A predicted pair is correct only when its matched opening and closing endpoints share the same ground-truth pair_id. Otherwise it is a false pair.
5. Multi-code images are scored per ground-truth pair. Every `ground_truth_codes` entry is keyed by `pair_id` and carries the literal payload used for CER/part scoring plus the canonical code when valid. Merging two codes into one ROI is not correct.

## ROI and rectification

Where ROI ground truth exists, report polygon localization IoU/error before rectification and rectification success separately from payload OCR errors. Match predicted and ground-truth ROIs by fiducial `pair_id`; assignments are one-to-one. If a manifest case requires ROI truth and it is absent, the manifest is invalid. If a prediction or metric is unavailable, record the explicit null/not-measured reason; do not silently omit the metric.

## Text and code scoring

1. Preserve raw recognizer text for CER and part scoring.
2. Exact-code accuracy compares each decoded code with the canonical truth having the same `pair_id`; an unkeyed or cross-paired comparison is invalid.
3. CER uses Levenshtein edit distance between each candidate's recognizer text and the `literal_payload` for the same `pair_id`; both fields contain payload text only, without the structural boundary markers. The frozen gate config pins `cer_normalization` to `nfc-code-points-v1`: normalize both strings to Unicode NFC and count Unicode code points without case-folding, trimming, whitespace collapsing, punctuation removal, or wordlist correction. Partial and invalid cases retain literal payload truth even when `canonical_code` is null. Any other normalization requires a new protocol version.
4. Count false-valid decode when the final decoded code is valid but differs from ground truth.
5. Count False Accept whenever product state is Accept and the selected canonical code is not ground truth, or the sample has no valid ground-truth code.
6. Multiple candidates are not an error by themselves when the product requires a person to pick. Score them against expected band constraints and pair accuracy.

7. Candidate order is the recognizer's returned order and is immutable through serialization. Do not sort by confidence, validity, wordlist proximity, or ground truth. If one ROI has more than one text hypothesis, runtime disposition is `CLARIFY` and the UI presents hypotheses in the preserved order; no hypothesis is silently selected. The primary OCR accuracy uses only the first (top-1) hypothesis. Any all-hypothesis coverage metric is descriptive and cannot satisfy a release gate. Ground truth is scorer-only and must not affect candidate ordering, selection, or runtime state.

## Aggregation

Report separate `tuning` and `final` metric sets. Each set reports overall and per-stress-bucket: numerator, denominator, and rate for every rate metric; endpoint precision/recall; complete-pair detection; pair accuracy; false finders/pairs; exact-code and part/word accuracy; CER; false-valid and False Accept; band distribution; median and p95 latency. Every bucket metric record carries its split. Never merge or average split metrics. Release-gate observations, False Accept/false-valid dispositions, and pass/fail decisions are computed from the final split only; tuning metrics are descriptive and cannot contribute to release gates.

Compute overall rates from overall numerators and denominators. Do not average bucket percentages.

## Input and receipt consistency checks

The validator applies these checks in addition to JSON Schema:

1. The gate config's `manifest_sha256` and adapter-result `manifest_sha256` equal the exact whole-corpus manifest byte hash. Every manifest `sample_id` appears exactly once in results, no other sample appears, each result's split equals its manifest split, and each result's image hash equals that manifest entry.
2. The set of `writer_group` values in tuning is disjoint from the set in final. Any overlap invalidates the corpus and makes the run INCOMPLETE.
3. Every ground-truth code entry has a unique `pair_id` within its sample. Complete truth pairs map to exactly one opening and closing fiducial. Each `roi_truth.pair_id` maps to a complete ground-truth fiducial pair, and each complete visual pair has exactly one ROI truth. Polygon points and boxes remain within the normalized image; the scorer rejects geometry extending outside the image.
4. Before final execution, canonicalize the frozen candidate-bundle JSON as RFC 8785 JSON Canonicalization Scheme (JCS) and hash those canonical bytes with SHA-256. Verify a signed pre-run attestation against a verifier trust root pinned independently of the candidate. It binds the exact manifest, gate-config, and candidate-bundle hashes and has an independently verifiable publication timestamp/reference. Verify the signed execution attestation binds the same bundle hash, pre-run hash, and exact adapter-results hash; its trusted start time must follow the pre-run publication time. `signature` covers the attestation object serialized as JCS, excluding only the `signature` property. For other input files, hash exact bytes. Caller-supplied `frozen_at_utc` values are not evidence. Missing, invalid, mismatched, untrusted, or backdated attestations make the run INCOMPLETE. The trust-root and publication mechanism must be selected and documented before a PASS is possible.
5. `split_counts`, per-split aggregate sample counts, and per-split bucket counts reconcile to the manifest and result set. Each split meets `minimum_samples_by_split`. The frozen gate config must require every canonical stress bucket, each with a positive minimum count, and the observed final count for each required bucket must meet that minimum. Missing or under-count coverage is INCOMPLETE.
6. For every rate in each split, numerator and denominator match counted observations; rate is numerator / denominator, or null only when denominator is zero. Count fields equal the corresponding case lists. Band counts sum to that split's sample count.
7. Every final-split False Accept and false-valid case is listed by `sample_id` with expected/observed values and a non-empty reviewer disposition. No undispositioned case is allowed in PASS.
8. `receipt.candidate_bundle_sha256`, pre-run/execution attestation hashes, gate-config hash, and manifest hashes match the exact frozen inputs. Candidate id and bundle hash agree across the bundle, both attestations, and receipt. Every adapter/decoder identity field in the receipt equals the sealed bundle, including artifact, engine/config/preprocessing/confidence-mapping, device-matrix, wordlist/check-word, vectors, and band-mapping hashes. `release_gates.frozen_at_utc` is copied from the verified pre-run attestation, not supplied by the caller. Receipt `run_id`, `started_at_utc`, and `finished_at_utc` equal the signed execution attestation fields, whose trusted start time follows the pre-run publication time. `required_gate_ids` equals the protocol's fixed set exactly, and `gate_results` contains each id exactly once with `split: final`; its observed value/comparator/threshold recompute to the recorded result using the gate-config threshold mapping and pinned IoU/CER normalization parameters.
9. Adapter input contains evidence only. The harness derives decoded codes, canonicalization, validity, and product state by replaying every candidate through the exact pinned spec-003 parser/decoder, wordlist, check-word implementation, vectors, and spec-004 band mapping. For each valid manifest truth entry, the validator reconstructs the marked candidate from `literal_payload`, parses it with that same pinned decoder, and requires equality with `canonical_code`; any mismatch invalidates the manifest and makes the run INCOMPLETE.
10. PASS is valid only for a non-empty final split, disjoint writer groups, complete schema-valid evidence, verified matching attestations, all required bucket minima met, passing final-only release gates, zero final False Accepts, and approved dependency/license, privacy, security, and qualification reviews. The approver, promoted engine, and linked PR must be present. Otherwise the only valid disposition is FAIL, INCOMPLETE, or NO_PROMOTION, with no promoted engine.
11. Results are evaluated offline. The validator must not resolve codes over the network or use server state to alter any metric.

## Final split discipline

Freeze the manifest, gate config, adapter candidate, and decoder identity in a verifiable signed pre-run attestation before final execution. The trusted execution attestation binds the exact results and start time. Evaluate the final split once per sealed candidate. A corpus, gate config, code, or configuration change after viewing final results creates a new candidate and receipt. Previous attestations and receipts remain immutable evidence. A caller-entered timestamp or hash without verifiable publication and signature can never support PASS.

The required gate IDs and threshold mapping are fixed by protocol: `false-accept-count` → `max_false_accept_count` (`lte`); `false-valid-decode-rate` → `max_false_valid_decode_rate` (`lte`); `endpoint-recall` → `min_endpoint_recall` (`gte`); `pair-accuracy` → `min_pair_accuracy` (`gte`); `exact-code-accuracy` → `min_exact_code_accuracy` (`gte`); `character-error-rate` → `max_character_error_rate` (`lte`); `rectification-success-rate` → `min_rectification_success_rate` (`gte`); and `p95-latency-ms` → `max_p95_latency_ms` (`lte`). The validator rejects omitted, duplicate, unknown, or tuning-split gate results, as well as a comparator or threshold inconsistent with this mapping.
