# Tasks: capture

Feature: [spec.md](spec.md) · Plan: [plan.md](plan.md) · Related issue: #13 (reads on the device; server-side OCR only for retries)
Workflows for every implementing task: anti-slop-code, production-systems, google-developer-style. CI: `ci.yml`, `site-ci.yml`, `free-security-scan.yml`.


## Status reconciliation

This is the original capture decomposition. V1 boundaries and server/client integration were consolidated under spec 005/zzThat. Voice, trained-reader work, and the Option B benchmark remain deferred. Unchecked boxes are **not** a reliable current-status list. Use [TRACEABILITY](../TRACEABILITY.md) and current product specs before scheduling work.

Reconciled 2026-10-10: T001 and T002 are decided (Q33, Q34). T003 and T009 are implemented for text in `packages/zz-core` (`classify.ts`, `scanner.ts`, vectors); their camera parts and T004, T005, and T006 belong to zzThat (v1.1, BACKLOG RM-060 to RM-065). T007 is superseded by Q18 for v1 (RM-092, v2.2). T008 is research phase R-B12.
## Phase 0: Decisions

- [ ] T001 App scope and platform (Q33). Owner: Michael and Danny.
- [ ] T002 Real-photo test set source and consent (Q34).

## Phase 1: Foundational (after spec 003 T008)

- [ ] T003 Snap-to-wordlist and check-word verification on the client, shared with spec 003. Every reading goes through the spec 003 grammar library first (FR-008); handle and field parts are not snapped (FR-010), and a part counts as a field part only after the near-word confirm step (FR-015), tested with the `docs/SPEC.md` G1a vectors.
- [ ] T004 Decision bands: accept, clarify, retry, abstain, with a human confirm step. One test per trigger row in the spec's Decision bands table, with thresholds as parameters until Q37.
- [ ] T009 Multi-line and multi-code reads (FR-009, FR-014); bare mark, non-ASCII, and reserved-symbol handling (FR-011, FR-012); running-text scan (FR-013).

## Phase 2: US1 and US2 (P1)

- [ ] T005 Option A camera read on the device.
- [ ] T006 Typed and spoken entry through the same snap and verify path.

## Phase 3: US3 (P2)

- [ ] T007 Retry path: upload photo, cloud read, same snap and verify. Depends on spec 002.

## Phase 4: Benchmark (v1 exit gate)

- [ ] T008 Option B 2-week prototype benchmarked against Option A on the same test set (Q18). The result decides whether the v2 trained-reader track starts (`docs/SPEC.md` Section 12). Training and shipping our own model beyond this benchmark is v2.
