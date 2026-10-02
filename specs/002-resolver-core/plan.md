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
| Cache rule | Only signed records of reusable codes are cached; single-use and short-expiry codes always go to the central server | INFERRED (Section 10.2) |
| API shape | `POST /codes`, `GET /resolve/{code}`, `POST /codes/{id}/revoke`, `POST /records/{id}/versions`, `GET /audit` | INFERRED sketch (Section 10.6), not a contract |
| Data model | `codes`, `records`, `record_versions`, `grants`, `audit_events` | INFERRED sketch (Section 10.7) |
| Signing keys | Not decided: algorithm, storage, and rotation | OPEN (Q28) |
| Language and framework for the Worker | Not decided | OPEN; TypeScript on Node 24 tooling matches the repo (INFERRED) |
| Where the code lives | Not decided: this repo or a new one | OPEN (Q29) |

## Constitution check

| Principle | Plan |
|---|---|
| I. Security lives in the resolver | Central enforcement of revocation, single use, expiry, and rate limits. |
| III. Exact match | `GET /resolve` is exact only; one not-found shape. |
| VI. Public repo | No keys or secrets in the tree; Worker secrets through the platform secret store (INFERRED). |
| VIII. Human gates | Creating Cloudflare resources and deploying the Worker need Danny's yes. |

## Risks

- Edge caching versus revocation: a revoked reusable code may resolve until the purge window ends (Q26).
- Enumeration through timing or error differences; the single not-found shape must also hold for timing (INFERRED).
