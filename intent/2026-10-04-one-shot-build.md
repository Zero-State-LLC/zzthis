# Intent: one-shot build of the server, the web client, and the apps

Author: Claude, for Luna, from the 2026-10-04 spec review
Date: 2026-10-04
Status: draft
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
- A zzThat draft PR adds the iOS and Android apps as zzThat spec 001 runtime.md describes. `apps-ci.yml` passes. The end-to-end run on each platform against the local Worker passes once and is linked.
- Every platform library passes every row of `specs/003-wordlist-checkword/vectors.json`.
- Nothing is deployed, no cloud resource or OAuth client is created, and nothing is submitted to a store.

## Affected users / systems

- Users: people who create and scan codes, Danny as operator, Michael as product owner
- Systems: this repo (new workspaces), zzThat (apps), Cloudflare and the Apple and Google consoles later (human-gated)

## Constraints

Product-true locks (do not reopen in implement):

- The server chooses the words, including free public codes (spec 002 US2, zzThat ZQ11).
- Danny's Q26 cache header and classes (spec 005 FR-018).
- Thin clients. One grammar library per platform, all passing the same vectors.
- User-facing copy comes from `design/copy.json`: demo, check word, no em dashes.

Non-goals:

- Production deploy, store submission, a vision model (Q18), voice, partner auth (Q19), Sign in with Apple on Android (Q67).
- Merging either pull request.

## Open questions

- Q66 to Q69 (spec 005, issues #68 to #71), the spec 003 prototype defaults (Q27, Q30, Q31, Q32, Q35), and the spec 004 band values (Q37), for Danny and Michael.
- zzThat ZQ22 to ZQ26 (zzThat issues #32 to #36).

## Claims

| Claim | Label |
|---|---|
| Plain mint returned `not-ready` until spec 003 had a list and a check word | `[verified: spec 005 FR-004 at 497ea0d]` |
| Sign in with Apple on iPhone returns an ID token and a code with a nonce, not PKCE | `[assumed: Apple AuthenticationServices documentation]` |
| `cache.delete` clears one data center, and the Cache API ignores `stale-while-revalidate` | `[verified: Cloudflare Workers Cache API documentation, read 2026-10-04]` |
| The Workers rate-limit binding counts per location, over 10 or 60 seconds | `[verified: Cloudflare rate-limit binding documentation, read 2026-10-04]` |
| Apple requires revoking Sign in with Apple tokens when an account is deleted | `[verified: Apple developer forum guidance, read 2026-10-04]` |

## Next

A human accepts this file (`Status: accepted`). Then the build follows
[docs/ONE-SHOT-BRIEF.md](../docs/ONE-SHOT-BRIEF.md). Do not implement from this file alone.
