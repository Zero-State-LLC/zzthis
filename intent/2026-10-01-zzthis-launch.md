# Intent: zzThis launch surface

Author: Zero State agents (draft for human accept)
Date: 2026-10-01
Status: draft
Product: zzThis (`Zero-State-LLC/zzthis`)

This file is a proto-spec. It comes **before** specify.
Next stage is `spec.md` (spec-kit specify). Do not skip to code.

## Problem / why now

zzThis (human-writable, machine-readable codes) has a repo but no spec,
public site, or demo. [verified: README.md is the only file on main at
repo creation, 2026-10-01]

The launch surface is needed for an xTechSearch submission.
[assumed: from the seeded issue list; confirm timing with Danny]

## Proposed outcome

Observable done (a stranger can check this without reading the chat):

- `spec.md` exists and defines the code format with a `## Workflows` section.
- A marketing site and a click-through demo build in CI on `main`.
- xTechSearch submission materials are prepared for human review.

## Affected users / systems

- Users: TBD by spec.
- Systems: this repo; Vercel (deploy, needs human yes); zzthis domain/DNS
  (needs human yes).

## Constraints

Product-true locks (do not reopen in implement):

- Human yes on Vercel deploy, domain/DNS, spend, and legal.

Non-goals:

- Defining the code format in this file. That belongs in `spec.md`.

## Open questions

- What exactly is the code format and its target users?
- Which domain, and who owns DNS?
- xTechSearch deadline and required materials?

## Claims

| Claim | Label |
|---|---|
| Repo started README-only | `[verified: main at 2026-10-01]` |
| Site and demo target xTechSearch | `[assumed: seeded issue list]` |

## Next

A human accepts this file (`Status: accepted`). Then specify
(`spec.md` + `## Workflows`). Do not implement from this file alone.
