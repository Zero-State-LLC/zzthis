# Tasks: wordlist and check word

Feature: [spec.md](spec.md) · Plan: [plan.md](plan.md) · Issue: #14
Workflows for every implementing task: anti-slop-code, production-systems, google-developer-style. CI: `ci.yml`, `site-ci.yml`, `free-security-scan.yml`.

## Phase 0: Decisions

- [ ] T001 Choose the candidate word source and confirm its license (Q32).
- [ ] T002 Set the target list size (Q31) and first formats (Q27).

## Phase 1: Setup

- [ ] T003 Library package layout and tests in the existing CI.

## Phase 2: US1, pipeline and yield report (P1)

- [ ] T004 Filter: edit distance of at least 3 between every pair.
- [ ] T005 Filter: homophones out. Depends on Q35.
- [ ] T006 Filter: distinct letter shapes when handwritten. Depends on Q35.
- [ ] T007 Yield report: counts after each filter and the gap to the needed size.

## Phase 3: US2, check word (P1)

- [ ] T008 Check word compute and verify, with tests for the error classes from Q30.

## Phase 4: Polish

- [ ] T009 Publish the final list and the report in the repo once licensing allows.
