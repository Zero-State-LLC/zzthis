# Requirements checklist: 004-capture

Checked 2026-10-04. Capture is not built.

Status note 2026-10-10: the scanner and classifier are implemented in `packages/zz-core` and pass the shared vectors; on-device recognition lives in zzThat and is unqualified. ZZ-OCR-QUAL-001 is in draft PR #89, not on `main`. Release: v1.1 ([RELEASE-ROADMAP](../../RELEASE-ROADMAP.md)).

## Completeness

- [x] Spec has a `## Workflows` section.
- [x] Camera, typing, and voice are named. Voice is out of the first zzThat release (their ZQ10).
- [x] Decision bands and the human confirm step are stated.
- [x] Q18 is resolved to on-device/no-cloud v1 and refined by the fiducial-first qualification work. Q37 prototype thresholds are parameters; final release thresholds are evidence-gated by ZZ-OCR-QUAL-001.
- [ ] No recognizer is implemented.

## Consistency

- [x] A photo leaves the device only for a retry or a hard case.
- [x] Spec 005 `POST /v1/reads` is that retry upload. The vision vendor stays Q18.
