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
| PR #126 Michael's 2026-10-08 About image set (v2) plus specs | In review, on hold | open PR, held until Michael answers T053; not to merge before then. Its card (the zz-Kathy-found-dog-zz set of three concept images under the handwritten photos on About, with the explainer and the plain-text zzPage note, T054; replaces the v1 pair, T052) moves to Done when it merges. T053 (collar tag shows a capital-letter zz; keep or regenerate) is Backlog for Michael. No zzThat parity card: the apps and the web client have no About page |
| PR #123 Michael's 2026-10-08 nav plus specs | In review | open PR; its card (Demo in the top menu, menu links about 30% larger, logo never shrinks, 64 px header) moves to Done when it merges. No zzThat parity card: the apps and the web client have no site menu or `/demo` link (`docs/SPEC.md` Section 5.5) |
| #87 contract-2/semantic domain gate | Backlog | required before #81 can leave CANON-SHADOW |
| PR #118 Michael's 2026-10-07 site changes plus specs | In review | open PR; its change cards (dark default, wordmarks, Omer, zzthis.com on About, Home headings, bio and Hacker Dojo text) move to Done when it merges |
| #116 Q72, #117 Q73 | Backlog | open questions for Michael from the 2026-10-07 changes |
| #6, PR #124 zzthis.com cutover | In review, blocked on DNS | draft PR #124 moves the site to the root of zzthis.com; it merges only after Michael's DNS records are live and Danny sets the Pages custom domain. #6 stays open until HTTPS and the redirects are verified |
| zzThat app parity (draft card) | Backlog | the apps start dark and use the lowercase zzThat wordmark (`docs/SPEC.md` Section 5.5); lands in the zzThat specs and apps |
| #93 B4 Cloudflare runtime | In progress | isolated staging D1, R2, Durable Object, marketing Worker, and API Worker are deployed; API contract discovery, API Worker rollback, a D1-only restore drill, private R2 30-day `reads/` lifecycle configuration, bounded discovery rate-limit check, staging token-secret rotation, marketing Worker rollback, and one zero-error staging retention Cron execution are verified with public feature flags disabled. Six-route 390×844 visual comparison is Clef-equivalent against the currently served Pages baseline; bounded initial-load Browser Run inventories found no external origins. Staging HSTS now matches Pages on all six required routes (Worker version `dd1abc3c-0052-4170-baff-91a5f25d04ce`, workflow 37585374449). These checks do not cover the post-#91 accepted baseline or full interactive network behavior. `/robots.txt` is a known Cloudflare-generated staging-host difference. R2 expiry behavior, measured recovery objectives, secret recovery, DO recovery, spend/alert thresholds, final-baseline site parity, and production approval remain open |

When repo state and Project status disagree, fix the Project field rather than changing repo truth to match the board.
