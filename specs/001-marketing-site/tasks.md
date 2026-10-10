# Tasks: zzThis marketing site and scripted demo

Feature: [spec.md](spec.md) · Plan: [plan.md](plan.md)
Workflows for every implementing task: anti-slop-code, production-systems, google-developer-style (stop-slop for copy). CI: `ci.yml`, `site-ci.yml`, `free-security-scan.yml`, `pages.yml` (deploy).

`[x]` means done and OBSERVED on `main` (d721783, 2026-10-03). `[P]` means the task can run in parallel with other `[P]` tasks in the same phase.

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
- [ ] T009 [P] Add Daniel Meyer's profile URL and accomplishments, and Adam Fry's link, when supplied (Q10, Q12). Adam's specialty, bio, and photo, Jim White's removal, and Ridham Bhagat's removal (2026-10-06, Danny approved 2026-10-07) are done. Blocked on Michael.

## Phase 5: US4, Demo (P2)

- [x] T010 Remove "Did you mean" suggestions from Flow B. A miss returns "No match" without revealing codes. Update `src/lib/resolver.ts`, `src/content/demo.ts`, tests, and `docs/SPEC.md` Section 4.4. Closes issue #12. Depends on Q20 only for wording; the security rule already stands (constitution III).
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

## Phase 6b: Public repo hygiene

- [x] T019 Remove research targets and pitch-only text from the repo and site (Q24 RESOLVED [OPERATOR 2026-10-02]). The founder card now shows Michael's founder origin.

## Phase 8: Michael's 2026-10-02 shared-folder deltas

- [x] T020 Comparison: four cards (Barcode, QR code, Alphanumeric code, zzThis) and the row "Easy to say and remember", with 1 / 2 / 4 columns and subgrid row alignment at 900 px.
- [x] T021 Comparison note under the cards, both sentences, small and muted, full width (Q41).
- [x] T022 Founder role set to "Founder, system architecting, and project lead."
- [x] T023 Codes written by hand: removed the three unused photos and render four real photos in a 2x2, including the two capital-ZZ photos (Q42).
- [x] T024 check-dist standalone-ZZ rule, no uppercase-inside-code rule, per Q42.
- [x] T025 Applied Michael's answers Q41-Q47 as given.

## Phase 9: Michael's OneDrive update 2026-10-02b

- [x] T026 Home Top ways block inside section 01 (1 / 2 / 3 columns).
- [x] T027 Applications galleries and the Card frame variant (`object-fit: contain`, width cap).
- [x] T028 New images are WebP. The applications set is about 0.6 MB.

## Phase 10: v1 spec redeepen 2026-10-03

- [x] T029 Move Flow B to the v1 grammar (`docs/SPEC.md` Section 2.2a): replace or wrap `src/lib/grammar.ts` with the spec 003 library (003 T013), add the B5 bare-mark state and the per-reason B4 lines in Section 4.4, and run every G9 vector as a test (Section 8 item 30). Keep 100% coverage. Closes the divergence in Section 4.4.
- [ ] T030 Image display rule (FR-019, Q53 issue #39): audit every AI-generated site image for a capital-letter zz mark, on its own or in a code, and regenerate any that show one. The real photos `hw-mark-on-object`, `hw-dog-collar-tag`, and `app-truck-after` stay as they are (Michael, 2026-10-03: "keep them"). Never AI-edit a real photo.
- [x] T031 Q54 (issue #40): Michael answered "No" on 2026-10-03, so `src/content/uses.ts` and `src/content/applications.ts` keep the blockchain and ledger items as given. No change.
- [x] T032 Fix stale status in the specs: checklist Flow B and Section 7 items, `main` pins, success-criteria count, SPEC Section 3.2 Q2 note, SPEC header and Section 7 (this PR).
- [x] T033 Ship the v1.0 hero H1 (Q62) with the B v1.0 `src/` implementation PR, not PR #50: set `src/content/hero.ts` title to "Barcodes made things scannable. zzThis makes things readable-writable - and smart." (spaced hyphen, no em dash) and update the H1 wording in `tests/content.test.ts` and any H1 string check in `scripts/check-dist.mjs` to match. Wording only: do not relax the validator. `scripts/check-dist.mjs` keeps failing on any em dash in rendered text, and the no-em-dash test stays as is (FR-006, Q62 [DANNY 2026-10-03, revised: "Fix the em dashes"]). Until then, the live site and CI keep the Q47 "writable - and smart." wording.

## Phase 11: Direction B v1.0 (accepted 2026-10-03)

Reference: `docs/redesign-2026-10-03/b-resolver-v1/`. Copy and layout: `docs/SPEC.md` Section 3.1b. Workflows: anti-slop-code, production-systems, google-developer-style.

- [x] T034 Record direction B in spec 001 and the Section 3.1b copy blocks, including the v1.0 change-list lines and the prototype microcopy, before editing `src/`.
- [x] T035 Self-host IBM Plex Sans Condensed and Hebrew through `@fontsource`. Ship Korean and Japanese as committed woff2 subsets of the glyphs the language examples use, not the full `@fontsource` faces. No other origin at runtime.
- [x] T036 Rebuild Home, About, and Applications in the B layout. Move header, footer, theme toggle, and tokens to that system on every page. Leave How it works, demo, contact, and 404 content as they are.
- [x] T037 Home console: `src/lib/grammar.ts` and `src/lib/resolver.ts` unchanged, exact match only, coming-later note for letters outside A–Z, simulated camera and voice, reduced motion.

## Phase 12: Michael's 2026-10-07 changes

Intent: `intent/2026-10-07-michael-content-changes.md`. Copy and layout: `docs/SPEC.md` Sections 3.2 (H.1b, H.8, H.9), 3.5, 3.8, 5.1, and 5.5; decision D-2026-10-07-01.

- [x] T038 Home: only "zz" orange in both anatomy headings; the markers paragraph ending; "zz- In - any - language -zz"; the "About and people" H2 at the "Contact" H2 size; the Home contact email at about half size.
- [x] T039 About: zzthis.com in place of zzthing.com with the header's theme-aware zzThis wordmarks, the commercial-use line, and the new label; the lowercase zzThat wordmark; the founder bio and Hacker Dojo paragraph replaced as given.
- [x] T040 About: Omer F. Yalcin as the fifth advisor, with headshot, LinkedIn link, and Michael's role line; content test updated to the new order.
- [x] T041 All pages: dark by default for every visitor; the toggle switches the current page to light; nothing stored (FR-022).
- [ ] T042 Replace Omer's bio and closing line with Michael's wording if he sends it (Q72, issue #116).
- [ ] T043 `/demo` "Current prototypes": swap zzthing.com for zzthis.com only if Michael says so (Q73, issue #117).
- [ ] T044 zzThat app parity (FR-022, `docs/SPEC.md` Section 5.5): the apps default to dark and use the lowercase zzThat wordmark wherever one appears. The change lands in the zzThat specs and apps, tracked on the zzThis + zzThat board.

## Phase 13: Michael's 2026-10-08 header changes

Intent: `intent/2026-10-08-michael-nav-demo.md`. Spec: `docs/SPEC.md` Sections 3.1, 5.2, and 5.5, acceptance item 3; FR-002; decision D-2026-10-08-01.

- [x] T045 Top menu: Demo between Applications and About, the footer's order (`src/content/navigation.ts`, `NavKey` gains `demo`); `/demo` passes `current="demo"`; the content test checks the new order.
- [x] T046 Header: menu links about 30% larger (`calc(var(--text-sm) * 1.3)`), header height unchanged at 64 px; `.nav__mark { flex-shrink: 0 }` so the logo never shrinks; full menu from 64rem, checked at 1024 px.

## Phase 14: zzthis.com cutover (issue #6)

Decision D-2026-10-08-02 in `docs/SPEC.md`; Section 6, Hosting; acceptance item 28. Danny said yes on 2026-10-08.

- [x] T047 Root base: `astro.config.mjs` sets `site` to `https://zzthis.com` and the default `base` to `/`, keeping the `ASTRO_BASE` override; `scripts/check-dist.mjs` defaults to `/` and fails on a leftover `/zzthis/` path or a `zero-state-llc.github.io` link; tests cover the config and both bases.
- [ ] T048 Cutover: Michael's DNS records live and verified, Danny sets the Pages custom domain, the T047 PR merges right away, Enforce HTTPS once the certificate is issued, then check `https://zzthis.com`, the `www` redirect, and the `zero-state-llc.github.io/zzthis/` redirect. Owner: Danny.

## Phase 16: Michael's 2026-10-08 About image set (v2)

Intent: `intent/2026-10-08-michael-kathy-found-dog.md`. Spec: `docs/SPEC.md` Sections 2.1, 3.1a, 3.5, and 3.8; FR-023; decision D-2026-10-08-04. (Phase 15 is #125.)

- [x] T052 About, "Codes written by hand": Michael's v1 pair under the four real photos, replaced by T054.
- [ ] T053 Ask Michael about the collar tag: in all three Kathy images the corgi's red tag shows a capital-letter zz, carried over from the real photo `hw-dog-collar-tag`. Renders Michael supplies may show it (`docs/SPEC.md` Section 2.2), but images we generate stay lowercase (Section 2.2a G7, FR-019). If these count as generated, regenerate them with a lowercase zz on the tag. Owner: Michael.
- [x] T054 About, Michael's v2 set (replaces the T052 pair): three concept images in order, card, phone scan, community board with the phone (`public/images/handwritten/hw-kathy-found-dog.webp`, `hw-kathy-phone.webp`, `hw-kathy-board-phone.webp`; `src/content/images.ts` entries with status `concept`; `aboutPage.handwrittenSetCaption` and `aboutPage.handwrittenSetZzPage` in `src/content/contact.ts`; `.hw-pair` in `src/pages/about.astro` and `src/styles/b-about.css`). Each about 2/3 the height of a photo above; one row from 64rem; on phones the first two side by side, the board underneath, then the explainer. The zzPage address zzpage.com/zz/Kathy-found-dog is plain text, not a link. Checked at 1280 px and 390 px, dark and light.
