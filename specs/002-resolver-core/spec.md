# Feature spec: resolver core

Feature ID: 002-resolver-core
Status: not built. Prototype requested in issue #13. Deepened 2026-10-03: canonical-form rules from the v1 grammar, handles, error states, and edge cases.
Phase: specify (what and why). The how is in [plan.md](plan.md), which carries the architecture proposal from `docs/SPEC.md` Section 10.
Constitution: [.specify/memory/constitution.md](../../.specify/memory/constitution.md).

The `/v1` wire contract is [spec 005](../005-v1-api/spec.md). This file stays the resolver behavior. Where a path in Section 10.6 has no `/v1` prefix, spec 005 is the route.

## Why

A zz code on paper is public. Anyone can copy it, photograph it, or guess at it. The value of zzThis depends on a resolver that turns a code into the right record for the right person, and nothing else [PRODUCT] [OPERATOR 2026-10-02]. No resolver exists yet; its security is untested [PRODUCT].

## Users

| User | Need | Source |
|---|---|---|
| Person holding a marked item | Read a code and see the record view they are allowed to see | [BRIEF] [OPERATOR 2026-10-02] |
| Issuer (for example a supply clerk) | Issue a code, link it to a record, update the record, revoke the code | [PRODUCT] [OPERATOR 2026-10-02] |
| Auditor | See who did what to a code or record, and when | [PRODUCT] |
| Partner system | Resolve codes through an API | [OPERATOR 2026-10-02]; authentication OPEN (Q19) |

## User stories

### US1. Resolve a code (P1)

As a person with a code, I submit the exact code and get the record view for my role, or a single not-found answer, so that a copied or guessed code reveals nothing extra.

Acceptance:

1. An active code returns the current signed record version, scoped to the caller's role [OPERATOR 2026-10-02].
2. Unknown, expired, used, and revoked codes all return the same not-found shape [OPERATOR 2026-10-02] (INFERRED shape detail in `docs/SPEC.md` Section 10.6).
3. The resolver never returns nearby or similar codes [OPERATOR 2026-10-02].
4. Given an active code `zz-copper-lantern-sky-zz`, when a caller submits `ZZ COPPER LANTERN SKY ZZ` or `(zz) copper lantern sky (zz)`, then the caller gets the same view as for the canonical form (FR-013).
5. Given input that fails the grammar, then the response is `malformed` with the parser reason, and it is the same whether or not any live code is similar (FR-014).
6. Given a single-use code and two resolves that arrive at the same time, then exactly one gets the view and the other gets not-found (FR-004).

### US2. Issue and link a code (P1)

As an issuer, I ask for a new code linked to a record, with an optional expiry and single-use flag, so that I can mark an item [PRODUCT] [OPERATOR 2026-10-02].

Acceptance: the server chooses the words and the check word; the code is unique among active codes (INFERRED); the issue is written to the audit log.

1. The issued code parses with the v1 grammar as kind `plain`, and its stored form is the canonical form (FR-013).
2. Issuing fails, and writes a failed audit event, if the audit write fails (FR-018).
3. A handle is issued only to an authenticated owner and only if no handle with the same canonical form exists (FR-016).

### US3. Update and revoke (P1)

As an issuer, I add a new record version or revoke a code, and the change takes effect centrally at once [OPERATOR 2026-10-02].

Acceptance: every record change is a new signed version; older versions are kept; a revoked code stops resolving.

1. Given a revoked reusable code, when a caller resolves it at the central server, then the response is not-found at once; at the edge, within the purge window (Q26).
2. Given a code with `expires_at` T, a resolve at T or later gets not-found (INFERRED: the boundary is exclusive).
3. Given a failed signature step, no version is stored (FR-018).

### US4. Audit (P2)

As an auditor, I list audit events by code, record, or time. The log is append-only [OPERATOR 2026-10-02].

### US5. Link a code written with no device (P3)

As a field user who wrote a code by hand with no device, I can link it to a record later [BRIEF]. How a valid code is chosen without a device is OPEN (Q25).

## Functional requirements

| ID | Requirement | Source |
|---|---|---|
| FR-001 | Exact-match lookup by default. No fuzzy matching on the server and no live-code suggestions unless FR-012 allows them for the tenant. | [OPERATOR 2026-10-02] [MICHAEL 2026-10-02] |
| FR-002 | Every record change creates a new immutable version signed by the server. | [OPERATOR 2026-10-02] |
| FR-003 | Append-only audit log for every call that changes state, and for resolves. | [OPERATOR 2026-10-02]; "every call" is INFERRED (`docs/SPEC.md` Section 10.6) |
| FR-004 | Single-use and expiry where the code format calls for them; a single-use code is marked used in the same write that resolves it. | [OPERATOR 2026-10-02]; same-write rule INFERRED |
| FR-005 | Revocation is enforced centrally at once; cached copies stop resolving within a stated purge window. | [OPERATOR 2026-10-02]; window length OPEN (Q26) |
| FR-006 | Rate limits per client, per role, and per code. | [OPERATOR 2026-10-02]; limit values OPEN (Q26) |
| FR-007 | Role-scoped views of a record. | [OPERATOR 2026-10-02] |
| FR-008 | Issuing, revoking, and marking used always go through the central server, never an offline client. | [OPERATOR 2026-10-02] |
| FR-009 | Handwritten codes resolve the same way as printed ones; no printed-only feature is required. | [OPERATOR 2026-10-02] |
| FR-010 | Abuse cases to defend: copied marks, replay, enumeration, unauthorized updates, malformed input. Each abuse case gets a test with a stated pass condition in tasks.md. | [PRODUCT]; test rule INFERRED |
| FR-011 | A lookup for a code that does not exist and a lookup for a revoked code return the same response shape and status, so a caller cannot tell them apart or enumerate codes. | INFERRED from FR-001 and the plan's timing risk |
| FR-012 | Per-tenant suggestion policy. Off by default. A tenant marked high-security can never turn it on and gets strict pass or fail, possibly graded by the type of misread. Which tenant types may enable it, and what a suggestion may reveal, are OPEN (Q40). | [MICHAEL 2026-10-02]; defaults [OPERATOR 2026-10-02] |
| FR-013 | The resolver parses every submitted code with the v1 grammar library (spec 003 US3) and looks up the canonical form. It never trusts a client's normalization. Codes are stored only in canonical form, so case, separators, and circled markers never create two codes. | [MICHAEL 2026-10-02 #33]; server-side re-parse INFERRED |
| FR-014 | Input that fails the grammar gets a `malformed` response with the parser reason. The grammar is public, so the reason reveals nothing about live codes. Malformed calls count toward rate limits. | INFERRED |
| FR-015 | A bare mark (`zz`) cannot be resolved by text in v1. It returns `unsupported` with reason `bare-mark-needs-context`. Matching a bare mark by photo, place, and time is a v2 candidate. | [MICHAEL 2026-10-02 #33] describes the matching; the v1 split is INFERRED |
| FR-016 | Every code and handle belongs to a scope (v1 scopes: enterprise, logistics; free public and postal are v2). Handles are unique within their scope, compared in canonical (lowercase) form and on the G10 matching key. In v1, only the server issues a handle, to an authenticated owner; writing a handle on a thing does not claim it. Verifying that the owner really is the named brand comes later. | [MICHAEL 2026-10-03 #42] (Q56); v1 scope list INFERRED |
| FR-017 | The canonical form of an active code is unique. Whether a retired code's words can be issued again stays OPEN (Q36); until it is answered, the prototype never reissues. | Q36; default INFERRED |
| FR-018 | No state change without its audit event: if signing or the audit write fails, the whole call fails and nothing is stored. | INFERRED from FR-002 and FR-003 |
| FR-019 | Reserved handles. The server refuses to issue a reserved handle to a free user, comparing on the G10 matching key so `@adm1n` counts as `@admin`. Seed categories: system names (`admin`, `administrator`, `root`, `support`, `help`, `security`, `official`, `zz`, `zzthis`, `zzthat`, `zzthing`, `zerostate`); brand and trademark names (enterprise only, after verification); government and agency names (for example `usps`, `army`, `irs`); offensive terms (kept in a list outside the public repo). An issued handle has at least 3 characters after `@`. Premium pricing for short handles is v2. | [MICHAEL 2026-10-03 #47] (Q60); seed list and key check INFERRED |
| FR-020 | A record marked private cannot be opened by a one-part code alone. A one-part code opens a private record only for a signed-in user with permission. One-part codes are fine for public records (signs, community posts). | INFERRED from [MICHAEL 2026-10-03 #46] (Q59) and the issue proposal |
| FR-021 | A word code's check word is verified (spec 003 FR-018, FR-022) before any lookup. A mismatch never resolves; the caller gets `malformed` with reason `check-mismatch`, and the client asks the person to confirm (spec 004 FR-016). | [MICHAEL 2026-10-03 #45] (Q58) |
| FR-022 | A `name` code and the same name written as a handle (`zz-vitalik.eth-zz` and `zz-@vitalik.eth-zz`) resolve to the same record. | INFERRED from [MICHAEL 2026-10-03 #38] (Q52) |

## Error states (INFERRED, prototype contract)

| Call | Outcome | HTTP status | Body |
|---|---|---|---|
| `GET /resolve` | Active code, caller may see it | 200 | Role-scoped view of the current signed version |
| `GET /resolve` | Unknown, expired, used, or revoked | 404 | One fixed not-found body, identical for all four (FR-011) |
| `GET /resolve` | Grammar failure | 400 | `malformed` and the parser reason (FR-014) |
| `GET /resolve` | Bare mark | 422 | `unsupported`, reason `bare-mark-needs-context` (FR-015) |
| Any | Rate limit hit | 429 | One fixed body that does not depend on whether the code exists |
| Write calls | Not authenticated | 401 | Fixed body |
| Write calls | Authenticated, not allowed | 403 | Fixed body; audit event written with result `denied` |
| Write calls | Signing or audit failure | 500 | Nothing stored (FR-018) |
| `POST /codes` (handle) | Handle taken in this scope | 409 | Fixed body; does not reveal the owner |
| `POST /codes` (handle) | Reserved or shorter than 3 characters | 422 | `reserved-handle` (FR-019) |
| `GET /resolve` | Word code whose check word fails | 400 | `malformed`, reason `check-mismatch` (FR-021) |
| `GET /resolve` | One-part code for a private record, caller not signed in | 404 | The fixed not-found body (FR-020, FR-011) |

Status codes are a prototype choice and may change with Q19. The not-found response must also match in timing within a stated budget (plan risk); the budget is set when T007 measures it.

## Edge cases

- Two resolves of one single-use code at the same moment: exactly one view (US1 acceptance 6).
- A code that differs from a live code by one word: not-found, never a hint (FR-001).
- `zz-@AgentSmith-zz` and `zz-@agentsmith-zz`: the same handle (FR-013, FR-016).
- `zz-@agentsmith-neo-zz`: the qualifier `neo` is part of the code, so it can open a different record from `zz-@agentsmith-zz` under the same owner (INFERRED).
- A reusable account code in a spec example is a word code such as `zz-post-maple-river-zz`, linked privately to the account. A code never carries a phone number or other personal data (Section 9a D-2026-10-03-11).
- A revoked code still in an edge cache: resolves only until the purge window ends (Q26).
- A record version whose signature fails verification on read: the resolver returns not-found and writes an audit event with result `integrity-error` (INFERRED).
- A malformed flood from one client: rate limited like any other call (FR-014).

## Success criteria

No numeric targets are set for this prototype. Research targets are not acceptance criteria and are not kept in this repo (Q24). Acceptance for the prototype is the US1 to US4 scenarios passing in automated tests, including one test per FR-010 abuse case (INFERRED).

## Out of scope

Recognition (spec 004), the wordlist and check word (spec 003), payments, partner authentication design (Q19), SD-JWT views (an option, not a commitment [OPERATOR 2026-10-02]), and any production deployment (human gate).

## Open questions

| ID | Question | Default |
|---|---|---|
| Q19 | How do partner apps authenticate? | None chosen |
| Q25 | How does a person pick a valid code with no device: pre-issued code cards, or claiming a handwritten code that the server checks? | None chosen |
| Q26 | Purge window for revoked codes at the edge, and rate-limit values | None chosen; prototype uses short cache lifetimes (INFERRED) |
| Q27 | Which code formats does the prototype support first (two-word, three-word, check word, prefix, enterprise, one-time, reusable-account [PRODUCT])? | None chosen |
| Q28 | Where the server's record-signing keys live and how they rotate | None chosen; blocks T001 |
| Q29 | Where the resolver code lives (this repo or a separate repo) | None chosen; blocks T001 |
| Q40 | Suggestion policy details: allowed tenant types, what a suggestion reveals, misread grading for high-security tenants | Off by default; never on for high-security [MICHAEL 2026-10-02] |
| Q56 | Who can create a handle, and how is it protected? (issue #42) | RESOLVED for v1 [MICHAEL 2026-10-03 #42]: per-scope uniqueness (FR-016); free public duplicates, local priority, and postal account codes are v2 |
| Q59 | One-part codes and private records (issue #46) | RESOLVED (FR-020) |
| Q60 | Reserved handles (issue #47) | RESOLVED (FR-019) |
| Q36 | Can the words of a revoked, used, or expired code be issued again? Reissue would let a copied old mark open a new record. | None chosen; "never reissue" proposed for Danny |

## Workflows

| Item | Value |
|---|---|
| Governing workflows | anti-slop-code, production-systems, google-developer-style |
| Owners | Spec: Opus 5.5 through Grok Bot. Decomposition: FORGE. Implementation: cloud coding agent. Threat model review: ADVERSARY. Filing: SCRIBE. |
| CI to reuse | `.github/workflows/ci.yml` (required `build`), `site-ci.yml` (typecheck and test), `free-security-scan.yml`. Deploying the Worker is a human-gated step and needs its own workflow, named in plan.md before it is added. |
