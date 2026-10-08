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

## Current convergence map (2026-10-07)

| Item | Intended board status | Reason |
|---|---|---|
| #13, #14, #60–#67 | Done | reconciled to implementation evidence and closed |
| #81 | Backlog | CANON-SHADOW semantic-profile specification track |
| PR #82 | In review | semantic-profile spec assimilation |
| #83 | Backlog | SPECULATIVE ZK research |
| PR #84 | In review after reconciliation | S1 research PR depends on semantic parent/rebase |
| PR #85 | Closed (superseded) | its governance artifacts are already present on main; after syncing, no file diff remained, so it was closed without merging |
| #86 production readiness evidence | Ready | the governance baseline is present on main; numeric RTO/RPO/SLO, restore evidence, observability, key lifecycle and deploy approval remain open |
| #87 contract-2/semantic domain gate | Backlog | required before #81 can leave CANON-SHADOW |
| #93 B4 Cloudflare runtime | In progress | isolated staging resources and prior API/D1/Worker checks remain recorded; feature flags stay disabled. The #91 public branch Preview is live and current security, CI, and site typecheck/test workflows pass, but E2E is skipped and #91 remains draft. A newer Clef review has mixed/low route confidence, so earlier visual-equivalence notes are not signoff. After acceptance, deploy the exact commit through main-only staging and repeat complete route/asset/header, responsive, and interactive-network parity against the accepted baseline. R2 lifecycle rules remain configured, but the prior probe is absent before its expected expiry; deletion behavior is unverified and needs a controlled re-test. Measured product recovery objectives, secret and DO recovery, spend-alert semantics/thresholds, and production approval remain open |

When repo state and Project status disagree, fix the Project field rather than changing repo truth to match the board.
