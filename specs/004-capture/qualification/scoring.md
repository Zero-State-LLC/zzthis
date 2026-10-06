# ZZ-OCR-QUAL-001 scoring rules

These rules make the qualification harness deterministic. They do not set release thresholds.

## Matching

1. All image boxes use normalized image coordinates in [0,1].
2. A predicted fiducial matches a ground-truth fiducial only when roles match and IoU is at least the threshold frozen in run configuration before the final split.
3. Matching is one-to-one. Choose the assignment that maximizes total IoU. An unmatched prediction is a false finder. An unmatched truth endpoint is a missed endpoint.
4. A predicted pair is correct only when its matched opening and closing endpoints share the same ground-truth pair_id. Otherwise it is a false pair.
5. Multi-code images are scored per ground-truth pair. Merging two codes into one ROI is not correct.

## ROI and rectification

Where ROI ground truth exists, report localization overlap/error before rectification and rectification success separately from payload OCR errors.

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

## Final split discipline

Evaluate the final split once per frozen adapter/configuration candidate. A code or configuration change after viewing final results creates a new candidate and receipt. Previous receipts remain immutable evidence.
