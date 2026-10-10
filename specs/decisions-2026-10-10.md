# Decision records: architecture and roadmap review, 2026-10-10

Status: decision records for the 2026-10-10 architecture and roadmap review ([intent](../intent/2026-10-10-architecture-roadmap-review.md), [analysis](analysis-2026-10-10-architecture-review.md), [roadmap](RELEASE-ROADMAP.md), [backlog](BACKLOG.md)).
Authority: each record carries one status. `docs/SPEC.md` Section 9a lists one row per record and stays the decision log.

| Status | Meaning |
|---|---|
| ADOPTED | A documentation, sequencing, or classification decision inside an existing approved outcome. Agents follow it now. It changes no runtime behavior, contract, or product copy. |
| PROPOSED | Needs the named owner's yes before anyone builds on it, because it changes a release outcome, a governing policy, spend, or a human-gated resource. Each one names the conservative default that holds until then. |
| ASSIMILATED | A defect fix or missing acceptance evidence that enters the active release under the append-closed exceptions in [SCOPE-GOVERNANCE.md](SCOPE-GOVERNANCE.md) (security, privacy, correctness, or missing acceptance evidence). |

Research note. Sources were read on 2026-10-10 through web search results that quote the vendor pages. The session network policy blocked direct fetches of `developers.cloudflare.com`, so every Cloudflare figure below must be rechecked against the live page at implementation time (backlog RM-010). Repository evidence was read at `main` 8189ce1.

## D-2026-10-10-01 Release version convention (ADOPTED)

- **Question.** The repository uses v1, "v1 launch", v1.x, v2, v2+, contract 1, and contract 2 without one rule, so no capability can be placed on a numbered release.
- **Evidence.** `specs/CAPABILITY-ROADMAP.md` targets; `docs/CONTRACT-EVOLUTION.md` rules 1 and 2; spec 005 FR-001 (`X-ZZ-Contract` must equal `1`).
- **Alternatives.** (a) Calendar releases. Rejected: there is no delivery date to anchor them, and dates would be invented. (b) Semantic versioning of the npm packages. Rejected: the packages are private and the user-facing unit is the product release. (c) Product release `vMAJOR.MINOR` tied to the API contract generation. Selected.
- **Decision.** A product release is `vMAJOR.MINOR`. MAJOR equals the API contract generation: every v1.x release serves contract 1, and v2.0 is the first release that serves contract 2. MINOR is one append-closed release outcome inside that contract generation. A research phase is `R-<topic>` and ends in a recorded exit decision. A deferred item is `DF-<nn>` with a reason and a reconsideration trigger. Patch fixes do not get a roadmap number; they ride the active release under the append-closed exceptions.
- **Consequences.** A capability that needs a breaking wire change cannot sit in a v1.x release. The release map is [RELEASE-ROADMAP.md](RELEASE-ROADMAP.md).
- **Revisit when.** The operator adopts a different release cadence or a store or sponsor requires another scheme.

## D-2026-10-10-02 Sequence v1 as v1.0 then v1.1 (ADOPTED as sequencing; production events stay human-gated)

- **Question.** B1 to B6 all target "v1". B2 (camera) and B3 (native apps) depend on evidence and code outside this repository. Can v1 ship as one event?
- **Evidence.** zzThat owns the native apps (`specs/README.md`); ZZ-OCR-QUAL-001 is a draft spec and an unfinished harness (PR [#89](https://github.com/Zero-State-LLC/zzthis/pull/89), PR [#115](https://github.com/Zero-State-LLC/zzthis/pull/115)) with no private corpus or device run yet. Apple's App Review requires in-app account deletion and Sign in with Apple token revocation for apps that create accounts ([App Review 5.1.1(v)](https://developer.apple.com/help/app-review/guideline-reference/5-1-1-account-deletion), [Offering account deletion in your app](https://developer.apple.com/support/offering-account-deletion-in-your-app)), so a store build needs a production `/v1` that already deletes accounts and revokes tokens.
- **Alternatives.** (a) One v1 event when everything is ready. Rejected: the API, web client, and operations gates would wait on the camera corpus, and the store build still needs a production API first. (b) v1.0 production API, web client, site, and production wordlist; v1.1 native apps with qualified camera capture. Selected.
- **Decision.** The v1 release train has two production milestones. v1.0 is B1 (typed and web), B4, B5, and B6. v1.1 is B2 and B3, the zzThat store launch that Q39 names. No bundle is added and no outcome is widened; this is the dependency order of already-approved scope.
- **Consequences.** "Try zzThat" (spec 001 T016) waits for v1.1. The v1.0 production deploy still needs Danny's yes (constitution Principle VIII).
- **Revisit when.** zzThat finishes camera qualification before the v1.0 gates close; then v1.0 and v1.1 may ship together.

## D-2026-10-10-03 Camera fallback when qualification does not pass (ADOPTED)

- **Question.** What ships in v1.1 if ZZ-OCR-QUAL-001 does not PASS for a platform (for example, no Android engine wins on the frozen corpus)?
- **Evidence.** `specs/DECISION-STATUS.md`: OCR thresholds block "camera Accept promotion, not typed entry"; spec 004 bands; Principle III (never guess).
- **Alternatives.** (a) Block v1.1 on that platform. (b) Ship the camera with the prototype 0.80 and 0.50 values. Rejected: those values are not measured, and false-valid decodes are the main safety risk. (c) Ship the camera in confirm-only mode: every camera candidate is at most Clarify, so the person confirms the canonical code before lookup. Selected.
- **Decision.** A platform whose engine has no PASS receipt ships camera capture in confirm-only mode. The Accept band is reachable only from a PASS receipt for that platform and engine. Typed entry is unaffected.
- **Consequences.** More taps per scan on unqualified platforms; no unconfirmed camera read ever resolves. zzThat implements the mode (external).
- **Revisit when.** A PASS receipt exists for the platform.

## D-2026-10-10-04 Production wordlist and issued format before the first production mint (PROPOSED: Michael for format, Danny for freeze and risk)

- **Question.** B6 requires a "human/OCR-qualified" list before the first production mint, but the Q34 corpus does not exist yet. What is the minimum sufficient evidence, and does the 2 data words plus check word format survive an enumeration review?
- **Evidence.** spec 003 Prototype defaults (N = 2663 after filter 6; code space about N squared, about 7.1 million); Q35 already decides a confusable-letter table and a Double Metaphone phonetic key for the first real list; spec 003 FR-017 (a published list never changes); spec 005 Resolve step 4 verifies the check word before lookup, so a second list version needs multi-list verification. Backend review H1: at 1 million issued public codes about 14% of random guesses hit a live code.
- **Alternatives.** (a) Ship proto-v0 plus the blocklist re-run (T037) only. Rejected: it skips the Q35 filters already decided. (b) Wait for corpus tuning. Rejected as the only path: it puts an external dependency on the critical path with no bound. (c) Apply the decided Q35 filters deterministically now, plus the private blocklist; run corpus tuning in parallel (R-B6); freeze with corpus evidence if it exists in time, else with Danny's recorded risk acceptance. Selected. (d) Change the issued format to three data words plus a check word (code space about 1.9e10). Not selected for v1.0: it changes every example, the copy, and handwriting length, which is Michael's call; it stays the named escalation.
- **Decision.** Keep two data words plus a check word for v1.0 (Q27 unchanged). Build the first production list with the Q35 filters and the blocklist (RM-020). Treat enumeration as a residual risk with controls: D-2026-10-10-05 controls, the `create.public_hint` disclosure, and a density trigger: when issued public codes exceed 1% of the code space (about 71,000), the threat review re-decides between stronger limits and a three-word format.
- **Consequences.** The first production list is permanent for codes minted from it. A successor list needs multi-list verification (v2.0, RM-081).
- **Remaining uncertainty.** Human confusion rates for the filtered list are unmeasured until R-B6 exits.
- **Revisit when.** R-B6 exits, or the density trigger fires.

## D-2026-10-10-05 Abuse controls that v1.0 requires (ASSIMILATED, security defect)

- **Question.** The IP limiter keys on the full address, so one IPv6 /64 rotates into unlimited buckets, and every not-found resolve writes an audit row.
- **Evidence.** `workers/api/src/limits/enforce.ts:33-36`; spec 005 Resolve (not-found audit); D1 has a 10 GB database limit on Workers Paid ([D1 limits](https://developers.cloudflare.com/d1/platform/limits/)).
- **Alternatives.** (a) Rely on Cloudflare WAF rules alone. Rejected: zone rules are configuration outside the repo and untested. (b) Fix the limiter subject and add a zone rule as defense in depth. Selected. (c) Sample not-found audit rows. Rejected for v1.0: it changes an audited invariant; it stays an operator decision (D-2026-10-10-10).
- **Decision.** v1.0 keys IPv6 callers on their /64 prefix and IPv4 callers on the address (RM-030), adds a zone rate-limiting rule for `/v1/resolve/*` as defense in depth at deploy (RM-031, human-gated), and monitors audit growth (RM-041).
- **Consequences.** Carrier-grade NAT users share a bucket, as they do today on IPv4.
- **Revisit when.** Pilot traffic shows false 429s, or the density trigger in D-2026-10-10-04 fires.

## D-2026-10-10-06 Tenant isolation inside a scope (ADOPTED operating rule; model change PROPOSED for contract 2)

- **Question.** `viewer` and `auditor` grants cover a whole scope (`enterprise` or `logistics`), so two customers in one scope can read each other's private records and audit events.
- **Evidence.** spec 005 FR-034 and FR-035; `workers/api/migrations/0001_init.sql` (scope is a three-value enum); backend review H2.
- **Alternatives.** (a) Add an organization column inside contract 1. Rejected: it changes grants, resolve authorization, and audit scoping, which contract 1 freezes. (b) Operating rule now, model change in contract 2. Selected.
- **Decision.** Through v1.x, each of `enterprise` and `logistics` serves at most one organization. The operator grants `issuer`, `viewer`, or `auditor` only to accounts of that one organization, and the grant runbook says so (RM-063). Multi-organization isolation becomes part of the #87 gate as an Organization (tenant) entity alongside Scope and Namespace (RM-080).
- **Consequences.** v1.3 supports one enterprise pilot customer at a time.
- **Revisit when.** A second organization needs private records before contract 2.

## D-2026-10-10-07 A staging environment that can verify writes and the cache (PROPOSED: Danny, DNS and Access are human-gated)

- **Question.** Staging cannot sign in or mint (`ZZ_DEV_AUTH`, `ZZ_MINT_ENABLED` false, no provider settings), and on `*.workers.dev` the Cache API has no effect, so the write path and FR-018 caching are unverified on Cloudflare.
- **Evidence.** `workers/api/wrangler.staging.toml`; Cloudflare Cache API docs state that Cache API operations on `*.workers.dev` deployments have no impact and that custom domains have functional cache ([Cache API](https://developers.cloudflare.com/workers/runtime-apis/cache/)).
- **Alternatives.** (a) Open dev sign-in on the public workers.dev host. Rejected: anyone could mint codes with arbitrary text on a public host, and the cache would still be untested. (b) A staging hostname on the existing `zer0state.com` zone, behind Cloudflare Access, with developer sign-in and mint on and `fixture-7`. Selected. (c) Verify only at a production canary. Kept as the fallback.
- **Decision.** Staging gets a custom hostname on `zer0state.com` behind Cloudflare Access (Zero Trust Free covers up to 50 users per Cloudflare's plan page; recheck at setup). Automated runs pass Access with a service token (`CF-Access-Client-Id` and `CF-Access-Client-Secret` headers, [service tokens](https://developers.cloudflare.com/access/service-auth/service-token/)). Staging enables `ZZ_DEV_AUTH` and `ZZ_MINT_ENABLED` with `fixture-7` and is reset with `--fresh`-equivalent D1 cleanup before each run (RM-012, RM-013). Until Danny approves the hostname, the fallback holds: cache behavior is verified at the production canary with one synthetic public code (RM-052).
- **Consequences.** Spec 005 FR-029 already names workers.dev for staging; this adds a gated custom hostname and does not change production.
- **Revisit when.** Cloudflare enables the Cache API on workers.dev.

## D-2026-10-10-08 Production configuration and deploy path (PROPOSED: Danny)

- **Question.** There is no production Wrangler configuration and no production deploy path. Draft PR [#95](https://github.com/Zero-State-LLC/zzthis/pull/95) deploys from the default config, which is local-only since PR #106.
- **Evidence.** `workers/api/wrangler.toml` (local placeholders); `.github/workflows/cloudflare-api-staging.yml` (manual, main-only, GitHub environment, full checks, then deploy).
- **Alternatives.** (a) PR #95 as written. Rejected: it targets the local config and has no environment protection. (b) A `wrangler.production.toml` plus a manual workflow that copies the staging workflow's checks, runs under a GitHub `production` environment with Danny as required reviewer, captures a D1 bookmark before migrations, and records the Worker version. Selected.
- **Decision.** RM-001 adds the configuration with production names from `docs/cloudflare-resource-inventory.md`, the `zz.zer0state.com` custom domain (Q69), `ZZ_ENV=production`, every feature flag explicit, an `[observability]` block pinned so invocation logs stay off, and no resource ids until Danny creates the resources. A repository test parses the file and fails on `ZZ_DEV_AUTH=true`, `ZZ_PHOTO_READS=true`, `fixture-7`, or invocation logs on. RM-002 adds the workflow. PR #95 is superseded when RM-002 merges.
- **Consequences.** Agents still never dispatch it (AGENTS.md); the environment reviewer enforces that.
- **Revisit when.** The operator moves deploys to Cloudflare Workers Builds.

## D-2026-10-10-09 Production runs on Workers Paid (PROPOSED: Danny, spend)

- **Question.** Which Workers plan can carry the v1.0 workload and its recovery promise?
- **Evidence.** Free plan: 50 external subrequests per invocation, 50 D1 queries per invocation, 7-day D1 Time Travel. Paid: 10,000 subrequests per invocation by default since 2026-02-11, 1,000 D1 queries per invocation, 30-day Time Travel ([Workers limits](https://developers.cloudflare.com/workers/platform/limits/), [subrequest changelog 2026-02-11](https://developers.cloudflare.com/changelog/2026-02-11-subrequests-limit/), [D1 limits](https://developers.cloudflare.com/d1/platform/limits/)). Account deletion purges one cache key per revoked code and deletes photos in one call (`workers/api/src/account/me.ts:155-163`); the retention run is unbounded (`workers/api/src/retention/cron.ts`).
- **Decision.** Production runs on Workers Paid. `docs/OPERATIONS.md` already assumes the paid 30-day window. The code fix in RM-035 bounds that work so it fits either plan's limits, which keeps staging honest.
- **Consequences.** A monthly platform cost; the amount is not recorded in this public repository (constitution Principle VI).
- **Revisit when.** Measured usage fits the free plan with margin, and the 7-day recovery window is accepted.

## D-2026-10-10-10 Recovery scope and proposed objectives (PROPOSED: Danny sets the numbers)

- **Question.** OPERATIONS lists R2, Durable Object, configuration, and secret recovery as open blockers.
- **Evidence.** In v1, `ZZ_PHOTO_READS` is false, so R2 holds no application objects; the limiter is non-authoritative (`docs/OPERATIONS.md`); configuration lives in git; secrets live only in Cloudflare. A D1 Time Travel restore also undoes account deletions made after the restore point (backend review M11).
- **Decision.** For v1.0 the authoritative state is D1 plus four secrets (`ZZ_TOKEN_SECRET`, `ZZ_DATA_KEY`, `ZZ_RECORD_SIGNING_KEY`, `APPLE_PRIVATE_KEY`). R2 and the limiter are out of the RPO scope while `ZZ_PHOTO_READS` is false, and the production configuration test (RM-001) enforces that. Secrets are escrowed by the operator outside Cloudflare and outside this repository (RM-022). A restore runbook replays account deletions recorded after the restore point (RM-023), and every migration captures a D1 bookmark first (RM-002). Proposed objectives for operator acceptance: RPO of 5 minutes for D1 and RTO of 4 hours from incident declaration. These are conservative defaults derived from minute-granular Time Travel and the 1.735-second measured staging restore, not measured service results; the restore drill (RM-024) must meet them before they count.
- **Audit retention.** Audit rows are append-only and retained through v1.1. The operator decides minimization when D1 reaches 1 GB or 6 months after launch, whichever comes first (RM-041).
- **Revisit when.** `ZZ_PHOTO_READS` turns on (R2 joins the scope), or measured drills miss the targets.

## D-2026-10-10-11 Observability and alerting baseline (ADOPTED design; resources gated)

- **Decision.** No third-party telemetry. The Worker logs the request id and Cloudflare ray id, returns `X-Request-Id`, logs the deployed version from version metadata, and logs a D1, R2, or Durable Object error class (RM-036). Invocation logs stay off because resolve URLs carry codes (FR-027), pinned in configuration (RM-001). Alerting uses a scheduled GitHub Actions probe of `GET /v1` and one synthetic public code, which files an issue on failure (RM-040), plus Cloudflare's built-in Worker metrics as the SLO source. No paging vendor is chosen; the operator names a contact (RM-025).
- **Revisit when.** Pilot traffic needs latency percentiles beyond the dashboard; then Analytics Engine is the in-platform option (`specs/CLOUDFLARE-RUNTIME.md`).

## D-2026-10-10-12 Contract 1 stays frozen through v1.1; additive revisions need tolerant readers (PROPOSED amendment to CONTRACT-EVOLUTION, Danny)

- **Question.** Can a v1.x release add an optional field or route without a contract 2?
- **Evidence.** `docs/CONTRACT-EVOLUTION.md` rule 1 freezes contract 1. kotlinx.serialization rejects unknown JSON keys unless `ignoreUnknownKeys` is true ([JsonBuilder.ignoreUnknownKeys](https://kotlinlang.org/api/kotlinx.serialization/kotlinx-serialization-json/kotlinx.serialization.json/-json-builder/ignore-unknown-keys.html)), and Swift `JSONDecoder` fails a whole object on an unknown enum case unless the generated type has a fallback ([OpenAPI Generator Swift options](https://openapi-generator.tech/docs/generators/swift6)). zzThat's generator settings are not visible from this repository.
- **Decision.** Contract 1 does not change through v1.1. Proposed amendment: after v1.1, contract 1 may take an additive revision (new optional request fields, new response fields, new routes) only when every supported client cohort is verified as a tolerant reader, the OpenAPI `info.version` changes, and discovery advertises the feature. Anything else is contract 2. The tolerant-reader verification is an external zzThat task (RM-075).
- **Consequences.** Mint idempotency keys, data export, and key publication wait for v2.0 unless the amendment is accepted and the clients are verified.

## D-2026-10-10-13 Security CI failure on main (ADOPTED)

- **Question.** The `security` workflow has failed on every push to `main` since 2026-10-08 (for example run [37876538197](https://github.com/Zero-State-LLC/zzthis/actions/runs/37876538197)).
- **Evidence.** Gitleaks scans every ref (`--all`). A local redacted run reproduced one `generic-api-key` finding at `scripts/ocr-qualification/receipt-semantics.mjs:79` in commit `ab3983ab95`, which exists only on the unmerged branch `spec/zz-ocr-qual-001` (PR #89). `main`'s own history is clean. Draft PR [#122](https://github.com/Zero-State-LLC/zzthis/pull/122) proposes an exact-commit allowlist.
- **Decision.** Keep scanning every ref: in a public repository a secret on any branch is exposed. Land a narrow allowlist for the verified false positive, scoped to that commit, path, and line (RM-003). Do not weaken the scan.

## D-2026-10-10-14 Dependency advisories, issue #92 (ADOPTED disposition)

- **Evidence.** `npm audit` on 2026-10-10 reports six high advisories: `@cloudflare/vitest-pool-workers`, `wrangler`, `miniflare`, `sharp`, `undici` (all through the local Workers simulator), and `http-cache-semantics` (through `astro`). The Worker production bundle's inputs (`workers/api/dist/meta.json`) are only `hono`, `jose`, `zod`, `@zzthis/zz-core`, and the Worker source. The site ships static files.
- **Decision.** None of the six reaches a production runtime. They are developer and build tooling risks. Upgrade them in a separate dependency pull request when fixed versions exist (RM-004), and keep the merge rule from D-2026-10-05-05: block a merge if any advisory reaches the Worker production bundle.

## D-2026-10-10-15 Marketing site stays on GitHub Pages for v1.0 (PROPOSED de-scope inside B4: Danny)

- **Evidence.** The site serves `https://zzthis.com` from GitHub Pages since PR #124 and issue #6 closed; Worker parity is "partial, not passed" (`docs/cloudflare-site-cutover.md`); FR-029 and Q69 say the marketing site stays on Pages.
- **Decision.** The site Worker migration is not a v1.0 gate. It stays B4 work that may finish at any time after parity, under its runbook (RM-045). This removes a production DNS change from the launch path.
- **Revisit when.** The site needs response headers Pages cannot set (CSP, Permissions-Policy) or Pages limits bind.

## D-2026-10-10-16 Privacy policy and data-subject requests (ASSIMILATED, legal and privacy gap)

- **Evidence.** `PUBLIC_PRIVACY_URL` and `PUBLIC_SUPPORT_EMAIL` have no value; no privacy policy exists in the repository, although FR-026 says "The privacy policy states the 30 days". `docs/DATA-LIFECYCLE.md` says export is not established.
- **Decision.** v1.0 requires a published privacy policy and a support address (Danny, legal; RM-026). Access and deletion requests outside the app are handled by an operator runbook (RM-027). Self-service export is a v2.0 capability (RM-085).

## D-2026-10-10-17 The zzPage claim on About (ADOPTED disposition)

- **Evidence.** D-2026-10-08-04 ships an explainer that every zz-code "can optionally have its own zzPage ... hosted by zzThis or in the user's own cloud storage". No spec names that capability. FR-007 keeps record text plain and forbids tappable links to limit phishing.
- **Decision.** The text stays as Michael's labeled concept copy. The capability is research R-ZZPAGE, and any design must resolve the FR-007 link-safety rule first. The resolve view of a public record is today's equivalent of a hosted page.

## D-2026-10-10-18 Location capability, PR #127 (ADOPTED disposition)

- **Decision.** The B17 proposal stays research (R-B17) with no release assignment until PR [#127](https://github.com/Zero-State-LLC/zzthis/pull/127) is reviewed. Its location data is a new sensitive-data class, so SCOPE-GOVERNANCE presumes scope expansion. This review does not merge or restate its content.

## D-2026-10-10-19 Backend defects enter v1.0 (ASSIMILATED)

- **Decision.** These findings are security or correctness defects and enter v1.0 under the append-closed exceptions: re-roll skips the scope check (RM-032), mint races deletion and suspension (RM-033), cache errors fail committed writes (RM-034), unbounded retention and deletion fan-out (RM-035), no outbound timeout on Apple calls (RM-037), `ZZ_DATA_KEY` cannot rotate (RM-021), no limiter failure policy (RM-038), and missing request and version logging (RM-036). Each backlog item cites its file and line evidence from the [analysis](analysis-2026-10-10-architecture-review.md).

## D-2026-10-10-20 Tests become a required check (PROPOSED: Danny, branch protection)

- **Evidence.** The required check `build` runs lint and build; tests run in `site-ci.yml`, whose required status is not documented (`.github/workflows/ci.yml`, `site-ci.yml`).
- **Decision.** Require the `site-ci.yml` test job on `main` (RM-005). Do not edit `ci.yml` (constitution, Engineering standards).

## D-2026-10-10-21 Pull the free public scope forward to v1.1 for zzThat create (PROPOSED: Danny, release outcome)

- **Question.** zzThat create shows an unavailable state until `GET /v1` reports `free_public: true` (zzThat FR-018), and turning on `ZZ_FREE_PUBLIC` is v1.2 (QUEUED, RM-076). Michael's MVP input (`intent/2026-10-09-michael-zzthat-mvp-input.md`, PR [#138](https://github.com/Zero-State-LLC/zzthis/pull/138)) needs in-app create at launch. Can `free_public` move into v1.0 or v1.1 without widening contract 1?
- **Evidence.** Contract 1 already carries the scope: spec 005 FR-005 (flag off by default), FR-034 (minting needs `ZZ_FREE_PUBLIC`), FR-035 (always public), US2 (server chooses the words, also in `free_public`). The web client mints only in `free_public` and shows Unavailable otherwise (`apps/web/src/lib/api.ts`, `apps/web/src/scripts/create.ts`), so the v1.0 outcome "create a server-chosen public code" in RELEASE-ROADMAP also depends on this flag; with the flag off, v1.0 web create is the Unavailable state. Open defects that public minting exposes: IPv6 callers escape the limiter ([#136](https://github.com/Zero-State-LLC/zzthis/issues/136), RM-030), scope grants leak across customers ([#135](https://github.com/Zero-State-LLC/zzthis/issues/135), RM-063, D-2026-10-10-06). The production blocklist is unsupplied (RM-028, required non-empty by FR-024). Enumeration risk grows with issued public codes (D-2026-10-10-04 density trigger). App Store guideline 1.2 needs report handling for user-generated content (RM-068, already v1.1).
- **Alternatives.**
  - (a) Keep `free_public` in v1.2 (current plan). zzThat v1.1 ships scan, resolve, and My codes, but create is Unavailable for everyone. Lowest risk; contradicts the MVP the input asks for and leaves v1.0 web create Unavailable too.
  - (b) Tenant-only create first: the v1.3 single-organization pilot path (an `issuer` grant in `enterprise`) moved earlier for a named pilot group. No public abuse surface, but needs RM-063 and #135 handled, gives no consumer create, and the operator hand-grants every account.
  - (c) Turn on `free_public` in v1.0 with the web launch. Fastest; but abuse controls, moderation, and spend data would all be untested together on day one, with no v1.0 traffic to learn from.
  - (d) Turn on `free_public` at v1.1, the zzThat store launch, behind hard prerequisites and a kill switch, with v1.0 production as the soak period. Selected and recommended: v1.0 web is lookup only, and public creation opens in v1.1 for the web and the zzThat apps together. Danny agreed in chat 2026-10-09; the status stays PROPOSED until this record merges.
- **Decision (proposed).** Move RM-076 and RM-077 from v1.2 to v1.1 as gate items. `ZZ_FREE_PUBLIC` stays false in v1.0 (RM-001 unchanged) and flips to true only at the v1.1 gate, after Danny's written yes. Prerequisites, each with evidence in the release packet:
  1. Abuse controls: D-2026-10-10-05 done, including IPv6 /64 keying (RM-030, #136) and the zone rule on resolve (RM-031); mint and re-roll scope checks (RM-032, RM-033).
  2. Rate limits: the FR-011 mint and resolve rows verified on staging (RM-015), plus a proposed per-account daily mint cap for `free_public` (number for Danny; a contract-1 compatible 429).
  3. Blocklist: RM-028 production list supplied and the staging refusal test passing (Gate G8).
  4. Grant isolation: #135 handled under D-2026-10-10-06 and RM-063. `free_public` itself has no grants, but the same release must not open public mint while enterprise grants still leak.
  5. Moderation and reporting: RM-068 commitment, RM-077 triage views, a named moderator, a stated response time, and the FR-025 suspension path rehearsed.
  6. Cost caps: RM-042 (Workers Paid, usage alerts), audit growth monitored (RM-041), and a written threshold at which the operator flips `ZZ_FREE_PUBLIC` off.
  7. Kill switch: `ZZ_FREE_PUBLIC=false` stops new mints without a deploy and is rehearsed on staging (existing codes keep resolving).
  8. Enumeration: the D-2026-10-10-04 density trigger is monitored from the first public mint.
- **Effort.** Small in code: the flag, contract, and clients already exist; RM-030 and RM-032 are already v1.0. New work is a per-account mint cap (one limiter row and tests), RM-077 SQL views, a content policy and moderation runbook, and a staging flag-flip rehearsal. The pacing items are human: Michael and Danny supply the blocklist, Danny names a moderator and spend thresholds.
- **Risks.** Spam and abusive record text at launch; offensive words in titles and bodies beyond the code words (the blocklist covers both under FR-024, but only for listed terms); enumeration of public records as volume grows; moderation load on a small team; store rejection if report handling is slow; cost spikes from scripted mint. Mitigations are the prerequisites above plus the kill switch. Residual risk is signed in the RM-029 threat review.
- **Consequences.** v1.1 widens from "native apps and camera" to also include public community create; the v1.2 release keeps only what remains (none, unless Danny adds items). Codes stay server-chosen; person-made codes, duplicates, and photos stay where the intake audit placed them. v1.0 web create remains Unavailable until v1.1 unless Danny chooses (c).
- **Roadmap correction.** RELEASE-ROADMAP v1.0 previously promised web create, edit, and revoke, which the flag-off web client cannot deliver. v1.0 is now lookup only on the web; create, edit, and revoke on the web move to v1.1 with the apps. The v1.0 canary (G12, RM-052) and cache check (RM-016) use one operator-minted synthetic code instead of a public web mint (INFERRED: an `issuer` grant on a single operator test account under RM-063).
- **Default until merge.** The current plan holds: `free_public` in v1.2, RM-076 QUEUED.
- **Revisit when.** v1.0 production data shows abuse or cost above the agreed thresholds, or the v1.1 gate slips while public create is the only blocker.
