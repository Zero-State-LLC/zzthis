# zzThis delivery backlog

Status: the repository copy of the kanban for the [release roadmap](RELEASE-ROADMAP.md), created 2026-10-10. The live board is the [zzThis + zzThat project](https://github.com/orgs/Zero-State-LLC/projects/25); [docs/project-board.md](../docs/project-board.md) defines how issue and PR truth maps to board status. When this file and an issue disagree, the issue and its PR evidence win, and this file is corrected.

Spec Kit task lists (`specs/NNN-*/tasks.md`) keep their T-numbers and history. This backlog adds cross-spec items with stable `RM-` ids. An id is never reused; a finished or dropped item stays with its final status.

## Fields

| Field | Values |
|---|---|
| Release | v1.0, v1.1, v1.2, v1.3, v2.0, v2.1, v2.2, or an `R-` phase |
| Priority | P0 blocks the release gate; P1 is required for the release but does not block other work starting; P2 should ship in the release; P3 may slip without a scope change |
| Status | Board values: Backlog, Ready, In progress, In review, Done. "Blocked on" names an external dependency. |
| Gate | The [roadmap](RELEASE-ROADMAP.md) gate the item's evidence feeds |
| Journey | The journey id in [TRACEABILITY.md](TRACEABILITY.md) |

Human-gated items (Principle VIII) name Danny or Michael as owner. An agent may prepare files for them but never performs the gated action.

## Existing issues mapped to items

| Issue or PR | Items |
|---|---|
| [#86](https://github.com/Zero-State-LLC/zzthis/issues/86) production readiness | RM-022 to RM-029, RM-040 to RM-043, RM-054 |
| [#93](https://github.com/Zero-State-LLC/zzthis/issues/93) B4 Cloudflare runtime | RM-001, RM-002, RM-012, RM-016, RM-031, RM-042, RM-045, RM-050 to RM-052 |
| [#92](https://github.com/Zero-State-LLC/zzthis/issues/92) dependency advisories | RM-004 |
| PR [#122](https://github.com/Zero-State-LLC/zzthis/pull/122) gitleaks allowlist | RM-003 |
| PR [#95](https://github.com/Zero-State-LLC/zzthis/pull/95) manual deploy workflow | superseded by RM-002 when it merges |
| PR [#89](https://github.com/Zero-State-LLC/zzthis/pull/89), PR [#115](https://github.com/Zero-State-LLC/zzthis/pull/115) OCR qualification | RM-060, RM-061, RM-064 |
| [#87](https://github.com/Zero-State-LLC/zzthis/issues/87) contract-2 gate | RM-080 |
| [#81](https://github.com/Zero-State-LLC/zzthis/issues/81), PR #82 semantic profiles | RM-091 |
| [#83](https://github.com/Zero-State-LLC/zzthis/issues/83), PR #84 ZK research | R-B15 |
| [#35](https://github.com/Zero-State-LLC/zzthis/issues/35) any-language codes | R-I18N |
| PR [#127](https://github.com/Zero-State-LLC/zzthis/pull/127) location | R-B17 |
| [#116](https://github.com/Zero-State-LLC/zzthis/issues/116), [#117](https://github.com/Zero-State-LLC/zzthis/issues/117), [#114](https://github.com/Zero-State-LLC/zzthis/issues/114), [#7](https://github.com/Zero-State-LLC/zzthis/issues/7), [#90](https://github.com/Zero-State-LLC/zzthis/issues/90) site content | RM-044 |
| [#11](https://github.com/Zero-State-LLC/zzthis/issues/11), [#8](https://github.com/Zero-State-LLC/zzthis/issues/8) xTechSearch | RM-047 (external, not a release item) |

## Issues filed 2026-10-10

Filed after the review once GitHub access was restored. Items already covered by #86, #93, #92, or PR #122 have no separate issue.

| Issue | Labels | Items |
|---|---|---|
| [#130](https://github.com/Zero-State-LLC/zzthis/issues/130) backend correctness and abuse defects | `bug`, `priority:high` | RM-021, RM-030, RM-032 to RM-039 |
| [#131](https://github.com/Zero-State-LLC/zzthis/issues/131) production Wrangler config and reviewer-gated workflow | `type:chore`, `priority:high` | RM-001, RM-002 |
| [#132](https://github.com/Zero-State-LLC/zzthis/issues/132) write path, edge cache, and real sign-in on Access-protected staging | `type:chore`, `priority:high` | RM-011 to RM-017 |
| [#133](https://github.com/Zero-State-LLC/zzthis/issues/133) production wordlist with Q35 filters and blocklist | `type:feature`, `priority:high` | RM-020, RM-028, RM-095 |
| [#134](https://github.com/Zero-State-LLC/zzthis/issues/134) privacy policy, support address, DSR runbook | `type:chore`, `priority:high` | RM-026, RM-027 |

## Dependency order for v1.0

```text
RM-003 security CI ─┐
RM-005 required tests ┤
RM-030..RM-039 backend fixes ─┬─> RM-013 staging config ─> RM-014/015 staging E2E ─┐
RM-021 data-key ids ──────────┘        ^                                           │
RM-012 staging host + Access ──────────┘──> RM-016 cache check ────────────────────┤
RM-011 OAuth clients ─> RM-017 real sign-in and Apple revoke ──────────────────────┤
RM-001 prod config ─> RM-002 prod workflow ─┐                                     │
RM-020 production wordlist ─────────────────┤                                     │
RM-022 escrow ─> RM-023 runbook ─> RM-024 drill ┤                                 │
RM-025 incident, RM-026 privacy, RM-027 DSR, RM-028 blocklist, RM-029 threat review ┤
RM-036 logging ─> RM-040 probe; RM-041 growth; RM-042 spend ─────────────────────┤
                                                                                   v
RM-050 production resources ─> RM-053 web build ─> RM-051 deploy ─> RM-052 canary ─> RM-054 GO
```

## v1.0 items

### RM-001 Production Wrangler configuration

- Release v1.0 · P0 · Ready · Bundle B4 · Gate G11 · Owner: API maintainer drafts; Danny supplies resource ids
- **Problem.** No production configuration exists. The default `workers/api/wrangler.toml` is local-only with placeholder ids, and production names exist only in `docs/cloudflare-resource-inventory.md`.
- **Outcome and scope.** Add `workers/api/wrangler.production.toml`: Worker `zzthis-api`, D1 `zzthis`, R2 `zzthis-photos`, the `Limiter` migration, the daily cron, the `zz.zer0state.com` custom domain (Q69), `ZZ_ENV=production`, every flag explicit (`ZZ_DEV_AUTH`, `ZZ_PHOTO_READS`, `ZZ_FREE_PUBLIC` false; `ZZ_MINT_ENABLED` true only at launch), an `[observability]` block with invocation logs off, and no secret values. Resource ids stay empty until Danny creates the resources (RM-050).
- **Depends on.** None. **Components.** `workers/api`, a new repository test.
- **Acceptance.** A test parses the file and fails if `ZZ_DEV_AUTH` or `ZZ_PHOTO_READS` is true, `ZZ_WORDLIST_VERSION` is `fixture-7`, invocation logs are on, a secret name appears under `[vars]`, or a staging resource name appears. `wrangler deploy --dry-run --config wrangler.production.toml` passes in CI without credentials.
- **Verification.** CI run of the new test and dry run.
- **Governing.** D-2026-10-10-08, D-2026-10-10-10; spec 005 Environment, FR-022, FR-027, FR-029; `specs/CLOUDFLARE-RUNTIME.md`.
- **Risks.** A wrong id binds staging data to production; the test's staging-name check guards it.

### RM-002 Manual production deploy workflow

- Release v1.0 · P0 · Ready · Bundle B4 · Gate G11 · Owner: API maintainer drafts; Danny owns the environment
- **Problem.** No production deploy path; PR #95 targets the local config without environment protection.
- **Outcome and scope.** `.github/workflows/cloudflare-api-production.yml`: `workflow_dispatch` only, `main` only, GitHub environment `production` with Danny as required reviewer, the same checks as the staging workflow, a D1 Time Travel bookmark printed before `migrations apply`, `wrangler deploy --config wrangler.production.toml`, and the Worker version id and git SHA in the job summary. Builds `apps/web` with the production `PUBLIC_*` values from environment variables.
- **Depends on.** RM-001. **Components.** `.github/workflows`.
- **Acceptance.** The workflow cannot run from a branch; a run without the reviewer's approval waits; a dry-run job variant passes on a pull request without credentials.
- **Verification.** Workflow lint, a dispatched dry-run job, the environment settings screenshot in the release packet.
- **Governing.** D-2026-10-10-08; AGENTS.md (agents do not dispatch production deploys); constitution Principle VIII.
- **Risks.** Required reviewers on environments depend on the repository plan; the repository is public, where they are available.

### RM-003 Repair the security check on main

- Release v1.0 · P0 · Ready · Bundle B4 · Gate G1 · Owner: any maintainer
- **Problem.** `security` fails on every push to `main` since 2026-10-08 because gitleaks scans every ref and finds a verified false positive on the unmerged branch `spec/zz-ocr-qual-001` (`scripts/ocr-qualification/receipt-semantics.mjs:79`, commit `ab3983ab95`).
- **Outcome and scope.** Land a `.gitleaks.toml` allowlist scoped to that commit, path, and line (draft PR #122). Do not narrow the scan to `main`.
- **Depends on.** None. **Components.** gitleaks configuration, `scripts/security-scan.sh` if it needs a config flag.
- **Acceptance.** `security` is green on `main`; a test commit with a synthetic key-shaped string on a scratch branch still fails the scan.
- **Verification.** Workflow runs before and after; local `gitleaks git --redact`.
- **Governing.** D-2026-10-10-13; AGENTS.md Escalation (no weakening).

### RM-004 Dependency advisory disposition (#92)

- Release v1.0 · P2 · Ready · Bundle B4 · Gate G10 · Owner: any maintainer
- **Problem.** Six high advisories are reported; their reachability was undocumented.
- **Outcome and scope.** Record the 2026-10-10 disposition (all six are developer or build tooling; the Worker bundle holds only `hono`, `jose`, `zod`, and `@zzthis/zz-core`) in #92, then bump `wrangler`, `@cloudflare/vitest-pool-workers`, and `astro` in a separate pull request when non-breaking fixes exist.
- **Acceptance.** `npm audit` shows no high advisory in a package that `workers/api/dist/meta.json` lists as an input; all checks pass after the bump.
- **Verification.** `npm audit --json` and the bundle metafile in the PR body.
- **Governing.** D-2026-10-10-14; D-2026-10-05-05 merge rule.

### RM-005 Make the test job a required check

- Release v1.0 · P1 · Ready · Bundle B4 · Gate G1 · Owner: Danny (branch protection)
- **Problem.** Only `build` (lint and build) is documented as required; the 861 tests run in `site-ci.yml` (`typecheck-and-test`).
- **Acceptance.** Branch protection lists `typecheck-and-test`; a PR with a failing test cannot merge.
- **Governing.** D-2026-10-10-20; constitution Engineering standards (do not edit `ci.yml`).

### RM-006 Specification and status convergence (this review)

- Release v1.0 · P1 · Done (2026-10-10, this change) · Owner: reviewer
- **Outcome.** Stale "not built", "proposal", and "open" statements corrected; roadmap, backlog, decisions, traceability, and domain states added.
- **Verification.** Link check and repository checks recorded in the [analysis](analysis-2026-10-10-architecture-review.md).

### RM-007 Intent status hygiene

- Release v1.0 · P3 · Backlog · Owner: Danny accepts; any maintainer edits
- **Problem.** Seven intents still read "draft (accepted when Danny merges)" although their PRs merged; `intent/2026-10-06-v1-display-in-capitals.md` is an unaccepted draft that conflicts with spec 001 FR-019.
- **Acceptance.** Each intent shows `accepted` with its merge PR, or `superseded`; the capitals draft is marked superseded or kept as draft with a note naming the conflict.
- **Governing.** `intent/README.md`.

### RM-010 Recheck platform facts against live vendor documentation

- Release v1.0 · P2 · Ready · Bundle B4 · Owner: API maintainer
- **Problem.** The 2026-10-10 review read Cloudflare limits through search results because direct fetches were blocked.
- **Acceptance.** Each figure cited in `specs/decisions-2026-10-10.md` (Cache API on workers.dev, D1 and Workers limits, Time Travel windows, Access service tokens) is confirmed or corrected with a dated link.

### RM-011 Register Apple and Google sign-in clients

- Release v1.0 · P0 · Blocked on Danny · Bundle B4 · Gate G4 · Owner: Danny
- **Scope.** Apple App ID with Sign in with Apple, a Services ID with domain verification for `zz.zer0state.com` and the staging host, a Sign in with Apple key; Google OAuth clients for web and iOS (Android in v1.1). Store values as Worker secrets and GitHub environment variables, never in git.
- **Acceptance.** Staging discovery lists `apple` and `google`; `/signin/` shows both buttons on staging.
- **Governing.** spec 005 FR-020, Provider constants, Build settings; plan.md Human-gated setup.

### RM-012 Access-protected staging hostname

- Release v1.0 · P0 · Blocked on Danny · Bundle B4 · Gate G2, G3 · Owner: Danny
- **Scope.** A staging hostname on the `zer0state.com` zone routed to `zzthis-api-staging`, protected by Cloudflare Access with a service token for automation.
- **Acceptance.** An unauthenticated request gets the Access challenge; a request with the service token reaches `GET /v1` with 200.
- **Governing.** D-2026-10-10-07. **Risks.** Free-plan seat limits; recheck at setup.

### RM-013 Staging configuration that can exercise writes

- Release v1.0 · P0 · Ready (applies after RM-012) · Bundle B4 · Gate G2 · Owner: API maintainer
- **Problem.** Staging has mint, developer sign-in, and providers off, so no write path has run on Cloudflare.
- **Scope.** In `wrangler.staging.toml`: `ZZ_DEV_AUTH=true`, `ZZ_MINT_ENABLED=true`, `fixture-7`, and `ZZ_BLOCKLIST` moved from `[vars]` to a secret so staging matches the production binding type. Add a documented reset step that empties application tables before a run. Only after RM-012, never on the public workers.dev host alone.
- **Acceptance.** Discovery on the staging host lists `dev`; a fresh reset leaves every application table empty.
- **Governing.** spec 005 FR-022 (developer sign-in is allowed outside production); D-2026-10-10-07.

### RM-014 Run the end-to-end suite against staging

- Release v1.0 · P0 · Ready (after RM-013) · Bundle B1, B4 · Gate G2 · Journeys J1 to J7
- **Scope.** Let `apps/web/playwright.config.ts` take a base URL and Access headers from the environment while keeping the local default; run the existing two flows against staging from a manual workflow.
- **Acceptance.** Both flows pass on staging with no CSP violation; the run URL is in the release packet.
- **Governing.** spec 005 plan.md Tests; T032.

### RM-015 API smoke and rate-limit verification script

- Release v1.0 · P0 · Ready (after RM-013) · Bundle B4 · Gate G2 · Journeys J1, J2, J6
- **Scope.** A script that calls every OpenAPI operation once with valid input and checks status and schema, then drives each rate-limit row to its first 429 with bounded traffic, and records p50 and p95 latency for resolve, mint, and token.
- **Acceptance.** Every row in the spec 005 Rate limits table returns 429 at its limit plus one with `Retry-After`; the report is stored in the release packet.
- **Governing.** spec 005 FR-011, Rate limits.

### RM-016 Verify the edge cache on a custom hostname

- Release v1.0 · P0 · Ready (after RM-012) · Bundle B1 · Gate G3 · Journeys J1, J5
- **Scope.** Mint a reusable public code, resolve twice (miss then hit), revoke, resolve in the same data center (404), and probe a second data center until max-age passes.
- **Acceptance.** Observed behavior matches FR-018 and FR-019; any deviation becomes a bug issue.
- **Governing.** FR-018, FR-019; D-2026-10-10-07 (fallback RM-052).

### RM-017 Real provider sign-in and Apple revocation check

- Release v1.0 · P0 · Ready (after RM-011) · Bundle B1 · Gate G4 · Journeys J6, J7
- **Scope.** One manual Apple web and one Google web sign-in on staging; delete the account; confirm Apple revocation by attempting a refresh with the revoked Apple token from a test harness and seeing it rejected, since Apple's revoke endpoint returns 200 even for wrong input (developer forum thread 707610).
- **Acceptance.** Both sign-ins create accounts; after deletion the Apple refresh is rejected and no `pending_revocations` row remains.
- **Governing.** FR-020, FR-023.

### RM-020 Build and freeze the production wordlist

- Release v1.0 · P0 · Ready · Bundle B6 · Gate G8 · Owner: maintainer builds; Michael reviews words; Danny freezes
- **Scope.** Extend the spec 003 pipeline with the Q35 filters: a published confusable-letter table and a Double Metaphone collision filter, then the private `ZZ_BLOCKLIST` (T037). Commit the list under a new version id with its yield report; keep proto-v0 unchanged (FR-017). Any new dependency (for example a Double Metaphone package) goes through dependency review.
- **Acceptance.** Deterministic rebuild (FR-019); N is prime and at least 1,000; the report lists every removed word with its filter; check-word tests pass exhaustively on the fixture and by property on the new list (FR-020); Danny's freeze record cites R-B6 evidence or an explicit risk acceptance.
- **Governing.** D-2026-10-10-04; spec 003 FR-001, FR-002, Prototype defaults; spec 005 T037; Q35.
- **Risks.** Permanent after the first production mint.

### RM-021 Key ids for `ZZ_DATA_KEY` sealed values and tags

- Release v1.0 · P0 · Ready · Bundle B4 · Gate G5 · Journeys J7
- **Problem.** Sealed Apple tokens and HMAC tags carry no key id and use fixed `v1` HKDF labels (`workers/api/src/lib/crypto.ts:9-10,97-112`), so a rotation silently breaks Apple revocation at deletion (`account/me.ts:48-62`).
- **Scope.** Prefix new sealed values with a key id; accept an optional `ZZ_DATA_KEY_PREVIOUS` for decryption; treat unprefixed values as the first key; add a re-encrypt step in the cron.
- **Acceptance.** A test seals with key A, rotates to key B with A as previous, and still revokes; a test with no previous key fails closed with a logged class.
- **Governing.** D-2026-10-10-19; `docs/OPERATIONS.md` Key and secret lifecycle.

### RM-022 Secret escrow and rotation runbook

- Release v1.0 · P0 · Ready · Bundle B4 · Gate G5 · Owner: Danny
- **Scope.** For each of `ZZ_TOKEN_SECRET`, `ZZ_DATA_KEY`, `ZZ_RECORD_SIGNING_KEY` (with key id), and `APPLE_PRIVATE_KEY`: owner, escrow location outside Cloudflare and the repository, rotation cadence, compromise procedure, and the user impact of rotation (token secret: every access token fails within 15 minutes and clients refresh; data key: RM-021; signing key: new id, old signatures stay stored).
- **Acceptance.** A staging drill restores all four from escrow into a scratch Worker that passes the settings check.
- **Governing.** D-2026-10-10-10; Q28; OPERATIONS.

### RM-023 Restore runbook with deletion replay

- Release v1.0 · P0 · Ready · Bundle B4 · Gate G5
- **Problem.** A D1 Time Travel restore undoes account deletions made after the restore point, so erased text and Apple tokens would return.
- **Scope.** Before restore, export the list of account ids deleted after the target time from the audit log; after restore, re-run deletion for each. Capture a bookmark before every migration (RM-002).
- **Acceptance.** The drill in RM-024 includes a deletion after the bookmark, and the account stays deleted after restore and replay.
- **Governing.** D-2026-10-10-10; `docs/DATA-LIFECYCLE.md` Deletion evidence.

### RM-024 Recovery drill and objectives

- Release v1.0 · P0 · Ready (after RM-013, RM-022, RM-023) · Bundle B4 · Gate G5 · Owner: Danny accepts numbers
- **Scope.** Seed staging with accounts, codes, versions, grants, and audit rows; restore to a bookmark; verify row counts, a sample resolve, audit continuity, and the deletion replay; time it from declaration to verified service.
- **Acceptance.** Measured RTO and RPO meet the accepted targets (proposed 4 hours and 5 minutes); Danny records acceptance.
- **Governing.** D-2026-10-10-10; OPERATIONS Recovery objectives.

### RM-025 Incident runbook, contacts, and kill switches

- Release v1.0 · P0 · Ready · Bundle B4 · Gate G10 · Owner: Danny
- **Scope.** Contacts and escalation for P0 to P3; switches that fail safe with one deploy (`ZZ_MINT_ENABLED=false` stops new codes; the zone rule can block `/v1/resolve/*`; Worker rollback to a recorded version); evidence preservation.
- **Acceptance.** A tabletop exercise is recorded with times.
- **Governing.** OPERATIONS Incident management.

### RM-026 Privacy policy, support address, and production build settings

- Release v1.0 · P0 · Blocked on Danny (legal) · Bundle B4, B5 · Gate G9
- **Scope.** Publish a privacy policy that states FR-026 retention, provider data use, and deletion; set `PUBLIC_PRIVACY_URL`, `PUBLIC_SUPPORT_EMAIL`, and the provider ids for the production web build.
- **Acceptance.** `/account/` on production shows working privacy and support links; the policy text matches `docs/DATA-LIFECYCLE.md`.
- **Governing.** D-2026-10-10-16; spec 005 Build settings; FR-026.

### RM-027 Data-subject request runbook

- Release v1.0 · P1 · Ready · Bundle B4 · Owner: Danny
- **Scope.** SQL queries and steps for access and deletion requests received by email, with identity checks and an audit note; complete the open rows of `docs/DATA-LIFECYCLE.md` (tombstone retention, audit retention, export).
- **Acceptance.** A staging dry run answers an access request for a seeded account.
- **Governing.** D-2026-10-10-16.

### RM-028 Production blocklist content

- Release v1.0 · P0 · Blocked on Michael and Danny · Bundle B1 · Gate G8
- **Scope.** Supply `ZZ_BLOCKLIST` as a production secret (required non-empty in production, FR-024) and use the same list in RM-020.
- **Acceptance.** Production settings check passes; a staging test term is refused with 422 `content-refused`.

### RM-029 Threat-model review and residual risks

- Release v1.0 · P0 · Ready (after RM-030 to RM-038) · Bundle B4 · Gate G10 · Owner: Danny signs
- **Scope.** Walk every row of `docs/THREAT-MODEL.md`; attach test or control evidence; sign the residual risks named there, including public-record enumeration and the single-organization rule.
- **Acceptance.** No row lacks evidence or a signed acceptance.

### RM-030 Rate-limit IPv6 callers by /64

- Release v1.0 · P0 · Ready · Bundle B1 · Gate G10 · Journeys J1
- **Problem.** `workers/api/src/limits/enforce.ts:33-36` keys on the full address.
- **Acceptance.** Two addresses in one /64 share a bucket; two IPv4 addresses do not; the HMAC still hides the prefix (FR-027).
- **Governing.** D-2026-10-10-05; FR-011.

### RM-031 Zone rate-limiting rule for resolve

- Release v1.0 · P1 · Blocked on Danny · Bundle B4 · Gate G10
- **Scope.** A Cloudflare rule on `zz.zer0state.com/v1/resolve/*` above the Worker limits, as defense in depth.
- **Acceptance.** The rule is recorded in the resource inventory with its threshold and does not trip during RM-015 traffic.

### RM-032 Re-roll checks the scope

- Release v1.0 · P0 · Ready · Bundle B1 · Journeys J3
- **Problem.** `rerollCode` never calls `checkMintScope` (`workers/api/src/codes/reroll.ts:86-97`), so an account whose issuer grant was removed, or a `free_public` code after the flag turns off, still gets a new code.
- **Acceptance.** Re-roll after `remove-grant.sql` returns 403 `forbidden`; re-roll of a `free_public` code with the flag off returns 403 `scope-unavailable`; nothing is written.
- **Governing.** FR-005, FR-034.

### RM-033 Mint checks the account in its batch

- Release v1.0 · P0 · Ready · Bundle B1 · Journeys J2, J7
- **Problem.** The mint batch is plain inserts (`workers/api/src/codes/store.ts:63-116`), so a mint racing `DELETE /v1/me` or `suspend.sql` can leave an active code owned by a deleted or suspended account.
- **Acceptance.** An interleaving test leaves no active code for a deleted or suspended account; the response is 401 or 403 as for a request that arrived after.
- **Governing.** FR-023, FR-025, FR-031.

### RM-034 Cache writes and purges never fail a committed request

- Release v1.0 · P0 · Ready · Bundle B1 · Journeys J1, J4, J5
- **Problem.** `storeResolve` and `purgeResolve` are awaited inline (`workers/api/src/resolve/resolve.ts:205`, `codes/revoke.ts:55`, `records/versions.ts:112`, `codes/reroll.ts:107`); a cache error turns a committed write into 500.
- **Acceptance.** With a throwing cache, resolve returns 200, revoke 200, and a version 201; a purge-failure log class is emitted; FR-018's 60-second bound is the only consequence.

### RM-035 Bound retention and deletion work; add cron indexes

- Release v1.0 · P0 · Ready · Bundle B1, B4 · Gate G6 · Journeys J7, J8
- **Problem.** The cron selects and deletes without limits (`workers/api/src/retention/cron.ts`); account deletion purges every revoked code and deletes all photos in one call (`account/me.ts:155-163`); retention queries scan without indexes.
- **Scope.** Limited loops with a time budget and per-step isolation; purge only codes that were cacheable; chunk R2 deletes at 1,000 keys; indexes on `auth_nonces(expires_at)`, `refresh_tokens(expires_at)`, `pending_revocations(next_attempt_at)`, `reports(closed_at)`; a log class for abandoned Apple revocations.
- **Acceptance.** Deleting an account with 5,000 codes returns 204; a cron run with 10,000 expired nonces finishes over successive runs without exceeding one invocation's limits.

### RM-036 Request, version, and error-class logging

- Release v1.0 · P0 · Ready · Bundle B4 · Gate G7
- **Scope.** Log the request id and `cf-ray` and return `X-Request-Id`; log the deployed version from version metadata; log D1, R2, and Durable Object error classes; keep FR-027 exclusions.
- **Acceptance.** A log-line test asserts the fields and the absence of code, token, text, and IP.

### RM-037 Timeouts on outbound calls

- Release v1.0 · P1 · Ready · Bundle B1 · Journeys J6, J7
- **Problem.** Apple token and revoke calls have no timeout (`workers/api/src/auth/apple.ts:37-41`).
- **Acceptance.** A never-resolving stub returns within 3 seconds; sign-in still succeeds and logs the failure (FR-020); the cron moves on to the next row.

### RM-038 Limiter failure policy

- Release v1.0 · P1 · Ready · Bundle B1 · Journeys J1
- **Problem.** A Durable Object error or hang becomes 500 on every route (`workers/api/src/limits/enforce.ts:23`).
- **Scope.** A timeout and a documented policy per route class: fail closed for auth, mint, re-roll, and reports; fail open for discovery and the OpenAPI document. Resolve fails closed (abuse risk).
- **Acceptance.** A test per route class shows the documented status when the limiter throws.

### RM-039 Low-severity hardening

- Release v1.0 · P2 · Ready · Bundle B1
- **Scope.** Strip Unicode format characters before the blocklist check (`workers/api/src/lib/text.ts:5`); check JSON body size while streaming (`http/body.ts:21-22`); revoke the previous Apple token when a new one replaces it (`auth/signin.ts:88-96`); audit a rejected ID token; return `reroll-cap` for a handle re-roll even when mint is disabled (`codes/reroll.ts:88`); document whether reports and reads from suspended accounts are allowed (FR-025).
- **Acceptance.** One test per change.

### RM-040 Synthetic probe

- Release v1.0 · P1 · Ready (after RM-051 for production) · Bundle B4 · Gate G7
- **Scope.** A scheduled GitHub Actions workflow (public repository minutes) that calls `GET /v1` and resolves one synthetic public code every 15 minutes and opens an issue on failure.
- **Acceptance.** A forced failure on staging opens one issue and no duplicates.

### RM-041 Storage growth and audit retention decision

- Release v1.0 · P1 · Ready · Bundle B4 · Owner: Danny decides retention
- **Scope.** A weekly count of rows per table and D1 size; the D-2026-10-10-10 trigger (1 GB or 6 months) for an audit minimization decision.
- **Acceptance.** First weekly report recorded after launch.

### RM-042 Plan, spend guardrails, and alerts

- Release v1.0 · P0 · Blocked on Danny · Bundle B4 · Gate G11
- **Scope.** Move the account to Workers Paid (D-2026-10-10-09); set usage notifications; record thresholds by name, not price, in the inventory.
- **Acceptance.** The inventory lists the plan and the alert names.

### RM-043 Service objective posture

- Release v1.0 · P1 · Blocked on Danny · Bundle B4
- **Scope.** Accept or reject the proposed internal objective: no public SLO; track 30-day resolve success from Cloudflare metrics and review weekly during the first pilot.
- **Acceptance.** `docs/OPERATIONS.md` records the decision.

### RM-044 Site content backlog

- Release v1.0 · P3 · Backlog · Bundle B5 · Owner: Michael
- **Scope.** Spec 001 open tasks T009, T011, T013, T014, T015, T017, T030, T042, T043, T053 and issues #7, #114, #116, #117; PRs #91, #120, #125.
- **Acceptance.** Each closes under its own task text. None blocks v1.0.

### RM-045 Marketing site Worker migration

- Release: any (optional) · P3 · Backlog · Bundle B4 · Owner: Danny for DNS
- **Scope.** `docs/cloudflare-site-cutover.md` against the current `/` base and accepted content.
- **Governing.** D-2026-10-10-15.

### RM-046 Honest architecture label on the site

- Release v1.0 · P2 · Backlog · Bundle B5 · Owner: Michael (copy)
- **Problem.** `src/content/architecture.ts:6` says "Proposal, not built" while the server exists on staging. At v1.0 the label becomes false in the other direction.
- **Acceptance.** Michael's wording ships before the v1.0 announcement and claims nothing beyond the release packet.
- **Governing.** Constitution Principle IV.

### RM-047 xTechSearch submission (external)

- Not a release item · Owner: Danny · Issues #11 (decide by 2026-10-12), #8
- **Note.** The site is one of the materials; no submission text may claim production use before RM-054.

### RM-050 Create production resources

- Release v1.0 · P0 · Blocked on Danny · Bundle B4 · Gate G11
- **Scope.** Worker, D1, R2 with no public access and a 30-day `reads/` rule, limiter namespace, cron, secrets, `zz.zer0state.com`. Record names and ids in the inventory.

### RM-051 Production deploy

- Release v1.0 · P0 · Blocked on Danny · Bundle B4 · Gate G11 · Depends on every P0 above
- **Acceptance.** RM-002 run approved by Danny; version id and SHA recorded.

### RM-052 Production canary

- Release v1.0 · P0 · Ready (after RM-051) · Bundle B4 · Gate G3, G12
- **Scope.** Within 1 hour: discovery, real sign-in, one operator-minted synthetic code (public web mint is off in v1.0, D-2026-10-10-21), resolve (cache miss and hit if RM-016 did not run), revoke, delete account; latency within twice the staging p95 (PROPOSED).
- **Acceptance.** Results in the release packet; rollback rehearsed to the recorded previous version if a step fails.

### RM-053 Production web build

- Release v1.0 · P0 · Ready (after RM-011, RM-026) · Bundle B1
- **Acceptance.** The deployed `/signin/` shows Apple and Google only; no `dev`; the dist check passes.
- **PROPOSED (D-2026-10-10-21, Danny agreed in chat 2026-10-09; adopted on merge).** v1.0 web is lookup only: production discovery reports `free_public: false`, so `/create/` shows its Unavailable state; web create, edit, and revoke are verified in v1.1.

### RM-054 Release evidence packet and GO decision

- Release v1.0 · P0 · Backlog · Bundle B4 · Owner: Danny decides
- **Scope.** One document linking every gate's evidence, open risks, and the decision.
- **Acceptance.** Every gate G1 to G12 has a dated link or the decision is NO-GO.

### RM-063 Single-organization grant runbook

- Release v1.0 · P1 · Ready · Bundle B1 · Journeys J10
- **Scope.** Add the D-2026-10-10-06 rule to the operator SQL docs (`workers/api/ops/grant.sql` header and plan.md Operator work).
- **Acceptance.** The runbook names the rule and the check the operator performs before each grant.

## v1.1 items

### RM-060 Land the qualification specification

- Release v1.1 · P0 · In review (PR #89, draft) · Bundle B2 · Phase R-B2
- **Acceptance.** PR #89 rebased on `main`, independently reviewed, and merged; `specs/004-capture` cites the RecognitionResult boundary and the receipt states.

### RM-061 Qualification harness and protected workflow

- Release v1.1 · P0 · In progress (PR #115, draft) · Bundle B2 · Phase R-B2
- **Acceptance.** Evidence reconciliation, metric recomputation, decoder replay, and Sigstore verification implemented; the protected workflow identity pinned; schema-valid negative receipts fail.

### RM-062 Private qualification corpus (Q34)

- Release v1.1 and R-B6 · P0 · Blocked on Danny · Bundle B2, B6
- **Acceptance.** A private corpus with written consent, no faces, personal data, or location metadata, split into tuning and final sets, stored outside the repository.

### RM-064 Engine decision per platform

- Release v1.1 · P0 · Backlog · Bundle B2 · Phase R-B2 exit
- **Acceptance.** A PASS receipt per promoted engine, or a recorded confirm-only decision (D-2026-10-10-03).

### RM-065 Confirm-only camera mode in spec 004

- Release v1.1 · P1 · Ready · Bundle B2
- **Acceptance.** Spec 004 band tables state that Accept requires a PASS receipt for the platform and engine, with shared band vectors for confirm-only mode.

### RM-066 zzThat pins the v1.0 release commit (external)

- Release v1.1 · P0 · Blocked on v1.0 · Bundle B3 · Owner: zzThat maintainers
- **Acceptance.** `scripts/pin-zzthis.sh` output at the release SHA; the zzThat contract tests pass against production discovery.

### RM-067 Store submissions (external)

- Release v1.1 · P0 · Blocked on Danny · Bundle B3
- **Acceptance.** Both stores approve; account deletion in each app verified against production.

### RM-068 Report handling commitment for user-written pages

- Release v1.1 · P1 · Ready · Bundle B1, B3 · Owner: Danny
- **Scope.** A triage cadence for `reports.sql`, a block or suspend path, and the response the apps show, to meet App Store guideline 1.2 for user-generated content.

### RM-069 Site "Try zzThat" and app parity

- Release v1.1 · P2 · Backlog · Bundle B5 · spec 001 T016, T044

### RM-070 Creation check in the apps (external)

- Release v1.1 · P2 · Backlog · Bundle B2 · spec 004 FR-017

### RM-071 Brand files the apps need

- Release v1.1 · P1 · Blocked on Michael · Bundle B3
- **Scope.** The lowercase zzThat wordmark in `design/brand/` and a square app icon (`design/UX.md`).

### RM-075 Tolerant-reader verification in zzThat (external)

- Release v1.1 · P1 · Backlog · Bundle B3
- **Acceptance.** Generated clients ignore unknown keys and tolerate unknown enum values, shown by a contract test with an extra field.
- **Governing.** D-2026-10-10-12.

## v1.2 and v1.3 items

### RM-076 Public community codes review

- Release v1.2 · P1 · Backlog (QUEUED) · Bundle B9 · Owner: Danny promotes
- **Acceptance.** Written abuse review from v1.0 data; content policy; `ZZ_FREE_PUBLIC=true` in production after approval.
- **PROPOSED (D-2026-10-10-21, Danny agreed in chat 2026-10-09; adopted on merge).** Release v1.1 · P0 · Covers web and app create together · Gate: v1.1 store launch. Adds a per-account daily mint cap for `free_public`, a moderation runbook with a named moderator and response time, written spend and abuse thresholds for turning the flag off, and a staging rehearsal of `ZZ_FREE_PUBLIC=false` as the kill switch.

### RM-077 Report triage tooling

- Release v1.2 · P2 · Backlog · Bundle B9 · Operator SQL views for open reports by age and code.
- **PROPOSED (D-2026-10-10-21, Danny agreed in chat 2026-10-09; adopted on merge).** Release v1.1 · P1, required before `ZZ_FREE_PUBLIC` turns on.

### RM-078 Web issuer controls

- Release v1.3 · P1 · Backlog (QUEUED) · Bundle B7 · Journeys J2, J9
- **Scope.** Create offers `visibility`, `single_use`, and `expires_at` for scopes where the caller holds `issuer`; resolve sends the bearer only for a signed-in viewer path and never caches (FR-008).
- **Acceptance.** Playwright flows for a private code, a single-use code, and an expiring code.

### RM-079 Web auditor view

- Release v1.3 · P2 · Backlog · Bundle B7 · Journeys J11 · FR-016.

### RM-088 Audit scope index

- Release v1.3 · P2 · Backlog · Bundle B7 · Index `codes(scope)` and record each event's scope at insert so auditor queries stop scanning.

## v2.0 to v2.2 items

| ID | Release | Pri | Status | Item | Governing |
|---|---|---|---|---|---|
| RM-080 | v2.0 | P0 | Backlog | #87 gate extended with an Organization entity: Scope, Namespace, Organization cardinality, ownership, grants, migration | #87; D-2026-10-10-06; DOMAIN-MODEL |
| RM-081 | v2.0 | P1 | Backlog | Multi-list verification and per-scope dictionaries; discovery lists versions | spec 003 FR-017, FR-022; D-2026-10-10-04 |
| RM-082 | v2.0 | P1 | Backlog | `GET /v1/keys` and client signature verification | Q28 |
| RM-083 | v2.0 | P1 | Backlog | Partner OAuth 2.0 client credentials, one client per partner | Q19; B11 |
| RM-084 | v2.0 | P2 | Backlog | No-device field-code claim and scope-aware handles | Q25, Q56, Q71 |
| RM-085 | v2.0 | P2 | Backlog | Self-service data export | D-2026-10-10-16 |
| RM-086 | v2.0 | P2 | Backlog | Mint idempotency key; reuse grace evaluation (DF-10) | backend review M1 |
| RM-087 | v2.0 | P0 | Backlog | Contract negotiation, dual-contract tests, deprecation record | CONTRACT-EVOLUTION |
| RM-089 | v2.0 | P3 | Backlog | Audit cursor across equal timestamps | backend review M8 |
| RM-090 | v2.0 | P3 | Backlog | Name suffixes beyond `.eth` | spec 003 FR-023 |
| RM-091 | v2.1 | P1 | Backlog (SHADOW) | Semantic profiles after RM-080 and PR #82 | #81 |
| RM-092 | v2.2 | P1 | Backlog (RESEARCH) | Advanced recognition and photo reads after R-B12; R2 joins recovery scope | B12; spec 005 US5 |
| RM-095 | R-B6 | P1 | Backlog | Human and OCR confusion evaluation of the production list on the Q34 corpus | spec 003 FR-001, FR-002 |
