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

## Staging reset

D-2026-10-13-06 (RM-013). Before a staging run (RM-014, RM-015), empty the staging database by hand from `workers/api`:

```sh
npx wrangler d1 execute zzthis-staging --remote --config wrangler.staging.toml --file scripts/staging-reset.sql
```

`scripts/staging-reset.sql` drops the two `audit_events` triggers, deletes every application table, and creates the triggers again as `migrations/0001_init.sql` defines them. It runs only against `zzthis-staging`, never production. No workflow runs it. Limiter windows are not reset, so run RM-014 before RM-015.

Staging sets `ZZ_FREE_PUBLIC = "true"`, `workers_dev = false`, and `preview_urls = false` (`wrangler.staging.toml`). It answers only on the Access-protected `zz-staging.zer0state.com`, which Danny creates with its Access policy. Until then, a staging deploy is not reachable.


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

## Moderation

Required before `ZZ_FREE_PUBLIC` turns on (D-2026-10-10-25 item 2, RM-102; Apple App Review Guideline 1.2, Google Play user-generated content policy). Spec 005 records the target: every report is triaged within one day (24 hours), and a confirmed abusive code is revoked and its owner suspended within that window.

| Role | Who |
|---|---|
| Moderator | Danny (D-2026-10-11-08 answer 17) |
| Backup moderator | Michael (D-2026-10-11-08 answer 17) |

Each day, and whenever a report arrives during a launch:

1. Run `ops/report-overdue.sql`. The target is zero rows. A row is a missed target: handle it first.
2. Run `ops/report-queue.sql`. It lists every open report oldest first, with its age, the overdue flag, how many open reports name the same code, the code's status, its owner, and whether the owner is already suspended. Both files are read only.
3. Decide each report:
   - Not abusive: close it with `ops/reports.sql`.
   - One abusive code: revoke it with `ops/revoke-code.sql`, then close the report.
   - An abusive creator (several reported codes, or a single severe one): suspend the owner with `ops/suspend.sql`, which revokes all of their active codes and refuses their writes (FR-025), then close the report. `ops/unsuspend.sql` lifts a suspension on appeal; revoked codes stay revoked.
   - A report of a code that was never issued has no code or owner: close it.
4. Every action writes its own audit row (`code.revoke`, `account.suspend`, `account.unsuspend`, `report.close`), so no separate log is kept. A cached resolve of a revoked code can last 60 seconds (FR-018).

Escalation: when the queue cannot be kept within one day, or a wave of abuse arrives faster than it can be handled, turn create off for everyone by setting `ZZ_FREE_PUBLIC` to `false` (spec 005 FR-005). That is a production config change, so it needs Danny's yes (AGENTS.md), and it is the first thing to ask for. Turn it back on when the queue is clear.

Shutoff triggers (D-2026-10-13-03, ACCEPTED by Danny 2026-10-14, [#170](https://github.com/Zero-State-LLC/zzthis/issues/170#issuecomment-6175348667)). Ask Danny to turn public create off when any one of these is true:

| Trigger | How it is seen |
|---|---|
| Any report has been open more than 48 hours | `ops/report-overdue.sql` lists it, with its age |
| More than 2,000 `free_public` codes are drawn in one UTC day | a count of `code.mint` and `code.reroll` audit events with result `ok` on `free_public` codes since 00:00 UTC (INFERRED query; the audit log is the only per-day record) |
| The month's Cloudflare usage alert passes $50 | the usage notification set under RM-042 |

Target: 30 minutes from Danny's decision to stop to new `free_public` mints refused. `ZZ_FREE_PUBLIC` is a Wrangler var, so shutoff is a production redeploy with the flag `false` through the RM-002 workflow. Existing codes keep resolving. Rehearse the redeploy on staging, time it, and record the measured time here and in the release packet before the flag turns on (RM-076). If the measured redeploy misses 30 minutes, the named upgrade is a runtime flag read from KV or D1 with a short cache (D-2026-10-10-21 item 7). _Not yet rehearsed._

Before launch: rehearse steps 1 to 3 once on staging with a seeded report, and record the date here. _Not yet rehearsed._

## Account deletion and access requests

D-2026-10-13-08 (ACCEPTED by Danny, 2026-10-14, [#170](https://github.com/Zero-State-LLC/zzthis/issues/170#issuecomment-6175348667)); BACKLOG RM-023 and RM-027. zzThis stores no email or name, so an emailed request cannot be matched to an account by itself.

1. Identity check: the person signs in and quotes the account id shown on `/account/` (copy key `account.id`; the label is pending Michael's review). Act only on that id. The `/account/` change is separate work; until it ships, ask the person to delete the account themselves, in the app or on `/account/`.
2. Deletion: run `ops/delete-account.sql` with that id (its header gives the command). It writes the FR-023 step 2 batch that `DELETE /v1/me` writes and one `account.delete` audit event with no actor. Each stored Apple token is copied into `pending_revocations` (attempts 0, due now), and the next daily run revokes it. The words of the account's codes are never issued again. SQL cannot delete the photo objects or purge the edge cache: the 30-day `reads/` lifecycle rule removes the objects, and a cached resolve lasts at most 60 seconds (FR-018). An unknown or already deleted account is left alone.
3. Access request: answer with that account's rows from `accounts`, `codes`, `records`, and the current version of each record, as JSON. Do not include other accounts' rows or audit rows that name other accounts.

   ```sh
   npx wrangler d1 execute ZZ_DB --remote --json --command="$(sed 's/:account_id/ACCOUNT_ID/g' <<'SQL'
   SELECT * FROM accounts WHERE id = ':account_id';
   SELECT * FROM codes WHERE owner_id = ':account_id' ORDER BY created_at;
   SELECT * FROM records WHERE owner_id = ':account_id' ORDER BY created_at;
   SELECT v.* FROM record_versions v JOIN records r ON r.current_version_id = v.id WHERE r.owner_id = ':account_id' ORDER BY v.created_at;
   SQL
   )"
   ```

Before a D1 restore (Time Travel or an import), export the `audit_events` and `pending_revocations` rows written after the target time (`created_at` later than it) with `--json`, and insert them again after the restore. A restore that goes back past an `account.delete` event brings that account back: run `ops/delete-account.sql` again for each such account, so an erased account stays erased and its Apple token is still revoked.

The privacy policy names this method (RM-026, RM-123).

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

`ZZ_DATA_KEY` rotation (RM-021): set the old key as `ZZ_DATA_KEY_PREVIOUS` and the new key as `ZZ_DATA_KEY`, then deploy. New sealed Apple tokens name the new key. Keep `ZZ_DATA_KEY_PREVIOUS` set until no row still uses the old key id: `SELECT count(*) FROM identities WHERE apple_refresh_token_enc IS NOT NULL AND apple_refresh_token_enc NOT LIKE 'k1.<new id>.%'` and the same for `pending_revocations.token_enc` both return 0, or 30 days pass and the pending rows expire. HMAC tags are not migrated: rotation resets rate-limit windows and old not-found and nonce audit targets stop matching new ones. It also changes every Resolve `creator` value (RM-112), so creators that people blocked in the apps show again until they block them again; rotate only when the key is at risk.

Rotation rule for v1.x (2026-10-14): do not rotate `ZZ_DATA_KEY` in v1.x except after a compromise. A rotation changes every Resolve `creator` value, so creators that people blocked in the apps lapse, and every `mint-subject` key (spec 005 FR-011), so daily mint caps restart for the rest of that UTC day. Record any rotation and its reason in the incident log.


Before production define owner, storage system, rotation cadence, emergency revoke/replace procedure, key identifiers, and verification overlap. Compromise response must include invalidation scope and evidence that old material is no longer accepted.

## Capacity and spend

Production approval must define budget guardrails, storage-growth monitoring, rate-limit saturation signals, and alert thresholds. Spend remains human-gated.

## Production gate

Production authorization requires: numeric SLO posture, RTO/RPO, successful restore test, incident contacts/runbook, observability/redaction review, secret/key lifecycle, data-lifecycle review, security threat-model review, and Danny's explicit deploy approval.

## Recovery scope and proposed objectives (2026-10-10)

Recorded in [D-2026-10-10-10](../specs/decisions-2026-10-10.md). Status: ACCEPTED (Danny, 2026-10-14, [#170](https://github.com/Zero-State-LLC/zzthis/issues/170#issuecomment-6175348667)). The numbers count only once the seeded drill (RM-024) meets them.

- **Authoritative state for v1.0.** D1 plus four secrets: `ZZ_TOKEN_SECRET`, `ZZ_DATA_KEY`, `ZZ_RECORD_SIGNING_KEY` (with its key id), and `APPLE_PRIVATE_KEY`. Configuration is in git.
- **Out of the RPO scope while `ZZ_PHOTO_READS` is false.** R2 holds no application object, and the limiter Durable Object is non-authoritative. The production configuration test (BACKLOG RM-001) fails if photo reads are turned on, so R2 cannot silently join the scope.
- **Secret escrow.** The operator keeps each secret in an escrow outside Cloudflare and outside this repository, names the location in a private runbook, and rehearses restore into a scratch Worker (RM-022).
- **Deletion replay.** A Time Travel restore undoes account deletions made after the restore point. Before restoring, export the audit and pending-revocation rows written after the target; after restoring, re-insert them and re-run deletion with `ops/delete-account.sql` for each deleted account (RM-023; Account deletion and access requests, above).
- **Migration bookmark.** Every production migration prints a D1 bookmark first (RM-002).
- **Objectives.** RPO 5 minutes for D1; RTO 4 hours from incident declaration to verified service. These are conservative defaults from minute-granular Time Travel and the 1.735-second staging restore, not measured service results. They count only after the seeded drill (RM-024) meets them.
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
