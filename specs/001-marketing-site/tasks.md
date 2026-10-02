# Tasks: zzThis marketing site and scripted demo

Feature: [spec.md](spec.md) · Plan: [plan.md](plan.md)
Workflows for every implementing task: anti-slop-code, production-systems, google-developer-style (stop-slop for copy). CI: `ci.yml`, `site-ci.yml`, `free-security-scan.yml`, `pages.yml` (deploy).

`[x]` means done and OBSERVED on `main` (40dfa3b). `[P]` means the task can run in parallel with other `[P]` tasks in the same phase.

## Phase 1: Setup

- [x] T001 Astro project, base `/zzthis/`, Node 24, lockfile, lint, typecheck, test, and build scripts.
- [x] T002 Pages deploy workflow `pages.yml`; required `build` check from `ci.yml`.

## Phase 2: Foundational

- [x] T003 Content model in `src/content/*.ts` with image metadata.
- [x] T004 Design tokens and card system (`src/styles/tokens.css`, `base.css`).
- [x] T005 `scripts/check-dist.mjs` build checks.

## Phase 3: US1 and US2, Home and Applications (P1)

- [x] T006 Home sections in Section 3.1a order; Applications page.
- [x] T007 Michael's 2026-10-02 answers: hero em dash, lowercase code as text, concept labels, panel placement (PR #16).

## Phase 4: US3, About (P2)

- [x] T008 Founder origin, advisor cards with bios and supplied links (PR #16).
- [ ] T009 [P] Add Daniel Meyer's profile URL and Adam Fry's specialty, bio, and link when supplied (Q10, Q12). Blocked on Michael.

## Phase 5: US4, Demo (P2)

- [ ] T010 Remove "Did you mean" suggestions from Flow B. A miss returns "No match" without revealing codes. Update `src/lib/resolver.ts`, `src/content/demo.ts`, tests, and `docs/SPEC.md` Section 4.4. Closes issue #12. Depends on Q20 only for wording; the security rule already stands (constitution III).
- [ ] T011 [P] Align demo handling verbs once Q21 is answered.

## Phase 6: US5, Contact (P1)

- [x] T012 Contact page, footer email, About contact card.

## Phase 7: Polish

- [ ] T013 [P] Refresh `docs/screenshots/` (they show the 2026-10-01 build).
- [ ] T014 [P] Add automated checks for acceptance criteria 15 to 19 (contrast, reduced motion, Lighthouse goals, no cross-origin requests at runtime), or mark them manual in the checklist.
- [ ] T015 Replace hero panel b with a real photo if Michael answers Q23 with yes.
- [ ] T016 Add "Try zzThat" to the nav when the app launches (FR-016).
- [ ] T017 Build `/technology` once it has the draft text plus an example, with an H1 distinct from "How it works" and wording checked against spec 002 (Q14, FR-010).

## External dependencies (not code)

- [ ] T018 Issue #11: confirm xTechSearch eligibility and registrations; go or no-go by 2026-10-12. Owner: Danny. The site is one of the submission materials.

## Phase 6: Public repo hygiene

- [ ] T019 Danny decides whether to remove or relocate the research material: `docs/SPEC.md` Section 2.7, the NSF figures in the Section 10.8 data row, the NSF-sourced founder bio, and the "Current stage" line on About (Q24). Owner: Danny. See `specs/analysis-2026-10-02.md`.
