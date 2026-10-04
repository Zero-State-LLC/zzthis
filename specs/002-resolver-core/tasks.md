# Tasks: resolver core

Feature: [spec.md](spec.md) · Plan: [plan.md](plan.md) · Issue: #13 (prototype), #12 (no live-code hints)
Workflows for every implementing task: anti-slop-code, production-systems, google-developer-style. CI: `ci.yml`, `site-ci.yml`, `free-security-scan.yml`.

## Phase 0: Decisions (blocking)

- [ ] T001 Decide where the resolver code lives (Q29) and the signing-key approach (Q28). Owner: Danny.
- [ ] T002 Decide the first code formats (Q27). Owner: Michael and Danny.

## Phase 1: Setup

- [ ] T003 Worker project skeleton with lint, typecheck, and tests wired into the existing CI. Depends on T001.
- [ ] T004 Portable SQL schema and migrations for the five tables in the plan.

## Phase 2: Foundational

- [ ] T005 Signing of record versions and verification helpers. Depends on T001.
- [ ] T006 Append-only audit writer used by every handler.

## Phase 3: US1, resolve (P1)

Depends on spec 003 T010 (grammar library).

- [ ] T007 `GET /resolve/{code}`: re-parse with the spec 003 grammar library, exact match on the canonical form, role-scoped view, one not-found shape (FR-011, FR-013). Tests for unknown, used, expired, and revoked codes returning the same shape; for case, separator, and circled variants resolving the same; for `malformed` (FR-014) and the bare mark (FR-015); and a timing comparison between not-found cases.
- [ ] T017 Error-state contract tests: one test per row of the spec's Error states table.

## Phase 4: US2 and US3, issue, update, revoke (P1)

- [ ] T008 `POST /codes` with single use and expiry; stored form is canonical (FR-013); concurrent single-use resolve test (US1 acceptance 6). Word choice uses the library from spec 003 once it exists; until then, a fixture wordlist marked as test data.
- [ ] T009 `POST /records/{id}/versions` and `POST /codes/{id}/revoke`. Tests that a failed signature or audit write stores nothing (FR-018) and that expiry is exclusive at `expires_at`.
- [ ] T018 Handle issuance (FR-016): authenticated owner only, uniqueness in canonical form, 409 without revealing the owner. Depends on Q56 for anything beyond the default.

## Phase 5: US4, audit (P2)

- [ ] T010 `GET /audit` restricted to audit roles.

## Phase 6: Security polish

- [ ] T011 Rate limits per client, role, and code (numbers from spec 005).
- [ ] T012 One automated test per abuse case: copied mark, replay, enumeration, unauthorized update, malformed input. Each test states its pass condition before it runs; for example, an enumeration attempt only ever gets the FR-011 response and hits the rate limit. ADVERSARY reviews.
- [ ] T013 Human-gated deploy to a Cloudflare prototype environment. Needs Danny's yes and a named workflow file.

## Later

- [ ] T014 US5 no-device linking after Q25 is answered.
- [ ] T015 Partner authentication after Q19 is answered.
- [ ] T016 Per-tenant suggestion policy (FR-012): off by default, blocked for high-security tenants, with tests for both. Details after Q40 is answered.
