# ZZ-OCR-QUAL-001 scoring rules

These rules make the qualification harness deterministic. They do not set release thresholds.

## Matching

1. All image boxes use normalized image coordinates in [0,1].
2. A predicted fiducial matches a ground-truth fiducial only when roles match and IoU is at least the threshold frozen in run configuration before the final split.
3. Matching is one-to-one. Choose the assignment that maximizes total IoU. An unmatched prediction is a false finder. An unmatched truth endpoint is a missed endpoint.
4. A predicted pair is correct only when its matched opening and closing endpoints share the same ground-truth pair_id. Otherwise it is a false pair.
5. Multi-code images are scored per ground-truth pair. Every `ground_truth_codes` entry is keyed by `pair_id` and carries the literal payload used for CER/part scoring plus the canonical code when valid. Merging two codes into one ROI is not correct.

## ROI and rectification

Where ROI ground truth exists, report polygon localization IoU/error before rectification and rectification success separately from payload OCR errors. Match predicted and ground-truth ROIs by fiducial `pair_id`; assignments are one-to-one. If a manifest case requires ROI truth and it is absent, the manifest is invalid. If a prediction or metric is unavailable, record the explicit null/not-measured reason; do not silently omit the metric.

## Text and code scoring

1. Preserve raw recognizer text for CER and part scoring.
2. Exact-code accuracy compares each decoded code with the canonical truth having the same `pair_id`; an unkeyed or cross-paired comparison is invalid.
3. CER uses Levenshtein edit distance between each candidate's original recognizer text and the `literal_payload` for the same `pair_id`, excluding the two structural boundary markers. Partial and invalid cases retain literal payload truth even when `canonical_code` is null. Record the metric normalization in the frozen gate config.
4. Count false-valid decode when the final decoded code is valid but differs from ground truth.
5. Count False Accept whenever product state is Accept and the selected canonical code is not ground truth, or the sample has no valid ground-truth code.
6. Multiple candidates are not an error by themselves when the product requires a person to pick. Score them against expected band constraints and pair accuracy.

## Aggregation

Report overall and per stress bucket: numerator, denominator, and rate for every rate metric; endpoint precision/recall; complete-pair detection; pair accuracy; false finders/pairs; exact-code and part/word accuracy; CER; false-valid and False Accept; band distribution; median and p95 latency.

Compute overall rates from overall numerators and denominators. Do not average bucket percentages.

## Input and receipt consistency checks

The validator applies these checks in addition to JSON Schema:

1. The gate config's `manifest_sha256` and adapter-result `manifest_sha256` equal the exact whole-corpus manifest byte hash. Every manifest `sample_id` appears exactly once in results, no other sample appears, each result's split equals its manifest split, and each result's image hash equals that manifest entry.
2. The set of `writer_group` values in tuning is disjoint from the set in final. Any overlap invalidates the corpus and makes the run INCOMPLETE.
3. Every ground-truth code entry has a unique `pair_id` within its sample. Complete truth pairs map to exactly one opening and closing fiducial. Each `roi_truth.pair_id` maps to a complete ground-truth fiducial pair, and each complete visual pair has exactly one ROI truth. Polygon points and boxes remain within the normalized image; the scorer rejects geometry extending outside the image.
4. `split_counts`, aggregate sample counts, and per-bucket counts reconcile to the manifest and result set. Each split meets `minimum_samples_by_split`. The frozen gate config must require every canonical stress bucket, each with a positive minimum count, and the observed final count for each required bucket must meet that minimum. Missing or under-count coverage is INCOMPLETE.
5. For every rate, numerator and denominator match the counted observations; rate is numerator / denominator, or null only when denominator is zero. Count fields equal the corresponding case lists. Band counts sum to sample count.
6. Every False Accept and false-valid case is listed by `sample_id` with expected/observed values and a non-empty reviewer disposition. No undispositioned case is allowed in PASS.
7. `release_gates.gate_config_sha256` and both receipt manifest hashes match the exact frozen inputs. `frozen_at_utc` precedes final-split execution; the final split is not evaluated before the freeze. Every required gate has exactly one result and its observed value/comparator/threshold recompute to the recorded result.
8. PASS is valid only for a non-empty final split, disjoint writer groups, complete schema-valid evidence, all required bucket minima met, passing release gates, zero False Accepts, and approved dependency/license, privacy, security, and qualification reviews. The approver, promoted engine, and linked PR must be present. Otherwise the only valid disposition is FAIL, INCOMPLETE, or NO_PROMOTION, with no promoted engine.
9. Results are evaluated offline. The validator must not resolve codes over the network or use server state to alter any metric.

## Final split discipline

Evaluate the final split once per frozen adapter/gate-config candidate. A corpus, gate config, code, or configuration change after viewing final results creates a new candidate and receipt. Previous receipts remain immutable evidence.
