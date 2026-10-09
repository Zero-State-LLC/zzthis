# Current decision status

Date: 2026-10-06
Authority: docs/SPEC.md Section 9 and 9a plus later accepted intents. This file is a convergence index, not a new decision source.

## Reading rule

Historical analysis files preserve what was open when they were written. They are not the current decision ledger. If an older active spec/plan says OPEN but this table says RESOLVED, update the active artifact to cite the canonical decision rather than reopening it.

## Resolved decisions with known stale copies

| ID | Current disposition | Canonical source |
|---|---|---|
| Q18 | v1 on-device recognition only; no cloud reader. Current refinement: fiducial-first capture and engine qualification in PR #89. | docs/SPEC.md; accepted 2026-10-06 recognizer intent |
| Q19 | No partner route in contract 1. v2 uses OAuth 2.0 client credentials, one client per partner. | docs/SPEC.md / spec 005 |
| Q28 | Ed25519 signing for contract 1; production key lifecycle remains a deploy gate. | docs/SPEC.md / spec 005 |
| Q29 | API/resolver implementation lives in this repo; shared grammar in packages/zz-core. | docs/SPEC.md; observed implementation |
| Q30 | Check word is (d1 + 2*d2) mod N over the versioned prime-size list. | docs/SPEC.md / spec 003 |
| Q32 | EFF long wordlist, English, CC BY 3.0 US with NOTICE credit. | docs/SPEC.md |
| Q33 | zzThat v1 is iOS and Android together; web client is in zzThis. | docs/SPEC.md |
| Q34 | Team-made governed private photo corpus; no faces/PII/location metadata; measurement-only absent training consent. | docs/SPEC.md |
| Q35 | proto-v0 skips shape/sound filters; production list adds confusable-shape and phonetic filtering validated empirically. | docs/SPEC.md / spec 003 |
| Q36 | Retired words are never reissued. | docs/SPEC.md |
| Q37 | 0.80 accept / below 0.50 retry are prototype parameters. ZZ-OCR-QUAL-001 may replace them from frozen tuning evidence. | docs/SPEC.md / PR #89 |
| Q38 | No voice in v1; future voice recognition stays on device. | docs/SPEC.md |
| Q39 | zzThat launch trigger is first public release on both app stores. | docs/SPEC.md |
| Q66-Q71 | Resolved/delegated for the one-shot build. | docs/SPEC.md / spec 005 |

## Genuinely open or evidence-gated

| Item | Owner/evidence | Blocking effect |
|---|---|---|
| B17 consumer location capability | Operator disposition; consumer journey and privacy decisions in `specs/006-location/spec.md` | No contract-1 schema change or implementation until release/scope and privacy decisions are accepted |
| OCR/fiducial release thresholds | ZZ-OCR-QUAL-001 tuning/final corpus | blocks camera Accept promotion, not typed entry |
| production wordlist human-confusion thresholds | governed human/OCR qualification before first production mint | blocks freezing production wordlist |
| product SLO, end-to-end RPO, RTO | deployment topology plus restore/incident drills (#86) | blocks production authorization |
| six high npm audit findings | clean Node 24 npm audit JSON plus dependency-path reachability (#92) | blocks dependency-security disposition |
| contract-2 Scope/Namespace model | #87 | blocks promotion of #81 semantic-profile work |
| ZK proof-system promotion | #87/#81 plus S1 negative vectors and trust/lifecycle decisions | #83 remains CANON-SHADOW |
| Michael-supplied website assets/copy | exact supplied source | blocks only those content deltas |
| production OAuth/secrets/domain/deploy approvals | operator/human gates | blocks production deploy, not local/staging implementation |

## Closed by dependent PR

- #90 closes when website reconciliation PR #91 merges.
- zzThat recognition convergence waits for zzThis #89 merge, then exact pin advance and #44 reconciliation.

## Hygiene rule

A new OPEN item must name owner, safe default if one exists, evidence needed, blocking artifact, and canonical decision location. Do not add bare TODO/TBD/OPEN prose to active specs.
