# Project board

The family board is live: [zzThis + zzThat](https://github.com/orgs/Zero-State-LLC/projects/25) (org project 25).

Do not create a second board.

## Status

The single-select field is `Status`. Options, in order:

| Option | Meaning |
|---|---|
| Backlog | Filed, not ready to build |
| Ready | Spec and acceptance are enough to start |
| In progress | Someone is building it |
| In review | A pull request is open |
| Done | Merged, or the question is closed |

## Repository

GitHub's built-in Repository field shows which repo an item comes from. There is no custom Repo field.

## Automation

`.github/workflows/project-collaboration.yml` points at project 25. On a new issue or pull request it adds the item and sets Status to `Backlog` when `PROJECT_TOKEN` can see the board. A missing token or a missing status option warns and still posts the team comment. The workflow does not close the issue.

Ready, In progress, In review, and Done are set on the board by hand.

## Board truth and maintenance

Do not keep a hand-maintained exhaustive item list in this file. The GitHub Project is the live inventory; static enumerations became stale during the V1 build.

Repository issue/PR state is the minimum source of truth:
- closed issue/merged PR -> candidate for **Done**;
- open PR -> **In review**;
- accepted, buildable issue with no active PR -> **Ready**;
- active implementation -> **In progress**;
- research/deferred/not-ready -> **Backlog**.

Project field changes are manual unless the board workflow explicitly automates them.

## Release and bundle mapping

Board items are grouped by release and bundle (SCOPE-GOVERNANCE, Kanban rule). The release for every item is in [`specs/BACKLOG.md`](../specs/BACKLOG.md), which gives each one a stable `RM-` id, priority, acceptance, and verification. Put the release (`v1.0`, `v1.1`, ...) and the `RM-` id in the issue title or body so the board can be filtered by it. Research (`R-`) and deferred (`DF-`) items stay in Backlog.

## Current convergence map (2026-10-10)

Replaces the 2026-10-07 map, which listed PRs #118, #123, #124, and #126 as in review after they merged. Project fields were not edited by this update: the available GitHub connector cannot change Project fields, so these are the intended states for a maintainer to set.

| Item | Intended board status | Release / backlog | Reason |
|---|---|---|---|
| #13, #14, #60 to #67 | Done | v1.0 history | reconciled to implementation evidence and closed |
| PR #118, PR #123, PR #124, PR #126; #6 | Done | v1.0 (B5) | merged 2026-10-08 and 2026-10-09; #6 closed by PR #124 |
| #86 production readiness | In progress | v1.0; RM-022 to RM-029, RM-040 to RM-043, RM-054 | governance present; evidence gates open |
| #93 B4 Cloudflare runtime | In progress | v1.0; RM-001, RM-002, RM-012, RM-016, RM-031, RM-042, RM-045, RM-050 to RM-052 | staging deployed; no write-path or cache evidence; production gated |
| #92 dependency advisories | Ready | v1.0; RM-004 | dispositioned as build-only on 2026-10-10 (D-2026-10-10-14); upgrades pending |
| PR #122 gitleaks allowlist | In review | v1.0; RM-003 | `security` is red on `main` from a branch-only false positive (D-2026-10-10-13) |
| PR #95 manual deploy workflow | In review (to be superseded) | v1.0; RM-002 | targets the local config; replace with the reviewer-gated production workflow |
| PR #119 B4 continuation evidence | In review | v1.0; RM-016, R2 evidence | evidence documentation |
| PR #89 ZZ-OCR-QUAL-001 spec | In review (draft) | v1.1; RM-060 | camera qualification contract |
| PR #115 OCR qualification harness | In progress (draft) | v1.1; RM-061 | stacked on PR #89 |
| PR #121 README and board mirror | In review (draft) | v1.0; RM-006 | overlaps this review's README and board updates; reconcile before merge |
| PR #91 site reconciliation, #90 | In review (draft) | v1.0 (B5); RM-044 | closes #90 |
| PR #120 Q72 and Q73 answers; #116, #117 | In review (draft) | v1.0 (B5); RM-044 | Michael's answers |
| PR #125 footer social icons and Omer removal | In review | v1.0 (B5); RM-044 | Michael's 2026-10-08 changes |
| PR #128 LICENSE owner name | In review | v1.0 (legal) | legal text needs Danny's yes |
| PR #127 location capability | In review | R-B17 | research only (D-2026-10-10-18) |
| #87 contract-2 gate | Backlog | v2.0; RM-080 | now includes the Organization entity (D-2026-10-10-06) |
| #81, PR #82 semantic profiles | Backlog / In review (draft) | v2.1; RM-091 | CANON-SHADOW |
| #83, PR #84 ZK research | Backlog / In review (draft) | R-B15 | SPECULATIVE |
| #35 any-language codes | Backlog | R-I18N | research |
| #114, #7 site follow-ups and assets | Backlog | v1.0 (B5); RM-044 | Michael's supplied files |
| #11, #8 xTechSearch | In progress (Danny) | RM-047, not a release item | decide by 2026-10-12 |
| zzThat app parity (draft card) | Backlog | v1.1; RM-069, RM-071 | lands in zzThat |

When repo state and Project status disagree, fix the Project field rather than changing repo truth to match the board.
