# zzThis constitution

Version 1.0.0. Ratified: pending (draft for operator acceptance in the PR that adds this file). Amend through a pull request that bumps the version and records the change at the end of this file.

This file is the governing contract for every zzThis spec, plan, and task under `specs/`. When an artifact conflicts with this file, this file wins until it is amended. Product-true locks from the operator win over this file.

## Labels used in every artifact

- **OBSERVED**: checked against the repo, the live site, or a cited source at the stated date.
- **INFERRED**: a design or engineering choice made in a spec. An implementer may follow it without further approval.
- **SPECULATIVE**: a guess that needs evidence before anyone builds on it.
- **OPEN**: a decision for Michael Chung (product and copy) or Danny (operator). Each OPEN item names its default, if one exists, and its question ID in [`docs/SPEC.md` Section 9](../../docs/SPEC.md#9-out-of-scope-and-open-questions).
- Source tags carry over unchanged from `docs/SPEC.md`: [BRIEF], [WIRE], [OVERVIEW], [NSF], [ASSETS], [OPERATOR date], and [MICHAEL date].

## Principles

### I. The code on paper is public; security lives in the resolver

The visible words are a public identifier, not a password or a key [NSF]. Authorization, payment, revocation, single use, and expiry are enforced by the server, never by a client or by the printed mark [OPERATOR 2026-10-02].

### II. Handwriting first

A code a person writes by hand must work. Printed marks, steganography, and other machine-only features are optional add-ons and are never required to resolve a code [OPERATOR 2026-10-02].

### III. Exact match, no live-code hints

A resolver matches the exact code. It never suggests other live codes, and unknown, used, expired, and revoked codes look the same to a caller. Correction happens on the client against the closed wordlist and the check word [OPERATOR 2026-10-02]. Demos must not teach the opposite pattern (issue #12).

### IV. Honest status

zzThis has no validated codebook, no controlled comparisons, and no tested recognition or resolver yet [NSF]. Public copy never claims pilots, customers, endorsement, adoption, or results. Research targets are never presented as results, and NSF Phase I target figures are never published on the site [MICHAEL 2026-10-02]. Concept renderings are labeled as concepts [MICHAEL 2026-10-02].

### V. Do not invent the code format or the product

Encoding rules, word counts, metrics, and product behavior come from an accepted spec or a cited source. Gaps are carried as OPEN questions with a default, not filled in (repo `AGENTS.md` invariant).

### VI. Public repository hygiene

The repository is public. It holds no secrets, credentials, internal costs or prices, private source documents, or quotations from private proposals. Material drawn from private sources is flagged for review before it stays in the tree.

### VII. Spec before code, workflows in the spec

Work follows Spec Kit order: constitution, specify, clarify, plan, checklist, tasks, analyze, implement, converge. Each `spec.md` has a `## Workflows` section that names the governing workflows and the CI files to reuse. Plans and tasks copy that list and do not replace it. A spec may add a workflow or owner for its own feature; it records the addition in its own Workflows section.

### VIII. Human gates

A human yes from Danny is required for deploys outside the existing Pages workflow, domains and DNS, spend, legal, and admin-override merges. Agents do not dispatch production deploys or buy things (repo `AGENTS.md`).

### IX. A red honest check beats a green lie

Do not weaken tests, fixtures, or CI to force green. Open a `bug` issue instead (repo `AGENTS.md`).

## Engineering standards

- Default workflows for product code: anti-slop-code, production-systems, google-developer-style.
- Reuse the CI that exists: `.github/workflows/ci.yml` (job `build`, the required check; do not edit or duplicate), `site-ci.yml` (typecheck and test), `free-security-scan.yml` (calls `scripts/security-scan.sh`), and `pages.yml` (deploy on push to `main`). A new service adds a workflow only when none of these covers it, and the spec names it.
- Node 24 for all JavaScript and TypeScript work, matching CI.
- Developer prose follows the Google developer documentation style guide. New prose uses no em dashes. The one exception is the site hero line chosen by Michael [MICHAEL 2026-10-02].

## Governance

- Owner of product decisions: Michael Chung. Owner of operator decisions and approvals: Danny.
- Decision log: `docs/SPEC.md` Section 9 (question IDs Q1 onward). New questions take the next free ID.
- A spec is accepted when Danny approves the pull request that adds or changes it.

## Amendments

| Version | Date | Change |
|---|---|---|
| 1.0.0 | 2026-10-02 | First draft, derived from `docs/SPEC.md`, repo `AGENTS.md`, and operator decisions to date. |
