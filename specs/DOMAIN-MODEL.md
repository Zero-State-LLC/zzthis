# zzThis domain model

Evidence classification: **OBSERVED** for statements describing current repository code/tests; **INFERRED** for governance, production gates, or design choices accepted by the convergence intent; **SPECULATIVE** only where explicitly marked as future research.

Status: current V1 model plus reserved future terms. Deepened 2026-10-10 with state ids, guards, and the Organization gap from the [architecture review](analysis-2026-10-10-architecture-review.md). The persisted schema is `workers/api/migrations/0001_init.sql`; spec 005 Data model is the column list.

## Ubiquitous language

| Term | Meaning | Not to be confused with |
|---|---|---|
| zz-code, code | A public, human-writable identifier between `zz-` and `-zz` markers | A password or capability; possession grants nothing (Principle I) |
| Canonical form | Lowercase, hyphen-joined form the grammar returns (`docs/SPEC.md` 2.2a G2) | The spelling a person wrote |
| Match key | The uniqueness and lookup key (spec 005 Resolve step 6) | The canonical form, which is displayed |
| Check word | The last word of an issued word code, computed from the data words | Capacity; it adds detection only |
| Scope | A product partition: `enterprise`, `logistics`, `free_public` | A tenant or organization (see below) |
| Record | Owner-linked content a code addresses, with versions | The code |
| Grant | A role (`issuer`, `viewer`, `auditor`) for one account in one scope | An organization membership |

## V1 entities (OBSERVED)

- **Account**: authenticated subject; no email or name stored.
- **Identity**: provider and subject bound to an account; holds the sealed Apple refresh token for deletion-time revocation.
- **Scope**: one of three fixed values; not an entity table.
- **Code**: public identifier with lifecycle state, scope, kind (`plain`, `handle`), list version, and owner.
- **Record**: owner-linked, `public` or `private`.
- **RecordVersion**: append-only for ordinary history. Account deletion is the explicit privacy-erasure exception: title, body, and signature are erased and `erased_at` is set (spec 005 FR-023).
- **Grant**: role in a scope, optional expiry.
- **AuditEvent**: append-only evidence; update and delete are blocked by triggers.
- **Report**: safety report; open until the operator closes it.
- **AuthNonce**, **RefreshToken** (with family), **PendingRevocation**, **ReadPhoto** (disabled in normal V1).

## State machines (OBSERVED unless marked)

### Code

| Id | State | Stored as |
|---|---|---|
| C1 | active | `status = 'active'`, `expires_at` null or in the future |
| C2 | used | `status = 'used'` |
| C3 | expired | Derived at read time: `status = 'active'` and `expires_at <= now` (`workers/api/src/codes/view.ts:21-28`); never written |
| C4 | revoked | `status = 'revoked'` with `revoked_reason` |

| Transition | Trigger | Guard | Effects |
|---|---|---|---|
| none -> C1 | mint | issuer or scope flag; content check; unique match key | record and version 1 in the same batch; audit |
| C1 -> C1 | first reusable resolve | `first_resolved_at IS NULL` | sets `first_resolved_at`; re-roll no longer allowed |
| C1 -> C2 | resolve of a single-use code | guarded update wins the race | audit `ok`; loser gets 404 |
| C1 -> C3 | time passes `expires_at` | none | resolve returns 404; never cached |
| C1 -> C4 `reroll` | re-roll | owner, `rerolls_remaining > 0`, never resolved, scope still allowed (RM-032) | successor code C1 with budget minus one |
| C1 -> C4 `owner` | owner revoke | owner | audit; cache purge |
| C1 -> C4 `operator` | `revoke-code.sql` or `suspend.sql` | operator | audit; cache ages out (up to 60 s) |
| C1 -> C4 `account-deleted` | `DELETE /v1/me` | account owner | part of the deletion batch |

Terminal: C2, C3, C4. Words of a code in any terminal state are never issued again (Q36), because the match key stays unique across retired rows.

### Record

| Id | State | Transition |
|---|---|---|
| R1 | live, version N | owner appends version N+1 (signed); a failed signature or audit stores nothing |
| R2 | deleted and erased | account deletion sets `deleted_at` and erases every version |

### Account and session

| Id | State | Transitions |
|---|---|---|
| A1 | active | -> A2 by `suspend.sql`; -> A3 by `DELETE /v1/me` |
| A2 | suspended | writes and the owner list return 403; sign-in, `GET /v1/me`, and deletion still work; -> A1 by `unsuspend.sql` (revoked codes stay revoked) |
| A3 | deleted | terminal; a later sign-in creates a new empty account |
| S0 / S1 | signed out / signed in | client view of the access token |
| T1 | refresh token active | -> T2 rotated on refresh (guarded update); -> T3 revoked on sign-out, deletion, or reuse of a rotated token (whole family) |

### Retention and moderation

| Id | State | Transitions |
|---|---|---|
| N1 | nonce issued | -> used once; used or expired nonces are deleted by the daily run |
| P1 | pending Apple revocation | -> P2 accepted and removed; -> P3 abandoned after 30 days (logged; alert needed, RM-035) |
| RP1 / RP2 | report open / closed | closed reports are deleted 365 days after `closed_at`; open reports are never deleted |

## Scope, Organization, and Namespace

**Scope controls V1 product behavior; it is not a tenant.** A `viewer` or `auditor` grant covers every record or event in its scope, across every account (spec 005 FR-034, FR-035). Until contract 2:

- each of `enterprise` and `logistics` serves at most one organization, and the operator grants roles only to that organization's accounts (D-2026-10-10-06, RM-063);
- Organization (tenant) is a missing entity. Its relation to Scope and Namespace is part of the #87 gate (RM-080).

Future terms, reserved and not persisted under contract 1:

- **Organization** (INFERRED, 2026-10-10): the customer boundary that grants and private records must respect.
- **Namespace**: future authority/domain binding for semantic interpretation. It is not automatically the same thing as V1 Scope.
- **SemanticProfile**: versioned schema that assigns meaning rules to an explicitly profile-bound code.
- **SemanticDictionaryVersion**: immutable versioned semantic mappings used by a profile.
- **DictionaryRoot**: future commitment to an immutable dictionary version.
- **SemanticResolution**: authorized interpretation produced only after canonicalization and resolver authorization.

### Scope vs Namespace rule

Until a future contract specifies otherwise:
- Scope controls current V1 product/account behavior.
- Namespace is a future semantic authority concept.
- There is no assumed 1:1 mapping, inheritance, or shared identifier.
- The same visible code cannot gain tenant-dependent meaning under contract 1.

A V1.x/V2 implementation proposal must explicitly define Organization, Scope, and Namespace cardinality, ownership, lifecycle, selection, migration, and authorization before implementation.

## Research entities

Proof, nullifier/replay tag, verifier/audience, authority-state commitment, and dictionary commitment are research-only terms under #83/S1 and create no V1 authority. Location terms proposed in PR #127 are not part of this model until that PR is reviewed (D-2026-10-10-18).
