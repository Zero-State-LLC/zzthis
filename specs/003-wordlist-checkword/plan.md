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
| Relation to `src/lib/grammar.ts` | The demo parser is demo-only and must not be reused as product grammar until Q27 is answered | INFERRED |

## Constitution check

- V. Do not invent the code format: the pipeline produces data and a report; the accepted grammar still comes from Q27.
- VI. Public repo: the source word list must be licensed for publication (Q32) before it is committed.
