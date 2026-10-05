# Intent: one-shot build of the server, the web client, and the apps

Author: Claude, for Luna, from the 2026-10-04 spec review
Date: 2026-10-04, revised 2026-10-05 from Danny's review on #75
Status: accepted
Accepted-by: Danny on 2026-10-05 PT (zzthis #77 comment)
Product: zzThis (`Zero-State-LLC/zzthis`) and zzThat (`Zero-State-LLC/zzthat`)

This file is a proto-spec. It comes **before** specify.
The specify stage for it is the 2026-10-04 deepening of spec 003, spec 004, spec 005, and zzThat spec 001. Do not skip to code.

One committed intent per change stream. Live under `intent/` or
`docs/intent/`. Do not invent product work in the template pack.

## Problem / why now

The `/v1` contract (PR #59) and the zzThat app specs (zzThat PR #31) are written, but a builder could not finish from them. The server had no wordlist or check word, so Create was dead on every client. Sign-in used a flow that native Apple and Android sign-in do not provide. Writes could not be tested without real Apple or Google clients. The owner screens had no record read. Four app screens had no pattern and no copy. zzThat had three different zzThis pins.

[verified: specs/analysis-2026-10-04.md, findings 1 to 19]

## Proposed outcome

Observable done (a stranger can check this without reading the chat):

- A zzThis draft PR adds `packages/zz-core`, `workers/api`, and `apps/web` as spec 005 tasks Group 0 to Group I describe. `npm run lint`, `typecheck`, `test`, and `build` pass. The Playwright run against `npm run dev:api` passes and is linked.
- A zzThat draft PR adds the iOS and Android apps as zzThat spec 001 runtime.md describes. `apps-ci.yml` passes, with the iOS job as dev Mac evidence (ZQ27, below). The end-to-end run on each platform against the local Worker passes once and is linked.
- Every platform library passes every row of `specs/003-wordlist-checkword/vectors.json`.
- Nothing is deployed, no cloud resource or OAuth client is created, nothing is submitted to a store, and nothing legal is published. The privacy page is drafted as a doc that is not wired into the site, and Danny publishes it. Store listings and the support mailbox stay Danny's.

## Affected users / systems

- Users: people who create and scan codes, Danny as operator, Michael as product owner
- Systems: this repo (new workspaces), zzThat (apps), Cloudflare and the Apple and Google consoles later (human-gated)

## Constraints

Product-true locks (do not reopen in implement):

- The server chooses the words, including free public codes (spec 002 US2, zzThat ZQ11).
- Danny's Q26 cache header and classes (spec 005 FR-018).
- Thin clients. One grammar library per platform, all passing the same vectors.
- User-facing copy comes from `design/copy.json`: demo, check word, no em dashes.
- Design lock: the web client and both apps use the same `design/` tokens, `design/UX.md` patterns, and `design/copy.json`, from one zzThis commit. Michael's strings are used as given.

Non-goals:

- Production deploy, store submission, a cloud or custom-trained reader (Q18: on-device Apple Vision and ML Kit only, `photo_reads` false), voice, partner auth (Q19), Sign in with Apple on Android (Q67).
- Merging either pull request.

## Start point and order

- zzThis: the build branch starts from `main` at this revision's merge commit. This revision changes docs and spec prose only, so the code, the contract, and `design/` under it are those of 0c735f2, the commit zzThat pins.
- zzThat: first, a small pin PR moves `contracts/ZZTHIS-API-PIN`, `apps/DESIGN-PIN`, and the files that name the live pin from 4841003 to 0c735f2. It is a pure pin move and merges before the zzThat build branch is cut from `main`.
- No commits from unmerged PRs sit under either build branch. The split-out contract, auth, and CSP changes (zzThis #76 and zzThat #39) are adopted later, through a re-pin, once they merge. Each PR body names its base sha.
- Cursor cloud agents build, as draft PRs only. Every merge needs Danny's yes.
- Merge order: the zzThis build PR, then a zzThat re-pin to that merge commit, then the zzThat build PR.

## Stop and ask

The builder stops and writes the gap in the PR body, instead of deciding, when:

- the spec does not cover something;
- the work would add a dependency, a toolchain version, a CSP rule, or an auth behavior that no merged spec names;
- a test, or a row of `specs/003-wordlist-checkword/vectors.json`, would change;
- the work would need a paid runner, a cloud resource, or any spend.

## Open questions

- CI spend (zzThat ZQ27) was open for Danny when this intent was first written. He decided it on 2026-10-05: the no-spend path, accepted on zzThat #39, which carries the record. Until #39 merges, this is the rule:
  - `apps-ci.yml` is added by the build but is not a required check. Only `ci.yml` is required in each repo.
  - The zzThat Android and checks jobs run on `ubuntu-latest` on every PR. The iOS job runs only on `workflow_dispatch` or the `ios-ci` label, and adding that label or a dispatch run spends macOS minutes, so it needs Danny's yes in the PR.
  - zzThis `e2e.yml` and zzThat `apps-e2e.yml` run on `workflow_dispatch` or on a PR with the `run-e2e` label. No schedule and no other trigger.
  - The macOS CI done-test is met by the dev Mac run: the builder pastes the command, the sha, and the log tail into the PR body.
- This file needs Danny's accept (Status). #74 did not cover it.

## Claims

| Claim | Label |
|---|---|
| Plain mint returned `not-ready` until spec 003 had a list and a check word | `[verified: spec 005 FR-004 at 4841003]` |
| Sign in with Apple on iPhone returns an ID token and a code with a nonce, not PKCE | `[assumed: Apple AuthenticationServices documentation]` |
| `cache.delete` clears one data center, and the Cache API ignores `stale-while-revalidate` | `[verified: Cloudflare Workers Cache API documentation, read 2026-10-04]` |
| The Workers rate-limit binding counts per location, over 10 or 60 seconds | `[verified: Cloudflare rate-limit binding documentation, read 2026-10-04]` |
| Apple requires revoking Sign in with Apple tokens when an account is deleted | `[verified: Apple developer forum guidance, read 2026-10-04]` |

## Next

A human accepts this file (`Status: accepted`). Then the build follows
[docs/ONE-SHOT-BRIEF.md](../docs/ONE-SHOT-BRIEF.md). Do not implement from this file alone.
