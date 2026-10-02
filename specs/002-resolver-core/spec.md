# Feature spec: resolver core

Feature ID: 002-resolver-core
Status: not built. Prototype requested in issue #13.
Phase: specify (what and why). The how is in [plan.md](plan.md), which carries the architecture proposal from `docs/SPEC.md` Section 10.
Constitution: [.specify/memory/constitution.md](../../.specify/memory/constitution.md).

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

### US2. Issue and link a code (P1)

As an issuer, I ask for a new code linked to a record, with an optional expiry and single-use flag, so that I can mark an item [PRODUCT] [OPERATOR 2026-10-02].

Acceptance: the server chooses the words and the check word; the code is unique among active codes (INFERRED); the issue is written to the audit log.

### US3. Update and revoke (P1)

As an issuer, I add a new record version or revoke a code, and the change takes effect centrally at once [OPERATOR 2026-10-02].

Acceptance: every record change is a new signed version; older versions are kept; a revoked code stops resolving.

### US4. Audit (P2)

As an auditor, I list audit events by code, record, or time. The log is append-only [OPERATOR 2026-10-02].

### US5. Link a code written with no device (P3)

As a field user who wrote a code by hand with no device, I can link it to a record later [BRIEF]. How a valid code is chosen without a device is OPEN (Q25).

## Functional requirements

| ID | Requirement | Source |
|---|---|---|
| FR-001 | Exact-match lookup only. No fuzzy matching on the server and no live-code suggestions. | [OPERATOR 2026-10-02] |
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
| Q36 | Can the words of a revoked, used, or expired code be issued again? Reissue would let a copied old mark open a new record. | None chosen; "never reissue" proposed for Danny |

## Workflows

| Item | Value |
|---|---|
| Governing workflows | anti-slop-code, production-systems, google-developer-style |
| Owners | Spec: Opus 5.5 through Grok Bot. Decomposition: FORGE. Implementation: cloud coding agent. Threat model review: ADVERSARY. Filing: SCRIBE. |
| CI to reuse | `.github/workflows/ci.yml` (required `build`), `site-ci.yml` (typecheck and test), `free-security-scan.yml`. Deploying the Worker is a human-gated step and needs its own workflow, named in plan.md before it is added. |
