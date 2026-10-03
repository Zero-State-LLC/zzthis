# intent/: SDLC intent records

**Kind:** process. Not a specification. Not implementation authority.

Non-trivial features start here. Copy [`_TEMPLATE.md`](_TEMPLATE.md) to a
dated file (`YYYY-MM-DD-short-slug.md`). Fill every section. Label claims
`[verified: …]` or `[assumed: …]`.

## Sequence

`intent.md` → `spec.md` (must include `## Workflows`) → plan → tasks →
implement → REVIEW → land. See the Zero State SDLC order in
`Zero-State-LLC/agent-context` (`templates/sdlc/README.md`).

A human accepts an intent (`Status: accepted`) before specify. Docs-only
hygiene and chores that do not change behavior may skip this sequence.

## Holds

- An intent is not a spec, not a plan, and not a release. It does not
  authorize implementation, deploy, or spend.
- Do not invent product behavior here.
