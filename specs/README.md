# Specs

zzThis uses [Spec Kit](https://github.com/github/spec-kit) order: constitution, specify, clarify, plan, checklist, tasks, analyze, implement, converge. The rules for every spec are in [`.specify/memory/constitution.md`](../.specify/memory/constitution.md) (v1.1.0, ratification pending Danny's approval).

`docs/SPEC.md` stays as the source for verbatim copy, source tags, and the decision log (Section 9). Its banner maps each section to the artifact that now holds it.

## Features

| ID | Feature | Built? | specify | clarify | plan | checklist | tasks | analyze |
|---|---|---|---|---|---|---|---|---|
| [001](001-marketing-site/spec.md) | Marketing site and scripted demo | Yes, live on GitHub Pages | Done | Open: Q10 (part), Q12 (part), Q20 (part), Q21 to Q23, Q39, Q40 | Done | [Done](001-marketing-site/checklists/requirements.md) | [Open: T029, T030](001-marketing-site/tasks.md) | Done |
| [002](002-resolver-core/spec.md) | Resolver core | No | Done, deepened 2026-10-03 | Open: Q19, Q25 to Q28, Q36, Q40. Q29 location is this repo (spec 005). | Proposal | [Done](002-resolver-core/checklists/requirements.md) | [Draft](002-resolver-core/tasks.md) | Done |
| [003](003-wordlist-checkword/spec.md) | Wordlist, check word, and v1 text grammar | No | Done, deepened 2026-10-03 (US3 grammar accepted) | Open: Q27, Q30 to Q32, Q35 | Proposal | [Done](003-wordlist-checkword/checklists/requirements.md) | [Draft](003-wordlist-checkword/tasks.md) | Done |
| [004](004-capture/spec.md) | Capture by camera, typing, or voice | No | Done, deepened 2026-10-03 | Open: Q18, Q33, Q34, Q37, Q38 | Proposal | [Done](004-capture/checklists/requirements.md) | [Draft](004-capture/tasks.md) | Done |
| [005](005-v1-api/spec.md) | `/v1` API and web client | No | Done, deepened 2026-10-04 for a one-shot build | Q18, Q19, Q25 to Q28, Q36, Q66 to Q69 stay open, with prototype defaults | [Done](005-v1-api/plan.md) | [Done](005-v1-api/checklists/requirements.md) | [Build order](005-v1-api/tasks.md) | [Done 2026-10-04](analysis-2026-10-04.md) |

v1 scope, exit criteria, and v2 candidates: [`docs/SPEC.md` Section 12](../docs/SPEC.md). The v1 text grammar: [`docs/SPEC.md` Section 2.2a](../docs/SPEC.md).

The `/v1` API and the later web client are [spec 005](005-v1-api/spec.md). The zzThat phone apps are specified in that repo. zzThing is still unspecified. Q33 tracks app scope.

## Artifact map

| Artifact | Path |
|---|---|
| Constitution | `.specify/memory/constitution.md` |
| Feature spec (what and why) | `specs/NNN-name/spec.md` |
| Plan (how and stack) | `specs/NNN-name/plan.md` |
| Requirement checklist | `specs/NNN-name/checklists/requirements.md` |
| Tasks | `specs/NNN-name/tasks.md` |
| Cross-artifact analysis | [`specs/analysis-2026-10-02.md`](analysis-2026-10-02.md), [`specs/analysis-2026-10-03.md`](analysis-2026-10-03.md), [`specs/analysis-2026-10-04.md`](analysis-2026-10-04.md) |
| Shared test vectors | [`specs/003-wordlist-checkword/vectors.json`](003-wordlist-checkword/vectors.json) |
| One-shot build brief | [`docs/ONE-SHOT-BRIEF.md`](../docs/ONE-SHOT-BRIEF.md) |
| Decision log | `docs/SPEC.md` Section 9 (questions) and Section 9a (running decisions log) |

## Issues to tasks

| Issue | Spec and task |
|---|---|
| [#11](https://github.com/Zero-State-LLC/zzthis/issues/11) xTechSearch eligibility | 001 T018 (owner Danny) |
| [#12](https://github.com/Zero-State-LLC/zzthis/issues/12) Exact match, no live-code hints | 001 T010 (demo), 002 FR-001 and FR-011 |
| [#13](https://github.com/Zero-State-LLC/zzthis/issues/13) Resolver prototype | 002 T001 to T015 |
| [#14](https://github.com/Zero-State-LLC/zzthis/issues/14) Wordlist and check word | 003 tasks |
| [#33](https://github.com/Zero-State-LLC/zzthis/issues/33) Q48 case and spacing (answered) | SPEC 2.2a; 003 US3, T010; 001 T029, T030 |
| [#34](https://github.com/Zero-State-LLC/zzthis/issues/34) Q49 `@` handles (answered) | SPEC 2.2a; 003 FR-010, FR-011; 002 FR-016 |
| [#35](https://github.com/Zero-State-LLC/zzthis/issues/35) Any-language codes, trained reader | v2 candidate (SPEC 12.2) |
| [#36](https://github.com/Zero-State-LLC/zzthis/issues/36) to [#38](https://github.com/Zero-State-LLC/zzthis/issues/38) Q50 to Q52 (answered 2026-10-03) | SPEC 2.2a G4, G5; 003 FR-010, FR-012, FR-023 |
| [#39](https://github.com/Zero-State-LLC/zzthis/issues/39) Q53 capital ZZ photos (answered: keep) | 001 FR-019, T030 |
| [#40](https://github.com/Zero-State-LLC/zzthis/issues/40) Q54 blockchain mentions (answered: no change) | 001 T031 |
| [#41](https://github.com/Zero-State-LLC/zzthis/issues/41) Q55 `zz` in running text (answered) | SPEC 2.2a G8; 004 FR-013 |
| [#42](https://github.com/Zero-State-LLC/zzthis/issues/42) Q56 handle issuance (answered) | 002 FR-016, T018 |
| [#44](https://github.com/Zero-State-LLC/zzthis/issues/44) to [#48](https://github.com/Zero-State-LLC/zzthis/issues/48) Q57 to Q61 (answered 2026-10-03) | SPEC 2.2a G3, G10, G11; 002 FR-019 to FR-021; 003 FR-009, FR-022, FR-024; 004 FR-016, FR-017 |

## Labels

Findings and choices carry one label: OBSERVED (seen in the repo or the live site), INFERRED (a reasoned choice in a spec), SPECULATIVE (an idea to test). OPEN marks a decision that Michael or Danny must make. Specs do not invent requirements or metrics.
