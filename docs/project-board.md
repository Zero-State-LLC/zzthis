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
| PR #118 Michael's 2026-10-07 site changes plus specs | Done | merged to main as `f78edb6` |
| #116 Q72, #117 Q73 | In review | Michael answered both; draft PR #120 applies the advisor-card and demo decisions. Keep issue items open until the PR merges. |
| PR #120 Q72/Q73 content follow-through | In review | draft; CI/site checks passed per current notes, but the security scan flags the pre-existing `max_p95_latency_ms` false positive in main history. Do not waive the security gate; resolve via the dedicated allowlist path or documented maintainer decision. |
| PR #91 site claim corrections | In review | draft and behind main after #118. The head distinguishes typed lookup (available), on-device camera recognition (planned v1, not built), and voice (future). Rebase preserving #118, rerun checks, then complete route/interactive/network review; no Clef sign-off from low-confidence comparisons. |
| PR #89 OCR qualification spec | In review | draft; engine-neutral evidence boundary, Apple Vision iOS baseline, Android engine qualification on one frozen corpus, false-valid-decode as primary safety metric, raw photos stay on-device, no cloud/server fallback. Not implemented; do not promote to Done until reviewed, merged, and acceptance evidence exists. |
| zzThat app parity (draft card) | Backlog | the apps start dark and use the lowercase zzThat wordmark (`docs/SPEC.md` Section 5.5); lands in the zzThat specs and apps |
| #93 B4 Cloudflare runtime | In progress | isolated staging D1, R2, Durable Object, marketing Worker, and API Worker are deployed. API contract discovery, Worker rollbacks, D1-only restore drill, private R2 lifecycle configuration, bounded rate-limit check, staging token-secret rotation, and HSTS parity on six routes are recorded as verified. The retention probe was absent before its expected expiry, so actual R2 expiration is unverified. Clef visual comparison was mixed/low confidence and is not sign-off; `/robots.txt` remains a staging-host difference. Final #91 baseline and full interactive network checks, measured recovery objectives, secret/DO recovery, spend/alert thresholds, and production approval remain open.

When repo state and Project status disagree, fix the Project field rather than changing repo truth to match the board. This file is a status mirror; the live project field is still the canonical status.
