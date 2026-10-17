# Decision records, 2026-10-16

## D-2026-10-16-01 Scry as the R-B12 server vision candidate (PROPOSED: Danny)

- **Question.** Can Scry, Zero State's local Qwen-vision document reader (private repo `Zero-State-LLC/scry`, PR #1 merged 2026-10-13), be the OCR engine for zzThis and zzThat, and where does it fit?
- **Evidence.**
  - Scry reads scans, photos, and IDs with Qwen3.8 vision models on self-hosted GPUs: the DGX Spark (SGLang) and the AMD box (llama.cpp). On its 187-document holdout it scored 99.8% of fields correct on the Spark and 99.9% on the AMD box.
  - It has not been measured on handwritten zz codes.
  - v1 and v1.1 are on-device only and never upload a photo, crop, or transcript: spec 004 FR-005, Q18, and zzThat FR-005.
  - Spec 004 already reserves the slot: plan.md names a "Hard-case VLM: Qwen-class or equivalent vision model behind the same recognition boundary, v2 research only", and task T017 says to evaluate one "only as a hard-case verifier behind RecognitionResult".
  - The Worker has the `PhotoReader` port behind `POST /v1/reads`, disabled (`photo_reads: false`).
- **Recommendation.** Scry is the server-VLM candidate in research phase R-B12. It is not part of v1.0 or v1.1, in either the apps or the server.
  1. **R-B12 research (no product path).** Add a "zz code" mode to Scry: given an ROI crop, it returns the engine's ordered text hypotheses and confidence only when the model gives it. zz grammar and the check word stay in the shared decoder, never in the engine. A research adapter wraps that mode as a `RecognitionResult` in the ZZ-OCR-QUAL-001 harness (spec 004 T017). Runs use the private Q34 corpus on Zero State's own GPUs only, never a third-party cloud. The receipt is compared with Apple Vision and ML Kit on the same frozen manifest, with the false-valid rate first.
  2. **R-B12 exit (Danny).** Promote Scry to v2.2 scope only if its receipt is eligible and it helps the hard cases that the on-device engines Retry or Abstain on, without raising false Accepts. Otherwise reject it, as R-B12 allows.
  3. **v2.2 (only after that exit).** A Worker `PhotoReader` backed by Scry serves the retry photo read (RM-092). It needs:
     - the inference host decision (RM-129);
     - consent (RM-117);
     - zzThat's hard-case "send this photo" flow behind `photo_reads`;
     - the 30-day photo retention already written in the privacy draft;
     - an availability rule: when the reader is down, `POST /v1/reads` answers abstain, never a guess.
- **Alternatives.** (a) Use Scry in v1.1 as a cloud fallback. Rejected: it breaks the locked no-upload rule and store privacy answers already drafted. (b) Fine-tune a small on-device model (Option B). This stays the other R-B12 arm. (c) A hosted third-party VLM. Rejected for research, because the corpus is private.
- **Consequences.** RM-128 (research adapter and Scry zz mode) and RM-129 (inference host decision) enter BACKLOG under R-B12 and v2.2. RM-092 names Scry as its candidate reader. No v1.0 or v1.1 change.
- **Revisit when.** Michael wants hard-case reading at launch, or the on-device engines fail qualification (then v1.1 ships confirm-only, D-2026-10-13-05, and R-B12 becomes more urgent).
