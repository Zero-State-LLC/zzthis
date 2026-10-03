# Requirements checklist: 001-marketing-site

Checked 2026-10-02 against `main` at 40dfa3b and the live site; status rows refreshed 2026-10-03 at d721783. Items map to `docs/SPEC.md` Section 8.

## Completeness

- [x] Spec has a `## Workflows` section naming workflows and CI files.
- [x] Each user story has acceptance scenarios.
- [x] Out of scope is stated.
- [ ] Every OPEN question has an owner and a default. Q21 to Q23, Q53, and Q54 still need Michael. Q48 and Q49 are resolved (issues #33, #34).

## Verification status of Section 8 criteria

| Item | Check | How verified |
|---|---|---|
| 1, 23, 24, 25 | Routes, base-path links, 404, no service worker | Automated: `check-dist.mjs` |
| 2 | One H1, no skipped levels | Automated: `check-dist.mjs` |
| 3 | Nav and footer order | Automated: `tests/content.test.ts` |
| 4 | Copy matches spec | Automated: `tests/content.test.ts` |
| 5 | Em dash rule | Automated: `check-dist.mjs`, `tests/content.test.ts` |
| 6, 7 | Home order, panel placement | Partly automated (content tests); order checked by review |
| 8 | Concept labels and demo badge | Manual review; demo badge covered by `tests/demo-guard.test.ts` |
| 9, 10 | Advisor list; headshot where supplied, initials otherwise | Automated (content tests); photos checked by review |
| 11, 12, 17 | Demo keyboard path, Flow B outcomes, reduced motion | Flow logic automated (`demoMachine.test.ts`, `resolver.test.ts`); keyboard and motion manual |
| 13 | No camera, fetch, or storage calls | Automated: `check-dist.mjs` banned APIs |
| 14 | No unmeasured performance figures or claim phrases | Automated: `check-dist.mjs`, content tests |
| 15, 16, 18 | Responsive layout, contrast, Lighthouse goals | Manual only. No automated check (T014). |
| 19 | No cross-origin runtime requests | Partly automated (`check-dist.mjs` external `src`); runtime not checked |
| 20 | CI green on Node 24 | Automated |
| 21 | Size budgets | Automated: `check-dist.mjs` |
| 22 | Secret scan clean | Automated: `free-security-scan.yml` |
| 26, 27 | Lockfile, `pages.yml` shape | Review |
| 28 | Live after merge | OBSERVED 2026-10-02 after PR #16 |
| 29 | Copy-only case rule: lowercase codes in site copy, no standalone capital ZZ; photos may show capitals | Automated: `check-dist.mjs` and content tests (T024) |
| 30 | Flow B follows the v1 grammar test vectors | Not yet: T029 |
| 31 | No image shows a capital-letter zz mark | Not yet: T030, Q53 |

## Clarity and consistency

- [x] Flow B behavior (Section 4.4 B2) conflicted with constitution III. Resolved by T010 (PR #19, issue #12).
- [x] Section 7 of `docs/SPEC.md` said CI is "OPEN Q13" and that the implementer opens a draft PR. Fixed 2026-10-03 (T032).
- [ ] Flow B's parser diverges from the v1 grammar (`docs/SPEC.md` Section 4.4). Resolve through T029.
