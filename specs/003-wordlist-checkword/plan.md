# Plan: wordlist and check word

Feature: [spec.md](spec.md). Status: not started.

## Workflows (copied from the spec)

anti-slop-code, production-systems, google-developer-style. CI: `ci.yml`, `site-ci.yml`, `free-security-scan.yml`.

## Technical context

| Item | Choice | Status |
|---|---|---|
| Pipeline shape | Ordered filters, each emitting a count, ending in a yield report | [issue #14] |
| Distance metric | Edit distance between words, minimum 3 | [issue #14] |
| Letter-shape and sound filters | Method not chosen | OPEN; SPECULATIVE options include a confusable-letter table and a phonetic key |
| Check word algorithm | Not chosen | OPEN (Q30) |
| Language for the library | TypeScript, so the site, the resolver, and the client can share it | INFERRED |
| Relation to `src/lib/grammar.ts` | The v1 text grammar is accepted (`docs/SPEC.md` Section 2.2a). The library implements it once, and the demo parser is replaced by it (001 T029, 003 T013). Q27 now covers only which formats the server issues, not what a parser accepts | [MICHAEL 2026-10-02 #33] [MICHAEL 2026-10-02 #34] |
| Where the library lives | `src/lib/` in this repo until Q29 decides the resolver's home; then shared as a package | INFERRED |

## Constitution check

- V. Do not invent the code format: the pipeline produces data and a report. The accepted text grammar comes from Michael's Q48 and Q49 answers (Section 2.2a); issued formats still come from Q27.
- VI. Public repo: the source word list must be licensed for publication (Q32) before it is committed.
