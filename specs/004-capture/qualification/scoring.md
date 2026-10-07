# ZZ-OCR-QUAL-001 scoring rules

These rules make the qualification harness deterministic. They do not set release thresholds.

## Matching

1. All image boxes use normalized image coordinates in [0,1].
2. A predicted fiducial matches a ground-truth fiducial only when roles match and IoU is at least the threshold frozen in run configuration before the final split.
3. Matching is one-to-one. Choose the assignment that maximizes total IoU. An unmatched prediction is a false finder. An unmatched truth endpoint is a missed endpoint.
4. A predicted pair is correct only when its matched opening and closing endpoints share the same ground-truth pair_id. Otherwise it is a false pair.
5. Multi-code images are scored per ground-truth pair. Merging two codes into one ROI is not correct.

## ROI and rectification

Where ROI ground truth exists, report polygon localization IoU/error before rectification and rectification success separately from payload OCR errors. Match predicted and ground-truth ROIs by fiducial `pair_id`; assignments are one-to-one. If a manifest case requires ROI truth and it is absent, the manifest is invalid. If a prediction or metric is unavailable, record the explicit null/not-measured reason; do not silently omit the metric.

## Text and code scoring

1. Preserve raw recognizer text for CER and part scoring.
2. Exact-code accuracy compares the final canonical code with ground truth.
3. CER uses Levenshtein edit distance over expected versus observed payload text, excluding the two structural boundary markers. Record the metric normalization in run configuration.
4. Count false-valid decode when the final decoded code is valid but differs from ground truth.
5. Count False Accept whenever product state is Accept and the selected canonical code is not ground truth, or the sample has no valid ground-truth code.
6. Multiple candidates are not an error by themselves when the product requires a person to pick. Score them against expected band constraints and pair accuracy.

## Aggregation

Report overall and per stress bucket: numerator, denominator, and rate for every rate metric; endpoint precision/recall; complete-pair detection; pair accuracy; false finders/pairs; exact-code and part/word accuracy; CER; false-valid and False Accept; band distribution; median and p95 latency.

Compute overall rates from overall numerators and denominators. Do not average bucket percentages.

## Input and receipt consistency checks

The validator applies these checks in addition to JSON Schema:

1. The adapter-result `manifest_sha256` equals the exact manifest byte hash. Every manifest `sample_id` appears exactly once in results, no other sample appears, and each result's image hash equals that manifest entry.
2. Each `roi_truth.pair_id` maps to a complete ground-truth opening/closing fiducial pair in that sample. Polygon points and boxes remain within the normalized image; the scorer rejects geometry extending outside the image.
3. `split_counts`, aggregate sample counts, and per-bucket counts reconcile to the manifest and result set. Every required final bucket is present; missing coverage is INCOMPLETE.
4. For every rate, numerator and denominator match the counted observations; rate is numerator / denominator, or null only when denominator is zero. Count fields equal the corresponding case lists. Band counts sum to sample count.
5. Every False Accept and false-valid case is listed by `sample_id` with expected/observed values and a non-empty reviewer disposition. No undispositioned case is allowed in PASS.
6. The frozen release-gate configuration hash and final-split manifest hash match the run inputs. The gate freeze timestamp precedes final-split execution. Every required gate has exactly one result and its observed value/comparator/threshold recompute to the recorded result.
7. PASS is valid only for a non-empty final split, complete schema-valid evidence, full required-bucket coverage, passing release gates, zero False Accepts, and approved dependency/license, privacy, security, and qualification reviews. The approver, promoted engine, and linked PR must be present. Otherwise the only valid disposition is FAIL, INCOMPLETE, or NO_PROMOTION, with no promoted engine.
8. Results are evaluated offline. The validator must not resolve codes over the network or use server state to alter any metric.

## Final split discipline

Evaluate the final split once per frozen adapter/configuration candidate. A code or configuration change after viewing final results creates a new candidate and receipt. Previous receipts remain immutable evidence.
