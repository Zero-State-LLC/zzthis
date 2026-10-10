# zzThis release roadmap

Status: governing delivery roadmap, adopted 2026-10-10 by the [architecture and roadmap review](analysis-2026-10-10-architecture-review.md). It sequences the capability bundles in [CAPABILITY-ROADMAP.md](CAPABILITY-ROADMAP.md) under [SCOPE-GOVERNANCE.md](SCOPE-GOVERNANCE.md). It does not promote a bundle, authorize a deploy, or commit a date. Implementation items live in [BACKLOG.md](BACKLOG.md); decisions are in [decisions-2026-10-10.md](decisions-2026-10-10.md).

Evidence labels follow the constitution: OBSERVED, INFERRED, SPECULATIVE, OPEN. "Implemented" means code and tests exist on `main`. "Verified" names the environment where evidence was recorded. Nothing below is production-ready until its release gate evidence exists.

## Version convention (D-2026-10-10-01)

| Form | Meaning | Example |
|---|---|---|
| `vMAJOR.MINOR` | A product release. MAJOR is the API contract generation it serves. MINOR is one append-closed outcome inside that generation. | v1.0 serves contract 1; v2.0 is the first contract-2 release |
| `R-<topic>` | A bounded research phase. It names its question, evidence, owner, and exit decision. It never ships runtime behavior by itself. | R-B6 wordlist human factors |
| `DF-<nn>` | A deferred capability with a reason and a reconsideration trigger. | DF-01 payments |

Rules:

1. A release outcome becomes append-closed when its first implementation item starts (SCOPE-GOVERNANCE). Today v1.0 and v1.1 are inside the ACTIVE v1 bundles B1 to B6. v1.2 and later are QUEUED: only the operator promotes them.
2. A capability that needs a breaking wire change cannot be in a v1.x release ([CONTRACT-EVOLUTION.md](../docs/CONTRACT-EVOLUTION.md)). Contract 1 is frozen through v1.1 (D-2026-10-10-12).
3. Dates are not set here. Order follows dependencies, then user value.

## Current readiness (OBSERVED 2026-10-10, `main` 8189ce1)

| Area | State | Evidence |
|---|---|---|
| Marketing site and scripted demo | Live on GitHub Pages at `https://zzthis.com` | PR #124 merged; issue #6 closed |
| `packages/zz-core` grammar, classifier, check word, issuer, match key, scanner | Implemented; every shared vector passes | 235 zz-core tests pass locally on 2026-10-10 |
| `/v1` API Worker | Implemented; 330 Worker tests pass; deployed to isolated staging with mint, sign-in, and photo reads off | `docs/cloudflare-resource-inventory.md` |
| Web client | Implemented (9 screens, typed lookup); 78 unit tests and a local Playwright flow; not reachable for sign-in on staging | `apps/web` |
| Native iOS and Android apps | Not in this repository (zzThat); camera engine unqualified | PR #89, PR #115 (drafts) |
| Production | No production configuration, resource, OAuth client, privacy policy, or deploy approval | B4 issue [#93](https://github.com/Zero-State-LLC/zzthis/issues/93), [#86](https://github.com/Zero-State-LLC/zzthis/issues/86) |
| CI | `build` and site tests green; `security` red on `main` since 2026-10-08 from a branch-only false positive | D-2026-10-10-13 |

Verdict: implementation-complete prototype; not production-ready. The shortest path to a usable production release is v1.0 below.

## Release map

```text
v1.0 Production web launch (contract 1)  <- active, append-closed
  |
  v
v1.1 Native apps and camera capture (zzThat store launch)
  |
  +--> v1.2 Public community codes (free_public)       [QUEUED]
  +--> v1.3 Single-organization enterprise pilot       [QUEUED]
          |
          v
v2.0 Contract 2 foundation (#87 gate, keys, partners, lists)  [QUEUED]
  +--> v2.1 Semantic profiles (B10)                    [SHADOW until #87]
  +--> v2.2 Advanced recognition and retry photos (B12) [RESEARCH-gated]
          |
          v
Horizon: R-B13, R-B15, R-B17, R-I18N, R-AI, R-ZZPAGE, R-VOICE; DF-01 to DF-17
```

## v1.0 Production web launch

- **User outcome.** A person can open `https://zz.zer0state.com`, type a code to find its record, and report abuse, on production infrastructure with tested recovery. The web is lookup only in v1.0: public creation, edit, and revoke open in v1.1 for the web and the apps together (D-2026-10-10-21, PROPOSED; Danny agreed in chat 2026-10-09). Sign-in and account deletion stay available so the API's identity and deletion paths are proven in production.
- **Bundles.** B1 (typed and web paths), B4, B5, B6.
- **Prerequisites.** Security CI green (RM-003); Danny's approvals for resources, OAuth clients, spend, DNS, legal text, and deploy.
- **Included.** Contract 1 as implemented; the web client (spec 005 US6); production wordlist (RM-020); the v1.0 backend fixes (D-2026-10-10-19); production configuration, workflow, recovery, observability, and incident runbooks; privacy policy and support address; marketing site unchanged on Pages.
- **Excluded.** Native apps and camera (v1.1); `free_public` (v1.2); private, single-use, and expiring codes in the web UI (v1.3); photo reads (v2.2); any contract change; the site Worker migration (optional, D-2026-10-10-15).
- **Contracts and data.** No wire change. Data changes: indexes for retention queries and a key id prefix on sealed values (RM-021, RM-035), both forward-compatible migrations.
- **Operations.** Production Worker, D1, R2 (empty while photo reads are off), limiter namespace, cron, secrets with escrow, custom domain, invocation logs off, synthetic probe, zone rate rule.
- **Security and privacy.** Threat-model review with signed residual risks, including enumeration of public records (D-2026-10-10-04) and the one-organization-per-scope rule (D-2026-10-10-06). Logs carry no code, token, text, or IP (FR-027).
- **Performance.** No public SLO is promised. Record staging p50 and p95 for resolve, mint, and sign-in (RM-015). The production canary must stay within twice the staging p95 (PROPOSED, RM-052).

### v1.0 release gates

Each gate needs dated evidence linked from the release packet (RM-054). A gate with no evidence is failed, not pending.

| Gate | Evidence required | Items |
|---|---|---|
| G1 CI | `build`, `typecheck-and-test`, and `security` green on the release commit; a `run-e2e` Playwright run green | RM-003, RM-005 |
| G2 Staging write path | Playwright and the API smoke script pass against the Access-protected staging host, including every rate-limit row | RM-012 to RM-015 |
| G3 Edge cache | On a custom hostname: hit, revoke, purge, and 404 in one data center; max-age bound observed elsewhere | RM-016 or RM-052 |
| G4 Identity | One real Apple web sign-in and one real Google web sign-in on staging; Apple token revocation confirmed by a failed refresh at Apple after deletion | RM-011, RM-017 |
| G5 Recovery | Seeded D1 restore drill with integrity checks and deletion replay; secret restore from escrow; measured times meet the accepted RTO and RPO | RM-022 to RM-024 |
| G6 Retention | A staging cron run that deletes seeded expired nonces, refresh tokens, and closed reports, within one invocation's limits | RM-035 |
| G7 Observability | Log sample review shows no code, token, record text, or IP; probe alert fires on a forced failure | RM-036, RM-040 |
| G8 Wordlist | Production list committed with its yield report (N at least 1,000), blocklist applied, Danny's freeze record | RM-020 |
| G9 Legal | Privacy policy published and linked; support address live; NOTICE unchanged | RM-026 |
| G10 Security review | Threat-model rows each have automated evidence or an operator control; residual risks signed | RM-029 |
| G11 Approval | Danny's written yes for resources, spend, DNS, and deploy | RM-042, RM-050, RM-051 |
| G12 Canary | Production smoke within 1 hour of deploy: discovery, sign-in, an operator-minted synthetic code (no public mint, D-2026-10-10-21), resolve, revoke, delete; rollback target recorded | RM-052 |

- **Migration and compatibility.** First production database: the migrations apply forward from empty. After the first production mint, the wordlist is permanent for those codes (spec 003 FR-017).

## v1.1 Native apps and camera capture

- **User outcome.** iOS and Android users scan a handwritten code with the camera, confirm or accept it, and use every v1.0 job in the zzThat apps. Public creation, edit, and revoke open in v1.1 on the web and in the apps together (D-2026-10-10-21, PROPOSED; Danny agreed in chat 2026-10-09).
- **Bundles.** B2, B3. Implementation lives in zzThat; this repository owns the contract pin, vectors, design files, and the qualification protocol.
- **Prerequisites.** v1.0 production API; ZZ-OCR-QUAL-001 merged (PR #89) with a harness (PR #115) and a protected workflow; the Q34 private corpus.
- **Included.** On-device recognition behind the shared decoder; bands from the qualification receipt; confirm-only fallback for any unqualified platform (D-2026-10-10-03); creation check (spec 004 FR-017); App Store and Play submissions; "Try zzThat" on the site (spec 001 T016); report-handling commitments for user-written pages.
- **Excluded.** Cloud or server vision, photo upload, voice, custom models, web camera.
- **Contracts and data.** None in this repository. zzThat pins the v1.0 release commit and verifies tolerant readers (RM-075).
- **Security and privacy.** No raw photo leaves the device; store privacy labels match the data lifecycle matrix.
- **Gates.** A signed PASS receipt per promoted engine, or confirm-only mode; store review passes; account deletion from each app verified against production.
- **PROPOSED (D-2026-10-10-21, Danny agreed in chat 2026-10-09; adopted on merge).** Add public community create for the web and the apps: `ZZ_FREE_PUBLIC` turns on at the v1.1 gate after Danny's written yes, with RM-076 and RM-077 moved here from v1.2 and the prerequisites in that record (RM-028, RM-030, RM-031, RM-032, RM-033, RM-041, RM-042, RM-063, RM-068, RM-072 durable-key mint cap, and a rehearsed shutoff redeploy with a target time). Until Danny decides, v1.2 below stands.

## v1.2 Public community codes (QUEUED, B9)

- **Outcome.** Signed-in people mint `free_public` codes for signs, lost-and-found, and community posts.
- **Prerequisites.** v1.0 in production for at least one review cycle; moderation capacity and report triage (RM-077); abuse evidence from v1.0 logs and audit growth.
- **Included.** Turning on `ZZ_FREE_PUBLIC` (no code or contract change); content policy; report triage cadence.
- **Excluded.** Duplicate public codes with local priority (R-B17, R-B13); premium handles (DF-01).
- **Gate.** Operator promotion after a written abuse review.
- **PROPOSED (D-2026-10-10-21, not adopted).** If Danny adopts it, this release's items move to v1.1 and v1.2 is left empty.

## v1.3 Single-organization enterprise pilot (QUEUED, B7 phase 1)

- **Outcome.** One pilot organization issues private, single-use, or expiring codes and audits them.
- **Prerequisites.** v1.0; the one-organization-per-scope grant rule (RM-063); audit scope index (RM-088).
- **Included.** Web issuer controls for `visibility`, `single_use`, and `expires_at`, which contract 1 already accepts (RM-078); signed-in resolve for viewers; an auditor view of `GET /v1/audit` (RM-079); onboarding runbook.
- **Excluded.** More than one organization per scope (v2.0); links to external identifiers as structured fields (v2.0); AI photo-to-action (R-AI).

## v2.0 Contract 2 foundation (QUEUED)

- **Outcome.** A versioned contract that adds organizations, scope-aware resolution, published signing keys, partner clients, and multiple word lists without breaking contract-1 clients.
- **Prerequisites.** The #87 gate extended with the Organization entity (RM-080); tolerant-reader evidence; a deprecation record (CONTRACT-EVOLUTION).
- **Included.** RM-080 to RM-087, RM-089, RM-090: Organization, Scope, and Namespace model; `GET /v1/keys` and client signature checks (Q28); partner OAuth 2.0 client credentials (Q19, B11); multi-list verification and per-scope dictionaries (spec 003 FR-022); no-device claim (Q25); scope-aware handle duplicates (Q56, Q71); self-service export; mint idempotency key; audit cursor; new name suffixes.
- **Compatibility.** Contract 1 keeps serving until every pinned cohort has an upgrade path; both contracts are tested independently.

## v2.1 Semantic profiles (SHADOW until #87, B10)

- **Outcome.** Versioned semantic profiles interpret an explicitly profile-bound code after canonical resolution and authorization.
- **Prerequisites.** v2.0; PR #82 reviewed; acceptance vectors from #81.

## v2.2 Advanced recognition and retry photos (RESEARCH-gated, B12)

- **Outcome.** Hard-case reads improve through a custom recognizer or a governed server read, with photo upload under explicit consent.
- **Prerequisites.** R-B12 exit; data-lifecycle and threat-model updates; R2 joins the recovery scope.

## Research phases

Each phase ends with one recorded exit decision: promote to a named release, extend once with a stated reason, or reject.

| ID | Question | Evidence needed | Owner | Exit decision feeds |
|---|---|---|---|---|
| R-B2 | Which on-device engine may reach Accept on each platform? | ZZ-OCR-QUAL-001 final-split receipts on the frozen corpus and device matrix | Danny; zzThat maintainers | v1.1 bands or confirm-only mode |
| R-B6 | Is the filtered production list confusable by hand or ear? | Q34 corpus confusion pairs; read-back error measurement (Q37) | Michael and Danny | v1.0 freeze evidence, or a successor list for v2.0 |
| R-B12 | Does a fine-tuned reader or a server VLM beat Option A safely? | Option B benchmark on the same corpus (spec 004 T008); privacy review | Danny | v2.2 scope or rejection |
| R-B13 | Can bare, drawn, or object marks be matched by photo, place, and time without guessing? | Threat model for context matching; prototype on synthetic data | Michael | Horizon release or rejection |
| R-B15 | Is a ZK selective-disclosure proof worth its cost? | S1 negative vectors (PR #84) after #87 | Danny | Horizon release or rejection |
| R-B17 | Owner-selected location on records | Review of PR [#127](https://github.com/Zero-State-LLC/zzthis/pull/127); privacy model | Danny and Michael | v1.x or v2.x assignment |
| R-I18N | Any-language codes and non-Latin scripts | Issue [#35](https://github.com/Zero-State-LLC/zzthis/issues/35); grammar and confusable model per script | Michael | Contract-2 or later grammar version |
| R-AI | AI photo-to-action and inventory assistant (`docs/SPEC.md` 2.6) | A bounded user study; data and vendor review | Michael | B7 phase 2 or rejection |
| R-ZZPAGE | Hosted or linked zzPages (D-2026-10-10-17) | Link-safety design against FR-007 | Michael | v2.x or rejection |
| R-VOICE | On-device voice entry (Q38) | Platform speech APIs that keep audio on device; read-back error method | Michael | v1.x client release or deferral |

## Deferred register

| ID | Capability | Reason | Reconsider when |
|---|---|---|---|
| DF-01 | Payments: postal spending caps, premium short handles (Q56, Q60) | Payment processing, pricing, and legal terms are not decided | A payment provider and terms are approved |
| DF-02 | Authorized actions and macros (B14) | Code-as-authority is forbidden; needs confirmed, authorized actions | Contract 2 is live and a concrete action is specified |
| DF-03 | Ledger, agent, and blockchain integrations (B16) | Not a v1 dependency | A partner integration is specified on contract 2 |
| DF-04 | AWS GovCloud or another accredited host | No sponsor requirement | A sponsor requires IL4 or IL5 |
| DF-05 | Printed watermark or steganography add-on | Optional by Principle II | Print volume justifies it |
| DF-06 | SD-JWT role views | Option, not a commitment (`docs/SPEC.md` 10.4) | Contract 2 views need portable proofs |
| DF-07 | Per-tenant suggestion policy (Q40) | Off everywhere; client correction covers misreads | A tenant requests it and the threat review approves |
| DF-08 | Sign in with Apple on Android (Q67) | No native library | Store or user demand |
| DF-09 | Linking two providers to one account | Account merge risks | Support requests show need |
| DF-10 | Refresh-token reuse grace window | Security tradeoff (FR-021) | Measured false family revocations |
| DF-11 | Global cache purge through the zone API | 60-second bound accepted (Q26) | A record class needs faster revocation at the edge |
| DF-12 | zzThing app | Unspecified | Michael specifies it |
| DF-13 | Long founder history page | Out of scope (Q8) | Michael supplies text |
| DF-14 | Web camera capture | No dependable on-device browser reader | A qualified browser reader exists |
| DF-15 | Meanings for `#`, `$`, `/`, `:` | Reserved (Q49) | B10 or B14 needs them |
| DF-16 | Workers AI, Vectorize, Queues, Workflows, Hyperdrive | No demonstrated need (`CLOUDFLARE-RUNTIME.md`) | A bundle records a requirement |
| DF-17 | Operator admin API in place of SQL | No admin route in contract 1 | Operator workload or audit needs justify it, in contract 2 |

## Capability disposition

Every capability the repository describes or implies has one row. "Code" is the observed implementation state; "Release" is the assignment.

| Capability | Source | Code | Release |
|---|---|---|---|
| v1 text grammar, canonical form, failure reasons | SPEC 2.2a; spec 003 US3 | Implemented, vectors pass | v1.0 |
| Classifier, near-word confirm | G1, G1a; spec 003 FR-021 | Implemented | v1.0 (web), v1.1 (apps) |
| Field-code matching key | G10; FR-024 | Implemented | v1.0 |
| Running-text scanner | spec 004 Scanner rules | Implemented in zz-core | v1.1 |
| proto-v0 list, check word, issuer | spec 003 Prototype defaults | Implemented | v1.0 via the production list (RM-020) |
| Resolve with one not-found body, edge cache | spec 005 Resolve, FR-018, FR-019 | Implemented; cache unverified on Cloudflare | v1.0 |
| Mint, re-roll, handles, `.eth` names | US2, FR-032 | Implemented; re-roll scope defect | v1.0 (RM-032) |
| Record versions, signatures | US3 | Implemented; no client verification | v1.0; verification v2.0 |
| Owner revoke; operator SQL revoke, suspend, grant | US3, US7 | Implemented | v1.0 |
| Private records, viewer grants | FR-035 | Implemented server; no web UI | v1.3 |
| Single-use and expiring codes | FR-004 (002), mint body | Implemented server; no web UI | v1.3 |
| Audit read for auditors | FR-016 | Implemented server; no UI | v1.3 |
| Reports and moderation blocklist | FR-017, FR-024 | Implemented; production list content missing | v1.0 (RM-028) |
| Apple, Google, and developer sign-in; refresh rotation | FR-020 to FR-022 | Implemented; real providers unverified | v1.0 (RM-011, RM-017) |
| Account deletion with Apple revoke | FR-023 | Implemented; fan-out defect | v1.0 (RM-035) |
| Retention cron | FR-026 | Implemented; unbounded | v1.0 (RM-035) |
| Global rate limits | FR-011 | Implemented; IPv6 defect | v1.0 (RM-030) |
| Web client, typed lookup | US6 | Implemented | v1.0 |
| `free_public` scope | FR-005 | Implemented behind a flag | v1.2 |
| Retry photo upload and server read | US5, FR-013 | Server path implemented, disabled | v2.2 |
| On-device camera capture | spec 004 US1; B2 | zzThat; unqualified | v1.1 |
| Creation check | spec 004 FR-017 | zzThat | v1.1 |
| Voice entry | spec 004 US2 | None | R-VOICE |
| Native apps | B3 | zzThat | v1.1 |
| Production operations, recovery, observability | B4 | Partial staging evidence | v1.0 |
| Marketing site Worker migration | B4 | Staging parity partial | Optional, any release (D-2026-10-10-15) |
| Marketing site and demo | B5 | Live | v1.0 (continuing) |
| Production wordlist qualification | B6 | Not started | v1.0 gate (RM-020); R-B6 |
| Organizations, tenant isolation | Backend review H2 | Not designed | v2.0 (RM-080) |
| No-device field-code claim | Q25 | None | v2.0 |
| Per-scope dictionaries, list succession | FR-022 (003) | None | v2.0 |
| Partner machine API | Q19, B11 | None | v2.0 |
| Published signing keys | Q28 | None | v2.0 |
| Data export | DATA-LIFECYCLE | None | v2.0; manual runbook in v1.0 |
| Semantic profiles | B10, #81 | Branch-only spec | v2.1 |
| ZK selective disclosure | B15, #83 | Research branch | R-B15 |
| Bare, drawn, and object codes | Q48, Q50 | Parse only | R-B13 |
| Any-language codes | #35 | Rejected by grammar in v1 | R-I18N |
| AI photo-to-action, inventory assistant | SPEC 2.6 | Concept images only | R-AI |
| zzPage | D-2026-10-08-04 | None | R-ZZPAGE |
| Location layer | PR #127 | None | R-B17 |
| Field and enterprise workflows beyond the pilot | B7 | None | v1.3 then v2.0 |
| Postal and parcel | B8 | None | DF-01 for payments; rest QUEUED behind v2.0 |
| Macros, ledgers, watermarks, SD-JWT, GovCloud, suggestions | various | None | DF-02 to DF-07 |
