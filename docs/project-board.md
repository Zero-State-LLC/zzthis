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
| PR #85 | In review | completeness audit and convergence repair stream |
| #86 production readiness evidence | Ready after #85 merge | numeric RTO/RPO/SLO, restore evidence, observability, key lifecycle and deploy approval remain |
| #87 contract-2/semantic domain gate | Backlog | required before #81 can leave CANON-SHADOW |
| #93 B4 Cloudflare runtime | In progress | isolated staging D1 and marketing Worker are live and smoke-checked; API staging bindings, parity/rollback evidence, recovery evidence, and every production gate remain |

When repo state and Project status disagree, fix the Project field rather than changing repo truth to match the board.
