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
| PR #118 Michael's 2026-10-07 site changes plus specs | Done | merged as `f78edb6`; approved Home/About copy, lowercase zzThat wordmark, Omer, and theme requirements are now on main |
| #116 Q72, #117 Q73 | In review | answered by Michael and applied in draft PR #120 |
| zzThat app parity (draft card) | Backlog | the apps start dark and use the lowercase zzThat wordmark (`docs/SPEC.md` Section 5.5); lands in the zzThat specs and apps |
| PR #91 site reconciliation | In review | rebased/merged with main at head `f97458a`; CI and site typecheck/test pass, security is blocked only by the exact historical Gitleaks OCR threshold false positive (isolated draft fix PR #122), and E2E is skipped. Keep draft for mobile/interactive verification and the #89 architecture-claim gate |
| #93 B4 Cloudflare runtime | In progress | isolated staging resources and prior API/D1/Worker checks remain recorded; feature flags stay disabled. The #91 public branch Preview is live, but a newer Clef review has mixed/low route confidence and is not signoff. After acceptance, deploy the exact commit through main-only staging and repeat complete route/asset/header, responsive, and interactive-network parity against the accepted baseline. R2 lifecycle rules remain configured; the non-sensitive probe was confirmed present on 2026-10-08 before its 2026-11-06 expected expiry. A contradictory earlier empty-prefix observation is unverified. Verify deletion after expiry plus Cloudflare's usual 24-hour processing window. Measured product recovery objectives, secret and DO recovery, spend-alert semantics/thresholds, and production approval remain open |

When repo state and Project status disagree, fix the Project field rather than changing repo truth to match the board.
