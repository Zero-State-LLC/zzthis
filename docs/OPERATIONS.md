# zzThis operations contract

Status: pre-production governance. No production deployment is authorized by this file.

## Service objectives

Until a production pilot is approved, zzThis has **no external availability SLO**. Staging and local environments are verification surfaces. A production SLO must be set from observed pilot traffic rather than invented now.

The production readiness review must set:
- availability measurement point and reporting window;
- latency/error SLOs for resolve, mint, auth, and owner writes;
- error-budget policy and freeze/escalation behavior.

## Recovery objectives

Before production, the operator must approve numeric RTO and RPO after the deployed Cloudflare topology and backup/export capabilities are verified. Until then:
- RTO: OPEN, production blocker.
- RPO: OPEN, production blocker.

No document may claim backup/recovery guarantees before a restore test demonstrates them.

## Backup and restore

Production runbook must cover D1, R2, Durable Object state, configuration, and signing/secret material.

Required evidence before production:
1. documented backup/export mechanism and cadence;
2. retention and encryption policy;
3. restore procedure into a non-production environment;
4. dated restore test with integrity checks;
5. owner for recurring restore tests;
6. key/secret recovery and rotation procedure that does not put secrets in the repo.

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
