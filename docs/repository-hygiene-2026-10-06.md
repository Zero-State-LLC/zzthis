# Repository hygiene audit — 2026-10-06

Scope: documentation/source-of-truth hygiene, collaboration metadata, recognition/privacy consistency, and visible repository controls. This audit does not claim access to every GitHub organization or repository setting.

## Observed

- README, CONTRIBUTING, CODEOWNERS, pull-request template, CI, specs, intent records, and a proprietary LICENSE are present.
- `SECURITY.md` was missing and is added by this audit.
- No TODO/FIXME/HACK/XXX markers were returned by repository code search.
- Five pull requests are open at audit time: #82, #84, #85, #88, and #89. #89 is the recognition-spec branch carrying this audit.
- README status on `main` is stale relative to current workspace work: it still says the product behind the site/demo is not built. PR #88 is already dedicated to README/workspace synchronization, so this audit does not create a competing README rewrite.
- spec 004 on `main` and the accepted 2026-10-04 one-shot intent still name Apple Vision + ML Kit directly. PR #89 intentionally refines that engine lock behind ZZ-OCR-QUAL-001 while preserving the no-cloud v1 privacy invariant.
- Legacy cloud-read API/spec/test surfaces remain in spec 005 and Worker tests, but v1 advertises `photo_reads: false` and the route is `not-ready`. They are dormant contract/future-path surfaces, not authorization to upload v1 photos.
- `.github/dependabot.yml` is not present. This audit does not enable dependency automation or repository security settings without an explicit settings decision.

## Hygiene rules applied

1. Status text must distinguish implemented, verified, deployed, and production-ready.
2. Specs and intent records outrank README summaries when they disagree.
3. Historical decisions remain historical; superseding decisions should link forward rather than rewrite history.
4. Raw scan photos stay on device in v1.
5. Wrong-but-valid recognition is treated as a security-relevant failure mode.
6. Generated/private qualification artifacts do not belong in the public repository.
7. Open PRs with overlapping documentation scope should be reconciled before merge, not independently rewrite the same source-of-truth text.

## Follow-up

- Merge/reconcile #88 before changing README status again.
- Review #82/#84/#85 for ordering and overlap before merging #89.
- After #89 merges, advance zzThat's zzThis pin in its normal sync PR.
- Decide separately whether to enable Dependabot, secret scanning/push protection, code scanning, private vulnerability reporting, and repository rules. Their state is not established by files in the tree.
