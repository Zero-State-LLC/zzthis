# Decision records, 2026-10-19: OCR read-path spec audit

Status:
- D-2026-10-19-01 to -09 are **ADOPTED** as recommended (Danny, 2026-10-19).
- D-2026-10-19-10 to -16 are **PROPOSED: Prabu**, who owns zz semantics. Spec text that depends on them is marked `PENDING P-n (default: …)`.

Evidence: [analysis-2026-10-19-ocr-spec-audit.md](analysis-2026-10-19-ocr-spec-audit.md). Intent: [`intent/2026-10-19-ocr-spec-assimilation.md`](../intent/2026-10-19-ocr-spec-assimilation.md).

## Adopted (Danny, 2026-10-19)

| ID | Audit ref | Decision |
|---|---|---|
| D-2026-10-19-01 | D-1 | Negative false valid (classes N1 to N7, at least 3,000 final items per device-matrix entry) is the primary v1.1 safety gate. Adding it is a protocol version change (`ZZ-OCR-QUAL-002`): schemas, `scripts/ocr-qualification-gates.mjs`, the scoring pipeline, and receipt semantics change in one pull request. |
| D-2026-10-19-02 | D-2 | The threshold applies to the one-sided 95% upper bound: at most 0.1% pooled per device-matrix entry and at most 1% per class, plus a per-writer maximum gate. |
| D-2026-10-19-03 | D-3 | Bench: at least 60 final writers and at least 30 tuning writers, writer-disjoint; 60 positives and 60 negatives per final writer; at least 10% left-handed; three pen types. |
| D-2026-10-19-04 | D-4 | D-2026-10-16-01 is accepted with a narrower scope: any VLM is v2 only, and only as a tiebreaker among decoder offers, capped at Clarify. Cloudflare Clef and other third-party hosts are never used on the private corpus. An online VLM is opt-in and off by default. |
| D-2026-10-19-05 | D-5 | The Android classify fallback becomes `prod-v1` when that list exists. Until then, a release build treats a fallback list as no match. |
| D-2026-10-19-06 | D-6 | The FR-017 online uniqueness check sends the decoded canonical code only. |
| D-2026-10-19-07 | D-7 | Clarify shows per-word candidates and decoder offers; it does not list raw rank-2+ engine strings. |
| D-2026-10-19-08 | D-8 | `fixture-7` is removed from release app bundles. It is bundled only in Debug, Local, and Demo, and Demo uses it for exact lookup only. |
| D-2026-10-19-09 | D-9 | Public claim boundaries as written in `specs/004-capture/qualification.md`. |

## Proposed (Prabu)

| ID | Audit ref | Question | Recommended default |
|---|---|---|---|
| D-2026-10-19-10 | P-1 | Is `marker-confusion-v1` = {`zz`, `z2`, `2z`, `22`}, used for camera detection only, an allowed reading of G3/G10? | Yes, with exact markers first, outer ends only, and a Clarify cap; drop `22` on any tolerant false pair in the final negatives |
| D-2026-10-19-11 | P-2 | May a declared decoder layer offer whole check-valid codes on the Confirm screen? | Allow: Clarify only, at most 3 offers or none, a per-part floor, no part filled from the check equation; flag off in Release until the bench passes |
| D-2026-10-19-12 | P-3 | zzThat #102's check-valid fallback | Recast it so the span read is a second ordered hypothesis that goes to Clarify |
| D-2026-10-19-13 | P-4 | Lists identified by (version, SHA-256) on a per-release allowlist; no decoder below N = 1,000 | Yes |
| D-2026-10-19-14 | P-5 | Negative classes N5 and N7 as worded in scoring 5a | Yes |
| D-2026-10-19-15 | P-6 | A write check that reads a tolerant pair | Ask the person to rewrite the end marks as `zz`; never pass |
| D-2026-10-19-16 | P-7 | Meaning of "snapped" | Per-part candidates plus decoder offers when enabled; never an automatic replacement |

Revisit when: the bench reports, or Prabu changes any default.
