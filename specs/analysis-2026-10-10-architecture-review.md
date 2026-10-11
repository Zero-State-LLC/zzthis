# zzThis architecture and roadmap review - 2026-10-10

Scope: the whole repository at `main` 8189ce1 (constitution, AGENTS.md, `docs/SPEC.md`, specs 001 to 005, governance files, intents, `packages/zz-core`, `workers/api`, `apps/web`, the marketing site, workflows), the open issues and pull requests on `Zero-State-LLC/zzthis`, and vendor documentation. This report supersedes the "next work" lists of earlier analyses; those stay as history.
Outputs: [RELEASE-ROADMAP.md](RELEASE-ROADMAP.md), [BACKLOG.md](BACKLOG.md), [decisions-2026-10-10.md](decisions-2026-10-10.md), and the updates listed at the end.

`CONTEXT.md`, named in the review request, does not exist in this repository; AGENTS.md points to `Zero-State-LLC/agent-context` for team context, which is outside this session's access. No decision here depends on it.

## 1. Readiness assessment

| Question | Answer | Evidence |
|---|---|---|
| Is v1 implemented? | The server, shared library, and web client are implemented and tested: 861 tests passed locally on 2026-10-10 (218 root, 235 zz-core, 78 web, 330 Worker), with lint, typecheck, build, and the AGENTS.md check green. | Local run on Node 22.22 (CI uses Node 24) |
| Is v1 verified on Cloudflare? | Only partially. Staging proves discovery, one rate-limit row, a D1 restore, a token-secret replacement, one empty cron run, and Worker rollback. It cannot sign in or mint, and the Cache API does nothing on its workers.dev host. | `docs/cloudflare-resource-inventory.md`; Cache API docs |
| Is anything production-ready? | No. There is no production configuration, resource, OAuth client, privacy policy, recovery objective, or deploy approval, and the `security` check is red on `main`. | Section 3 |
| Are camera and native apps ready? | No. Both live in zzThat; the camera engine is unqualified and the qualification harness is a draft. | PR #89, PR #115 |

Verdict: implementation-complete prototype with partial staging evidence. Production readiness is not claimed and is not supported by the evidence.

## 2. Gap inventory

Each row: capability, current state, evidence, what is missing, impact, version, and whether it blocks a release. Item ids are in [BACKLOG.md](BACKLOG.md).

### 2.1 Release-blocking gaps (v1.0)

| # | Capability | Current | Evidence | Missing / acceptance | Impact and risk | Item |
|---|---|---|---|---|---|---|
| G-01 | Production configuration | Absent; default config is local-only | `workers/api/wrangler.toml` placeholders | Production config with a guard test | No deploy path | RM-001 |
| G-02 | Production deploy | Absent; PR #95 draft targets the local config | `.github/workflows/` | Reviewer-gated workflow with bookmark and version record | No auditable deploy | RM-002 |
| G-03 | Security CI | Red on `main` since 2026-10-08 | run 37876538197; gitleaks finding on branch `spec/zz-ocr-qual-001` | Narrow allowlist; scan stays full-history | A red check hides new real findings | RM-003 |
| G-04 | Write path on Cloudflare | Untested; staging mint, sign-in, providers all off | `wrangler.staging.toml` | Access-protected staging with dev auth and mint; E2E and smoke | Mint, re-roll, versions, revoke, deletion never ran on Cloudflare | RM-012 to RM-015 |
| G-05 | Edge cache | Tested only in the Workers test pool | Cache API no-op on workers.dev | Custom-hostname check or canary | FR-018 and FR-019 unproven | RM-016, RM-052 |
| G-06 | Real identity providers | Stubbed in tests; clients unregistered | `test/helpers/world.ts` | Registration, one real sign-in each, Apple revoke confirmation | Production sign-in unproven | RM-011, RM-017 |
| G-07 | Recovery | D1-only staging drill on empty tables | OPERATIONS packet | Scope decision, escrow, deletion replay, seeded drill, numbers | No recovery promise | RM-022 to RM-024 |
| G-08 | Production wordlist | proto-v0 only; Q35 filters not run; blocklist not applied | spec 003; T037 open | Filtered, frozen list | Permanent after first mint | RM-020 |
| G-09 | Privacy policy and support | Absent; FR-026 refers to a policy that does not exist | `apps/web/.env.example` | Published policy, address, build settings | Legal exposure; account page links empty | RM-026 |
| G-10 | Backend defects | Found in this review | Section 3 | Fixes with tests | Authorization, correctness, availability | RM-021, RM-030 to RM-038 |
| G-11 | Observability | Field list met; no request id, version, or error class; dashboard-only log settings | `workers/api/src/http/log.ts` | Logging fields, pinned config, probe | Incidents cannot be traced | RM-036, RM-040 |
| G-12 | Incident and spend | Classes defined; no contacts, switches, plan, or alerts | OPERATIONS | Runbook, plan, alerts | No response path | RM-025, RM-042 |

### 2.2 Gaps that block a later release

| # | Capability | Current | Missing | Release | Item |
|---|---|---|---|---|---|
| G-13 | Camera engine qualification | Spec and harness drafts; no corpus or device run | Merge, harness, corpus, receipts | v1.1 | RM-060 to RM-064 |
| G-14 | Native apps | zzThat; not in this repository | Pin of the v1.0 commit, store submissions | v1.1 | RM-066, RM-067 |
| G-15 | Brand files for apps | Lowercase zzThat wordmark absent from `design/brand/`; icon is a placeholder | Michael's files | v1.1 | RM-071 |
| G-16 | Issuer, viewer, auditor UI | Contract supports private, single-use, expiring codes and audit; the web mints public codes only | Web controls | v1.3 | RM-078, RM-079 |
| G-17 | Tenant isolation | A scope-wide grant reads every organization's private records | Organization model | v2.0 (rule now) | RM-063, RM-080 |
| G-18 | List succession | One list version per deployment; resolve verifies before lookup | Multi-list verification | v2.0 | RM-081 |
| G-19 | Data export | Not established | Self-service export | v2.0 (runbook in v1.0) | RM-027, RM-085 |
| G-20 | Retry photo reader | Route implemented; reader port `null` | Research exit | v2.2 | RM-092 |

### 2.3 Missing connections between implemented parts

- The web client is built and deployed with the staging Worker, but no setting lets anyone sign in there, so the client and the API have never been exercised together off a laptop.
- `apps/web` reads `PUBLIC_*` build settings, but no workflow injects them and nothing fails a release build that lacks them (RM-053).
- The marketing site has no link to the web client; spec 001 T016 waits for v1.1 by D-2026-10-10-02.
- R2 lifecycle evidence for `reads/` is still pending (expiry due after 2026-11-06), but R2 receives no application object while photo reads are off, so the gap does not block v1.0 (D-2026-10-10-10).

### 2.4 Unsupported or stale claims corrected in this change

| Claim | Where | Correction |
|---|---|---|
| Section 10 architecture "proposal, not built" | `docs/SPEC.md` 2.1, 10 | Implemented on `main` and staging; production gated |
| Retry and hard cases go to a cloud vision model | `docs/SPEC.md` 10.3, spec 004 plan | Superseded by Q18: no cloud reader in v1 |
| Partner auth "not decided" | `docs/SPEC.md` 10.9; spec 005 Users | Q19 resolved |
| Wordlist, resolver, capture "Not started" | `docs/SPEC.md` 12.1 | Updated to observed state |
| "Web client: Not built here"; intent "(build, draft)" | spec 005 | Built; intent accepted |
| Spec 004 "not built"; Q33 open | spec 004 spec and plan | Shared library parts implemented; Q33 resolved |
| PRs #118, #123, #124, #126 "In review" | `docs/project-board.md` | Merged |
| Demo follows v1 rules "open" | README, `specs/README.md` | Done (spec 001 T029) |
| Site label "Proposal, not built" | `src/content/architecture.ts:6` | Copy is Michael's; flagged as RM-046, not edited here |
| zzPage hosting | About explainer | Concept only; R-ZZPAGE (D-2026-10-10-17) |

The inventory agent could not see GitHub and reported PR #89, PR #91, and the 2026-10-06 recognizer intent as missing. They exist as open draft pull requests; the intent is on branch `spec/zz-ocr-qual-001`. The governance files now say "draft PR" wherever they cite them.

## 3. Backend architecture QA

Design review of the code, not runtime verification. "Verified" means a test in the Workers pool covers it; nothing below is verified on Cloudflare unless it says so.

### 3.1 Actual design

- One Worker (`workers/api/src/worker.ts`): `/v1*` to a Hono app; other paths to static assets with CSP and COOP headers; `scheduled` runs retention.
- Middleware order (`http/app.ts`): finalize (contract header, `no-store` default, log line), settings check fail-closed, contract check, handler (limiter first), error mapping. Matches plan.md.
- Platform-free domain logic lives in `packages/zz-core`. Handlers call D1, the Cache API, R2, and Durable Objects directly; only the clock, randomness, JWKS, `fetch`, and the photo reader are ports (`deps.ts`). This departs from `CLOUDFLARE-RUNTIME.md` Portability ("domain contracts remain independent of Cloudflare-specific APIs") for persistence code. It is acceptable for v1 because SQL stays portable; a move off Cloudflare would rewrite handlers, not grammar. Recorded, no item.
- FR-031 guarded batches are implemented for revoke, re-roll, single-use resolve, refresh rotation, nonce consume, deletion, and version append. The mint batch is unguarded (RM-033).
- Append-only audit is enforced by triggers in `migrations/0001_init.sql`.
- Tokens: HS256 access tokens with `alg` checked first; RS256 ID tokens with issuer, audience, expiry, and nonce; Ed25519 record signatures; HKDF-derived AES-GCM and HMAC keys.

### 3.2 Findings by severity

No critical defect was found. Authentication, algorithm confusion, nonce replay, race handling, and the one not-found body are sound in design and covered by tests.

| Id | Sev | Finding | Evidence | Failure scenario | Release impact | Remedy | Item |
|---|---|---|---|---|---|---|---|
| H1 | High | IPv6 callers rotate inside a /64 to escape the IP limit; every not-found resolve writes an audit row | `limits/enforce.ts:33-36`; spec 005 Resolve | Bulk guessing of about 7.1M two-word codes scrapes public records and grows the audit table | Blocks v1.0 | /64 keying, zone rule, growth monitor; density trigger | RM-030, RM-031, RM-041; D-2026-10-10-04, -05 |
| H2 | High | Grants are scope-wide; a scope is shared by every organization | FR-034, FR-035; `0001_init.sql` | A viewer at customer A reads customer B's private records | Blocks any multi-customer pilot | One-organization rule now; Organization in contract 2 | RM-063, RM-080; D-2026-10-10-06 |
| H3 | High | `ZZ_DATA_KEY` has no key id; rotation breaks Apple revocation at deletion | `lib/crypto.ts:9-10,97-112`; `account/me.ts:48-62` | After a compromise rotation, deletions silently fail to revoke Apple tokens | Blocks v1.0 | Key-id prefix and previous key | RM-021 |
| M1 | Med | No mint idempotency; no refresh grace | `codes/mint.ts`; `auth/session.ts:164-182` | A retried mint creates a second code; a retried refresh signs the user out | Pilot UX | Client single-flight now; idempotency key in contract 2 | RM-086 |
| M2 | Med | No timeout on Apple calls | `auth/apple.ts:37-41` | A hung Apple endpoint stalls sign-in and the cron | v1.0 | 3-second abort | RM-037 |
| M3 | Med | Retention is unbounded and unindexed | `retention/cron.ts`; `0001_init.sql:29-33` | A backlog exceeds invocation limits; later steps never run | v1.0 | Bounded loops, indexes | RM-035 |
| M4 | Med | Deletion fan-out purges every code and deletes all photos in one call | `account/me.ts:155-163` | An account with thousands of codes gets 500 after its deletion committed | v1.0 (store rule 5.1.1(v) in v1.1) | Purge cacheable codes only, chunk | RM-035 |
| M5 | Med | Re-roll skips the scope check | `codes/reroll.ts:86-97` | A removed issuer keeps issuing codes | v1.0 | Call `checkMintScope` | RM-032 |
| M6 | Med | Mint races deletion and suspension | `codes/store.ts:63-116` | Active code owned by a deleted account | v1.0 | Account guard in the batch | RM-033 |
| M7 | Med | Cache errors fail committed writes | `resolve/resolve.ts:205`; `codes/revoke.ts:55` | Client retries a committed version and creates a duplicate | v1.0 | `waitUntil` with catch | RM-034 |
| M8 | Med | Auditor queries scan; no cursor | `audit/route.ts:55-78` | Slow audit reads as the log grows | v1.3 | Scope index; cursor in contract 2 | RM-088, RM-089 |
| M9 | Med | A limiter error is 500 on every route | `limits/enforce.ts:23` | One Durable Object fault takes discovery and resolve down | v1.0 | Timeout and per-route policy | RM-038 |
| M10 | Med | No request id, version, or error class in logs; log settings live in the dashboard | `http/log.ts`; no `[observability]` block | Incidents cannot be correlated; a deploy could re-enable URL logging | v1.0 | Fields and pinned config | RM-036, RM-001 |
| M11 | Med | A D1 restore undoes deletions; migrations take no bookmark | `cloudflare-api-staging.yml:49-50` | Erased personal data returns after a restore | v1.0 | Deletion replay, bookmark | RM-023, RM-002 |
| M12 | Med | Tests are not documented as required | `ci.yml`; `site-ci.yml` | A failing test merges | v1.0 | Require `typecheck-and-test` | RM-005 |
| L1 to L11 | Low | Blocklist format characters; streaming body size; old Apple token kept; unaudited bad ID token; handle re-roll status; suspended reports; unattributed operator rows; `sed` substitution without escaping; Actions pinned by tag; staging `ZZ_BLOCKLIST` as a var | backend review notes | Minor abuse or audit gaps | v1.0 P2 or later | Hardening bundle | RM-039, RM-013 |

D1 query sizes stay far below the 100 bound-parameter limit; no IN-list grows with input. Time handling is consistent.

### 3.3 Interpreting a code versus authorizing an action

The separation holds. Parsing, classification, and check-word verification are pure functions in zz-core; the resolver re-parses on the server (FR-003), authorizes by bearer and grant, and never treats possession of a code as authority (Principle I). Macros remain plain codes to the grammar (DF-02). The one weakness is H2: authorization is scope-wide, so "who may see this private record" is coarser than the product intends for multiple customers.

### 3.4 Test coverage versus risk

Covered in the Workers pool: every route and error row, schema conformance, limiter windows, cache classes and local purge, same-isolate races, failed-audit rollback, deletion steps, cron happy paths, settings fail-closed, and token checks, at 100% coverage thresholds.

Not verified anywhere: remote JWKS and the real Apple token and revoke endpoints; multi-colo cache behavior; Durable Object errors and cross-region latency; D1 concurrency across isolates; limits at scale; transaction behavior of `wrangler d1 execute` for the operator SQL; platform log redaction; key rotation; R2 lifecycle deletion; any restore beyond the empty-table D1 drill; the production configuration (absent).

## 4. Steelman and challenge

### 4.1 The strongest case for the design

- **It solves the stated problem.** A person writes a short word code by hand; the server chooses the words from a filtered list with a check word that catches any single wrong word and any swap. Typed and camera input share one deterministic grammar, so every client agrees on what "the same code" means. The shared vector file (76 grammar, 17 classifier, 5 matching-key, 36 scanner, and 38 check-word rows) is the cross-platform contract.
- **Security lives where it can be enforced.** The code is public; the resolver decides disclosure with one not-found body, server-side expiry, single use, and revocation. That matches Principle I and survives a copied mark.
- **The platform choice is cheap to operate.** One Worker, one D1 database, one limiter class, and one cron cover the v1 surface with no servers to patch; secrets never enter the repository.
- **It fails closed.** Missing settings return 503; developer sign-in is refused in production; photo reads and free public codes are off by default.
- **Scope is governed.** The bundle and append-closed rules have kept semantic profiles, ZK, and VLM ideas out of contract 1.

### 4.2 Challenges and repairs

| Challenge | Assessment | Repair |
|---|---|---|
| Does the 2+check format resist bulk guessing? | No, not at scale. About 7.1M codes; at 1M issued, about 1 guess in 7 hits. Public records are public by design, so the harm is aggregation, not unauthorized access. | Controls now and a density trigger (D-2026-10-10-04, -05) |
| Does "scope" isolate customers? | No. It is a product partition, not a tenant. | Operating rule now; Organization in contract 2 (D-2026-10-10-06) |
| Is staging evidence evidence of production behavior? | Only for what staging exercises. It cannot sign in, mint, or cache. | Access-protected staging with writes on (D-2026-10-10-07) |
| Can the wordlist be fixed later? | Only for new codes, and only with multi-list verification, which contract 1 lacks. | Freeze with the decided filters; successor lists in v2.0 (D-2026-10-10-04) |
| Does a restore respect deletion? | No; Time Travel restores erased rows. | Deletion replay runbook (RM-023) |
| Do partial failures leave clean state? | Writes do (FR-031); cache side effects and deletion fan-out do not. | RM-034, RM-035 |
| Are retries safe? | Mint and refresh retries are not idempotent. | Client single-flight now; contract-2 key (RM-086) |
| Is the camera promise supported? | No measured accuracy exists. | Confirm-only fallback (D-2026-10-10-03) |
| Is the marketing migration needed for launch? | No user value at launch and a DNS risk. | Not a v1.0 gate (D-2026-10-10-15) |
| Is the operational burden right for a small team? | Yes if the switches are few and documented. | RM-025 kill switches; probe instead of a paging vendor (D-2026-10-10-11) |
| Will future bundles extend cleanly? | Mostly. Grammar, contract, and data are versioned; the missing pieces are organizations, multi-list verification, and contract negotiation, all gathered in v2.0. | RM-080 to RM-087 |

No new subsystem is proposed. Every repair is a fix inside an existing component, an operating rule, or a contract-2 item already implied by recorded decisions.

## 5. Research summary

Sources read 2026-10-10 through search results quoting vendor pages; direct fetches of `developers.cloudflare.com` were blocked by the session network policy (RM-010 rechecks them).

| Topic | Finding | Source | Used in |
|---|---|---|---|
| Cache API on workers.dev | Operations have no effect on `*.workers.dev`; custom domains have a working cache | [Cloudflare Cache API](https://developers.cloudflare.com/workers/runtime-apis/cache/) | D-2026-10-10-07 |
| D1 limits | 100 bound parameters per query; Time Travel 30 days on Paid, 7 on Free; 1,000 queries per invocation on Paid, 50 on Free | [D1 limits](https://developers.cloudflare.com/d1/platform/limits/) | D-2026-10-10-09, -10 |
| Workers subrequests | 10,000 per invocation on Paid since 2026-02-11; 50 external on Free | [Workers limits](https://developers.cloudflare.com/workers/platform/limits/), [changelog](https://developers.cloudflare.com/changelog/2026-02-11-subrequests-limit/) | D-2026-10-10-09 |
| Workers Logs | `[observability]` settings with head sampling; invocation logs carry the request URL | [Workers Logs](https://developers.cloudflare.com/workers/observability/logs/workers-logs/) | D-2026-10-10-11 |
| Access service tokens | Client id and secret sent as request headers; Zero Trust Free covers small teams | [Service tokens](https://developers.cloudflare.com/access/service-auth/service-token/) | D-2026-10-10-07 |
| Account deletion | In-app deletion required; Sign in with Apple apps revoke tokens through the REST API; revoke may return 200 for bad input | [App Review 5.1.1(v)](https://developer.apple.com/help/app-review/guideline-reference/5-1-1-account-deletion), [Offering account deletion](https://developer.apple.com/support/offering-account-deletion-in-your-app), [forum 707610](https://developer.apple.com/forums/thread/707610) | D-2026-10-10-02; RM-017 |
| Tolerant readers | kotlinx.serialization rejects unknown keys by default; Swift generators need an unknown-enum fallback | [ignoreUnknownKeys](https://kotlinlang.org/api/kotlinx.serialization/kotlinx-serialization-json/kotlinx.serialization.json/-json-builder/ignore-unknown-keys.html), [OpenAPI Generator Swift](https://openapi-generator.tech/docs/generators/swift6) | D-2026-10-10-12 |
| Dependency advisories | Six high, all build or simulator tooling | local `npm audit`; osv-scanner in run 37876538197 | D-2026-10-10-14 |

## 6. External dependencies and assumptions

| Dependency | Owner | Blocks | Working assumption or fallback |
|---|---|---|---|
| Resource creation, spend, DNS, deploy approval | Danny | v1.0 gates G11, G12 | None; agents never perform these |
| Apple and Google client registration | Danny | G4 | Developer sign-in on staging only |
| Privacy policy and legal text | Danny | G9 | No production accounts without it |
| Blocklist content | Michael and Danny | G8 | Production refuses to start without it (FR-024) |
| Q34 corpus | Danny | R-B2, R-B6 | Confirm-only camera; frozen list with risk acceptance |
| zzThat implementation, pins, tolerant readers | zzThat maintainers | v1.1 | v1.0 ships without apps |
| Cloudflare figures | vendor | Sizing | Recheck at implementation (RM-010) |
| Team context in `agent-context` | org | None found | Not loaded in this session |

## 7. Verification performed and its limits

| Check | Result |
|---|---|
| `bash scripts/check-agents-md.sh AGENTS.md` | Pass |
| `npm run lint`, `typecheck`, `test`, `build` | Pass before and after this change (Node 22.22.0 locally; CI uses Node 24) |
| Relative markdown links and anchors across every `.md` file | Pass after this change (script in the session scratchpad) |
| Gitleaks, full history, redacted | `main` clean; one finding on branch `spec/zz-ocr-qual-001` |
| `npm audit` | Six high, none in the Worker bundle (`workers/api/dist/meta.json`) |
| Live site, staging hosts, Cloudflare account | Not checked; the network policy blocks them. Staging facts come from committed evidence. |
| Project 25 field values | Not changed; the available connector cannot edit project fields. `docs/project-board.md` records the intended states. |
| New GitHub issues | The first attempt returned 403; after access was restored, #130 to #134 were filed ([BACKLOG.md](BACKLOG.md), Issues filed). |

## 8. Changed files

New: this report; `specs/RELEASE-ROADMAP.md`; `specs/BACKLOG.md`; `specs/decisions-2026-10-10.md`; `intent/2026-10-10-architecture-roadmap-review.md`.
Updated: `specs/README.md`, `specs/CAPABILITY-ROADMAP.md`, `specs/DECISION-STATUS.md`, `specs/TRACEABILITY.md`, `specs/DOMAIN-MODEL.md`, `docs/OPERATIONS.md`, `docs/DATA-LIFECYCLE.md`, `docs/THREAT-MODEL.md`, `docs/CONTRACT-EVOLUTION.md`, `docs/project-board.md`, `docs/SPEC.md` (status banners and Sections 2.1, 10, 12, 9a), `README.md` (status and roadmap), spec 002, 004, and 005 status lines and task reconciliation notes.
