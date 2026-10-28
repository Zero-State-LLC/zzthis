# Analysis, 2026-10-19: OCR spec audit against the read-path research

**Kind:** analysis. Not a decision source. Decisions are in [decisions-2026-10-19.md](decisions-2026-10-19.md).

Scope: every spec, decision, and task that governs reading, markers, the check word, the confirm flow, privacy and offline behavior, and qualification. It covers zzThis `040b8c3` (specs 003 and 004, `docs/SPEC.md`, the constitution) and zzThat `6057c80` (spec 001, KANBAN, T028). The research behind it was an OCR read-path audit on synthetic renders plus the team's governed photos. No private photo, crop, or transcript is reproduced here. A model-assisted review of the specs was part of the audit; it saw spec text only.

Labels: OBSERVED (read in the tree), INFERRED (follows from observed text), SYNTHETIC (measured on rendered images, not handwriting).

| ID | Severity | Finding | Where | Label | Resolution |
|---|---|---|---|---|---|
| A1 | Critical | Correction against the list and check word is required (constitution III, FR-003, FR-006, SPEC 2.5) and also forbidden (no selection or reordering by validity). | `docs/SPEC.md` 2.5; `qualification/scoring.md` item 8; zzThat `recognition-adapter.md` step 7 | OBSERVED | Declared decoder layer, FR-026 (PENDING P-2); interim rule in scoring item 8 |
| A2 | Critical | False valid on negatives is never gated. Under confirm-only, camera Accept cannot happen, so the zero-False-Accept gate tests nothing in v1.1. | `qualification.md` safety definitions; scoring item 5 | OBSERVED | Negative false valid, scoring 5a; D-2026-10-19-01 |
| A3 | Critical | zzThat #102 selects a reading because it passes the check word and runs a full-frame fallback OCR. | zzThat #102 (`CapturePipeline.swift`, `VisionRecognitionAdapter.swift`) | OBSERVED | Interim rule; zzThat FIX-PLAN packet 2 (PENDING P-3) |
| A4 | High | PASS needs zero false-valid cases, but other text and the code allow dispositioned cases within the threshold. | scoring item 10 vs `qualification.md` promotion rule | OBSERVED | Aligned to the threshold rule |
| A5 | High | Eligibility rejects only an "uninvestigated" False Accept; the limit is zero elsewhere. | `qualification.md` eligibility 1 | OBSERVED | "any False Accept" |
| A6 | High | No statistical floor: a small final split can PASS. | `qualification.md` split rules | OBSERVED | Split rule 9; D-2026-10-19-02, -03 |
| A7 | High | Handwritten `zz` read as `22` is a missing marker (Retry); no tolerant-marker rule exists. | `docs/SPEC.md` G3, G10 | OBSERVED | FR-024 (PENDING P-1) |
| A8 | High | With `(d1 + 2·d2) mod N`, any two words fix the third, so a decoder without a per-part floor can always complete a valid code. SYNTHETIC: a loose gate gave 17% false valid on random triples; a per-part floor gave 1 in 400. | spec 003 check word | OBSERVED / SYNTHETIC | FR-026 (2) per-part floor |
| A9 | High | zzThat #96 merged with an open review P1: box count is taken as proof of hyphen boxes, which can create a false pair. | zzThat `VisionRecognitionAdapter.swift` | OBSERVED | zzThat T023d |
| A10 | Medium | Adapters expose top-1 only; no provenance or UI rule for decoder output. | `qualification.md` multi-hypothesis rule | OBSERVED | FR-025 |
| A11 | Medium | The eight fixed gates have no negative or false-finder gate; the set is fixed in protocol, schema, and code. | scoring gate list; gate-config and receipt schemas; `scripts/ocr-qualification-gates.mjs` | OBSERVED | `ZZ-OCR-QUAL-002`, one pull request |
| A12 | Medium | Release app builds bundle `fixture-7`; only the server refuses it in production. | zzThat `project.yml`, `build.gradle.kts` | OBSERVED | D-2026-10-19-08; spec 003 test list row |
| A13 | Medium | The Android classify fallback is `proto-v0`; production mints only `prod-v1`. | zzThat `ReadPipeline.kt` | OBSERVED | D-2026-10-19-05 |
| A14 | Medium | A `fixture-7` test code was used as handwriting evidence; no rule keeps fixture codes out of bench denominators. | audit evidence | OBSERVED | Split rule 9 |
| A15 | Medium | The online creation check does not say what it sends. | spec 004 FR-017 | INFERRED | Code only; D-2026-10-19-06 |
| A16 | Medium | VLM status is scattered, and D-2026-10-16-01 was still PROPOSED. | `docs/SPEC.md` 10.3; Q18; T017 | OBSERVED | D-2026-10-19-04 |
| A17 | Medium | No x-height, upscale, or rotate-before-OCR rule. | `qualification.md` adapter input; zzThat `recognition-adapter.md` | OBSERVED | FR-027 |
| A18 | Medium | US1-4 and FR-016 wording block a whole-code offer that the person picks. | spec 004 US1-4, FR-016, Clarify row | OBSERVED | Amended, PENDING P-2 |
| A19 | Medium | "Nothing leaves the device" is false on Android (ML Kit diagnostics). | zzThat `decisions.md` | OBSERVED | Claim boundaries; D-2026-10-19-09 |
| A20 | Medium | Top-N could flood Clarify with raw strings. | `qualification.md` multi-hypothesis rule | INFERRED | D-2026-10-19-07 |
| A21 | Low | zzThat FR-025 calls the accepted confirm-only band rule "proposed". | zzThat spec 001 | OBSERVED | Fixed in zzThat |
| A22 | Low | The zzThat contract says "rectification", which v1 bans. | zzThat `recognition.md` | OBSERVED | Fixed in zzThat |

## Residual risks of the amendments

The largest is a person confirming a decoder offer that is one word away from what was written (class N3). Mitigations: no preselection, changed parts marked, engine text shown, and N3 in the negative gate. Others: `22` in quantities or field codes (exact-first and outer-end rules, N1 and N7, a kill rule for `22`), decoders over small lists (allowlist, N ≥ 1,000), and Clarify fatigue (Release stays top-1 until measured).
