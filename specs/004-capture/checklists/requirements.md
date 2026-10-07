# Requirements checklist: 004-capture

Checked 2026-10-07. Capture is not built. Recognition architecture refined by the accepted 2026-10-06 v1 recognizer-qualification intent.

## Completeness

- [x] Spec has a `## Workflows` section.
- [x] Camera, typing, and voice are named. Voice remains outside v1.
- [x] Decision bands and human confirmation are stated.
- [x] RecognitionResult separates vendor OCR evidence from zz semantics.
- [x] Apple Vision is the iOS baseline.
- [x] Android ML Kit and PP-OCR are qualification candidates, not simultaneous product authorities.
- [x] ZZ-OCR-QUAL-001 names the shared corpus and required product metrics.
- [x] The manifest schema carries polygon ROI truth for complete visual codes, keyed by ground-truth fiducial pair.
- [x] Serialized adapter results have a strict machine schema and fixture bound to manifest/sample hashes.
- [x] The receipt schema separates tuning/final and per-split bucket metrics; release gates use final-only metrics.
- [x] Frozen gate config binds fiducial IoU and exact CER normalization as well as release thresholds.
- [x] Adapter evidence omits decoder-owned canonical codes and product states; validators replay the pinned shared decoder and verify ground truth.
- [x] PASS requires independently verifiable pre-run and execution attestations; no caller-supplied timestamp can authorize promotion.
- [x] False-valid-decode behavior is explicitly measured and is the primary safety metric for engine promotion.
- [x] Qwen/VLM and custom zz recognizers are deferred to v2.
- [ ] No recognizer is implemented or qualified yet.

## Consistency

- [x] Raw photos stay on device in v1; `photo_reads` remains false.
- [x] Recognizers cannot query live codes or resolver records.
- [x] Spec 003 remains authoritative for grammar, wordlist snapping, near-word handling, check-word verification, and shared vectors.
- [x] The same normalized evidence boundary feeds iOS and Android despite different platform engines.
- [x] Missing recognizer confidence is explicit; adapters cannot invent confidence.
- [x] The existing prototype decision thresholds remain parameters; qualification does not silently rewrite them.
- [x] Android engine promotion requires evidence from the same frozen corpus.

## Fiducial refinement 2026-10-06

- [x] Terminal `zz` markers have a dual role: literal grammar markers and camera fiducial/index marks.
- [x] Camera localization/pairing precedes payload OCR; typed/voice grammar behavior is unchanged.
- [x] Missing endpoints are never inferred from payload plausibility.
- [x] Ambiguous/multiple endpoint pairings remain visible candidates and never use resolver/live-code knowledge for selection.
- [x] Marker confidence is separate from payload-word confidence.
- [x] Qualification measures endpoint precision/recall, pair accuracy, false finders/pairs, ROI/rectification, and downstream decode safety separately.
- [x] Ordinary handwritten/printed `zz` is the v1 format; no new stylized finder glyph is required by this spec.
