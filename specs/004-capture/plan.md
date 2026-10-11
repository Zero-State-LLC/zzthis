# Plan: capture

Feature: [spec.md](spec.md). Status: proposal. Full comparison in `docs/SPEC.md` Section 10.8.

## Workflows (copied from the spec)

anti-slop-code, production-systems, google-developer-style. CI: `ci.yml`, `site-ci.yml`, `free-security-scan.yml`.

## Technical context

| Item | Choice | Status |
|---|---|---|
| Option A | Off-the-shelf vision: on-device model first where good enough, cloud vision for retries and hard cases | Recommended to ship first [OPERATOR 2026-10-02]. The cloud part is superseded by Q18: no cloud reader in v1 |
| Option B | Fine-tuned small model (for example TrOCR-small or a small vision-language model with LoRA) trained on the closed wordlist. The list size was settled by Q31 (the proto-v0 yield). | 2-week benchmark first [OPERATOR 2026-10-02]; research phase R-B12 |
| Training data for B | Synthetic renders of the wordlist with blur, warping, and tape and cardboard textures, then real photos | [OPERATOR 2026-10-02] |
| Retry photo storage | R2 (spec 002 plan) | [OPERATOR 2026-10-02] |
| App platform | iOS and Android together in zzThat; the web client is typing only | RESOLVED (Q33) |

## Dependencies

- Spec 003 wordlist and check word are required before snapping can work.
- Spec 002 resolver is required for end-to-end reads.
