# One-shot build brief: server, web client, and apps

## Goal

Build the zzThis central server (a Cloudflare Worker), the web client, and the zzThat iOS and Android apps in one pass, from the merged specs. Open two draft PRs together: one in `Zero-State-LLC/zzthis`, one in `Zero-State-LLC/zzthat`. Nothing deploys. Nothing is submitted.

## Before the build (people, not the builder)

1. Merge zzThis PR #59. Re-pin zzThat PR #31 to the merge commit (`contracts/ZZTHIS-API-PIN` and the files that name it), run `python3 scripts/lint-specs.py`, then merge #31.
2. Done 2026-10-04. Danny answered Q66 ([#68](https://github.com/Zero-State-LLC/zzthis/issues/68)) himself and said yes to every other open decision on [#74](https://github.com/Zero-State-LLC/zzthis/issues/74), including the spec 003 defaults with the EFF list license and the bundle ids. They are recorded in `docs/SPEC.md` Section 9 and zzThat `decisions.md`. Michael reviews the new strings in `design/copy.json`. The icon artwork and the support mailbox (ZQ25) come before store submission, because builds use placeholders.
3. Danny accepts [intent/2026-10-04-one-shot-build.md](../intent/2026-10-04-one-shot-build.md).

## Start here

- zzThis: `AGENTS.md`, the intent above, [spec 005](../specs/005-v1-api/spec.md) with its plan and tasks, the Prototype defaults in [spec 003](../specs/003-wordlist-checkword/spec.md), the Client read pipeline in [spec 004](../specs/004-capture/spec.md), [design/UX.md](../design/UX.md), and [design/copy.json](../design/copy.json).
- zzThat: `AGENTS.md`, then `specs/001-zzthat-apps/` spec, runtime, tasks, and design.
- Branches: `feat/v1-server-web` in zzThis and `feat/apps-v1` in zzThat, both from `main`. Both PRs are drafts.

## Order

1. zzThis, spec 005 tasks Group 0 to Group I, in order. Each group's "done when" line passes before the next group starts.
2. Push the zzThis branch and note its head commit, S.
3. zzThat: sync the pin to S, then follow its tasks. iOS and Android can run in parallel once each platform's core library passes `vectors.json`.
4. Run `npm run dev:api` from the zzThis branch at S. Run each app's end-to-end test against it.
5. Open both draft PRs and link them to each other. After the zzThis PR merges, re-pin zzThat to the merge commit before it merges.

## Constraints (hard)

- One grammar per platform, and all three pass every row of `specs/003-wordlist-checkword/vectors.json`: `packages/zz-core` (TypeScript), `ZZCore` (Swift), `core-grammar` (Kotlin). Do not edit a row to match a bug.
- Every sentence a person reads comes from `design/copy.json`. No em dashes. Say demo and check word.
- No secrets in either tree. `.dev.vars.example` holds names and local test values only.
- Commit `proto-v0` only after Danny's yes. Without it, local runs use `fixture-7` and production mint stays `not-ready`.
- No Cloudflare resource, no OAuth client, no bundle id registration, no deploy, no store upload.
- The marketing site does not change: its build, `check-dist`, and its no-cross-origin rule still pass.
- Required checks stay green: zzThis `ci.yml` (`build`) and `site-ci.yml`; zzThat `ci.yml` and `apps-ci.yml`.

## Done when

- zzThis PR: every task in spec 005 Group 0 to Group I is checked. `npm run lint`, `typecheck`, `test`, and `build` pass. The OpenAPI file lints clean. The Playwright run is linked.
- zzThat PR: `apps-ci.yml` passes (both platforms' tests, the vectors, one snapshot per screen state, the pin check, the string check). The end-to-end run on each platform against the local Worker is linked. The PR shows each screen in the Demo build, light and dark, at one phone size.
- Each PR body lists anything it could not verify, with the reason.

## Do not

Merge, deploy, create cloud resources, register OAuth clients or bundle ids, submit to a store, weaken a test, or invent copy or product behavior the specs do not name.

## After the build (human-gated)

Cloudflare resources and secrets, the Apple and Google sign-in clients, the domain (Q69), the privacy policy and support contact, the app icon, store listings, and signing.
