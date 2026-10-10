# Intent: one organization per scope, then org-bound grants (#135)

Author: Claude, from the #135 research
Date: 2026-10-10
Status: accepted
Accepted-by: Danny, 2026-10-09, in D-2026-10-10-22 (`specs/decisions-2026-10-10.md`; task spec in the [#135 comment](https://github.com/Zero-State-LLC/zzthis/issues/135#issuecomment-6093538017)); implementation requested by the maintainer in the 2026-10-10 Claude Code session ("please work on pr 135")
Product: zzThis (`Zero-State-LLC/zzthis`)

This file is a proto-spec. The spec 005 amendments under Change map land in the same pull request as the code.

## Problem / why now

A `grants` row names only a scope and a role (`workers/api/migrations/0001_init.sql`). So a `viewer` grant opens every private record in its scope (`src/resolve/resolve.ts` `viewFor`) and an `auditor` grant lists every event in its scope (`src/audit/route.ts`), across every customer. D-2026-10-10-06 keeps one organization per scope by runbook only. Issue [#135](https://github.com/Zero-State-LLC/zzthis/issues/135) is High and must close before production use by a second customer in one scope.

[verified: source read at 2d76923]

## Proposed outcome

- **Task A (RM-073, v1.0).** `ops/grant.sql` refuses an `enterprise` or `logistics` grant, writing no grant and no audit row, when another live account already holds an active grant in that scope, unless the operator sets `:same_org` to the scope name. `free_public` is never blocked.
- **Task B (RM-074, closes #135).** Migration `0003_org_bound_grants.sql` adds nullable `org_id` to `accounts` and `grants`. `ops/grant.sql` takes `:org_id`; new `ops/set-org.sql` sets an account's `org_id` with an `account.org.set` audit event. A private record opens as `viewer` only when an active viewer grant for the code's scope has a non-null `org_id` equal to the owner's. `GET /v1/audit` lists only events whose code or record owner, refused-mint actor, or grant shares the auditor grant's organization. A null-org grant reaches only its holder's own rows.

## Affected users / systems

- Users: enterprise and logistics viewers and auditors (none in production yet). Nobody else sees a change.
- Systems: `workers/api` (one migration, two ops files, resolve step 7, the audit filter), spec 005, `specs/DOMAIN-MODEL.md`, `specs/BACKLOG.md`.

## Constraints

- No wire change: no route, field, status, error code, or header; OpenAPI and `vectors.json` unchanged (contract 1 frozen, D-2026-10-10-12).
- Every not-allowed private resolve stays the one not-found body (FR-009).
- FR-031: each operator change and its audit row happen together or not at all; a placeholder left as written writes nothing.
- Existing tests keep their assertions; fixtures change only to set `org_id`.
- No Cloudflare resource, secret, or deploy. Applying migration 0003 to staging or production is the existing human-run migration step.

Non-goals: the Organization entity (RM-080, contract 2); one account in two organizations; lifting the one-organization-per-scope rule.

## Change map

| Item | Files |
|---|---|
| RM-073 | `workers/api/ops/grant.sql`; `test/ops-grants.test.ts`; plan.md Operator work |
| RM-074 schema | `workers/api/migrations/0003_org_bound_grants.sql` |
| RM-074 ops | `ops/grant.sql` (`:org_id`), `ops/set-org.sql`; `test/ops-grants.test.ts`, `test/ops-org.test.ts` |
| RM-074 resolve | `src/resolve/resolve.ts`, `src/codes/scope.ts` |
| RM-074 audit | `src/audit/route.ts`, `src/codes/scope.ts` |
| RM-074 tests | new `test/org-grants.test.ts`; fixtures in `test/resolve.test.ts`, `test/audit.test.ts` |
| Spec | spec 005 FR-016, FR-034, FR-035, Resolve step 7, Data model; plan.md Operator work; `specs/DOMAIN-MODEL.md`; BACKLOG RM-073, RM-074 |

## Stop and ask

Write the gap in the PR body instead of deciding if a fix would change a wire shape, weaken a test, or need a resource or deploy.

Open for Danny (recorded, not decided here): the Task A guard counts any other account in the scope, so once org-bound grants land, a second organization in one scope still needs `:same_org`, which reads as "same organization". Whether to relax the guard to compare `org_id` is a later call under D-2026-10-10-06.

## Acceptance

The acceptance lines of RM-073 and RM-074 and the test matrix in the #135 comment; `npm run lint`, `typecheck`, `test` (100% coverage), and `build` pass.

## Claims

| Claim | Label |
|---|---|
| Scope-wide viewer and auditor cross customers | `[verified: resolve.ts viewFor, audit/route.ts inScopes at 2d76923]` |
| No production viewer or auditor grants exist, so no backfill | `[assumed: D-2026-10-10-22 Consequences; v1.0 is lookup only]` |
