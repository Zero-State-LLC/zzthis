# zzThis operations contract

Evidence classification: **OBSERVED** for statements describing current repository code/tests; **INFERRED** for governance, production gates, or design choices accepted by the convergence intent; **SPECULATIVE** only where explicitly marked as future research.

Status: pre-production governance. No production deployment is authorized by this file.

## Service objectives

Until a production pilot is approved, zzThis has **no external availability SLO**. Staging and local environments are verification surfaces. A production SLO must be set from observed pilot traffic rather than invented now.

The production readiness review must set:
- availability measurement point and reporting window;
- latency/error SLOs for resolve, mint, auth, and owner writes;
- error-budget policy and freeze/escalation behavior.

## Recovery objectives

Before production, the operator must approve numeric RTO and RPO after the deployed Cloudflare topology and backup/export capabilities are verified. The recovery mechanism is now evidence-backed: production D1 supports always-on Time Travel with minute-level point-in-time restore and a 30-day window on Workers Paid; longer retention can use D1 export to R2. This establishes a candidate **RPO capability of one minute for D1 state**, subject to a restore drill and confirmation that every authoritative state store is covered. It does not establish end-to-end product RPO for R2/DO/secrets.

Until measured:
- RTO: OPEN, production blocker; measure from incident declaration through validated service restoration.
- Product RPO: OPEN, production blocker; D1 supports minute-level restore points, but the product objective must cover every authoritative store.

No document may claim an end-to-end backup/recovery guarantee before a restore test demonstrates it. Cloudflare platform capability is evidence for the mechanism, not evidence for zzThis recovery time.

Staging evidence: on 2026-10-07, `zzthis-staging` was restored in place to a D1 Time Travel bookmark taken immediately before a disposable marker was created. A repeated controlled drill confirmed all application-table counts were zero before and after. The restore request returned in 1.287 seconds and the first verification query completed 0.448 seconds later (1.735 seconds request-to-verified-query); the probe table was absent after restore. This is a measured staging D1 restore interval, not an incident-to-service RTO, production recovery objective, or product RPO.

## Backup and restore

Production runbook must cover D1, R2, Durable Object state, configuration, and signing/secret material.

The `ZZ_LIMITER` Durable Object is non-authoritative: it stores only the current rate-limit window and clears it by alarm one window length after that window ends, leaving a safety margin against request/runtime clock skew. Its recovery posture is to resume or recreate the limiter namespace; lost limiter state can only reset a transient rate-limit window. It does not recover or replace D1, R2, configuration, or secret material.

Required evidence before production:
1. documented backup/export mechanism and cadence;
2. retention and encryption policy;
3. restore procedure into a non-production environment; the D1 staging path was exercised on 2026-10-07;
4. dated restore test with integrity checks; D1-only staging evidence exists, while R2/DO/configuration/secret recovery remains open;
5. owner for recurring restore tests;
6. key/secret recovery and rotation procedure that does not put secrets in the repo.


## Canonical Cloudflare substrate

Runtime topology is governed by `specs/CLOUDFLARE-RUNTIME.md`. GitHub is source/PR/CI; Cloudflare is the v1 runtime. Production inventory must record the Worker, static-asset deployments, D1 database, R2 buckets actually authorized by the data-lifecycle spec, Durable Object namespaces/classes, Cron triggers, domains/routes, secret names (never values), and environment ownership.

Environments are local, staging, and production. Staging/preview must use isolated stateful resources where sharing could expose or mutate production data. A preview may not inherit production D1/R2/secrets merely for convenience.

A Worker rollback is code/config rollback only. D1/R2/DO recovery follows the data recovery procedure. D1 Time Travel provides minute-granularity restore points on supported production storage; the product RTO/RPO remain measured gates.

## Incident management

Minimum incident classes:
- P0: confirmed security/privacy breach or widespread incorrect disclosure;
- P1: resolver/auth unavailable or material data integrity failure;
- P2: partial degradation, provider outage, delayed cleanup/revocation;
- P3: non-urgent defect/operational debt.

The operator owns declaration and closure. Every P0/P1 needs a preserved timeline, affected data/services, containment, recovery evidence, and follow-up actions.

## Observability

Production logging must be purpose-limited and redact:
- raw bearer/refresh tokens;
- provider ID tokens;
- raw zz codes, unconditionally, per spec 005 FR-027;
- record body/title content;
- uploaded images;
- secrets/keys;
- profile PII.

Required operational signals:
- route class, status, latency bucket;
- auth/provider failure class;
- rate-limit events;
- cache hit/miss/purge failure;
- cron cleanup/pending-revocation result;
- D1/R2/DO error class;
- signing/integrity failures;
- deployment/version identifier.

No analytics or telemetry beyond operational necessity is implied.

## Provider outage behavior

Apple/Google outage must fail closed for new token exchange while existing valid sessions follow their stated lifetime. Cloudflare subsystem degradation must not widen authorization or bypass not-found/non-enumerability behavior.

## Key and secret lifecycle

Before production define owner, storage system, rotation cadence, emergency revoke/replace procedure, key identifiers, and verification overlap. Compromise response must include invalidation scope and evidence that old material is no longer accepted.

## Capacity and spend

Production approval must define budget guardrails, storage-growth monitoring, rate-limit saturation signals, and alert thresholds. Spend remains human-gated.

## Production gate

Production authorization requires: numeric SLO posture, RTO/RPO, successful restore test, incident contacts/runbook, observability/redaction review, secret/key lifecycle, data-lifecycle review, security threat-model review, and Danny's explicit deploy approval.

## Recovery scope and proposed objectives (2026-10-10)

Recorded in [D-2026-10-10-10](../specs/decisions-2026-10-10.md). Status: PROPOSED until Danny accepts the numbers.

- **Authoritative state for v1.0.** D1 plus four secrets: `ZZ_TOKEN_SECRET`, `ZZ_DATA_KEY`, `ZZ_RECORD_SIGNING_KEY` (with its key id), and `APPLE_PRIVATE_KEY`. Configuration is in git.
- **Out of the RPO scope while `ZZ_PHOTO_READS` is false.** R2 holds no application object, and the limiter Durable Object is non-authoritative. The production configuration test (BACKLOG RM-001) fails if photo reads are turned on, so R2 cannot silently join the scope.
- **Secret escrow.** The operator keeps each secret in an escrow outside Cloudflare and outside this repository, names the location in a private runbook, and rehearses restore into a scratch Worker (RM-022).
- **Deletion replay.** A Time Travel restore undoes account deletions made after the restore point. Before restoring, list accounts deleted after the target from the audit log; after restoring, re-run deletion for each (RM-023).
- **Migration bookmark.** Every production migration prints a D1 bookmark first (RM-002).
- **Proposed objectives.** RPO 5 minutes for D1; RTO 4 hours from incident declaration to verified service. These are conservative defaults from minute-granular Time Travel and the 1.735-second staging restore, not measured service results. They count only after the seeded drill (RM-024) meets them.
- **Service objective.** Proposed: no public SLO for v1.0; track 30-day resolve success from Cloudflare Worker metrics and review it weekly during the first pilot (RM-043).
- **Plan.** Production runs on Workers Paid for the 30-day recovery window and invocation limits (D-2026-10-10-09).
- **Alerting.** A scheduled GitHub Actions probe of `GET /v1` and one synthetic public code files an issue on failure (D-2026-10-10-11, RM-040). Invocation logs stay off, pinned in configuration.
- **Kill switches.** `ZZ_MINT_ENABLED=false` stops new codes; a zone rule can block `/v1/resolve/*`; Worker rollback to a recorded version (RM-025).

## Production readiness packet (2026-10-07)

**Decision: NO-GO for production.** Staging evidence does not authorize production resources, routes, DNS, or deployment.

| Gate | Evidence/status |
|---|---|
| Service objectives | No production SLO is set; define it from an approved pilot. |
| Recovery objectives | Product RTO/RPO remain open. Staging D1 restore passed; end-to-end D1/R2/DO/configuration/secret recovery is not proven. |
| API and limiter | Contract discovery returned 200; bounded discovery limit check returned 60 × 200 then 429. Other route limits and broader API behavior remain to be verified. |
| Retention/retry schedule | Staging API Cron Trigger `17 3 * * *` UTC ran at 2026-10-07 03:17:58 UTC; its count-only report showed zero work and zero logged errors. This verifies one scheduled execution, not nonzero cleanup behavior. Production schedule remains human-gated. |
| R2 data lifecycle | Staging API is bound to the private `zzthis-photos-staging` bucket; public r2.dev and custom domains are disabled, no CORS policy exists, and `ZZ_PHOTO_READS=false`. The enabled 30-day `reads/` expiration rule is configured. A controlled non-sensitive 93-byte probe, `reads/b4-lifecycle-probe-20261007T050522Z.txt`, was uploaded and verified present on 2026-10-07 05:05:32 UTC. Observe after 2026-11-06 05:05 UTC plus Cloudflare lifecycle processing; deletion is not yet verified. |
| Durable Object recovery | Limiter is non-authoritative; no namespace recovery drill is recorded. |
| Site parity and rollback | Six required routes and 137 local assets passed earlier HTTP checks; titles/H1s match and CSS/JS assets match after base-path normalization; staging Worker-version rollback passed. Clef judged paired 390×844 screenshots equivalent on all six currently served routes (confidence 0.840–0.913); a bounded Browser Run initial-load inventory found no external origins on either host. These checks predate the accepted PR #91 baseline and are not a complete interactive request trace. Staging now sends Pages-matching HSTS (`max-age=31556952`) on all six required routes, confirmed on Worker version `dd1abc3c-0052-4170-baff-91a5f25d04ce` (workflow 37585374449). `/robots.txt` remains Cloudflare-generated on the staging workers.dev host (200) vs Pages 404; `/sitemap-index.xml` is 404 on both. Other checked security headers are absent on both. Final-baseline staging deployment/recheck, full interaction/network review, and final acceptance remain open. |
| Observability and privacy | Staging invocation logs are disabled while persisted application logs remain enabled. Production redaction/retention/alerting review is open. |
| Secret/key lifecycle | Staging token-secret replacement passed with no staged accounts/sessions and API readiness remained 200. Production ownership, cadence, recovery, and emergency rotation procedure remain open. |
| Incident readiness | Contacts, escalation path, and measured incident restoration exercise remain open. |
| Security/data approval | Threat-model and data-lifecycle reviews remain open; no production deploy approval is recorded. |

Close each open gate with dated evidence and the accountable operator before reconsidering production. Do not infer approval from completion of staging drills.

The ordered work that closes these gates is the v1.0 section of [specs/BACKLOG.md](../specs/BACKLOG.md); the release gates G1 to G12 are in [specs/RELEASE-ROADMAP.md](../specs/RELEASE-ROADMAP.md). As of 2026-10-10 the staging API cannot exercise any write path (mint, developer sign-in, and providers are off) and the Cache API has no effect on its workers.dev host, so the packet above has no write-path or cache evidence (D-2026-10-10-07).
