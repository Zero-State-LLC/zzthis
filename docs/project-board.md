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

### Current convergence map (2026-10-10)

Replaces the 2026-10-07 map, which listed PRs #118, #123, #124, and #126 as in review after they merged. Project fields were not edited by this update: the available GitHub connector cannot change Project fields, so these are the intended states for a maintainer to set.

| Item | Intended board status | Release / backlog | Reason |
|---|---|---|---|
| #13, #14, #60 to #67 | Done | v1.0 history | reconciled to implementation evidence and closed |
| PR #118, PR #123, PR #124, PR #126; #6 | Done | v1.0 (B5) | merged 2026-10-08 and 2026-10-09; PR #118 (Michael's 2026-10-07 site changes plus specs) merged as `f78edb6`, so the approved Home/About copy, lowercase zzThat wordmark, Omer, and theme requirements are on main; #6 closed by PR #124 |
| PR #85 | Closed (superseded) | — | its governance artifacts are already present on main; after syncing, no file diff remained, so it was closed without merging |
| #86 production readiness | In progress | v1.0; RM-022 to RM-029, RM-040 to RM-043, RM-054 | the governance baseline is present on main; evidence gates open: numeric RTO/RPO/SLO, restore evidence, observability, key lifecycle and deploy approval remain open |
| #93 B4 Cloudflare runtime | In progress | v1.0; RM-001, RM-002, RM-012, RM-016, RM-031, RM-042, RM-045, RM-050 to RM-052 | isolated staging resources and prior API/D1/Worker checks remain recorded; staging is deployed but there is no write-path or cache evidence yet, so production stays gated. Feature flags stay disabled. The #91 public branch Preview is live, but a newer Clef review has mixed/low route confidence and is not signoff. After acceptance, deploy the exact commit through main-only staging and repeat complete route/asset/header, responsive, and interactive-network parity against the accepted baseline. R2 lifecycle rules remain configured; the non-sensitive probe was confirmed present on 2026-10-08 before its 2026-11-06 expected expiry. A contradictory earlier empty-prefix observation is unverified. Verify deletion after expiry plus Cloudflare's usual 24-hour processing window. Measured product recovery objectives, secret and DO recovery, spend-alert semantics/thresholds, and production approval remain open |
| #92 dependency advisories | Ready | v1.0; RM-004 | dispositioned as build-only on 2026-10-10 (D-2026-10-10-14); upgrades pending |
| PR #122 gitleaks allowlist | Done | v1.0; RM-003 | merged 2026-10-10; `security` is green on `main` (D-2026-10-10-13) |
| PR #95 production Wrangler file and manual workflow | Merged | v1.0; RM-001, RM-002 | merged 2026-10-14; resource ids are still the zero UUID (RM-050); workflow not dispatched |
| PR #85 governance artifacts | Closed (superseded) | — | its governance artifacts are already present on main; after syncing, no file diff remained, so it was closed without merging |
| PR #119 B4 continuation evidence | Done | v1.0; RM-016, R2 evidence | merged 2026-10-11 |
| PR #89 ZZ-OCR-QUAL-001 spec | Done | v1.1; RM-060 | merged 2026-10-14; camera Accept still needs a PASS receipt |
| PR #115 OCR qualification harness | Merged, preflight only | v1.1; RM-061 | merged 2026-10-14; T003 and T003A stay open; no PASS receipt |
| PR #121 README and board mirror | Done | v1.0; RM-006 | merged 2026-10-14 |
| PR #85 governance artifacts | Closed (superseded) | v1.0 (governance) | artifacts already present on main; after syncing, no file diff remained, so it was closed without merging |
| PR #91 site reconciliation, #90 | Done | v1.0 (B5); RM-044 | #91 merged 2026-10-14 and #90 is closed |
| PR #120 Q72 and Q73 answers; #116, #117 | Done | v1.0 (B5); RM-044 | Michael's answers; applied in #120, merged 2026-10-10 |
| PR #125 footer social icons and Omer removal | Done | v1.0 (B5); RM-044 | Michael's 2026-10-08 changes |
| PR #128 LICENSE owner name | Closed, superseded by #143 | v1.0 (legal) | #143 merged 2026-10-10 after Danny's approval; names Michael Chung as owner |
| PR #127 location capability | Merged, research only | R-B17 | merged 2026-10-14; no contract-1 change (D-2026-10-10-18) |
| #87 contract-2 gate | Backlog | v2.0; RM-080 | now includes the Organization entity (D-2026-10-10-06); required before #81 can leave CANON-SHADOW |
| #81, PR #82 semantic profiles | #82 merged; #81 still open | v2.1; RM-091 | CANON-SHADOW semantic-profile specification track; PR #82 merged 2026-10-14 |
| #83, PR #84 ZK research | #84 merged; #83 still open | R-B15 | SPECULATIVE; S1 research merged 2026-10-14 |
| #35 any-language codes | Backlog | R-I18N | research |
| #114, #7 site follow-ups and assets | Backlog | v1.0 (B5); RM-044 | Michael's supplied files |
| #11, #8 xTechSearch | In progress (Danny) | RM-047, not a release item | decide by 2026-10-12 |
| zzThat app parity (draft card) | Backlog | v1.1; RM-069, RM-071 | the apps start dark and use the lowercase zzThat wordmark (`docs/SPEC.md` Section 5.5); lands in the zzThat specs and apps |

When repo state and Project status disagree, fix the Project field rather than changing repo truth to match the board. This file is a status mirror; the live project field is still the canonical status.
