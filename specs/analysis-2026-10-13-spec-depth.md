# Spec-depth audit, 2026-10-13

Question: from the current tip, are the specs deep enough to build each release without guessing, upstream (zzThis) and downstream (zzThat)? Audited at zzThis `main` 8873ce1 (after #161 and #162) and zzThat `main` ae21fcd (after #62 and #63), including open PRs (zzThis #164, #167; zzThat #64, #65, #72) and Danny's issues zzThat #66 to #71. Four read-only passes: v1.0 release path, v1.1 product, cross-document consistency, and zzThat per version.

**Answer: not yet.** v1.0 has executable gaps in staging, the production wordlist, and operator deletion. v1.1 has three open product mechanisms (idle expiry and revive, word count and re-rolls, terms and 18+) that need decisions. v1.2 and later are fine as QUEUED. This pull request fixes everything that is fact at the tip, and records every gap that needs a human as a PROPOSED decision in [decisions-2026-10-13.md](decisions-2026-10-13.md) with a recommendation.

## Verdict by version

| Version | zzThis (upstream) | zzThat (downstream) |
|---|---|---|
| v1.0 web launch | **Gaps.** 8 blockers, about 20 majors (below). | Complete: no app-side outcome. |
| v1.1 apps and camera | **Gaps.** 3 blockers needing decisions; the rest fixed here or proposed. | **Gaps.** Confirm-only capture, RM-066, retry reasons, D-15, terms and 18+, RM-125 (zzThat PR follows this one). |
| v1.2 public community codes | Fine (QUEUED, or empty if D-2026-10-10-21 is confirmed). | Fine: FR-018 covers the flag either way. |
| v1.3 enterprise pilot | Prerequisites RM-073, RM-074, RM-098 to RM-100 are Done; RM-088 and RM-078 QUEUED. RM-114 should reuse D-2026-10-13-01. | Fine: web-only issuer and auditor views. |
| v2.0 and later | QUEUED. Prerequisites: zzThat #54 before any contract 2 enum, RM-087, RM-116, RM-117 consent. | QUEUED. Note: FR-005 must change before RM-117 training use. |

## v1.0: what blocks a build

| Sev | Item | Gap | Where it is answered |
|---|---|---|---|
| blocker | RM-013, RM-014 | Staging keeps `ZZ_FREE_PUBLIC` false, but the web client only mints `free_public`, so the end-to-end create flow cannot pass. | D-2026-10-13-06 |
| blocker | RM-012, RM-013 | Staging workers.dev and preview URLs are on, so developer sign-in plus mint there opens public minting. | D-2026-10-13-06 |
| blocker | RM-013 | The reset cannot delete audit rows: triggers block it. | D-2026-10-13-06 |
| blocker | RM-020 | No confusable table, collision rule, survivor rule, filter order, or package choice. | D-2026-10-13-07 (Michael approves the letter groups) |
| blocker | RM-020, RM-028 | The private blocklist breaks the public byte-for-byte rebuild, and a report naming removed words would publish blocklist hits. | D-2026-10-13-07 |
| blocker | RM-023, RM-027 | No operator SQL deletes an account; a restore drops later `pending_revocations`. | D-2026-10-13-08 |
| blocker | RM-027 | No email is stored, so an emailed request cannot be matched to an account. | D-2026-10-13-08 |
| blocker | all B4 code | The only accepted intent covers documents. D-2026-10-10-07 to -10 and -20 are PROPOSED. | Danny accepts them and an implementation intent |
| major | RM-001 | Production accepts `proto-v0`, so a first mint would freeze the unfiltered list. | D-2026-10-13-07 |
| major | RM-001, RM-002 | Config keys, test file, PR trigger, bookmark command, and rollback job are unnamed. | Proposed text below |
| major | RM-011, RM-012, RM-014 to RM-017, RM-022 to RM-026, RM-029, RM-040, RM-041, RM-050, RM-052, RM-054 | Hosts, scripts, secret names, evidence locations, and owners are unnamed (details in the v1.0 pass). | Proposed text below; numbers Danny sets |

Proposed text for the v1.0 majors that need no decision (to apply to BACKLOG when Danny accepts D-2026-10-10-08):

- **RM-001.** Commit `ZZ_MINT_ENABLED = "true"`, `ZZ_FREE_PUBLIC = "false"`, `workers_dev = false`, `preview_urls = false`, a custom-domain route for `zz.zer0state.com`, `[observability] enabled = true`, and `[observability.logs] invocation_logs = false`. Resource ids use the zero-UUID placeholder. The guard test is `tests/wrangler-production.test.ts` and also fails when `ZZ_FREE_PUBLIC` is true or `workers_dev` is not false.
- **RM-002.** A pull request runs a dry run only, with no environment. The deploy job fails while the placeholder id is present. Before migrations it records `wrangler d1 time-travel info zzthis --json`. A separate dispatch input runs `wrangler rollback <version>`.
- **RM-015.** `workers/api/scripts/smoke.mjs` uses developer sign-in and grants an auditor through `ops/grant.sql` before `/v1/audit`. The `DELETE /v1/me` limit row stays a unit test, because a deleted account gets 401 before the limiter.
- **RM-016.** Read the cache result with `wrangler tail --format json`, matched on `X-Request-Id`; record the `cf-ray` colo; if both vantage points hit one colo, record "not observed".
- **RM-054.** The release packet is `docs/releases/v1.0.md`, one row per gate with a dated link.
- **G1.** The required check is named `security scan`, not `security`.

## v1.1: what blocks a build

| Sev | Item | Gap | Where it is answered |
|---|---|---|---|
| blocker | D-2026-10-11-15 | No "last active", expiry step, revive path, or cache rule. | D-2026-10-13-01 |
| blocker | RM-125 | 1-word and 3-word codes are `wrong-length` everywhere; mint has no length field; the schema caps re-rolls at 3; contract 1 is frozen. | D-2026-10-13-02 |
| blocker | RM-125 | The 1-word space is too small to issue safely. | D-2026-10-13-02 |
| major | RM-072, D-21 item 7 | No cap numbers, window, or shutoff triggers. | D-2026-10-13-03 |
| major | RM-103, RM-120, RM-124 | No statement of server requirements, no source for the terms version, no copy keys. | D-2026-10-13-04 |
| major | RM-065 | Confirm-only mode is not defined in spec 004. | D-2026-10-13-05 |
| major | RM-075 | The enum half fails on both apps; it must gate the first store build. | D-2026-10-13-09 |
| major | D-2026-10-10-23 | The five retry reasons had no copy keys. | **Fixed here:** `scan.retry_marker_cut`, `scan.retry_blur`, `scan.retry_glare`, `scan.retry_closer`, `scan.retry_angle` |
| major | D-2026-10-10-21 | Header PROPOSED, text says adopted on merge, merged in #139. | Danny confirms |
| major | RM-118 to RM-126 (#164) | Table rows only: no Scope, Acceptance, or Governing sections. | Add when #164 merges, taking acceptance from D-2026-10-13-01 to -04 |
| minor | #161 | Rotating `ZZ_DATA_KEY` changes every `creator`, so device blocks lapse. | OPERATIONS records it; do not rotate in v1.x except after a compromise |

Adequate for v1.1: RM-062, RM-066, RM-067, RM-069 to RM-071, RM-096, RM-101, RM-102, RM-104 to RM-108, RM-111, RM-112, RM-115, RM-118, RM-119, RM-121 to RM-123, RM-126.

## Fixed in this pull request (fact at the tip, no decision)

- DECISION-STATUS: rows for D-2026-10-10-21 (status question) and -23; the 2026-10-11 table placed under its own heading.
- `docs/SPEC.md` 9a row for D-2026-10-11-01; stale draft notes removed; Q25 points at RM-116.
- RELEASE-ROADMAP: the v1.1 contract note now names the merged RM-112 field; v1.3 prerequisites marked Done; capability rows for hide, block, creator, moderation queue, picker, Saved, renew, and claim; `security` green.
- BACKLOG: RM-112 Done (#161), RM-077 Done (#157), RM-111 Ready, RM-115 cleared by its own Account action, and the v2.0 table renders as one table.
- Spec 005: FR-024 says how matching normalizes, FR-025 carries the one-day review target, and the abuse paragraph names the creator block.
- TRACEABILITY journeys J18 to J21 and the org and moderation tests; DOMAIN-MODEL grant rules after RM-098 and RM-099; THREAT-MODEL rows for public text abuse and the creator reference; DATA-LIFECYCLE rows for device lists and `org_id`; CONTRACT-EVOLUTION records the accepted RM-112 exception.
- `design/copy.json` and `design/UX.md`: the retry reason keys.

## Downstream (zzThat) follow-up

A zzThat pull request follows this one, per version:

- **v1.1:**
  - FR-025 gains confirm-only (D-2026-10-10-03, D-2026-10-13-05).
  - New tasks for RM-066 (pin the v1.0 release commit and bundle the production list), the retry reasons, and D-15 (per D-2026-10-13-01), and terms with 18+ (per D-2026-10-13-04).
  - An out-of-scope note for word count until D-2026-10-13-02.
  - T096 wording after #161.
  - The support contact line.
- **v1.3:** RM-114 reuses the D-2026-10-13-01 mechanism.
- **v2.0:** #54 is fixed before any contract 2 enum.

## Questions only Danny or Michael can answer

Each has a recommendation in the record it names.

1. Danny: confirm D-2026-10-10-21 (public create at v1.1).
2. Danny: D-2026-10-13-01. Activity is the owner's sign-in or refresh; `free_public` only; automatic revive; no warning.
3. Danny and Michael: D-2026-10-13-02. No 1-word codes; 3 words at v2.0 unless needed at launch; 5 re-rolls now.
4. Danny: D-2026-10-13-03 cap and shutoff numbers.
5. Danny and Michael: D-2026-10-13-04 client-only terms and 18+ in one step before the first create.
6. Danny: D-2026-10-13-05 confirm-only camera in v1.1.
7. Danny: D-2026-10-13-06 staging host, Access, and flags.
8. Michael and Danny: D-2026-10-13-07 letter groups, number words, `prod-v1`, and the freeze.
9. Danny (legal): D-2026-10-13-08 operator deletion and the access-request identity check.
10. Danny: D-2026-10-13-09 enum tolerance as a store-build gate.
11. Danny: accept D-2026-10-10-07 to -10 and -20, and an implementation intent for the B4 code items.
