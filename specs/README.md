# Specs

zzThis uses [Spec Kit](https://github.com/github/spec-kit) order: constitution, specify, clarify, plan, checklist, tasks, analyze, implement, converge. The rules for every spec are in [`.specify/memory/constitution.md`](../.specify/memory/constitution.md) (v1.0.0, ratification pending Danny's approval).

`docs/SPEC.md` stays as the source for verbatim copy, source tags, and the decision log (Section 9). Its banner maps each section to the artifact that now holds it.

## Features

| ID | Feature | Built? | specify | clarify | plan | checklist | tasks | analyze |
|---|---|---|---|---|---|---|---|---|
| [001](001-marketing-site/spec.md) | Marketing site and scripted demo | Yes, live on GitHub Pages | Done | Open: Q10, Q12, Q20 (part) to Q24, Q39, Q40 | Done | [Done](001-marketing-site/checklists/requirements.md) | [Done](001-marketing-site/tasks.md) | Done |
| [002](002-resolver-core/spec.md) | Resolver core | No | Done | Open: Q19, Q25 to Q29, Q36, Q40 | Proposal | Not started | [Draft](002-resolver-core/tasks.md) | Done |
| [003](003-wordlist-checkword/spec.md) | Wordlist and check word | No | Done | Open: Q27, Q30 to Q32, Q35 | Proposal | Not started | [Draft](003-wordlist-checkword/tasks.md) | Done |
| [004](004-capture/spec.md) | Capture by camera, typing, or voice | No | Done | Open: Q18, Q33, Q34, Q37, Q38 | Proposal | Not started | [Draft](004-capture/tasks.md) | Done |

The phone and web apps (zzThat, zzThing) are not specified yet. Q33 tracks their scope.

## Artifact map

| Artifact | Path |
|---|---|
| Constitution | `.specify/memory/constitution.md` |
| Feature spec (what and why) | `specs/NNN-name/spec.md` |
| Plan (how and stack) | `specs/NNN-name/plan.md` |
| Requirement checklist | `specs/NNN-name/checklists/requirements.md` |
| Tasks | `specs/NNN-name/tasks.md` |
| Cross-artifact analysis | [`specs/analysis-2026-10-02.md`](analysis-2026-10-02.md) |
| Decision log | `docs/SPEC.md` Section 9 |

## Issues to tasks

| Issue | Spec and task |
|---|---|
| [#11](https://github.com/Zero-State-LLC/zzthis/issues/11) xTechSearch eligibility | 001 T018 (owner Danny) |
| [#12](https://github.com/Zero-State-LLC/zzthis/issues/12) Exact match, no live-code hints | 001 T010 (demo), 002 FR-001 and FR-011 |
| [#13](https://github.com/Zero-State-LLC/zzthis/issues/13) Resolver prototype | 002 T001 to T015 |
| [#14](https://github.com/Zero-State-LLC/zzthis/issues/14) Wordlist and check word | 003 tasks |

## Labels

Findings and choices carry one label: OBSERVED (seen in the repo or the live site), INFERRED (a reasoned choice in a spec), SPECULATIVE (an idea to test). OPEN marks a decision that Michael or Danny must make. Specs do not invent requirements or metrics.
