# Feature spec: wordlist and check word

Feature ID: 003-wordlist-checkword
Status: not built. Requested in issue #14. Deepened 2026-10-03: the v1 text grammar (US3) is accepted from Michael's Q48 and Q49 answers ([`docs/SPEC.md` Section 2.2a](../../docs/SPEC.md)).
Phase: specify (what and why). The how is in [plan.md](plan.md).
Constitution: [.specify/memory/constitution.md](../../.specify/memory/constitution.md).

## Why

The code is made of words that people write, read aloud, and type. If two words look alike in handwriting or sound alike on a radio, a code can resolve to the wrong record. The codebook has to be built for handwriting, reading, speech, recall, correction, optical recognition, and error detection [PRODUCT]. No validated codebook exists yet [PRODUCT].

## Users

| User | Need |
|---|---|
| Person writing or reading a code | Words that are hard to confuse by eye or ear |
| Recognition (spec 004) | A closed list to snap readings to, plus a check word to catch errors |
| Resolver (spec 002) | Words to build new codes from |
| Michael and Danny | A yield report showing whether the list is big enough for the code space |
| Demo, resolver, and capture | One parser that turns any typed or read text into one canonical code or one failure reason |

## User stories

### US1. Build the wordlist with a yield report (P1)

As the team, we run a pipeline that filters candidate words and reports how many survive each filter, so that we can see whether the list is large enough [issue #14].

Acceptance: the report lists the count before and after each filter, and compares the final size with the size the code space needs.

### US2. Catch errors with a check word (P1)

As a reader, I get an error when a code has one wrong word, so that a misread code does not resolve to the wrong record [PRODUCT] [issue #14].

Acceptance: a library computes and verifies the check word; tests show it detects the error classes named in Q30 once they are chosen.

1. Given a valid issued word code, when one data word is replaced by any other wordlist word, then verification fails (Q30 minimum, tested over every substitution for a fixed sample of codes).
2. Given a valid issued word code, when the check word is removed, then verification fails with `wrong-length`, not `check-mismatch`.
3. Given a code whose part is not on the list, then verification fails with `unknown-word` and names the position, not a suggested word.

### US3. Parse and normalize any text into one code (P1)

As the demo, the resolver, or the capture client, I pass in whatever a person typed or a reader produced, and I get back one canonical code with its kind, or one failure reason, so that every part of zzThis agrees on what counts as the same code [MICHAEL 2026-10-02 #33] [MICHAEL 2026-10-02 #34].

Acceptance:

1. Every input in `docs/SPEC.md` Section 2.2a G9 returns the listed kind and canonical form, or the listed reason.
2. Two inputs that differ only in letter case, separator choice, separator runs, line breaks, or circled versus plain markers return the same canonical form.
3. The canonical form of any successful parse parses again to itself (idempotence, property test).
4. No input crashes the parser or takes more than linear time in its length (property test with random strings up to 10,000 characters; the 256-character guard runs first).

## Functional requirements

| ID | Requirement | Source |
|---|---|---|
| FR-001 | Filter for distinct letter shapes when handwritten. | [issue #14]; method and pass rule OPEN (Q35) |
| FR-002 | Remove homophones (distinct sounds). | [issue #14]; method and pass rule OPEN (Q35) |
| FR-003 | Every pair of words has an edit distance of at least 3. | [issue #14] |
| FR-004 | Report yield after each filter and the gap to the needed code-space size. | [issue #14] |
| FR-005 | A check word library tuned to handwriting and voice errors. The check word adds error detection, not capacity. | [issue #14] [PRODUCT] |
| FR-006 | The library implements the v1 text grammar in `docs/SPEC.md` Section 2.2a (G1 to G8) and passes its G9 test vectors. This replaces the earlier placeholder that excluded the circled marker, `@`, and mixed case. | [MICHAEL 2026-10-02 #33] [MICHAEL 2026-10-02 #34] |
| FR-007 | Parsing is case-insensitive and separator-tolerant; the canonical form is lowercase and hyphen-separated. | [MICHAEL 2026-10-02 #33] |
| FR-008 | A code with content needs a marker at both ends; a circled `(zz)` counts. A missing closing marker fails with `no-closing-marker`. | [MICHAEL 2026-10-02 #33] |
| FR-009 | The bare mark (`zz` or `(zz)` with no content) parses as its own kind, `bare`, with canonical form `zz`. | [MICHAEL 2026-10-02 #33] |
| FR-010 | `@` is allowed only as the first character after the opening marker and marks a handle. Inside a handle, letters, numbers, `.` and `_` are allowed. A handle is the only part of its code. | [MICHAEL 2026-10-02 #34]; single-part rule is the Q51 default (issue #37) |
| FR-011 | `#`, `$`, `/`, and `:` fail with `reserved-symbol`. | [MICHAEL 2026-10-02 #34] |
| FR-012 | A code with content has 1 to 5 parts. | Q50 default (issue #36) |
| FR-013 | Letters outside ASCII fail with `unsupported-script` in v1. | INFERRED; any-language codes are v2 (issue #35) |
| FR-014 | The parser returns exactly one failure reason, chosen by the fixed order in Section 2.2a G6. | INFERRED |
| FR-015 | The parser is a pure function with no I/O, no wordlist lookup, and no network. Word-code versus field-code classification is a second step that takes the wordlist as input. | INFERRED, so the demo can use it under the no-network rule (001 FR-011) |
| FR-016 | Wordlist entries are lowercase `a` to `z` only, are unique, and none is `zz`, `fn`, or `run` (these are markers or macro prefixes on the site). | INFERRED from Section 2.2a G3 and the macro examples in `docs/SPEC.md` Section 3.2 H.2a |
| FR-017 | The list is versioned. A published version is never reordered or edited; a change makes a new version, and the check word computation records which version it used. | INFERRED, so old issued codes keep verifying |
| FR-018 | The check word is one word from the same list, placed last. Verification returns exactly one of `ok`, `check-mismatch`, `unknown-word`, `wrong-length`. | INFERRED placement and result set; the check word itself is [PRODUCT] |
| FR-019 | The pipeline and the yield report are deterministic: the same input list and settings give byte-identical output. | INFERRED, so the report can be reviewed in a PR |

## Success criteria

Not set for the yield. The size the code space needs depends on the formats chosen (Q27) and the target list size (Q31). The spec does not invent a pass mark for the yield.

The grammar (US3) and the check word (US2) do have pass rules: every G9 vector passes, and every single-word substitution in the sample is detected.

## Data rules

| Item | Rule | Source |
|---|---|---|
| Yield report fields | For each filter in order: filter name, rule, count in, count removed, count out. Then the final size and the gap to the needed size (blank until Q27 and Q31 are set). | FR-004; field list INFERRED |
| Report format | Markdown table plus the same data as JSON, committed next to the list | INFERRED |
| Removed words | Each removed word is listed with the filter that removed it and, for the distance filter, the word it collided with | INFERRED, so reviewers can check the filters |
| Canonical code string | Lowercase, hyphen-separated, markers included (`zz-…-zz`); bare mark is `zz` | [MICHAEL 2026-10-02 #33] |

## Error states

| Where | State | Meaning |
|---|---|---|
| Parser | One of the 11 reasons in Section 2.2a G6 | Input is not a valid v1 code |
| Classifier | `word` or `field` | All parts on the list, or not |
| Check word | `check-mismatch` | Parts are on the list, but the check word does not match |
| Check word | `unknown-word` (with position) | A part is not on the list |
| Check word | `wrong-length` | The part count does not match the issued format |
| Pipeline | Fails the run | A filter receives an empty list, or the source list fails FR-016 |

## Edge cases

- `zz-copper-lantern-sky` (no closing marker): `no-closing-marker`. The old demo parser accepted it; the v1 grammar does not.
- `zz-zz-zz`: `marker-in-body`.
- `zz-@agentsmith-neo-zz`: `invalid-handle` (Q51 default).
- A typed en dash between words: read as a hyphen (Section 2.2a G2 step 3).
- A code across two lines: one code.
- A field code such as `zz-b2-smith-1-zz` goes through the parser but not the check word; only issued word codes carry a check word.
- Two source words that differ only by case collapse to one entry before filtering.


## Terms

This spec says "check word". `docs/SPEC.md` also says "checksum word". Both mean the same extra word that detects errors. "Part" means one separator-delimited piece of a code: a word, a number, a mix like `b2`, or a handle.

## Out of scope

Recognition models (spec 004), the resolver (spec 002), and human-factors studies.

## Open questions

| ID | Question | Default |
|---|---|---|
| Q27 | Which formats come first? | None chosen |
| Q30 | Which error classes must the check word detect (one wrong word, swapped words, a dropped word, voice confusions)? | One wrong word (INFERRED minimum) |
| Q31 | Target wordlist size. Sources differ: 5,000 words and a candidate 10,000 [PRODUCT], and "about 4,000 known words" in the recognition plan [OPERATOR 2026-10-02]. | None chosen |
| Q32 | Language and licensing of the candidate word source | None chosen |
| Q35 | How are "distinct letter shapes" and "distinct sounds" measured, and what is the pass rule for each? | None chosen; blocks the shape and sound filter tasks |
| Q50 | How many parts can a code have? (issue #36) | 1 to 5 |
| Q51 | `zz@-` versus `zz-@`; more words after a handle? (issue #37) | Same code; handle is the only part |
| Q52 | Dots outside handles? (issue #38) | Not allowed |
| Q55 | `zz` inside running text (issue #41) | Typed lookup takes one whole code |

## Workflows

| Item | Value |
|---|---|
| Governing workflows | anti-slop-code, production-systems, google-developer-style |
| Owners | Spec: Opus 5.5 through Grok Bot. Decomposition: FORGE. Implementation: cloud coding agent. Filing: SCRIBE. |
| CI to reuse | `.github/workflows/ci.yml` (required `build`), `site-ci.yml` (typecheck and test), `free-security-scan.yml`. No new CI. |
