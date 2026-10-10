# Intent: fix the v1.0 backend defects (#130)

Author: Claude, from the 2026-10-10 architecture review
Date: 2026-10-10
Status: accepted
Accepted-by: the requesting maintainer in the 2026-10-10 Claude Code session ("ok do them")
Product: zzThis (`Zero-State-LLC/zzthis`)

This file is a proto-spec. It comes before code. Next stage: the spec 005 clarifications listed under Change map, then implementation. Do not implement from this file until a human sets `Status: accepted`.

## Problem / why now

The 2026-10-10 design review of `workers/api` found three high and several medium defects that block the v1.0 production release (issue [#130](https://github.com/Zero-State-LLC/zzthis/issues/130); `specs/analysis-2026-10-10-architecture-review.md` Section 3; decision D-2026-10-10-19). They enter v1.0 under the append-closed exceptions in `specs/SCOPE-GOVERNANCE.md` (security and correctness defects). No other release work can be verified on staging (#132) until they are fixed.

[verified: file and line evidence in BACKLOG RM-021, RM-030, RM-032 to RM-039]

## Proposed outcome

Two pull requests, each with its own tests at the existing 100% coverage thresholds.

**PR A, authorization and correctness**

- RM-032: re-roll runs the mint scope check on the old code's scope, so a removed issuer or a `free_public` code with the flag off gets 403 and nothing is written.
- RM-033: the mint batch writes only while the account is neither deleted nor suspended; a mint that loses the race answers 401 or 403 as if it arrived after.
- RM-034: cache lookups, puts, and purges catch their errors and log the operation only; a cache fault never fails a committed write. (Awaiting with a catch, rather than `waitUntil`, keeps test timing deterministic and needs no new runtime behavior.)
- RM-030: IPv6 callers are limited by their /64 prefix; IPv4 and IPv4-mapped addresses by the address. The limiter key stays an HMAC.
- RM-037: Apple token and revoke calls abort after 3 seconds; sign-in still succeeds and logs the failure (FR-020).
- RM-038: limiter calls time out; discovery and the OpenAPI document fail open; every other route fails closed with 503 `not-ready`, which every operation already declares.

**PR B, operations**

- RM-035: the retention run works in bounded batches with per-step isolation; R2 deletes go in chunks of at most 1,000 keys; account deletion purges only codes that could be cached; migration `0002` adds indexes on `auth_nonces(expires_at)`, `refresh_tokens(expires_at)`, `pending_revocations(next_attempt_at)`, and `reports(closed_at)`; abandoned Apple revocations log a distinct class.
- RM-021: sealed Apple tokens carry a key id; an optional `ZZ_DATA_KEY_PREVIOUS` secret decrypts older values; values without a key id are read as the first key. HMAC tags (limiter keys, not-found audit targets) are not migrated: a rotation resets limiter windows and breaks linkability of older audit targets, and the runbook says so.
- RM-036: every log line carries the request id, the Cloudflare ray id, and the deployed version (version metadata binding), and errors log a D1, R2, or Durable Object class. The FR-027 exclusions stay.
- RM-039: format characters are stripped before the blocklist check; the JSON body limit is enforced while streaming; a replaced Apple token is revoked; a rejected ID token writes a `denied` audit event; a handle re-roll returns `reroll-cap` even when plain mint is disabled.

## Affected users / systems

- Users: everyone who signs in, mints, re-rolls, or deletes an account; nobody sees a new screen.
- Systems: `workers/api` (source, one new migration, `wrangler.toml` and `wrangler.staging.toml` for the version metadata binding), spec 005 prose, `docs/OPERATIONS.md` key rotation notes.

## Constraints

Product-true locks (do not reopen in implement):

- No wire change: no new route, field, status, error code, or response header; OpenAPI and `vectors.json` unchanged.
- FR-031 guard rule for every new guarded write.
- FR-027: no code, record text, token, nonce, photo, or IP in any log line.
- Existing tests are not weakened or removed (AGENTS.md Escalation).
- No Cloudflare resource, secret value, or deploy. Adding the version metadata binding to the staging config is a file change only; deploying it is the existing manual workflow.

Non-goals:

- RM-001 and RM-002 (production config and workflow, #131), staging verification (#132), the wordlist (#133).
- Whether reports and reads from suspended accounts should be refused (an FR-025 product question; recorded, not changed).
- Mint idempotency keys (contract 2, RM-086).

## Change map

| Item | Files |
|---|---|
| RM-032 | `workers/api/src/codes/reroll.ts`, `codes/scope.ts`; test `reroll.test.ts` |
| RM-033 | `codes/store.ts`, `codes/mint.ts`; tests `mint.test.ts`, `account.test.ts` |
| RM-034 | `resolve/resolve.ts`, `resolve/cache.ts`, `codes/revoke.ts`, `codes/reroll.ts`, `records/versions.ts`, `account/me.ts`; test `cache.test.ts` |
| RM-030 | `limits/enforce.ts`; test `limits.test.ts` |
| RM-037 | `auth/apple.ts`, `deps.ts`; tests `providers.test.ts`, `cron.test.ts` |
| RM-038 | `limits/enforce.ts`, `http/app.ts`; test `limits.test.ts` |
| RM-035 | `retention/cron.ts`, `account/me.ts`, `migrations/0002_retention_indexes.sql`; tests `cron.test.ts`, `account.test.ts`, `data.test.ts` |
| RM-021 | `lib/crypto.ts`, `env.ts`, `account/me.ts`, `retention/cron.ts`, `.dev.vars.example`; test `crypto.test.ts`, `account.test.ts` |
| RM-036 | `http/log.ts`, `http/app.ts`, `env.ts`, both wrangler files; test `assets.test.ts` (log lines) |
| RM-039 | `lib/text.ts`, `http/body.ts`, `auth/signin.ts`, `codes/reroll.ts`; matching tests |
| Spec | spec 005 FR-011 (IPv6 /64), FR-018 (cache faults), FR-026 (bounded run), Mint step 5 (account guard), Re-roll (scope check), Environment (`ZZ_DATA_KEY_PREVIOUS`, version metadata), plan.md (limiter failure policy) |

## Stop and ask

Stop and write the gap in the PR body, instead of deciding, if a fix would:

- change a wire shape, status, or error code;
- change a `vectors.json` row or weaken a test;
- need a new runtime dependency;
- need a Cloudflare resource, secret value, or deploy.

## Acceptance

The acceptance line of each backlog item (`specs/BACKLOG.md`), plus: `npm run lint`, `typecheck`, `test`, and `build` pass; the `run-e2e` Playwright run passes on each PR.

## Claims

| Claim | Label |
|---|---|
| The defects exist as described | `[verified: source read at 8189ce1; spot-checked enforce.ts, reroll.ts, store.ts, cache.ts, me.ts, crypto.ts]` |
| 503 `not-ready` is declared on every operation | `[verified: D-2026-10-05-01; spec 005 Errors]` |

## Next

A human accepts this file (`Status: accepted`). Then PR A, then PR B.
