# Agent contract: zzThis

You are working in **zzThis** (`Zero-State-LLC/zzthis`): human-writable,
machine-readable codes.
This file is the canonical contract for Cursor, Claude, Codex, Grok, and OpenClaw.
Harness adapters (`CLAUDE.md`, optional `CODEX.md`) only point here.

## Intent

Read the active intent under [`intent/`](intent/) before editing.
Specs live in [`specs/`](specs/) (Spec Kit). Do not skip to code.

If the change is non-trivial and no intent exists, draft one from
[`intent/_TEMPLATE.md`](intent/_TEMPLATE.md) and wait for a human to
accept it. Trivial docs and chore fixes do not need an intent file.
See [`intent/README.md`](intent/README.md).

## Commands

| Task | Command |
|---|---|
| AGENTS.md check | `bash scripts/check-agents-md.sh AGENTS.md` |
| Security scan | `./scripts/security-scan.sh` |
| Install | `npm ci` (Node 24) |
| Lint / typecheck / test / build | `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build` |
| Design tokens | `npm run design:check` (also runs inside `npm run build`) |

Fill the table from this repo's README or package scripts. Do not invent commands.

## Invariants

- Do not invent the code format. Encoding rules come from the accepted spec only.
- Cloudflare is the canonical runtime substrate; GitHub is source/PR/CI. Read `specs/CLOUDFLARE-RUNTIME.md` before adding infrastructure.
- Human yes (Danny) on production deploy, Cloudflare resource/DNS changes, spend, and legal.
  Agents do not dispatch production deploys or buy things.
- Do not put secrets, tokens, or live credentials in the tree.
- Do not invent product behavior the spec does not name.

## Graft and docs

If `graft/` exists, run `graft ask "<task>" --source` before grepping.
Otherwise start at `README.md`, then `docs/SPEC.md`.
Do not copy a code map into this file.

## Escalation

If CI, tests, or validators look wrong (missing coverage, silent skips,
green-but-inert checks, or a suite that contradicts the spec):

1. Open a defect issue with label `bug`.
2. Do **not** patch tests, fixtures, or CI to force green.
3. Do **not** weaken an assertion to match a broken implementation.

A red honest check is better than a green lie.

## Team context

Org and partner status is not this repo. Load `Zero-State-LLC/agent-context`:

1. `HANDOFF.md`
2. `STATUS.md`
3. `DECISIONS.md` only if a prior choice affects this task

Clone: `gh repo clone Zero-State-LLC/agent-context ~/agent-context`.
Pull `--ff-only` before trusting a local copy.

## Skills

Name only skills that already exist. Do not invent skills or bots.

See the `## Workflows` section in each `specs/*/spec.md` for this repo's named skills and Actions.
Defaults when that section is empty: `anti-slop-code`, `production-systems`,
`google-developer-style`.

## Size

Keep this file short (about 80 lines; hard ceiling 12 KB).
Move procedure and gotchas out, not in.
