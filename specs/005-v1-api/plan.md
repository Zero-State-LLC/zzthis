# Plan: v1 API and later web client

Feature: [spec.md](spec.md). Status: not built. This plan names the stack and the files. It does not add the Worker.

## Workflows (copied from the spec)

anti-slop-code, production-systems, google-developer-style. CI: `ci.yml`, `site-ci.yml`, `free-security-scan.yml`. A Worker deploy workflow is added only with Danny's yes, in the task that deploys.

## Technical context

| Item | Choice | Status |
|---|---|---|
| Where the server lives | This repo | [DANNY 2026-10-04]. Answers Q29 for the v1 API. |
| Runtime | Cloudflare Workers, TypeScript, Node 24 tooling | spec 002 plan [OPERATOR 2026-10-02] |
| Database | D1, portable SQL | spec 002 plan |
| Photos | R2 binding `ZZ_PHOTOS` | spec 002 plan |
| Contract file | `specs/005-v1-api/openapi.yaml`, served as JSON at `GET /v1/openapi.json` | FR-001, FR-002 |
| Code tree, when built | `workers/api/` | INFERRED. Not created in this change. |
| Web client, when built | `apps/web/`, Astro, calls `PUBLIC_API_ORIGIN` | INFERRED from the site stack. Not created in this change. |
| Grammar and check word | Call spec 003. Do not copy a second grammar into the Worker. | FR-003, FR-004 |
| Design | `design/` for the web client. The marketing site keeps `src/styles/tokens.css`. | design/README.md |

## Constitution check

| Principle | Plan |
|---|---|
| I. Security lives in the resolver | Revoke, single use, expiry, and rate limits are server-side. |
| III. Exact match | Resolve is exact. One not-found body. |
| V. Do not invent the format | Word choice is spec 003. This plan does not pick a word count. |
| VI. Public repo | Secrets are Worker secrets. The env table names them and does not hold values. |
| VIII. Human gates | No Cloudflare resource and no OAuth client is created by an agent. |

## Risks

- A revoked reusable code could be served from cache. Cache stays off until Q26.
- Enumeration by timing. The not-found path is one code path (spec 002).
- zzThat still has a proposal OpenAPI. They replace it with this file in their own pull request. This repo does not edit zzThat.
