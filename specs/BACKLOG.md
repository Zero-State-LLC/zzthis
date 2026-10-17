# zzThis delivery backlog

Status: the repository copy of the kanban for the [release roadmap](RELEASE-ROADMAP.md), created 2026-10-10. The live board is the [zzThis + zzThat project](https://github.com/orgs/Zero-State-LLC/projects/25); [docs/project-board.md](../docs/project-board.md) defines how issue and PR truth maps to board status. When this file and an issue disagree, the issue and its PR evidence win, and this file is corrected. Reconciled 2026-10-15 to pull requests #173 to #178 and to zzThat #79. Live Project 25 Status fields were not written in that pass: the token lacks the `read:project` scope. Intended statuses are in [docs/project-board.md](../docs/project-board.md).

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
| PR [#95](https://github.com/Zero-State-LLC/zzthis/pull/95) production Wrangler file and manual workflow | merged 2026-10-14; RM-001 and RM-002 files are on main; resource ids still empty (RM-050); workflow not dispatched |
| PR [#89](https://github.com/Zero-State-LLC/zzthis/pull/89), PR [#115](https://github.com/Zero-State-LLC/zzthis/pull/115) OCR qualification | RM-060 Done (#89); RM-061 preflight merged (#115), PASS receipt still open; RM-064 |
| [#87](https://github.com/Zero-State-LLC/zzthis/issues/87) contract-2 gate | RM-080 |
| [#81](https://github.com/Zero-State-LLC/zzthis/issues/81), PR #82 semantic profiles | RM-091 |
| [#83](https://github.com/Zero-State-LLC/zzthis/issues/83), PR #84 ZK research | R-B15 |
| [#35](https://github.com/Zero-State-LLC/zzthis/issues/35) any-language codes | R-I18N |
| PR [#127](https://github.com/Zero-State-LLC/zzthis/pull/127) location | R-B17 |
| [#116](https://github.com/Zero-State-LLC/zzthis/issues/116), [#117](https://github.com/Zero-State-LLC/zzthis/issues/117), [#114](https://github.com/Zero-State-LLC/zzthis/issues/114), [#7](https://github.com/Zero-State-LLC/zzthis/issues/7), [#90](https://github.com/Zero-State-LLC/zzthis/issues/90) site content | RM-044 |
| [#11](https://github.com/Zero-State-LLC/zzthis/issues/11), [#8](https://github.com/Zero-State-LLC/zzthis/issues/8) xTechSearch | RM-047 (external, not a release item) |
| PR [#173](https://github.com/Zero-State-LLC/zzthis/pull/173) docs reconciliation | merged 2026-10-15 |
| PR [#174](https://github.com/Zero-State-LLC/zzthis/pull/174) operator account deletion | merged 2026-10-15; RM-023 script and tests; RM-027 runbook. The RM-024 drill and the RM-027 staging dry run stay open |
| PR [#175](https://github.com/Zero-State-LLC/zzthis/pull/175) dev sharp and undici | merged 2026-10-15; RM-004 partial. #92 stays open: `http-cache-semantics` has no patched version |
| PR [#176](https://github.com/Zero-State-LLC/zzthis/pull/176) staging flags | merged 2026-10-15; RM-013 repo half. RM-012 stays blocked on Danny |
| PR [#177](https://github.com/Zero-State-LLC/zzthis/pull/177) idle expiry | merged 2026-10-15; RM-127 Done |
| PR [#178](https://github.com/Zero-State-LLC/zzthis/pull/178) five re-rolls and daily mint cap | merged 2026-10-15; RM-072 Done; RM-125 server only. zzThat cap tests still start at 3 |
| zzThat PR [#79](https://github.com/Zero-State-LLC/zzthat/pull/79) unknown-enum tolerance | merged 2026-10-15; RM-075 Done. No store build is claimed |

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

- Release v1.0 · P0 · Done for the repo file (PR #95 merged 2026-10-14). Resource ids stay the zero UUID until RM-050. · Bundle B4 · Gate G11 · Owner: API maintainer drafts; Danny supplies resource ids
- **Problem.** The default `workers/api/wrangler.toml` is local-only. PR #95 put `workers/api/wrangler.production.toml` and `tests/productionWrangler.test.ts` on main. The D1 id is still `00000000-0000-0000-0000-000000000000` until RM-050.
- **Outcome and scope.** Add `workers/api/wrangler.production.toml`: Worker `zzthis-api`, D1 `zzthis`, R2 `zzthis-photos`, the `Limiter` migration, the daily cron, the `zz.zer0state.com` custom domain (Q69), `ZZ_ENV=production`, every flag explicit (`ZZ_DEV_AUTH`, `ZZ_PHOTO_READS`, `ZZ_FREE_PUBLIC` false; `ZZ_MINT_ENABLED` true only at launch), an `[observability]` block with invocation logs off, and no secret values. Resource ids stay empty until Danny creates the resources (RM-050).
- **Depends on.** None. **Components.** `workers/api`, a new repository test.
- **Acceptance.** A test parses the file and fails if `ZZ_DEV_AUTH` or `ZZ_PHOTO_READS` is true, `ZZ_WORDLIST_VERSION` is `fixture-7`, invocation logs are on, a secret name appears under `[vars]`, or a staging resource name appears. `wrangler deploy --dry-run --config wrangler.production.toml` passes in CI without credentials.
- **Verification.** CI run of the new test and dry run.
- **Governing.** D-2026-10-10-08, D-2026-10-10-10; spec 005 Environment, FR-022, FR-027, FR-029; `specs/CLOUDFLARE-RUNTIME.md`.
- **Follow-up (D-2026-10-13-07).** Production accepts only `prod-v1`, so the file's `ZZ_WORDLIST_VERSION = "proto-v0"` changes to `prod-v1` in the RM-020 pull request, and the test then fails on any other value. RM-001 depends on RM-020 for launch.
- **Risks.** A wrong id binds staging data to production; the test's staging-name check guards it.

### RM-002 Manual production deploy workflow

- Release v1.0 · P0 · Workflow file merged (PR #95, 2026-10-14). Not dispatched. D-2026-10-10-08 ACCEPTED (Danny, 2026-10-14, [#170](https://github.com/Zero-State-LLC/zzthis/issues/170#issuecomment-6175348667)). · Bundle B4 · Gate G11 · Owner: API maintainer drafts; Danny owns the environment
- **Problem.** There was no production deploy path. The merged PR #95 adds `.github/workflows/cloudflare-api-production.yml`: `workflow_dispatch` only, `main` only, environment `production`. Remote migrate and deploy refuse the unassigned zero UUID. The workflow has not been dispatched.
- **Outcome and scope.** `.github/workflows/cloudflare-api-production.yml`: `workflow_dispatch` only, `main` only, GitHub environment `production` with Danny as required reviewer, the same checks as the staging workflow, a D1 Time Travel bookmark printed before `migrations apply`, `wrangler deploy --config wrangler.production.toml`, and the Worker version id and git SHA in the job summary. Builds `apps/web` with the production `PUBLIC_*` values from environment variables.
- **Depends on.** RM-001. **Components.** `.github/workflows`.
- **Acceptance.** The workflow cannot run from a branch; a run without the reviewer's approval waits; a dry-run job variant passes on a pull request without credentials.
- **Verification.** Workflow lint, a dispatched dry-run job, the environment settings screenshot in the release packet.
- **Governing.** D-2026-10-10-08; AGENTS.md (agents do not dispatch production deploys); constitution Principle VIII.
- **Risks.** Required reviewers on environments depend on the repository plan; the repository is public, where they are available.

### RM-003 Repair the security check on main

- Release v1.0 · P0 · Done (PR #122 merged 2026-10-10; `security` green on `main`, run 38017896510) · Bundle B4 · Gate G1 · Owner: any maintainer
- **Problem.** `security` failed on every push to `main` since 2026-10-08 because gitleaks scans every ref and finds a verified false positive on the unmerged branch `spec/zz-ocr-qual-001` (`scripts/ocr-qualification/receipt-semantics.mjs:79`, commit `ab3983ab95`).
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
- **Governing.** D-2026-10-10-20 (ACCEPTED, Danny 2026-10-14); constitution Engineering standards (do not edit `ci.yml`).

### RM-006 Specification and status convergence (this review)

- Release v1.0 · P1 · Done (PR #129 merged 2026-10-10) · Owner: reviewer
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

- Release v1.0 · P0 · Blocked on Danny (he creates the host and the Access policy) · Bundle B4 · Gate G2, G3 · Owner: Danny
- **Scope.** `zz-staging.zer0state.com` on the `zer0state.com` zone, routed to `zzthis-api-staging`, protected by Cloudflare Access. The policy admits named emails and one Service Auth token; the token's id and secret live in the `cloudflare-staging` GitHub environment, never in git (D-2026-10-13-06).
- **Acceptance.** An unauthenticated request gets the Access challenge; a request with the service token reaches `GET /v1` with 200.
- **Governing.** D-2026-10-10-07, D-2026-10-13-06 (both ACCEPTED, Danny 2026-10-14); spec 005 FR-029. **Risks.** Free-plan seat limits; recheck at setup.

### RM-013 Staging configuration that can exercise writes

- Release v1.0 · P0 · In progress (repo half merged in PR #176, 2026-10-15; discovery evidence waits on RM-012) · Bundle B4 · Gate G2 · Owner: API maintainer
- **Problem.** Staging has mint, developer sign-in, and providers off, so no write path has run on Cloudflare.
- **Scope.** In `wrangler.staging.toml`, staging only: `ZZ_DEV_AUTH=true`, `ZZ_MINT_ENABLED=true`, `ZZ_FREE_PUBLIC=true` (the web client mints only `free_public`), `fixture-7`, `workers_dev = false`, `preview_urls = false`, and `ZZ_BLOCKLIST` moved from `[vars]` to a secret so staging matches the production binding type. Add `workers/api/scripts/staging-reset.sql`: it drops the two audit triggers, deletes every application table, and recreates the triggers; the staging workflow runs it only against `zzthis-staging`. Only after RM-012, never on the public workers.dev host (D-2026-10-13-06).
- **Acceptance.** Discovery on the staging host lists `dev` and `free_public: true`; the workers.dev `/v1` no longer answers 200; a fresh reset leaves every application table empty and both audit triggers in place.
- **Evidence.** PR #176 set `ZZ_FREE_PUBLIC=true`, `workers_dev = false`, and `preview_urls = false`, and added `workers/api/scripts/staging-reset.sql`. `ZZ_DEV_AUTH` and `ZZ_MINT_ENABLED` stay false. `ZZ_BLOCKLIST` is still an empty `[vars]` value, not a secret. The staging workflow does not run the reset script. Discovery on the host waits on RM-012.
- **Governing.** spec 005 FR-022 (developer sign-in is allowed outside production), FR-029, Environment (Staging values); D-2026-10-10-07, D-2026-10-13-06.

### RM-014 Run the end-to-end suite against staging

- Release v1.0 · P0 · Ready (after RM-013) · Bundle B1, B4 · Gate G2 · Journeys J1 to J7
- **Scope.** Let `apps/web/playwright.config.ts` take a base URL from the environment while keeping the local default. The Access headers (`CF-Access-Client-Id`, `CF-Access-Client-Secret`) are added only for the staging origin with `page.route`, never as global extra headers (D-2026-10-13-06). Run the existing two flows against staging from a manual workflow, after a staging reset and before RM-015.
- **Acceptance.** Both flows pass on staging with no CSP violation; the run URL is in the release packet.
- **Governing.** spec 005 plan.md Tests; T032.

### RM-015 API smoke and rate-limit verification script

- Release v1.0 · P0 · Ready (after RM-013) · Bundle B4 · Gate G2 · Journeys J1, J2, J6
- **Scope.** A script that calls every OpenAPI operation once with valid input and checks status and schema, then drives each rate-limit row to its first 429 with bounded traffic, including the daily mint cap (RM-072, merged in PR #178), and records p50 and p95 latency for resolve, mint, and token. The staging reset does not clear limiter windows, so this runs after RM-014 (D-2026-10-13-06).
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

- Release v1.0 · P0 · Blocked on Michael (the letter groups in `confusable-v1.json`); the build is otherwise defined · Bundle B6 · Gate G8 · Owner: maintainer builds; Michael approves the letter groups and reviews words; Danny freezes
- **Scope.** The spec 003 Production list build (D-2026-10-13-07): filter 3 also drops every English cardinal number word; filter 4 compares shape keys from `packages/zz-core/wordlists/confusable-v1.json` (`rn` to m, `cl` to d, `vv` to w, then letter groups); filter 5 compares Double Metaphone primary codes with an exact-pinned package after dependency review; in both, the earlier word in sort order is kept; the blocklist is read from `ZZ_BLOCKLIST_FILE` outside the repository and applied after filter 6 and before the prime cut, and the report gives only its count and the SHA-256 of the normalized list. The pipeline takes the version id as an argument; output `prod-v1`; proto-v0 output stays byte-identical. Production accepts only `prod-v1` (`env.ts`, spec 005 Environment, RM-001).
- **Acceptance.** Deterministic rebuild (FR-019); N is prime and at least 1,000; the report lists every removed word with its filter and the kept word it collided with, except blocklisted words, which appear only as a count; CI rebuilds without the blocklist and checks that the committed list is an in-order subsequence with the gap equal to the reported count; proto-v0 rebuilds byte-identical; check-word tests pass exhaustively on the fixture and by property on the new list (FR-020); production settings refuse any list but `prod-v1`; Danny's freeze record cites the D-2026-10-10-04 risk acceptance, because no R-B6 corpus exists.
- **Governing.** D-2026-10-10-04; D-2026-10-13-07 (ACCEPTED, Danny 2026-10-14, [#170](https://github.com/Zero-State-LLC/zzthis/issues/170#issuecomment-6175348667)); spec 003 FR-001, FR-002, Production list build; spec 005 T037, Environment; Q35.
- **Risks.** Permanent after the first production mint.

### RM-021 Key ids for `ZZ_DATA_KEY` sealed values and tags

- Release v1.0 · P0 · Done (PR #142 merged 2026-10-10) · Bundle B4 · Gate G5 · Journeys J7
- **Problem.** Sealed Apple tokens and HMAC tags carry no key id and use fixed `v1` HKDF labels (`workers/api/src/lib/crypto.ts:9-10,97-112`), so a rotation silently breaks Apple revocation at deletion (`account/me.ts:48-62`).
- **Scope.** Prefix new sealed values with a key id; accept an optional `ZZ_DATA_KEY_PREVIOUS` for decryption; treat unprefixed values as the first key; add a re-encrypt step in the cron.
- **Acceptance.** A test seals with key A, rotates to key B with A as previous, and still revokes; a test with no previous key fails closed with a logged class.
- **Governing.** D-2026-10-10-19; `docs/OPERATIONS.md` Key and secret lifecycle.

### RM-022 Secret escrow and rotation runbook

- Release v1.0 · P0 · Ready · Bundle B4 · Gate G5 · Owner: Danny
- **Scope.** For each of `ZZ_TOKEN_SECRET`, `ZZ_DATA_KEY`, `ZZ_RECORD_SIGNING_KEY` (with key id), and `APPLE_PRIVATE_KEY`: owner, escrow location outside Cloudflare and the repository, rotation cadence, compromise procedure, and the user impact of rotation (token secret: every access token fails within 15 minutes and clients refresh; data key: RM-021; signing key: new id, old signatures stay stored).
- **Rotation rule.** Do not rotate `ZZ_DATA_KEY` in v1.x except after a compromise: rotation changes every Resolve `creator` value (blocked creators show again) and every `mint-subject` key, so daily mint caps restart (OPERATIONS, Key and secret lifecycle).
- **Acceptance.** A staging drill restores all four from escrow into a scratch Worker that passes the settings check.
- **Governing.** D-2026-10-10-10; Q28; OPERATIONS.

### RM-023 Restore runbook with deletion replay

- Release v1.0 · P0 · In progress (script and tests merged in PR #174, 2026-10-15; the RM-024 drill is still open) · Bundle B4 · Gate G5
- **Problem.** A D1 Time Travel restore undoes account deletions made after the restore point, so erased text and Apple tokens would return. It also drops `pending_revocations` rows written after the bookmark. `DELETE /v1/me` needs the account's own token, so the operator had no way to replay a deletion.
- **Scope.** Add `ops/delete-account.sql` (D-2026-10-13-08): the FR-023 step 2 batch, an `account.delete` audit event with no actor, and a copy of any stored Apple token into `pending_revocations` (attempts 0, due now), so the daily run revokes it. Before a restore, export the `audit_events` and `pending_revocations` rows written after the target time; after the restore, re-insert them and run `ops/delete-account.sql` for every account whose `account.delete` event is in the export. Capture a bookmark before every migration (RM-002).
- **Acceptance.** Tests in `workers/api/test/ops-delete.test.ts` (PR #174): the script revokes the account's codes, erases its versions, deletes its identities, grants, and refresh tokens, sets `deleted_at`, writes `account.delete` with no actor, and queues the Apple token. The drill in RM-024 includes a deletion after the bookmark, and the account stays deleted, with its audit and pending rows back, after restore and replay. That drill has not run.
- **Governing.** D-2026-10-10-10; D-2026-10-13-08 (ACCEPTED, Danny 2026-10-14, [#170](https://github.com/Zero-State-LLC/zzthis/issues/170#issuecomment-6175348667)); spec 005 FR-023; `docs/DATA-LIFECYCLE.md` Deletion evidence; OPERATIONS, Account deletion and access requests.

### RM-024 Recovery drill and objectives

- Release v1.0 · P0 · Ready (after RM-013, RM-022, RM-023) · Bundle B4 · Gate G5 · Owner: Danny accepts numbers
- **Scope.** Seed staging with accounts, codes, versions, grants, and audit rows; restore to a bookmark; verify row counts, a sample resolve, audit continuity, and the deletion replay; time it from declaration to verified service.
- **Acceptance.** Measured RTO and RPO meet the targets accepted in D-2026-10-10-10 (Danny, 2026-10-14): RTO 4 hours and RPO 5 minutes, which count only once this drill meets them; Danny records the result.
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

- Release v1.0 · P1 · In progress (runbook merged in PR #174, 2026-10-15; the staging dry run waits on RM-012; the account-id label waits on Michael) · Bundle B4 · Owner: Danny
- **Scope.** Steps for access and deletion requests received by email (D-2026-10-13-08). No email is stored, so the identity check is: the person signs in and quotes the account id shown on `/account/` (copy key `account.id`, pending Michael's review). A deletion runs `ops/delete-account.sql` (RM-023). An access request is answered with that account's rows from `accounts`, `codes`, `records`, and the current record versions, as JSON. Complete the open rows of `docs/DATA-LIFECYCLE.md` (tombstone retention, audit retention, export). The privacy policy names this method (RM-026, RM-123).
- **Acceptance.** A staging dry run answers an access request for a seeded account with the JSON above, and deletes a seeded account with `ops/delete-account.sql`.
- **Governing.** D-2026-10-10-16; D-2026-10-13-08 (ACCEPTED, Danny 2026-10-14, [#170](https://github.com/Zero-State-LLC/zzthis/issues/170#issuecomment-6175348667)); OPERATIONS, Account deletion and access requests.

### RM-028 Production blocklist content

- Release v1.0 · P0 · Blocked on Michael and Danny (list content) · Bundle B1 · Gate G8
- **Scope.** Supply `ZZ_BLOCKLIST` as a production secret (required non-empty in production, FR-024) and use the same list in RM-020, read from `ZZ_BLOCKLIST_FILE` outside the repository; the RM-020 report shows only its count and the SHA-256 of the normalized list (D-2026-10-13-07). Number words are kept out of codes by filter 3, not by the blocklist (D-2026-10-11-12).
- **Acceptance.** Production settings check passes; a staging test term is refused with 422 `content-refused`.

### RM-029 Threat-model review and residual risks

- Release v1.0 · P0 · Ready (after RM-030 to RM-038) · Bundle B4 · Gate G10 · Owner: Danny signs
- **Scope.** Walk every row of `docs/THREAT-MODEL.md`; attach test or control evidence; sign the residual risks named there, including public-record enumeration and the single-organization rule.
- **Acceptance.** No row lacks evidence or a signed acceptance.

### RM-030 Rate-limit IPv6 callers by /64

- Release v1.0 · P0 · Done (PR #140 merged 2026-10-10) · Bundle B1 · Gate G10 · Journeys J1
- **Problem.** `workers/api/src/limits/enforce.ts:33-36` keys on the full address.
- **Acceptance.** Two addresses in one /64 share a bucket; two IPv4 addresses do not; the HMAC still hides the prefix (FR-027).
- **Governing.** D-2026-10-10-05; FR-011.

### RM-031 Zone rate-limiting rule for resolve

- Release v1.0 · P1 · Blocked on Danny · Bundle B4 · Gate G10
- **Scope.** A Cloudflare rule on `zz.zer0state.com/v1/resolve/*` above the Worker limits, as defense in depth.
- **Acceptance.** The rule is recorded in the resource inventory with its threshold and does not trip during RM-015 traffic.

### RM-032 Re-roll checks the scope

- Release v1.0 · P0 · Done (PR #140 merged 2026-10-10) · Bundle B1 · Journeys J3
- **Problem.** `rerollCode` never calls `checkMintScope` (`workers/api/src/codes/reroll.ts:86-97`), so an account whose issuer grant was removed, or a `free_public` code after the flag turns off, still gets a new code.
- **Acceptance.** Re-roll after `remove-grant.sql` returns 403 `forbidden`; re-roll of a `free_public` code with the flag off returns 403 `scope-unavailable`; nothing is written.
- **Governing.** FR-005, FR-034.

### RM-033 Mint checks the account in its batch

- Release v1.0 · P0 · Done (PR #140 merged 2026-10-10) · Bundle B1 · Journeys J2, J7
- **Problem.** The mint batch is plain inserts (`workers/api/src/codes/store.ts:63-116`), so a mint racing `DELETE /v1/me` or `suspend.sql` can leave an active code owned by a deleted or suspended account.
- **Acceptance.** An interleaving test leaves no active code for a deleted or suspended account; the response is 401 or 403 as for a request that arrived after.
- **Governing.** FR-023, FR-025, FR-031.

### RM-034 Cache writes and purges never fail a committed request

- Release v1.0 · P0 · Done (PR #140 merged 2026-10-10) · Bundle B1 · Journeys J1, J4, J5
- **Problem.** `storeResolve` and `purgeResolve` are awaited inline (`workers/api/src/resolve/resolve.ts:205`, `codes/revoke.ts:55`, `records/versions.ts:112`, `codes/reroll.ts:107`); a cache error turns a committed write into 500.
- **Acceptance.** With a throwing cache, resolve returns 200, revoke 200, and a version 201; a purge-failure log class is emitted; FR-018's 60-second bound is the only consequence.

### RM-035 Bound retention and deletion work; add cron indexes

- Release v1.0 · P0 · Done (PR #142 merged 2026-10-10) · Bundle B1, B4 · Gate G6 · Journeys J7, J8
- **Problem.** The cron selects and deletes without limits (`workers/api/src/retention/cron.ts`); account deletion purges every revoked code and deletes all photos in one call (`account/me.ts:155-163`); retention queries scan without indexes.
- **Scope.** Limited loops with a time budget and per-step isolation; purge only codes that were cacheable; chunk R2 deletes at 1,000 keys; indexes on `auth_nonces(expires_at)`, `refresh_tokens(expires_at)`, `pending_revocations(next_attempt_at)`, `reports(closed_at)`; a log class for abandoned Apple revocations.
- **Acceptance.** Deleting an account with 5,000 codes returns 204; a cron run with 10,000 expired nonces finishes over successive runs without exceeding one invocation's limits.

### RM-036 Request, version, and error-class logging

- Release v1.0 · P0 · Done (PR #142 merged 2026-10-10) · Bundle B4 · Gate G7
- **Scope.** Log the request id and `cf-ray` and return `X-Request-Id`; log the deployed version from version metadata; log D1, R2, and Durable Object error classes; keep FR-027 exclusions.
- **Acceptance.** A log-line test asserts the fields and the absence of code, token, text, and IP.

### RM-037 Timeouts on outbound calls

- Release v1.0 · P1 · Done (PR #140 merged 2026-10-10) · Bundle B1 · Journeys J6, J7
- **Problem.** Apple token and revoke calls have no timeout (`workers/api/src/auth/apple.ts:37-41`).
- **Acceptance.** A never-resolving stub returns within 3 seconds; sign-in still succeeds and logs the failure (FR-020); the cron moves on to the next row.

### RM-038 Limiter failure policy

- Release v1.0 · P1 · Done (PR #140 merged 2026-10-10) · Bundle B1 · Journeys J1
- **Problem.** A Durable Object error or hang becomes 500 on every route (`workers/api/src/limits/enforce.ts:23`).
- **Scope.** A timeout and a documented policy per route class: fail closed for auth, mint, re-roll, and reports; fail open for discovery and the OpenAPI document. Resolve fails closed (abuse risk).
- **Acceptance.** A test per route class shows the documented status when the limiter throws.

### RM-039 Low-severity hardening

- Release v1.0 · P2 · Done (PR #142 merged 2026-10-10) · Bundle B1
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
- **D-2026-10-10-21 (ADOPTED, Danny 2026-10-14).** v1.0 web is lookup only: production discovery reports `free_public: false`, so `/create/` shows its Unavailable state; web create, edit, and revoke are verified in v1.1.

### RM-054 Release evidence packet and GO decision

- Release v1.0 · P0 · Backlog · Bundle B4 · Owner: Danny decides
- **Scope.** One document linking every gate's evidence, open risks, and the decision.
- **Acceptance.** Every gate G1 to G12 has a dated link or the decision is NO-GO.

### RM-063 Single-organization grant runbook

- Release v1.0 · P1 · Done (PR #146 merged 2026-10-10, with RM-073) · Bundle B1 · Journeys J10
- **Scope.** Add the D-2026-10-10-06 rule to the operator SQL docs (`workers/api/ops/grant.sql` header and plan.md Operator work).
- **Acceptance.** The runbook names the rule and the check the operator performs before each grant. Enforcement is RM-073 (D-2026-10-10-22).

### RM-073 Grant script enforces one organization per scope

- Release v1.0 · P1 · Done (PR #146 merged 2026-10-10) · Bundle B1 · Owner: kneelbeforez0D · Issue #135 (does not close it)
- **Scope.** `workers/api/ops/grant.sql` refuses an `enterprise` or `logistics` grant when another account holds an active grant in that scope, unless `:same_org` equals the scope name; header documents the rule (D-2026-10-10-06, D-2026-10-10-22).
- **Acceptance.** `test/ops-grants.test.ts`: second-account grant without the override writes no grant and no audit row; with the override it succeeds; same-account, expired, deleted-account, and `free_public` cases are not blocked.

### RM-074 Org-bound grants for viewer resolve and the auditor filter

- Release v1.3 (prerequisite, before the pilot onboards) · P0 · Done (PR #146 merged 2026-10-10, closed #135; migration 0003 applied on staging by Cloudflare API staging run 38025424156) · Bundle B7 · Owner: kneelbeforez0D · Closes #135
- **Scope.** Migration `0003_org_bound_grants.sql` (nullable `org_id` on `accounts` and `grants`, indexes); `ops/grant.sql` takes `:org_id`; `ops/set-org.sql`; resolve step 7 requires a matching non-null `org_id`; `GET /v1/audit` filters by scope and organization; null-org grants reach only the holder's own rows. Spec 005 FR-034, FR-035, FR-016 and the data model amended in the same pull request; OpenAPI unchanged.
- **Acceptance.** Two organizations in `enterprise` plus a null-org account: cross-organization private resolve is the one not-found body; auditor lists, including `record_id` and `code_id` filters, show only the auditor's organization; public resolve unchanged; existing FR-034, FR-035, FR-016 tests pass.
- **Governing.** D-2026-10-10-22; D-2026-10-10-06 (amended); RM-080 replaces `org_id` with the Organization entity. Follow-ups: D-2026-10-10-24, RM-098.

### RM-098 Grant organization must match the holder's and the scope's

- Release v1.3 (prerequisite, before the pilot onboards) · P1 · Done (PR #155, closes #148) · Bundle B7 · Owner: kneelbeforez0D
- **Scope.** `workers/api/ops/grant.sql` writes no grant and no audit row when `:org_id` differs from the subject's `accounts.org_id` (empty matches null), and, for `enterprise` and `logistics`, `:same_org` lets a grant through only when its `org_id` equals the non-null `org_id` of every other active grant in the scope. Header and plan.md Operator work say to run `ops/set-org.sql` first.
- **Acceptance.** `test/ops-grants.test.ts`: a mismatched `:org_id` writes nothing, including for an existing holder; a matching one, and empty for an account with no organization, succeed; `:same_org` with a different or null `org_id` than the scope's active grants writes nothing; existing grant tests pass after their fixtures run `set-org.sql` first.
- **Governing.** D-2026-10-10-24 items 1 to 3; D-2026-10-10-22.

### RM-099 set-org.sql guards for moved accounts

- Release v1.3 (prerequisite, before the pilot onboards) · P1 · Done (PR #155, closes #148) · Bundle B7 · Owner: kneelbeforez0D
- **Scope.** `workers/api/ops/set-org.sql` writes nothing (no update, no audit row) when the account holds an active grant whose `org_id` differs from the new one, unless `:revoke_grants` is set, in which case those grants are revoked in the same batch with `grant.remove` events. It also writes nothing when the account owns `enterprise` or `logistics` codes, unless `:move_owner` equals `yes`. plan.md Operator work gains the runbook note: a moved owner takes its history, including the old organization's actor ids, to the new organization's auditors, and the old organization loses it; to keep history, create a new account.
- **Acceptance.** `test/ops-org.test.ts`: a holder with a different-org grant is not moved; with `:revoke_grants` it is moved and the grants stop reaching (viewer 404, auditor list empty); an owner of an `enterprise` code is not moved without `:move_owner`, and is with it; a first assignment from null with no grants and no codes still works.
- **Governing.** D-2026-10-10-24 item 4.

### RM-100 Deleted accounts' audit visibility

- Release v1.3 (prerequisite, before the pilot onboards) · P2 · Done (PR #155, closes #148) · Bundle B7 · Owner: kneelbeforez0D
- **Scope.** Spec 005 FR-016 states what an auditor sees after an owner in its organization deletes the account (whether that owner's code and record events stay listed or drop out when their code rows are purged); a test pins the behavior.
- **Acceptance.** `test/org-grants.test.ts` or `test/audit.test.ts`: after `DELETE /v1/me` by an owner in `acme`, the `acme` auditor's list matches the FR-016 sentence.
- **Governing.** D-2026-10-10-24 item 4.

## v1.1 items

### RM-060 Land the qualification specification

- Release v1.1 · P0 · Done (PR #89 merged 2026-10-14). `specs/004-capture` cites the RecognitionResult boundary and the receipt states. · Bundle B2 · Phase R-B2
- **Acceptance.** PR #89 rebased on `main`, independently reviewed, and merged; `specs/004-capture` cites the RecognitionResult boundary and the receipt states.

### RM-061 Qualification harness and protected workflow

- Release v1.1 · P0 · In progress (PR #115 merged 2026-10-14 as the fail-closed preflight). T003 and T003A stay open: no protected final-corpus run and no PASS receipt. · Bundle B2 · Phase R-B2
- **Acceptance.** Evidence reconciliation, metric recomputation, decoder replay, and Sigstore verification implemented; the protected workflow identity pinned; schema-valid negative receipts fail.

### RM-062 Private qualification corpus (Q34)

- Release v1.1 and R-B6 · P0 · Blocked on Danny · Bundle B2, B6
- **Acceptance.** A private corpus with written consent, no faces, personal data, or location metadata, split into tuning and final sets, stored outside the repository.

### RM-064 Engine decision per platform

- Release v1.1 · P0 · Backlog · Bundle B2 · Phase R-B2 exit
- **Acceptance.** A PASS receipt per promoted engine, or a recorded confirm-only decision (D-2026-10-10-03).

### RM-065 Confirm-only camera mode in spec 004

- Release v1.1 · P1 · In review ([#186](https://github.com/Zero-State-LLC/zzthis/pull/186): zz-core confirm-only band and spec 003 `capture_band` vector rows; zzThat T102 next) · Bundle B2 · Owner: kneelbeforez0D (vectors and zzThat)
- **Scope.** v1.1 ships confirm-only on both platforms unless a signed PASS receipt exists at store submission (RM-064 records it). In confirm-only mode a camera candidate that would be Accept becomes Clarify, showing the full canonical code and Confirm. Typed bands do not change. Threshold numbers wait for the Q34 corpus. zzThat implements it under its FR-025 with a new task.
- **Acceptance.** Spec 004 band tables define confirm-only (done in the spec); the shared vectors add the camera Accept rows with `confirm_only: true`, expecting Clarify, and every platform's vector runner passes them; both apps show the canonical code and Confirm instead of resolving.
- **Governing.** D-2026-10-10-03; D-2026-10-13-05 (ACCEPTED, Danny 2026-10-14, [#170](https://github.com/Zero-State-LLC/zzthis/issues/170#issuecomment-6175348667)); spec 004 FR-023.

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

### RM-072 Durable-key daily mint cap for free_public

- Release v1.1 · P0 · Done (PR #178 merged 2026-10-15; `workers/api/test/mint-cap.test.ts`) · Bundle B9 · Owner: kneelbeforez0D
- **Problem.** A cap keyed to the account id resets when a person deletes and recreates the account, so it does not bound one person's mints.
- **Scope.** Spec 005 FR-011 as amended (D-2026-10-13-03). Window: the UTC day. Subject key: the HMAC of `provider:provider_subject` under the derived HMAC key with the label `mint-subject`, so the raw subject is never stored and the key survives account deletion for the window only. Each `free_public` mint and each `free_public` re-roll counts once against the subject (30 per UTC day) and once against the RM-030 IP subject (60 per UTC day, /64 for IPv6, address for IPv4); this is the one signed-in call that also counts against an IP row. Over either cap is 429 `rate-limited`, the existing contract-1 body, with `Retry-After` until the next UTC day.
- **Acceptance.** Tests: 30 mints and re-rolls in a UTC day succeed and the 31st is 429; mint to the cap, delete the account, sign in again with the same provider subject, and the next mint is 429; a re-roll counts like a mint; two accounts from one /64 share the 60 IP cap; the next UTC day allows mints again; `enterprise` and `logistics` mints do not count; no raw provider subject appears in storage or logs.
- **Governing.** D-2026-10-10-21; D-2026-10-13-03 (ACCEPTED, Danny 2026-10-14, [#170](https://github.com/Zero-State-LLC/zzthis/issues/170#issuecomment-6175348667)); spec 005 FR-011, Rate limits; RM-030; `docs/DATA-LIFECYCLE.md` (mint-cap subject key).

### RM-075 Tolerant-reader verification in zzThat (external)

- Release v1.1 · P0 · Done (unknown-key half: zzThat #58; unknown-enum half: zzThat #79, T106, merged 2026-10-15) · Bundle B3 · Owner: kneelbeforez0D · The first store build has not happened (D-2026-10-13-09). zzThat #54 was closed by #79 at 2026-10-15T02:21:04Z. The store build remains the RM-075 gate.
- **Scope.** The unknown-enum half (zzThat #54, zzThat T106) landed in zzThat #79: Android sets the generator's `enumUnknownDefaultCase=true`; iOS decodes an unknown value to a fallback case. The gate remains the first store build, not a server change. Until that build, no new value is added to any existing response enum within contract 1 (`docs/CONTRACT-EVOLUTION.md`).
- **Acceptance.** Generated clients ignore unknown keys and tolerate unknown enum values, shown by a contract test with an extra field and an unknown value in each response enum, on both apps, before the first store build.
- **Evidence.** `TolerantReaderTest` (Android) and `TolerantReaderTests` (iOS) cover that contract test. T095 and T106 are checked. No store build is claimed.
- **Governing.** D-2026-10-10-12; D-2026-10-13-09 (ACCEPTED, Danny 2026-10-14, [#170](https://github.com/Zero-State-LLC/zzthis/issues/170#issuecomment-6175348667)).

### RM-076 Public community codes review

- Release v1.1 · P0 · Backlog · Bundle B9 · Gate: v1.1 store launch · Owner: Danny promotes (moved from v1.2 by D-2026-10-10-21, ADOPTED 2026-10-14, [#170](https://github.com/Zero-State-LLC/zzthis/issues/170#issuecomment-6175348667))
- **Scope.** Turn on `ZZ_FREE_PUBLIC` in production for web and app create together, only at the v1.1 gate and after Danny's written yes. The D-2026-10-10-21 prerequisites, each with evidence in the release packet: abuse controls (RM-030, RM-031, RM-032, RM-033); the FR-011 rows verified on staging (RM-015) plus the RM-072 daily mint cap; the RM-028 blocklist with the staging refusal test (G8); grant isolation (RM-063); moderation (RM-068, RM-077, RM-102, a named moderator, 24-hour response, suspension rehearsed); cost caps (RM-041, RM-042); the shutoff triggers and a staging-rehearsed shutoff redeploy measured against the 30-minute target (D-2026-10-13-03, OPERATIONS Moderation); the D-2026-10-10-04 density trigger monitored from the first public mint; the RM-103 Terms; and RM-127 idle expiry scheduled to ship within 80 days of the flag turning on.
- **Acceptance.** Every prerequisite above has dated evidence in the release packet; Danny's written yes is recorded; production discovery shows `free_public: true` only after both.
- **Governing.** D-2026-10-10-21 (ADOPTED); D-2026-10-13-03; spec 005 FR-005, FR-034.

### RM-077 Report triage tooling

- Release v1.1 · P1 · Done (`report-queue.sql` and `report-overdue.sql` in PR #157, with RM-102) · Bundle B9 · Required before `ZZ_FREE_PUBLIC` turns on (moved from v1.2 by D-2026-10-10-21, ADOPTED 2026-10-14)
- **Scope.** Operator SQL views for open reports by age and code.
- **Governing.** D-2026-10-10-21 (ADOPTED); spec 005 US7, FR-025.

### RM-096 Live multi-frame reading with word-by-word voting (zzThat)

- Release v1.1 · P3 · Backlog · Bundle B2, B3 · D-2026-10-10-23
- **Problem.** One photo may read only some words well; asking for a second photo adds a step (Michael, 2026-10-09).
- **Scope.** Live camera reading of many frames inside FR-013's frame, merged word by word: a shared zz-core merge or vote function used by both apps; an overlap and grammar guard so two different codes are never joined (otherwise "Incomplete code. Rescan."); merging only within one scan session (until a code is accepted, the person cancels, or a short timeout).
- **Acceptance.** zz-core vectors: agreeing frames raise confidence; a disagreement goes to Clarify; `zz-kathy-found` plus `found-dog-zz` joins only when the overlap and grammar pass; two codes side by side are never joined.
- **Governing.** D-2026-10-10-23; spec 004 FR-013 and bands.

### RM-101 Hide this code and the expanded report flow in the apps (external)

- Release v1.1 · P0 · In progress (Hide merged in zzThat #64 and Block in zzThat #65; terms acceptance before the first create is client-only per D-2026-10-13-04 (ACCEPTED) and waits on Michael's Terms, RM-124, and the copy keys added 2026-10-14) · Bundle B3 · Owner: kneelbeforez0D
- **Scope.** zzThat FR-035 replaces "No block list" (D-2026-10-10-25 item 1). Resolve and the Report sheet offer "Hide this code" and, once RM-112 ships, "Block this creator": a device-only list of hidden canonical codes and blocked creator references (no server call), shown afterwards as a hidden state with Unhide or Unblock; cleared on account deletion and by a Settings reset. Create asks for terms acceptance before the first create and again when the terms version changes (RM-103). The Report sheet's sent state says the creator is reviewed within 24 hours and can be suspended. Copy keys go through zzThis `design/copy.json`.
- **Acceptance.** iOS and Android tests: hide a code, resolve it again (scan and typed) and see the hidden state without its title or body; unhide restores it; block a creator and another code with the same `creator` shows the hidden state; delete the account, or run the Settings reset, and both lists are empty; no network call is made by hide, block, unhide, or unblock; Create refuses until the current terms version is accepted.
- **Governing.** D-2026-10-10-25; Apple 1.2; Play UGC.

### RM-102 Moderation tooling: triage SLA, suspend, and runbook

- Release v1.1 · P0 · In progress (tooling merged in PR #157, 2026-10-11; moderators named in D-2026-10-11-08 answer 17; staging rehearsal pending) · Bundle B9 · Owner: kneelbeforez0D (tooling), Danny (moderator name)
- **Scope.** Extends RM-077. `workers/api/ops/` SQL: open reports by age and code, a query for reports open longer than 24 hours, suspend and unsuspend an account with audit rows (FR-025), and revoke a reported code. `docs/OPERATIONS.md` gains the moderator runbook: named moderator and backup, 24-hour response, and the escalation to `ZZ_FREE_PUBLIC=false`, with the shutoff triggers and the 30-minute target from D-2026-10-13-03 (any report open more than 48 hours, more than 2,000 `free_public` codes drawn in a UTC day, or the month's Cloudflare usage alert past $50), rehearsed on staging.
- **Acceptance.** Tests on the ops SQL: a report older than 24 hours appears in the breach query; suspend blocks mint, re-roll, and record writes with 403 `forbidden` and writes an audit row; unsuspend restores them. The runbook is rehearsed once on staging.
- **Governing.** D-2026-10-10-25 item 2; Apple 1.2 "timely responses"; Play UGC.

### RM-103 Terms of use and content policy

- Release v1.1 · P0 · Backlog (blocked on Michael's Terms wording, RM-124) · Bundle B9 · Owner: Danny (approval); Michael (wording)
- **Scope.** Terms of use and a content policy (prohibited content, reporting, suspension, appeals by email), linked from Create and Account in the apps and on the web. Client-only (D-2026-10-13-04): the server neither stores nor checks acceptance or age. The current version is `terms.version` in `design/copy.json`; each client stores the accepted version on the device, asks again when it changes, and clears it on account deletion. One combined step before the first create on a device: the person confirms they are 18 or older and accepts the Terms (`terms.age_confirm`, `terms.accept`, `terms.link`; `account.terms` on Account). Scanning and typing need neither. The Terms include the inactive-codes clause from D-2026-10-13-01, in Michael's final wording. Legal approval is Danny's.
- **Acceptance.** Danny's written yes and Michael's approved wording; `terms.version` set to the approved Terms' effective date; links present in both apps and the web client; each client requires the combined step before a person's first create and again after `terms.version` changes, before `ZZ_FREE_PUBLIC` turns on; account deletion clears the stored version; no server call records acceptance.
- **Governing.** D-2026-10-10-25 item 2; D-2026-10-11-05, D-2026-10-11-10; D-2026-10-13-04 (ACCEPTED, Danny 2026-10-14, [#170](https://github.com/Zero-State-LLC/zzthis/issues/170#issuecomment-6175348667)); Play UGC terms requirement; `design/UX.md` Terms.

### RM-104 Data safety and privacy drafts include ML Kit diagnostics (external)

- Release v1.1 · P1 · Done (zzThat #51 merged 2026-10-11; Google sign-in rows in zzThat #72) · Bundle B3 · Owner: kneelbeforez0D
- **Scope.** zzThat `apps/store/data-safety-draft.md` and `apps/store/privacy-policy-draft.md` per D-2026-10-10-25 item 4; this repository's `docs/DATA-LIFECYCLE.md` row is in the decision pull request.
- **Acceptance.** The Data safety draft lists App info and performance and Device or other IDs as collected by the ML Kit SDK, not shared, for analytics and diagnostics; no "no analytics" sentence remains unqualified; the list matches Google's ML Kit disclosure page for the pinned version.
- **Governing.** D-2026-10-10-25 item 4.

### RM-105 Age rating 13+ and Teen (external)

- Release v1.1 · P1 · Done (zzThat #51), then revised by RM-120: 18+ in the Terms, ratings from the questionnaires (zzThat #72) · Bundle B3 · Owner: kneelbeforez0D (spec), Danny (filing)
- **Scope.** zzThat FR-031, spec.md Privacy and permissions, and `apps/store/listing-draft.md` say Apple 13+ and Google Play Teen, with the questionnaire answers (user-generated content yes; no other mature themes) recorded in the listing draft.
- **Acceptance.** No "12+" remains in zzThat; the draft lists each answer.
- **Governing.** D-2026-10-10-25 item 5.

### RM-106 Signed AAB release job and Play App Signing (external)

- Release v1.1 · P0 · Done for the job (zzThat #62 merged 2026-10-14); Danny adds the upload key secrets and enrolls in Play App Signing · Bundle B3 · Owner: kneelbeforez0D (job), Danny (secrets, Play enrollment)
- **Scope.** zzThat workflow job `release-android`, `workflow_dispatch` only, behind a protected environment: `bundleProdRelease`, signed with the upload key from secrets, injected API origin and client ids, AAB uploaded as an artifact. No key, password, or keystore in the tree.
- **Acceptance.** A run produces a signed `.aab`; `jarsigner -verify` passes with the upload certificate; a secret scan of the tree is clean; Danny enrolls the app in Play App Signing at first upload.
- **Governing.** D-2026-10-10-25 item 6.

### RM-107 Privacy manifest HMAC entry and SDK manifest check (external)

- Release v1.1 · P1 · Done (zzThat #63 merged 2026-10-13) · Bundle B3 · Owner: kneelbeforez0D
- **Scope.** zzThat `PrivacyInfo.xcprivacy` adds Other Data Types (not linked, not tracking, App Functionality); a Release archive's Xcode Privacy Report is attached to the PR.
- **Acceptance.** The manifest matches the App Store privacy draft row for row; the report shows a manifest for every linked SDK and no undeclared required-reason API.
- **Governing.** D-2026-10-10-25 item 7.

### RM-108 Enter the store privacy forms

- Release v1.1 · P1 · Backlog (after RM-104, RM-107, RM-026) · Bundle B3 · Owner: Danny
- **Acceptance.** App Store Connect privacy answers and Play Data safety match the merged drafts; the Play deletion link is `https://zz.zer0state.com/account/`.
- **Governing.** D-2026-10-10-25 items 8 and 9.

### RM-109 EU DSA trader status

- Release v1.1 · P1 · Ready · Owner: Danny
- **Acceptance.** Trader status verified in App Store Connect before the EU storefront is selected.
- **Governing.** D-2026-10-10-25 item 10.

### RM-110 One support address across site, stores, and apps

- Release v1.1 · P2 · Backlog (Michael's yes for the site footer) · Owner: Danny
- **Scope.** `support@zer0state.com` in the site contact (`src/content/contact.ts`), both store listings, and the apps.
- **Governing.** D-2026-10-10-25 item 11.

### RM-111 zzThat Discord and Instagram links in the apps (external)

- Release v1.1 · P3 · Ready (T051 done 2026-10-10) · Owner: kneelbeforez0D
- **Scope.** Account shows zzThat's Discord and Instagram with the `design/UX.md` URLs only after T051 confirms a never-expiring invite.
- **Governing.** D-2026-10-10-25 item 11.

### RM-112 Optional creator reference on Resolve for creator blocking

- Release v1.1 · P0 · Done (PR #161 merged 2026-10-14; exception accepted by Danny, 2026-10-09 PT; RM-075 unknown-key half passes, zzThat PR #58) · Bundle B9 · Owner: kneelbeforez0D
- **Scope.** Resolve gains an optional response field `creator`: an opaque, stable HMAC of the owner account id (keyed with a server secret, never the raw id), null for private records. OpenAPI `info.version` changes and discovery advertises it. Old clients must ignore it (RM-075).
- **Acceptance.** Worker tests: two public codes from one owner resolve with the same `creator`; codes from different owners differ; a private record gives null; the raw account id never appears; the cached public response keeps the field. zzThat tolerant-reader tests pass on both apps.
- **Governing.** D-2026-10-10-25 item 1; D-2026-10-10-12; Apple 1.2; Play UGC.

### RM-113 Suggested-word picker on Create (server-chosen codes)

- Release v1.1 · P1 · Done (zzThat #65 merged 2026-10-14; RM-125 extends it) · Bundle B3 · Owner: kneelbeforez0D · External (zzThat; web create may mirror)
- **Scope.** Option (C) from D-2026-10-11-01. Create keeps `POST /v1/codes` and re-roll: the server still chooses words and the check word (zzThat FR-017, ZQ11). The UI offers a clearer way to pick among suggested or re-rolled server words (for example show the candidate set and "Get different words") so creators feel they chose a code without sending a person-written string. No wire change. The cap was 3 re-rolls; RM-125 raised it to 5 on the server in PR #178 (spec 005 FR-006, D-2026-10-13-02). zzThat demo fixtures still start at 3.
- **Acceptance.** zzThat (and web if create is shown) tests: mint still sends no canonical; re-roll to cap; picker copy uses `design/copy.json` keys; Unavailable when `free_public` is false.
- **Governing.** D-2026-10-11-01; D-2026-10-10-21.

### RM-115 Local Saved list in zzThat (device-only)

- Release v1.1 · P2 · Done (zzThat #65 merged 2026-10-14) · Bundle B3 · Owner: kneelbeforez0D · External (zzThat)
- **Scope.** Row 17 ASSIMILATE from D-2026-10-11-01. Add a device-only "Saved" list of codes the person scanned and chose to save (canonical codes only, no thumbnail, as built in zzThat #65 and `design/UX.md` Saved). No server sync, no photo upload. Cleared on account deletion and by its own Account action (`account.clear_saved`), not by `account.unhide_all`. Cloud sync of Saved stays QUEUE with RM-117 / v2.2.
- **Acceptance.** Spec and runtime name Saved; tests show save/unsave without network; list survives process restart; deletion and reset clear it; no new API calls.
- **Governing.** D-2026-10-11-01.

## v1.2 and v1.3 items

v1.2 has no items: D-2026-10-10-21 (ADOPTED 2026-10-14) moved RM-076 and RM-077 to v1.1.

### RM-078 Web issuer controls

- Release v1.3 · P1 · Backlog (QUEUED) · Bundle B7 · Journeys J2, J9
- **Scope.** Create offers `visibility`, `single_use`, and `expires_at` for scopes where the caller holds `issuer`; resolve sends the bearer only for a signed-in viewer path and never caches (FR-008).
- **Acceptance.** Playwright flows for a private code, a single-use code, and an expiring code.

### RM-079 Web auditor view

- Release v1.3 · P2 · Backlog · Bundle B7 · Journeys J11 · FR-016.

### RM-088 Audit scope index

- Release v1.3 · P2 · Backlog · Bundle B7 · Index `codes(scope)` and record each event's scope at insert so auditor queries stop scanning.


### RM-114 Owner-only renew for expired codes

- Release v1.3 · P2 · Backlog (QUEUED) · Bundle B7 · Owner: kneelbeforez0D
- **Scope.** Row 9 from D-2026-10-11-01. Issuer-set `expires_at` only (`enterprise` and `logistics` codes); idle expiry of `free_public` codes and its automatic revive are RM-127 (D-2026-10-13-01). Public resolve keeps one not-found shape for unknown, expired, used, and revoked (spec 002 FR-011, spec 005 FR-009). The signed-in owner (My codes / owner resolve) may see that a code expired and renew it (update `expires_at`) without a public "this code expired" message. Rolling renew-on-scan by arbitrary scanners is out of scope. An explicit per-code revive for idle-expired codes may join this item (D-2026-10-13-01 option 3b).
- **Acceptance.** Spec and tests: public expired → not-found; owner sees expired and can renew; scanner cannot keep another person's code alive by scanning.
- **Governing.** D-2026-10-11-01; pairs with RM-078 expiring-code UI.

## v2.0 to v2.2 items

| ID | Release | Pri | Status | Item | Governing |
|---|---|---|---|---|---|
| RM-080 | v2.0 | P0 | Backlog | #87 gate extended with an Organization entity: Scope, Namespace, Organization cardinality, ownership, grants, migration | #87; D-2026-10-10-06; DOMAIN-MODEL |
| RM-081 | v2.0 | P1 | Backlog | Multi-list verification and per-scope dictionaries; discovery lists versions | spec 003 FR-017, FR-022; D-2026-10-10-04 |
| RM-082 | v2.0 | P1 | Backlog | `GET /v1/keys` and client signature verification | Q28 |
| RM-083 | v2.0 | P1 | Backlog | Partner OAuth 2.0 client credentials, one client per partner | Q19; B11 |
| RM-084 | v2.0 | P2 | Backlog | No-device field-code claim and scope-aware handles | Q25, Q56, Q71; align with RM-116 |
| RM-085 | v2.0 | P2 | Backlog | Self-service data export | D-2026-10-10-16 |
| RM-086 | v2.0 | P2 | Backlog | Mint idempotency key; reuse grace evaluation (DF-10) | backend review M1 |
| RM-087 | v2.0 | P0 | Backlog | Contract negotiation, dual-contract tests, deprecation record | CONTRACT-EVOLUTION |
| RM-089 | v2.0 | P3 | Backlog | Audit cursor across equal timestamps | backend review M8 |
| RM-090 | v2.0 | P3 | Backlog | Name suffixes beyond `.eth` | spec 003 FR-023 |
| RM-091 | v2.1 | P1 | Backlog (SHADOW) | Semantic profiles after RM-080 and PR #82 | #81 |
| RM-092 | v2.2 | P1 | Backlog (RESEARCH) | Advanced recognition and photo reads after R-B12; R2 joins recovery scope. Candidate server reader: Scry (D-2026-10-16-01, PROPOSED) | B12; spec 005 US5 |
| RM-128 | R-B12 | P2 | Backlog (RESEARCH) | Scry "zz code" mode (ordered hypotheses from an ROI, no zz grammar in the engine) and a research adapter in the ZZ-OCR-QUAL-001 harness; private corpus on Zero State GPUs only; receipt compared with Vision and ML Kit (spec 004 T017) | D-2026-10-16-01; qualification.md |
| RM-129 | v2.2 | P2 | Backlog | Inference host for server photo reads: self-hosted GPU through a Cloudflare Tunnel versus a Cloudflare-hosted model; availability rule (reader down means abstain); cost and latency limits | D-2026-10-16-01; CLOUDFLARE-RUNTIME |
| RM-097 | v2.2 | P3 | Backlog (RESEARCH) | Image matching of scans against the creator's photos (Michael 2026-10-09); needs reference photos, consent wording, and a retention limit | D-2026-10-10-23; `docs/SPEC.md` 12.2 |
| RM-095 | R-B6 | P1 | Backlog | Human and OCR confusion evaluation of the production list on the Q34 corpus | spec 003 FR-001, FR-002 |
| RM-114 | v1.3 | P2 | Backlog (QUEUED) | Owner-only renew for issuer-set `expires_at`; no public expired message; idle expiry is RM-127 | D-2026-10-11-01; D-2026-10-13-01 |
| RM-116 | v2.0 | P1 | Backlog | Person-made code claim design (contract 2; option A) | D-2026-10-11-01; RM-084 |
| RM-117 | v2.2 | P1 | Backlog (RESEARCH) | Cloud photo and training consent before photo reads | D-2026-10-11-01; B12 |
| RM-126 | Horizon | P3 | Backlog | Links and zzPages safety requirements | D-2026-10-11-13 |

### RM-116 Person-made code claim (contract 2)

- Release v2.0 · P1 · Backlog · Bundle with RM-084 / RM-087 · Owner: kneelbeforez0D
- **Scope.** Option (A) from D-2026-10-11-01. Design and implement a signed-in **claim** of a person-made (or no-device field) code under contract 2: first-come on global `match_key` (FR-032 unchanged), minimum entropy (for example three parts or words plus digits), blocklist and trademark filter on code parts (extend RM-028), no fuzzy live-code match (Q40), and a new OCR qualification corpus for open vocabulary. Align with Q25 / RM-084. Option (B) (additive contract-1 slice) is not planned. Add a threat-model row for phrase squatting and guessable person-made codes.
- **Acceptance.** Design record reviewed by Danny; OpenAPI contract 2 + dual-contract tests (RM-087); Worker and zzThat claim flows; threat-model row with controls; qualification plan named.
- **Governing.** D-2026-10-11-01; CONTRACT-EVOLUTION; THREAT-MODEL.

### RM-117 Cloud photo and training consent (before photo reads)

- Release v2.2 · P1 · Backlog (RESEARCH) · Bundle B12 · Owner: Danny (legal) / kneelbeforez0D (eng)
- **Scope.** Row 8 from D-2026-10-11-01. Before RM-092 photo reads or RM-097 image matching: in-app explicit consent (purpose, retention, training yes/no), privacy policy and store-label updates, zzThat FR-005 consent text revision, EXIF strip and downscale rules, and DATA-LIFECYCLE rows. Training use is a separate opt-in from upload-for-read.
- **Acceptance.** Consent copy approved by Danny; drafts and manifests match; no upload path enabled until this RM and R-B12 exit.
- **Governing.** D-2026-10-11-01; Q34; Apple App Privacy / 5.1.2 norms; THREAT-MODEL photo row.

## v1.1 items from Michael's answers (D-2026-10-11-02 to -14)

Added by #164. Scope and acceptance for RM-120, RM-124, and RM-125 follow the records in [decisions-2026-10-13.md](decisions-2026-10-13.md) (D-2026-10-13-02 and -04), and RM-127 follows D-2026-10-13-01 under D-2026-10-11-15 option B; all ACCEPTED (Danny, 2026-10-14, [#170](https://github.com/Zero-State-LLC/zzthis/issues/170#issuecomment-6175348667)). Michael still owns the Terms wording, the confusable letter groups, and hearing why one-word codes are out.

| ID | Release | Pri | Status | Item | Governing |
|---|---|---|---|---|---|
| RM-118 | v1.1 | P0 | Built in zzThat #43 (evidence on zzThat #66) | iOS Sign in with Apple beside Google | D-2026-10-11-02; Guideline 4.8 |
| RM-119 | v1.1 | P0 | Built in zzThat #43 (evidence on zzThat #67) | iOS in-app account deletion with Apple token revocation | D-2026-10-11-03; spec 005 FR-023 |
| RM-120 | v1.1 | P0 | Ready; client-only per D-2026-10-13-04 (ACCEPTED); waits on Michael's Terms | 18+ gating, Terms clause, store age-rating questionnaires | D-2026-10-11-05; D-2026-10-13-04 |
| RM-121 | v1.1 | P1 | Ready | "Early release" labeling; no alpha/beta/test; no zzThis mention on zzThat surfaces | D-2026-10-11-06, -07 |
| RM-122 | v1.1 | P1 | Backlog | zzsupport@zer0state.com in app, listings, policy, site footer (mailbox first) | D-2026-10-11-04 |
| RM-123 | v1.1 | P0 | Backlog | Publish privacy policy (answers 1-19) at proposed zzthat.com/privacy | D-2026-10-11-08, -09; zzThat #47 |
| RM-124 | v1.1 | P0 | Backlog; draft in zzThat #72; wording pending Michael | Terms of Use and content policy draft for Michael's review; client-only acceptance | D-2026-10-11-10; D-2026-10-11-15; D-2026-10-13-01, -04 |
| RM-125 | v1.1 | P1 | In progress (server and OpenAPI maximum 5 in PR #178; zzThat cap tests still start at 3) | Create: 5 re-rolls per creation, two-word codes only, server daily cap (RM-072, Done), no phone numbers; length choice moves to v2.0 | D-2026-10-11-11, -12; D-2026-10-13-02; extends RM-113 |
| RM-127 | v1.1 | P0 | Done (PR #177) | Idle expiry and revive (server). The 80-day clock has not started: `ZZ_FREE_PUBLIC` is still false in production | D-2026-10-13-01; D-2026-10-11-15 option B; spec 005 FR-036 |

### RM-118 iOS Sign in with Apple beside Google (external)

- Release v1.1 · P0 · Built in zzThat #43; evidence on zzThat #66 · Bundle B3 · Owner: kneelbeforez0D
- **Scope.** iOS offers Sign in with Apple at equal prominence beside Google (App Store Review Guideline 4.8). The server side already exists: spec 005 FR-020 (Apple identity token and authorization code) and `identities.apple_client_id`. No server change.
- **Acceptance.** Already built. Evidence on zzThat #66: the iOS sign-in screen shows both buttons at equal prominence, and an Apple sign-in reaches a signed-in session against `POST /v1/auth/token`. Real-provider verification on staging is RM-017.
- **Governing.** D-2026-10-11-02; Guideline 4.8; spec 005 FR-020, Sign-in by platform.

### RM-119 iOS in-app account deletion with Apple token revocation (external)

- Release v1.1 · P0 · Built in zzThat #43; evidence on zzThat #67 · Bundle B3 · Owner: kneelbeforez0D
- **Scope.** A signed-in person deletes the account from inside the app (Guideline 5.1.1(v)) through `DELETE /v1/me`, which revokes the stored Apple token first (spec 005 FR-023). The web deletion link `https://zz.zer0state.com/account/` stays for the store forms. No server change.
- **Acceptance.** Already built. Evidence on zzThat #67: the entry point, the Delete confirm pattern, and the signed-out end state, with the device lists and the accepted terms version cleared. Apple revocation on staging is RM-017.
- **Governing.** D-2026-10-11-03; Guideline 5.1.1(v); spec 005 FR-023.

### RM-120 18+ gating, Terms clause, and age-rating questionnaires

- Release v1.1 · P0 · Ready; waits on Michael's Terms (RM-124) · Bundle B3, B9 · Owner: kneelbeforez0D (clients), Danny (questionnaires)
- **Scope.** Client-only (D-2026-10-13-04): the server neither stores nor checks age. One combined step before the first create on a device: the person confirms they are 18 or older (`terms.age_confirm`) and accepts the Terms (`terms.accept`). The accepted `terms.version` is stored on the device and asked again when it changes. Scanning and typing need neither. The Terms state 18+ (RM-124). Store ratings are whatever Apple's and Google's questionnaires give (D-2026-10-11-08 answer 15).
- **Acceptance.** iOS, Android, and web tests: Create shows the combined step before the first create; create is refused until both boxes are confirmed; a changed `terms.version` asks again; account deletion clears the stored version; scan and type never ask; no server call records it. Danny files the questionnaire answers.
- **Governing.** D-2026-10-11-05; D-2026-10-13-04; `design/UX.md` Terms.

### RM-121 "Early release" labeling and no zzThis mention

- Release v1.1 · P1 · Ready · Bundle B3 · Owner: kneelbeforez0D
- **Scope.** The store listings and the app say "early release", never "alpha", "beta", or "test". No "zzThis" or "zzthis.com" in any visible zzThat copy, listing, policy, Terms, or visible URL; API hostnames the person never sees are not copy.
- **Acceptance.** A sweep of zzThat strings, listing drafts, and policy drafts finds no "alpha", "beta", "test" label, "zzThis", or "zzthis.com"; the result is attached to the pull request.
- **Governing.** D-2026-10-11-06, D-2026-10-11-07.

### RM-122 zzsupport@zer0state.com everywhere

- Release v1.1 · P1 · Backlog (the mailbox comes first) · Owner: Danny (mailbox), kneelbeforez0D (surfaces)
- **Scope.** `zzsupport@zer0state.com` is the only public address for the apps: support, privacy contact, store contact, and abuse reports, in the app, the listings, the policy, and the site footer. Danny creates the mailbox and its routing to Danny and Michael before any surface shows it. Supersedes the address in RM-110.
- **Acceptance.** A test message reaches Danny and Michael; every surface above shows the address.
- **Governing.** D-2026-10-11-04; D-2026-10-11-08 answers 7 and 19.

### RM-123 Publish the privacy policy

- Release v1.1 · P0 · Backlog · Owner: Danny
- **Scope.** Publish the privacy policy built from D-2026-10-11-08 answers 1 to 19 at the host D-2026-10-11-09 proposes (`https://zzthat.com/privacy`, PROPOSED, Danny), and set `PUBLIC_PRIVACY_URL`. The policy names the operator deletion and access-request method (D-2026-10-13-08, RM-027) and states that no email is stored.
- **Acceptance.** The policy is live on or before the first store submission; `account.privacy` opens it in both apps and on the web; zzThat #47 is closed against it.
- **Governing.** D-2026-10-11-08, D-2026-10-11-09; D-2026-10-13-08; zzThat #47.

### RM-124 Terms of Use and content policy draft for Michael

- Release v1.1 · P0 · Backlog; draft in zzThat #72; wording pending Michael · Owner: kneelbeforez0D (draft), Michael (wording), Danny (approval)
- **Scope.** A draft with every D-2026-10-11-10 clause, the 18+ clause (D-2026-10-11-05), and the inactive-codes clause proposed in D-2026-10-13-01 (codes stop showing after 90 days without opening zzThat while signed in, turn back on at the next sign-in, and are never given to anyone else). The reuse clause stays out (D-2026-10-11-15 option B: never reissued). Acceptance is client-only (D-2026-10-13-04). Nothing publishes before Michael approves the wording; this backlog does not write it.
- **Acceptance.** Michael's written approval of the wording; `terms.version` in `design/copy.json` set to the approved Terms' effective date; RM-103 links point at the published text.
- **Governing.** D-2026-10-11-10; D-2026-10-11-15; D-2026-10-13-01, D-2026-10-13-04.

### RM-125 Create: five re-rolls on two-word codes

- Release v1.1 · P1 · In progress (server and OpenAPI maximum 5 merged in PR #178, 2026-10-15; zzThat demo and cap tests still start at 3) · Bundle B9 · Owner: kneelbeforez0D · Extends RM-113
- **Scope.** A new plain code gets `rerolls_remaining` 5, six candidates per creation (spec 005 FR-006); the OpenAPI `rerolls_remaining` `maximum` became 5 in PR #178, a narrow D-2026-10-10-12 exception (`docs/CONTRACT-EVOLUTION.md`). Two-word codes only: one-word codes are not issued in contract 1, and the length choice (including three words) moves to v2.0 with RM-116 (spec 003, Code length). Rolls are also capped per day on the server (RM-072, Done in the same pull request). No phone numbers in codes: filter 3 drops number words (RM-020). zzThat's picker gets five rolls with no app change when it reads the response count.
- **Acceptance.** Worker tests: a new plain code has `rerolls_remaining` 5; five re-rolls succeed and the sixth is `reroll-cap`; a handle still has 0. The OpenAPI test and both generated clients accept 5. zzThat's re-roll cap test passes at 5.
- **Evidence.** The worker tests and the OpenAPI maximum are in PR #178. Neither generated client enforces `maximum` (spec 005 FR-006). zzThat `DemoAPITests`, `DemoApiTest`, and `PickerFlowTest` still start at 3. `AppFlowTest.rerollDropsTheOldWordsAndStopsAtTheCap` stops at 0, so a live 5 decodes. The API pin stays `fd99d276e4546d2ebf9d23b5f6de85b08bad56c4`. The phone-number filter stays RM-020, blocked on Michael.
- **Governing.** D-2026-10-11-11, D-2026-10-11-12; D-2026-10-13-02 (ACCEPTED); spec 005 FR-006. Pending Michael: hearing why one-word codes are out.

### RM-126 Links and zzPages safety requirements

- Release Horizon · P3 · Backlog (unscheduled) · Owner: Michael (scheduling)
- **Scope.** Requirements for when links or zzPages come: sign-in required to add a link; a known-bad-site check on add and on open; a "You're leaving zzThat" screen showing the full address; a Report button; a daily limit per account. Sign-in, not email collection. Out of the early release.
- **Acceptance.** Before any link feature is promoted, a spec names each requirement above with a test, and THREAT-MODEL gains a link-safety row (FR-007 plain-text rule stays until then).
- **Governing.** D-2026-10-11-13; R-ZZPAGE; spec 005 FR-007.

### RM-127 Idle expiry and revive (server)

- Release v1.1 · P0 · Done (PR #177 merged 2026-10-15; `workers/api/test/idle.test.ts`, `workers/api/test/revive.test.ts`) · Bundle B9 · Owner: kneelbeforez0D · Must ship within 80 days of `ZZ_FREE_PUBLIC` turning on in production. That flag is still false, so the clock has not started.
- **Scope.** Spec 005 FR-036 (D-2026-10-13-01). `free_public` codes only. Migration 0004 adds `accounts.last_active_at` (backfilled to the migration time) and `codes.idle_expired_at`, with their indexes. `POST /v1/auth/token` and `POST /v1/auth/refresh` set `last_active_at` at most once per UTC day and, unless the account is suspended, clear `idle_expired_at` on all the owner's codes in the same batch, with one `code.revive` event each. The FR-026 daily run sets `idle_expired_at` on each active `free_public` code whose owner's `last_active_at` is more than 90 days old, in batches of 500 rows, at most 10 batches per run, with one `code.expire` event per code, and purges cache keys as FR-023 step 3 does. Re-roll refuses an idle-expired code. A code is never reissued. No wire change: the public answer is the one not-found body and the owner sees `expired`.
- **Acceptance.** Worker tests: 90 days idle plus one daily run gives a public 404 (the one not-found body) and `expired` for the owner in `GET /v1/me/codes`; a refresh (and a sign-in) revives the codes, with one `code.revive` event each; another person's scan of the code changes nothing (no `last_active_at` change, no revive); `enterprise` codes never idle-expire; a suspended owner is not revived; re-roll of an idle-expired code is `reroll-cap`; a run over 5,000 eligible codes stops at 10 batches and the next run continues.
- **Governing.** D-2026-10-13-01 (ACCEPTED, Danny 2026-10-14, [#170](https://github.com/Zero-State-LLC/zzthis/issues/170#issuecomment-6175348667)); D-2026-10-11-15 option B (ACCEPTED); spec 005 FR-009, FR-026, FR-036; Q36; DOMAIN-MODEL C3a; `docs/DATA-LIFECYCLE.md`; `docs/THREAT-MODEL.md`.
