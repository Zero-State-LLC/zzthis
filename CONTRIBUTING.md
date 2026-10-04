# Contributing

1. Read [`AGENTS.md`](AGENTS.md) and the active file in [`intent/`](intent/).
2. For non-trivial work, start from the spec in [`specs/`](specs/README.md). Branch from `main` and open a pull request.
3. Before you push, on Node 24, run `npm run lint`, `npm run typecheck`, `npm run test`, and `npm run build`.
4. Edit copy in `src/content/`, not in pages. User-facing text says "demo" and "check word", and it has no em dash.
5. Design tokens: edit `src/styles/tokens.css`, then run `npm run design:build`, and commit `design/` with the stylesheet. `npm run design:check` runs inside `npm run build`.
6. Use the issue templates. Labels `type:bug`, `type:feature`, and `type:chore` already exist.

## Branch protection

`main` is protected. Direct pushes are blocked. The required check is `build` (`.github/workflows/ci.yml`). One approving review is required. [`.github/CODEOWNERS`](.github/CODEOWNERS) requests the Partner Agents team.

Pull requests do not deploy. GitHub Pages runs from `main` only.

## Reviews

[`CODEOWNERS`](.github/CODEOWNERS) is `* @Zero-State-LLC/partner-agents`. A review from that team is the request the pull request template names.
