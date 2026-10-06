# Intent: specification convergence and governance repair

Author: ChatGPT, from the 2026-10-05 completeness audit and operator instruction
Date: 2026-10-05
Status: accepted
Accepted-by: Danny in ChatGPT on 2026-10-05: "Yes okay fix all of that and update kanban"
Product: zzThis (`Zero-State-LLC/zzthis`)

This intent governs the non-runtime convergence repair in PR #85. It comes before the repaired governance/specification artifacts and does not authorize production deployment.

## Problem / why now

The repository has a strong V1 implementation and detailed feature specs, but its governance and status surfaces drifted after the one-shot build. The constitution remained pending/stale, the 005 checklist still said the server was not built, legacy task lists looked like current backlog, completed implementation issues remained open, and no single artifacts covered cross-spec traceability, operations/recovery, data lifecycle, consolidated threats, or future contract compatibility.

That drift makes it possible for an agent to repeat completed work, mistake implementation for deployment, or extend future semantic/ZK work without the required authority and compatibility boundaries.

## Proposed outcome

Observable done:

- repository status documents distinguish implemented, deployed, deferred, CANON-SHADOW, and SPECULATIVE work;
- the constitution's status/version are reconciled under this accepted intent;
- a canonical domain model and cross-spec traceability map exist;
- operations/recovery, data lifecycle, threat-model, and contract-evolution gates exist without inventing unsupported production metrics;
- completed issues are closed with evidence and remaining gates are represented as explicit issues;
- the existing single GitHub Project remains the Kanban and repo documentation defines how issue/PR truth maps to board status;
- Notion parity records the repair while repository main remains implementation authority.

## Affected users / systems

- Danny as operator and approval owner.
- Michael as product/copy decision owner.
- Agents and contributors using AGENTS.md, specs, issues, PRs, and the Project board.
- No end-user runtime behavior.

## Constraints

- No runtime/OpenAPI/code-format behavior changes.
- Contract 1 remains unchanged.
- Do not deploy or create production Cloudflare/OAuth resources.
- Do not invent SLO, RTO, RPO, retention, legal, or spend commitments where evidence/approval is absent.
- Existing accepted privacy/security requirements win over generalized governance prose.
- #81 remains CANON-SHADOW and #83 remains SPECULATIVE/CANON-SHADOW.
- Project status fields are changed only through supported GitHub Project controls; do not claim a field was changed when the connector cannot mutate it.
- Branch protection and required reviewer approval remain in force.

## Stop and ask

Stop rather than decide if the repair would:
- change product behavior or contract 1;
- deploy, spend, create external production resources, or make a legal commitment;
- select a ZK proof system;
- promote semantic/ZK research into runtime authority;
- weaken an accepted privacy/security invariant.

## Acceptance

Danny accepted this repair stream in the conversation that initiated PR #85. The PR remains subject to repository branch protection and reviewer approval. Acceptance of this intent is not merge approval and is not production deployment approval.
