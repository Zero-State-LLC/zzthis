# One-shot build brief: server, web client, and apps

## Goal

Build the zzThis central server (a Cloudflare Worker), the web client, and the zzThat iOS and Android apps in one pass, from the merged specs. Open two draft PRs together: one in `Zero-State-LLC/zzthis`, one in `Zero-State-LLC/zzthat`. Nothing deploys. Nothing is submitted.

## Before the build (people, not the builder)

1. Done 2026-10-05: zzThis #59 and #75 (0c735f2) and zzThat #31 and #38 (165aecc) are merged.
2. Done 2026-10-04. Danny answered Q66 ([#68](https://github.com/Zero-State-LLC/zzthis/issues/68)) himself and said yes to every other open decision on [#74](https://github.com/Zero-State-LLC/zzthis/issues/74), including the spec 003 defaults with the EFF list license and the bundle ids. They are recorded in `docs/SPEC.md` Section 9 and zzThat `decisions.md`. Michael reviews the new strings in `design/copy.json`. The icon artwork and the support mailbox (ZQ25) come before store submission, because builds use placeholders.
3. Danny accepts [intent/2026-10-04-one-shot-build.md](../intent/2026-10-04-one-shot-build.md). This is the gate: the build does not start before it. His yes on #74 covered the open decisions, not this intent.
4. A zzThat pin PR moves `contracts/ZZTHIS-API-PIN`, `apps/DESIGN-PIN`, and the files that name the live pin from 4841003 to 0c735f2, and merges before the zzThat build branch is cut.

## Start here

- zzThis: `AGENTS.md`, the intent above, [spec 005](../specs/005-v1-api/spec.md) with its plan and tasks, the Prototype defaults in [spec 003](../specs/003-wordlist-checkword/spec.md), the Client read pipeline in [spec 004](../specs/004-capture/spec.md), [design/UX.md](../design/UX.md), and [design/copy.json](../design/copy.json).
- zzThat: `AGENTS.md`, then `specs/001-zzthat-apps/` spec, runtime, tasks, and design.
- Branches: the zzThis build starts from `main` at the merge commit of the intent revision, which changes docs only, so its code, contract, and `design/` are those of 0c735f2. The zzThat build starts from `main` after the pin PR (step 4). No commits from unmerged PRs sit under either build branch. The audit fixes in zzThis #76 and zzThat #39 (the contract, auth, and CSP changes) are adopted later, through a re-pin, once they merge. Each PR body names its base sha. Cursor cloud agents build. Both PRs are drafts, and every merge needs Danny's yes.

## Order

1. zzThis, spec 005 tasks Group 0 to Group I, in order. Each group's "done when" line passes before the next group starts.
2. Push the zzThis branch and note its head commit, S.
3. zzThat: do T005 first, which writes `scripts/sync-zzthis.sh`. Run it at S (it also rewrites the sha in the docs that name the pin), then run `python3 scripts/lint-specs.py`. Then follow the rest of its tasks. iOS and Android can run in parallel once each platform's core library passes `vectors.json`.
4. Run `npm run dev:api -- --fresh` from the zzThis branch at S. Run each app's end-to-end test against it.
5. Open both draft PRs and link them to each other. After the zzThis PR merges, run `scripts/sync-zzthis.sh` with the merge commit, then `python3 scripts/lint-specs.py`, before the zzThat PR merges.

## Constraints (hard)

- One grammar per platform, and all three pass every row of `specs/003-wordlist-checkword/vectors.json`: `packages/zz-core` (TypeScript), `ZZCore` (Swift), `core-grammar` (Kotlin). Do not edit a row to match a bug.
- Every sentence a person reads comes from `design/copy.json`. No em dashes. Say demo and check word.
- No secrets in either tree. `.dev.vars.example` holds names and local test values only, with every secret empty. No private key, PEM, or JWK is committed: the security scan reads the full history, so deleting a committed key does not fix it.
- Commit `proto-v0.txt`, its two reports, and a draft root `NOTICE` (EFF, CC BY 3.0 US) from the spec 003 pipeline in the build PR. Q32 on #74 is the license yes, so no further gate applies before the commit. The committed list does not apply the private blocklist. Required before the first production mint: re-run the pipeline with `ZZ_BLOCKLIST`, check the yield report (the removed words and the new N), and commit the new list. That mint needs Danny's deploy yes. Local runs use `fixture-7`. Production mint stays `not-ready` until a deploy sets `ZZ_MINT_ENABLED=true` (spec 005 FR-004). `ZZ_WORDLIST_VERSION` is always required, and production refuses `fixture-7`, so that deploy also sets `ZZ_WORDLIST_VERSION=proto-v0`.
- OPEN for Danny: his legal yes on the `NOTICE` text and the LICENSE sentence (spec 005 T036). Default: the drafts are committed and flagged in the PR body, and the PR does not merge without his yes.
- No Cloudflare resource, no OAuth client, no bundle id registration, no deploy, no store upload.
- The marketing site does not change, except the spec 005 T035 parser change in `src/lib/grammar.ts`, which its demo bundles. Its build, `check-dist`, its tests, and its no-cross-origin rule still pass.
- Required checks stay green: zzThis `ci.yml` (`build`) and zzThat `ci.yml` (`build`).
- Workflow skills named in the tasks (anti-slop-code, production-systems, google-developer-style) that are not installed where the build runs are style guidance. Each PR body says so.
- CI spend follows zzThat ZQ27, decided 2026-10-05: the no-spend path, accepted by Danny on Zero-State-LLC/zzthat#39. `apps-ci.yml` is added by the build but is not a required check; only `ci.yml` is required. The zzThat Android job runs on `ubuntu-latest` on every PR. The iOS job runs only on `workflow_dispatch` or the `ios-ci` label. zzThis `e2e.yml` and zzThat `apps-e2e.yml` run on `workflow_dispatch` or on a PR with the `run-e2e` label, with no schedule, and are not required checks. The builder runs the iOS tests and the iOS end-to-end run on the dev Mac and pastes the command, the sha, and the log tail into the PR body.

## Done when

- zzThis PR: every task in spec 005 Group 0 to Group I is checked. `npm run lint`, `typecheck`, `test`, and `build` pass. The OpenAPI file lints clean. The Playwright run is linked.
- zzThat PR: `apps-ci.yml` passes (both platforms' tests, the vectors, one snapshot per screen state, the pin check, the string check), with the iOS job from its label run or as dev Mac evidence. The end-to-end run on each platform against the local Worker is linked. The PR shows each screen in the Demo build, light and dark, at one phone size.
- "Linked" means the URL of the label-triggered run, or local evidence listed under "could not verify".
- Each PR body lists anything it could not verify, with the reason.

## Do not

Merge, deploy, create cloud resources, register OAuth clients or bundle ids, submit to a store, weaken a test, or invent copy or product behavior the specs do not name. When the specs do not settle something, follow Stop and ask in the intent: write the gap in the PR body instead of deciding.

## After the build (human-gated)

Cloudflare resources and secrets, the Apple and Google sign-in clients, the domain (Q69), the privacy policy and support contact, the app icon, store listings, and signing.
