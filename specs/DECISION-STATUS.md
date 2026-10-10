# Current decision status

Date: 2026-10-06, updated 2026-10-10 by the [architecture review](analysis-2026-10-10-architecture-review.md)
Authority: docs/SPEC.md Section 9 and 9a plus later accepted intents. This file is a convergence index, not a new decision source.

## Reading rule

Historical analysis files preserve what was open when they were written. They are not the current decision ledger. If an older active spec/plan says OPEN but this table says RESOLVED, update the active artifact to cite the canonical decision rather than reopening it.

A source marked "draft PR" is not on `main`. It informs planning but is not yet authority.

## Resolved decisions with known stale copies

| ID | Current disposition | Canonical source |
|---|---|---|
| Q18 | v1 on-device recognition only; no cloud reader. Refinement in review: an engine-neutral RecognitionResult boundary and engine qualification (ZZ-OCR-QUAL-001). | docs/SPEC.md; recognizer-qualification intent and spec in draft PR [#89](https://github.com/Zero-State-LLC/zzthis/pull/89) |
| Q19 | No partner route in contract 1. v2 uses OAuth 2.0 client credentials, one client per partner. | docs/SPEC.md / spec 005 |
| Q28 | Ed25519 signing for contract 1; production key lifecycle remains a deploy gate. | docs/SPEC.md / spec 005 |
| Q29 | API/resolver implementation lives in this repo; shared grammar in packages/zz-core. | docs/SPEC.md; observed implementation |
| Q30 | Check word is (d1 + 2*d2) mod N over the versioned prime-size list. | docs/SPEC.md / spec 003 |
| Q32 | EFF long wordlist, English, CC BY 3.0 US with NOTICE credit. | docs/SPEC.md |
| Q33 | zzThat v1 is iOS and Android together; web client is in zzThis. | docs/SPEC.md |
| Q34 | Team-made governed private photo corpus; no faces/PII/location metadata; measurement-only absent training consent. | docs/SPEC.md |
| Q35 | proto-v0 skips shape/sound filters; production list adds confusable-shape and phonetic filtering validated empirically. | docs/SPEC.md / spec 003 |
| Q36 | Retired words are never reissued. | docs/SPEC.md |
| Q37 | 0.80 accept / below 0.50 retry are prototype parameters. ZZ-OCR-QUAL-001 may replace them from frozen tuning evidence; without a PASS receipt a platform ships confirm-only (D-2026-10-10-03). | docs/SPEC.md; draft PR #89; decisions-2026-10-10 |
| Q38 | No voice in v1; future voice recognition stays on device. | docs/SPEC.md |
| Q39 | zzThat launch trigger is first public release on both app stores. | docs/SPEC.md |
| Q66-Q71 | Resolved/delegated for the one-shot build. | docs/SPEC.md / spec 005 |

## Decisions recorded 2026-10-10

Full records: [decisions-2026-10-10.md](decisions-2026-10-10.md). Rows in docs/SPEC.md Section 9a.

| ID | Subject | Status | Owner of any pending yes |
|---|---|---|---|
| D-2026-10-10-01 | Release version convention | ADOPTED | - |
| D-2026-10-10-02 | v1.0 web launch, then v1.1 native and camera | ADOPTED (sequencing) | Danny for each production event |
| D-2026-10-10-03 | Confirm-only camera without a PASS receipt | ADOPTED | - |
| D-2026-10-10-04 | Production wordlist path; keep 2+check format with a density trigger | PROPOSED | Michael (format), Danny (freeze, risk) |
| D-2026-10-10-05 | IPv6 /64 limits, zone rule, growth monitor | ASSIMILATED | Danny for the zone rule |
| D-2026-10-10-06 | One organization per scope until contract 2 | ADOPTED rule; model PROPOSED | Danny |
| D-2026-10-10-07 | Access-protected staging host with writes on | PROPOSED | Danny (DNS, Access) |
| D-2026-10-10-08 | Production config and reviewer-gated workflow | PROPOSED | Danny |
| D-2026-10-10-09 | Production on Workers Paid | PROPOSED | Danny (spend) |
| D-2026-10-10-10 | Recovery scope; proposed RPO 5 min, RTO 4 h | PROPOSED | Danny |
| D-2026-10-10-11 | Observability and alerting baseline | ADOPTED design | Danny for contacts |
| D-2026-10-10-12 | Contract 1 frozen through v1.1; tolerant-reader rule | PROPOSED amendment | Danny |
| D-2026-10-10-13 | Security CI: allowlist the verified false positive | ADOPTED | - |
| D-2026-10-10-14 | Dependency advisories are build-only | ADOPTED | - |
| D-2026-10-10-15 | Site stays on Pages for v1.0 | PROPOSED | Danny |
| D-2026-10-10-16 | Privacy policy and DSR runbook for v1.0 | ASSIMILATED | Danny (legal) |
| D-2026-10-10-17 | zzPage is research | ADOPTED | - |
| D-2026-10-10-18 | Location (PR #127) is research | ADOPTED | - |
| D-2026-10-10-19 | Backend defects enter v1.0 | ASSIMILATED | - |
| D-2026-10-10-20 | Tests become a required check | PROPOSED | Danny |
| D-2026-10-10-22 | One organization per scope now; org-bound grants before v1.3 | ADOPTED; built in PR #146 | - |
| D-2026-10-10-24 | Follow-ups from the org-bound grants build | ACCEPTED (Danny, 2026-10-09 PT); RM-098 to RM-100 | - |
| D-2026-10-10-25 | App Store and Google Play compliance gaps for v1.1 | ACCEPTED (Danny, chat 2026-10-09 23:21 PT); RM-101 to RM-112; RM-112 needs Danny's yes on the D-2026-10-10-12 exception | - |

## Genuinely open or evidence-gated

| Item | Owner/evidence | Blocking effect |
|---|---|---|
| OCR/fiducial release thresholds | ZZ-OCR-QUAL-001 tuning/final corpus (draft PR #89, harness draft PR #115) | blocks camera Accept promotion, not typed entry |
| production wordlist human-confusion thresholds | R-B6 on the Q34 corpus; fallback in D-2026-10-10-04 | blocks freezing the production wordlist unless Danny records risk acceptance |
| product SLO, end-to-end RPO, RTO | proposed values in D-2026-10-10-10; drill RM-024 (#86) | blocks production authorization |
| contract-2 Scope/Namespace/Organization model | #87 plus D-2026-10-10-06 | blocks promotion of #81 semantic-profile work and multi-organization pilots |
| ZK proof-system promotion | #87/#81 plus S1 negative vectors and trust/lifecycle decisions | #83 remains CANON-SHADOW |
| audit retention and minimization | Danny, at 1 GB or 6 months after launch (D-2026-10-10-10) | none before then |
| Michael-supplied website assets/copy | exact supplied source (spec 001 T053; Q72 and Q73 resolved, D-2026-10-07-03) | blocks only those content deltas |
| production OAuth/secrets/domain/deploy approvals | operator/human gates (BACKLOG RM-011, RM-042, RM-050, RM-051) | blocks production deploy, not local/staging implementation |

Resolved since 2026-10-06: the six high npm audit findings (#92) are dispositioned as build-only (D-2026-10-10-14); upgrades remain a hygiene item (RM-004).

## Closed by dependent PR

- #90 closes when website reconciliation draft PR #91 merges.
- zzThat recognition convergence waits for zzThis draft PR #89 to merge, then exact pin advance and zzThat #44 reconciliation.

## Hygiene rule

A new OPEN item must name owner, safe default if one exists, evidence needed, blocking artifact, and canonical decision location. Do not add bare TODO/TBD/OPEN prose to active specs.
