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

Staging evidence: on 2026-10-07, `zzthis-staging` was restored in place to a D1 Time Travel bookmark taken immediately before a disposable marker was created. The marker was absent after restore, core application tables were present, and the staging API discovery endpoint passed its contract check. This is a D1-only staging drill, not a production recovery objective or an end-to-end restore test.

## Backup and restore

Production runbook must cover D1, R2, Durable Object state, configuration, and signing/secret material.

The `ZZ_LIMITER` Durable Object is non-authoritative: it stores only the current rate-limit window and clears it when that window ends. Its recovery posture is to resume or recreate the limiter namespace; lost limiter state can only reset a transient rate-limit window. It does not recover or replace D1, R2, configuration, or secret material.

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
