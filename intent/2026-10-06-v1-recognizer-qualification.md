# Intent: qualify the v1 camera recognizer

Author: ChatGPT, from Danny's 2026-10-06 recognition research
Date: 2026-10-06
Status: accepted
Accepted-by: Danny in ChatGPT on 2026-10-06 ("Okay let’s spec this out and assimilate into the specs in the repo")
Product: zzThis / zzThat camera capture

## Problem / why now

Spec 004 correctly requires on-device recognition and fail-closed capture, but its accepted v1 build hard-codes Apple Vision on iOS and ML Kit on Android before either recognizer has been qualified against real zz codes. The current spec also treats the recognizer's text/confidence as if the vendor choice were the product contract.

The product invariant is not a vendor. It is: a photographed mark becomes recognition evidence; the shared zz grammar, wordlist, check word, and decision bands decide whether that evidence may resolve.

## Proposed outcome

- Define one engine-neutral RecognitionResult contract at the capture boundary.
- Keep Apple Vision as the iOS v1 baseline.
- Qualify Android ML Kit Text Recognition against PP-OCR on the same private test corpus before promoting either engine.
- Keep raw photos on device in v1. No cloud or server-side vision fallback is enabled.
- Preserve spec 003 as the authority for grammar, wordlist snapping, check-word verification, and vectors.
- Add ZZ-OCR-QUAL-001: an evidence-producing qualification run that measures exact-code accuracy, segment/word accuracy, character error rate, false-valid-decode rate, abstention/clarify/retry rates, and latency.
- Optimize promotion primarily for false-valid-decode behavior. A recognizer may abstain rather than silently emit a different valid code.
- Keep Qwen/VLM fallback and a trained zz-specific recognizer as v2 candidates, not v1 dependencies.

## Constraints

- No raw photo leaves the device in v1.
- No recognizer may query live codes, resolver records, or nearby valid codes to improve a reading.
- Recognizers emit evidence only. They do not own canonicalization, snapping, check-word policy, or acceptance.
- The same shared qualification corpus and expected canonical outputs are used for every engine.
- Test photos contain no faces or personal data and follow the existing Q34 consent decision.
- Adding a runtime dependency to the shipping app still requires normal dependency/security review.

## Stop and ask

Stop before:
- enabling cloud vision or photo upload;
- changing the zz grammar, wordlist, or check-word algorithm;
- changing accepted decision-band thresholds;
- training or shipping a custom model;
- choosing an Android winner without ZZ-OCR-QUAL-001 evidence.

## Non-goals

Cloud OCR, Qwen/VLM inference in v1, custom-model training, voice recognition, changing the code format, or changing resolver semantics.
