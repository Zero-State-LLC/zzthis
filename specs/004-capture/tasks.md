# Tasks: capture

Feature: [spec.md](spec.md) · Plan: [plan.md](plan.md) · Related issue: #13 (reads on the device; server-side OCR only for retries)
Workflows for every implementing task: anti-slop-code, production-systems, google-developer-style. CI: `ci.yml`, `site-ci.yml`, `free-security-scan.yml`.

## Phase 0: Decisions

- [ ] T001 App scope and platform (Q33). Owner: Michael and Danny.
- [ ] T002 Real-photo test set source and consent (Q34).

## Phase 1: Foundational (after spec 003 T008)

- [ ] T003 Snap-to-wordlist and check-word verification on the client, shared with spec 003.
- [ ] T004 Decision bands: accept, clarify, retry, abstain, with a human confirm step.

## Phase 2: US1 and US2 (P1)

- [ ] T005 Option A camera read on the device.
- [ ] T006 Typed and spoken entry through the same snap and verify path.

## Phase 3: US3 (P2)

- [ ] T007 Retry path: upload photo, cloud read, same snap and verify. Depends on spec 002.

## Phase 4: Benchmark

- [ ] T008 Option B 2-week prototype benchmarked against Option A on the same test set (Q18).
