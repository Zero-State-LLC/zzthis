# Requirements checklist: 004-capture

Checked 2026-10-06. Capture is not built. Recognition architecture refined by the accepted 2026-10-06 v1 recognizer-qualification intent.

## Completeness

- [x] Spec has a `## Workflows` section.
- [x] Camera, typing, and voice are named. Voice remains outside v1.
- [x] Decision bands and human confirmation are stated.
- [x] RecognitionResult separates vendor OCR evidence from zz semantics.
- [x] Apple Vision is the iOS baseline.
- [x] Android ML Kit and PP-OCR are qualification candidates, not simultaneous product authorities.
- [x] ZZ-OCR-QUAL-001 names the shared corpus and required product metrics.
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
