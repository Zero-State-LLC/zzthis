# Plan: resolver core

Feature: [spec.md](spec.md). Status: proposal, not built.

This plan carries `docs/SPEC.md` Section 10 (architecture), which was operator direction from 2026-10-02 [OPERATOR 2026-10-02]. Section 10 stays in `docs/SPEC.md` as the full record, including the topology diagram. This file summarizes the parts that govern the resolver and lists what is still undecided.

## Workflows (copied from the spec)

anti-slop-code, production-systems, google-developer-style. ADVERSARY reviews the threat model. CI: `ci.yml`, `site-ci.yml`, `free-security-scan.yml`.

## Technical context

| Item | Choice | Status |
|---|---|---|
| Topology | One central server owns codes, records, grants, and the audit log; every app is an API client | [OPERATOR 2026-10-02] |
| Edge | Cloudflare Workers for fast reads of signed records; writes and signing are central | [OPERATOR 2026-10-02] |
| Database | D1 for the prototype; portable SQL so it can move later (AWS GovCloud if a sponsor needs IL4 or IL5) | [OPERATOR 2026-10-02] |
| Object storage | R2 for retry photos (spec 004) | [OPERATOR 2026-10-02] |
| Cache rule | Only an active, reusable, public, unauthenticated resolve is cached. Header `Cache-Control: public, max-age=60, stale-while-revalidate=300`. Purge that code's key on write. Excluded classes are `no-store` | [DANNY 2026-10-04] (Q26). Spec 005 FR-018 |
| API shape | `POST /codes`, `GET /resolve/{code}`, `POST /codes/{id}/revoke`, `POST /records/{id}/versions`, `GET /audit` | INFERRED sketch (Section 10.6), not a contract |
| Data model | `codes`, `records`, `record_versions`, `grants`, `audit_events` | INFERRED sketch (Section 10.7) |
| Signing keys | Ed25519; one active signing key/id for contract 1. Contract 2 publishes verification keys and supports rotation. Production storage/rotation remains a deploy gate. | Q28 RESOLVED [DELEGATED 2026-10-04, #74] |
| Language and framework for the Worker | TypeScript Worker in this repository | OBSERVED in spec 005 implementation |
| Where the code lives | This repository (`workers/api`, shared `packages/zz-core`) | Q29 RESOLVED [DANNY 2026-10-04]; OBSERVED implementation |

## Constitution check

| Principle | Plan |
|---|---|
| I. Security lives in the resolver | Central enforcement of revocation, single use, expiry, and rate limits. |
| III. Exact match | `GET /resolve` is exact only; one not-found shape. |
| VI. Public repo | No keys or secrets in the tree; Worker secrets through the platform secret store (INFERRED). |
| VIII. Human gates | Creating Cloudflare resources and deploying the Worker need Danny's yes. |

## Risks

- Edge caching versus revocation: if a purge fails, a cached public resolve may last 60 seconds [DANNY 2026-10-04].
- Enumeration through timing or error differences; the single not-found shape must also hold for timing (INFERRED).
