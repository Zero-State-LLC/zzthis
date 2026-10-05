# Tasks: wordlist and check word

Feature: [spec.md](spec.md) · Plan: [plan.md](plan.md) · Issue: #14
Workflows for every implementing task: anti-slop-code, production-systems, google-developer-style. CI: `ci.yml`, `site-ci.yml`, `free-security-scan.yml`.

## Phase 0: Decisions

- [x] T001 Choose the candidate word source and confirm its license (Q32). Done on #74: the EFF long wordlist, CC BY 3.0 US (spec.md, Prototype defaults).
- [x] T002 Set the target list size (Q31) and first formats (Q27). Done on #74: the proto-v0 filter yield, at least 1,000 words, and two data words plus a check word (spec.md, Prototype defaults).

## Phase 1: Setup

- [ ] T003 Library package layout and tests in the existing CI.

## Phase 1b: US3, v1 text grammar (P1, unblocked)

- [ ] T010 Grammar parser per `docs/SPEC.md` Section 2.2a: normalization G2, markers G3, parts G4, count G5, reason order G6. Pure function, no I/O (FR-015).
- [ ] T011 Test table: every G9 vector as a named test, plus property tests for idempotence, case and separator invariance, and linear time (US3 acceptance 2 to 4). 100% line and branch coverage, as for `src/lib/*` today.
- [ ] T012 Word or field classifier that takes the wordlist as input (FR-015), with the near-word check and the `confirm` class (FR-021). Every G1a vector is a named test, plus a property test that a part at distance 1 from list word w returns w as its first candidate, and no other candidate is at distance 1 (Levenshtein, FR-003). Uses the G1a fixture list, marked as test data.
- [ ] T013 Replace the demo parser: `src/lib/grammar.ts` calls or becomes the T010 library (001 T029). The library lives in this repo until Q29 says otherwise.

## Phase 2: US1, pipeline and yield report (P1)

Unblocked: T001 and T002 are done (#74). Spec 005 T029 runs this pipeline in the one-shot build. T004 and T014 can also run on a fixture list.

- [ ] T004 Filter: edit distance of at least 3 between every pair.
- [ ] T005 Filter: homophones out. Depends on Q35.
- [ ] T006 Filter: distinct letter shapes when handwritten. Depends on Q35.
- [ ] T007 Yield report: counts after each filter and the gap to the needed size, in the fields and formats in the spec's Data rules. Deterministic output (FR-019).
- [ ] T014 Output-list check (FR-016): the final list is lowercase `a` to `z`, unique, and has no `zz`, `fn`, or `run`. A failure fails the run. The source list is not checked against FR-016; filters 1 and 3 remove what breaks it. The run also fails when the source SHA-256 does not match the spec.

## Phase 3: US2, check word (P1)

- [ ] T008 Check word compute and verify, with tests for the error classes from Q30, the four results in FR-018, and the US2 acceptance scenarios. Records the list version (FR-017). The one-wrong-word test is exhaustive or property-based over the whole list per FR-020; a fixed sample of codes does not close this task.

## Phase 4: Polish

- [ ] T009 Publish the final list and the report in the repo once licensing allows.
