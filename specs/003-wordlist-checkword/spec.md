# Feature spec: wordlist and check word

Feature ID: 003-wordlist-checkword
Status: not built. Requested in issue #14. Deepened 2026-10-03: the v1 text grammar (US3) is accepted from Michael's Q48 and Q49 answers ([`docs/SPEC.md` Section 2.2a](../../docs/SPEC.md)), and updated the same day from his answers to Q50 to Q61 (draft PR, pending Danny's merge).
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

1. Given a valid issued word code, when one data word is replaced by any other wordlist word, then verification fails (Q30 minimum). The test covers the whole list, not a fixed sample (FR-020).
2. Given a valid issued word code, when the check word is removed, then verification fails with `wrong-length`, not `check-mismatch`.
3. Given a code whose part is not on the list, then verification fails with `unknown-word` and names the position, not a suggested word.

### US3. Parse and normalize any text into one code (P1)

As the demo, the resolver, or the capture client, I pass in whatever a person typed or a reader produced, and I get back one canonical code with its kind, or one failure reason, so that every part of zzThis agrees on what counts as the same code [MICHAEL 2026-10-02 #33] [MICHAEL 2026-10-02 #34].

Acceptance:

1. Every input in `docs/SPEC.md` Section 2.2a G9 returns the listed kind and canonical form, or the listed reason.
2. Two inputs that differ only in letter case, separator choice, separator runs, line breaks, or circled versus plain markers return the same canonical form.
3. The canonical form of any successful parse parses again to itself (idempotence, property test).
4. No input crashes the parser or takes more than linear time in its length (property test with random strings up to 10,000 characters; the guard of 256 UTF-16 code units in G2 step 1 runs first).

## Functional requirements

| ID | Requirement | Source |
|---|---|---|
| FR-001 | Filter for distinct letter shapes when handwritten. | [issue #14]; method and pass rule OPEN (Q35) |
| FR-002 | Remove homophones (distinct sounds). | [issue #14]; method and pass rule OPEN (Q35) |
| FR-003 | Every pair of words has an edit distance of at least 3. Edit distance is Levenshtein distance over the lowercase ASCII letters: insert, delete, or substitute one letter, each costing 1. Swapping two letters is not one edit; it costs 2. FR-003, filter (6), and the G1 near-word check all use this one function. | [issue #14]; metric decided 2026-10-05 (`docs/SPEC.md` D-2026-10-04-05) |
| FR-004 | Report yield after each filter and the gap to the needed code-space size. | [issue #14] |
| FR-005 | A check word library tuned to handwriting and voice errors. The check word adds error detection, not capacity. | [issue #14] [PRODUCT] |
| FR-006 | The library implements the v1 text grammar in `docs/SPEC.md` Section 2.2a (G1 to G8) and passes its G9 test vectors. This replaces the earlier placeholder that excluded the circled marker, `@`, and mixed case. | [MICHAEL 2026-10-02 #33] [MICHAEL 2026-10-02 #34] |
| FR-007 | Parsing is case-insensitive and separator-tolerant; the canonical form is lowercase and hyphen-separated. | [MICHAEL 2026-10-02 #33] |
| FR-008 | A code with content needs a marker at both ends; a circled `(zz)` counts. A missing closing marker fails with `no-closing-marker`. | [MICHAEL 2026-10-02 #33] |
| FR-009 | The bare mark is `zz` or `(zz)` alone, in any case or mix, and parses as its own kind, `bare`, with canonical form `zz`. `zz-` fails with `no-closing-marker`; `zz-zz` and `(zz) (zz)` fail with `no-content`. | [MICHAEL 2026-10-02 #33] [MICHAEL 2026-10-03 #48] |
| FR-010 | `@` marks a handle. It starts the first part, or the second part when the first part is a tag. Inside a handle, letters, numbers, `.` and `_` are allowed. Plain qualifier parts may follow the handle. An `@` touching the opening marker or ending a tag part is rewritten (Section 2.2a G2 step 5). The parser returns the handle, the tag, and the qualifiers separately. | [MICHAEL 2026-10-02 #34] [MICHAEL 2026-10-03 #37]; tag rule INFERRED |
| FR-011 | `#`, `$`, `/`, and `:` fail with `reserved-symbol`. | [MICHAEL 2026-10-02 #34] |
| FR-012 | A code with content has one or more parts. There is no part maximum; the input guard of 256 UTF-16 code units (G2 step 1) is the only cap and is a parameter. | [MICHAEL 2026-10-03 #36] (Q50) |
| FR-013 | Letters outside ASCII fail with `unsupported-script` in v1. | INFERRED; any-language codes are v2 (issue #35) |
| FR-014 | The parser returns exactly one failure reason, chosen by the fixed order in Section 2.2a G6. | INFERRED |
| FR-015 | The parser is a pure function with no I/O, no wordlist lookup, and no network. Word-code versus field-code classification is a second step that takes the wordlist as input. | INFERRED, so the demo can use it under the no-network rule (001 FR-011) |
| FR-016 | Wordlist entries are lowercase `a` to `z` only, are unique, and none is `zz`, `fn`, or `run` (these are markers or macro prefixes on the site). | INFERRED from Section 2.2a G3 and the macro examples in `docs/SPEC.md` Section 3.2 H.2a |
| FR-017 | The list is versioned. A published version is never reordered or edited; a change makes a new version, and the check word computation records which version it used. | INFERRED, so old issued codes keep verifying |
| FR-018 | The check word is one word from the same list, placed last. Verification returns exactly one of `ok`, `check-mismatch`, `unknown-word`, `wrong-length`. | INFERRED placement and result set; the check word itself is [PRODUCT] |
| FR-019 | The pipeline and the yield report are deterministic: the same input list and settings give byte-identical output. | INFERRED, so the report can be reviewed in a PR |
| FR-020 | The one-wrong-word guarantee is tested over the whole wordlist, not a fixed sample of codes. The test is one of: (a) exhaustive: for every position and every pair of distinct words at that position, the substitution changes the check word, checked on the fixture list for every code and on the real list through a proof that the check function is one-to-one in each position when the others are fixed, with that per-position property tested directly; or (b) property-based: a seeded generator draws codes and single-word substitutions across every position and the full list, runs in CI with a fixed seed and at least 100,000 cases, and is paired with the exhaustive test on the fixture list. A fixed sample of codes alone does not pass. | INFERRED from the US2 story and the v1 exit criterion, PR #43 review |
| FR-022 | Each scope names the wordlist and list version its check words use, and the reader verifies a code's check word against that list. Candidate lists from Michael: a 10,000-word list for postal use, the BIP39 list (2,048 words, with official lists in nine more languages) for Bitcoin, and the EFF long wordlist (7,776 words). Any list used to issue codes goes through FR-001 to FR-004 and the yield report; a list that fails FR-003 is reported, not used silently (the English BIP39 list has 13,138 word pairs closer than edit distance 3, checked 2026-10-03). | [MICHAEL 2026-10-03 #45]; counts verified against the published lists; filter rule INFERRED |
| FR-023 | A `name` part (`zz-vitalik.eth-zz`) is valid without `@` when it ends in a known suffix (v1: `.eth`). The suffix list is data, so suffixes can be added without a grammar change. | [MICHAEL 2026-10-03 #38] |
| FR-024 | The library exposes the field-code matching key in `docs/SPEC.md` Section 2.2a G10 (number words to digits, then lookalikes folded, then digit runs joined, over the parts only) as a pure function, with the G10 vectors as tests. | [MICHAEL 2026-10-03 #44]; key INFERRED |
| FR-021 | Word-code versus field-code classification runs the near-word check in `docs/SPEC.md` Section 2.2a G1: a letters-only part within edit distance 2 (FR-003 metric) of a wordlist word makes the code `confirm`, not field, and returns the candidates. The number words `zero` to `nine` count as parts with a digit and are never near-words. Candidates are every wordlist word within the limit, sorted by distance (smallest first), then by wordlist index (list order, FR-017). The classifier passes every G1a vector, and `near_words` arrays are compared in that order. | INFERRED, PR #43 review; order INFERRED (D-2026-10-04-05); number words INFERRED (D-2026-10-04-08) |

## Success criteria

Not set for the yield. The size the code space needs depends on the formats chosen (Q27) and the target list size (Q31). The spec does not invent a pass mark for the yield.

The grammar (US3) and the check word (US2) do have pass rules: every G9 and G1a vector passes, and every single-word substitution is detected over the whole list (FR-020).

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
| Parser | One of the 11 reasons in Section 2.2a G6 (`part-count` removed, `no-content` added on 2026-10-03) | Input is not a valid v1 code |
| Classifier | `word` or `field` | All parts on the list, or not |
| Check word | `check-mismatch` | Parts are on the list, but the check word does not match |
| Check word | `unknown-word` (with position) | A part is not on the list |
| Check word | `wrong-length` | The part count does not match the issued format |
| Pipeline | Fails the run | A filter receives an empty list, the source SHA-256 does not match, or the final list fails FR-016 (a pipeline bug, because filters 1 and 3 enforce it). FR-016 is checked on the output list, not the source. |

## Edge cases

- `zz-copper-lantern-sky` (no closing marker): `no-closing-marker`. The old demo parser accepted it; the v1 grammar does not.
- `zz-zz-zz`: `marker-in-body`.
- `zz-@agentsmith-neo-zz`: handle `@agentsmith` with qualifier `neo` (Q51).
- `zz-vitalik.eth-zz`: `name` (Q52). `zz-example.com-zz`: `invalid-character`.
- A code with six or more parts: valid; only the guard of 256 UTF-16 code units (G2 step 1) applies (Q50).
- `zz-zz`: `no-content` (Q61).
- A typed en dash between words: read as a hyphen (Section 2.2a G2 step 3).
- A code across two lines: one code.
- A field code such as `zz-b2-smith-1-zz` goes through the parser but not the check word; only issued word codes carry a check word.
- Two source words that differ only by case collapse to one entry before filtering.


## Terms

This spec says "check word". `docs/SPEC.md` also says "checksum word". Both mean the same extra word that detects errors. "zz-code", "zz-code-words", "code-words", and "zz-Code" all mean a code [MICHAEL 2026-10-03 #36]. "Part" means one separator-delimited piece of a code: a word, a number, a mix like `b2`, or a handle.

## Out of scope

Recognition models (spec 004), the resolver (spec 002), and human-factors studies.

## Prototype defaults for the v1 build (decided 2026-10-04)

Status: decided. Danny said yes on #74 (2026-10-04), so these are the v1 rules (`docs/SPEC.md` Q27, Q30 to Q32, Q35). Source: [analysis 2026-10-04](../analysis-2026-10-04.md), finding 1. Without a list and a check word the server cannot mint, so every client's Create stays on "not available". These defaults fill Q27, Q30, Q31, Q32, and Q35 for the prototype only. Michael's later answers replace them through a new list version (FR-017).

| Item | Prototype default | Why |
|---|---|---|
| Issued format (Q27) | Two data words and one check word: `zz-word1-word2-check-zz`, kind `plain`. | Every example in spec 005, `design/UX.md`, and zzThat has this shape (`zz-copper-lantern-sky-zz`). Section 2.2 allows two or three data words. |
| Source list (Q32) | The EFF long wordlist (7,776 English words), one of Michael's candidates in FR-022. License CC BY 3.0 US, so the repo credits EFF in `NOTICE`. Source URL `https://www.eff.org/files/2016/07/18/eff_large_wordlist.txt`, committed at `packages/zz-core/wordlists/source/eff_large_wordlist.txt` so the pipeline runs offline. It has 7,776 lines, each five dice digits, a tab, then the word. The pipeline reads the word after the tab, trims it, and lowercases it. The run fails unless the file's SHA-256 is `addd35536511597a02fa0a9ff1e5284677b8883b83e986e43f15a3db996b903e` (checked 2026-10-04). | Already named by Michael. Licensed for a public repo. Pin INFERRED, so the list rebuilds the same way. |
| Filters (Q35) | In this order: (1) lowercase `a` to `z` only (this removes the four hyphenated words `drop-down`, `felt-tip`, `t-shirt`, and `yo-yo`); (2) 3 to 8 letters; (3) drop `zz`, `fn`, `run`, and the number words `zero` to `nine` (the EFF list holds `five` and `zero`). The private blocklist (spec 005 FR-024) is not applied to the committed list, and the report records `blocklist: not applied`, so the list rebuilds from public inputs (FR-019). (4) letter-shape filter: not run, reported as skipped (Q35); (5) sound filter: not run, reported as skipped (Q35); (6) edit distance at least 3 (FR-003): sort by length, then alphabetically, and keep a word only when it is at least 3 from every word already kept; (7) keep the first N words, where N is the largest prime that is not above the count. An audit dry run on 2026-10-04 kept 2,668 words after filter (6), so N is 2,663; a very different count points to a filter bug (INFERRED check). | Deterministic (FR-019). Shorter words first suits handwriting. A prime N makes the check word provable. |
| List size (Q31) | Whatever the filters yield, as N. The yield report states N and the code space, N squared. The pipeline fails if N is under 1,000. | No size is invented. The report shows it. |
| Check word (Q30) | With word indexes d1 and d2 (0-based, in list order), the check word is the word at index (d1 + 2 * d2) mod N. | With N prime, one wrong word in any position changes the result. With the issuer rule below, so does a swap of any two words. |
| Issuer rule | Draw d1 and d2 uniformly from a cryptographic random source, by rejection sampling (no modulo bias). Draw again when d1 = d2, d2 = 0, (d1 + d2) mod N = 0, or the check index equals d1 or d2. | These are the only cases where a swap goes undetected or a word repeats. |
| Verify | Only for a plain code whose parts are all on the list. Three parts: `ok` or `check-mismatch`. Any other part count: `wrong-length`. `unknown-word` is returned only when a caller verifies a code with a part that is not on the list. | FR-018 result set. |
| Version id | `proto-v0`. Files: `packages/zz-core/wordlists/proto-v0.txt` (one word per line; line order is the index), `proto-v0.report.md`, and `proto-v0.report.json` (FR-004 fields plus the source URL, its SHA-256, and `blocklist: not applied`). | FR-017: a published version never changes. |
| Test list | `fixture-7`: the G1a words plus `falcon` (7 words, a prime). Tests and local runs only. The server refuses to start in production with it. | Every platform can test mint and verify before proto-v0 exists. |

License: Danny said yes to the source and the license on #74 (Q32). The build runs the spec 003 pipeline and commits `proto-v0.txt`, `proto-v0.report.md`, `proto-v0.report.json`, and a draft root `NOTICE` crediting EFF (CC BY 3.0 US). Q32 on #74 is the license yes, so no further gate applies before the commit. Danny gave his legal yes on the `NOTICE` wording on #78 (2026-10-05, spec 005 T036). Local runs use `fixture-7`.

Point of no return: after the first production mint, proto-v0 can never change, because issued codes must keep verifying (FR-017) and retired words are never issued again (Q36 default). Required before that mint: re-run the pipeline with `ZZ_BLOCKLIST`, check the yield report (the removed words and the new N), and commit the new list, so the file changes before the point of no return. The first production mint needs Danny's deploy yes (spec 005 T037).

### Shared test vectors

[`vectors.json`](vectors.json) is the machine copy of the G9, G1a, and G10 rows in `docs/SPEC.md` Section 2.2a, plus the scanner rows (spec 004, Client read pipeline) and the check-word rows (fixture-7, with all 30 issuable codes). The G9 rows were checked against `src/lib/grammar.ts` on 2026-10-04. The `grammar_pending` rows fail against it until the spec 005 T035 parser change, which moves them into `grammar`. The check-word rows were checked exhaustively: every single wrong word and every swap of two words is detected on fixture-7. The TypeScript, Swift, and Kotlin libraries each run every row. Do not edit a row to match a bug. Rows whose `note` names a D-2026-10-04 decision come from the readings below.

## Readings (decided 2026-10-05 by established practice, docs/SPEC.md 9a)

The pre-build audit found places where two careful builders could read the grammar or the classifier differently. Each row records the reading the build uses. They were decided on 2026-10-05 by established practice, each with its sources, as Danny asked on #75. The full rows are in `docs/SPEC.md` Section 9a.

| ID | Reading | Effect on vectors |
|---|---|---|
| D-2026-10-04-04 | The `@` rewrite in G2 step 5 runs on the split parts, so the result does not depend on the separator or the marker form (US3 acceptance 2). An `@` touching the opening marker is read as separate. After the split, a first part `tag@rest` becomes `tag` and `@rest`, and a part that is exactly `@` joins the part after it. | It changes parser output: `zz@ agentsmith zz` gives `zz-@agentsmith-zz`, not `invalid-handle`. Its G9 rows and the `src/lib/grammar.ts` change land together in spec 005 T035, so no row is added before that. |
| D-2026-10-04-05 | Edit distance is Levenshtein (FR-003). Near-word candidates sort by distance, then by list index (FR-021). A part at distance 1 has exactly one candidate at distance 1, listed first, and may also have candidates at distance 2 after it. | New G1a and `vectors.json` classifier rows: `zz-ocppr-zz` is field (Levenshtein 3; a metric that counts a swap as one edit would say confirm), and `zz-mapper-zz` is confirm with `copper`, then `maple`. |
| D-2026-10-04-08 | The number words `zero` to `nine` count as parts with a digit in the near-word check (FR-021). | New classifier rows: `zz-coper-4-zz` is `confirm` with `copper`, and `zz-bravo-five-six-zz` is `field`. |
| D-2026-10-04-09 | G10 runs number words, then the fold, then the digit-run join, over the parts only (FR-024). | New matching-key rows: `zz-bravo-l-2-zz` matches `zz-bravo-12-zz`, and `zz-@b0b-zz` matches `zz-@bob-zz`. |
| D-2026-10-04-10 | Decided 2026-10-05 by established practice (RFC 8265 and 8266, Unicode C6, UAX #15, UAX #44, UTS #39): the 256 guard counts raw UTF-16 code units first; fullwidth forms map to ASCII and the text is normalized to NFC; whitespace is the Unicode White_Space set; lowercasing is the Unicode mapping without locale rules; a letter that is still not ASCII fails with `unsupported-script`. | The U+00A0, em space, Kelvin sign, and Cyrillic rows join `grammar` and pass today. The fullwidth, combining-acute, and U+FEFF rows wait in `grammar_pending` for the spec 005 T035 parser change. |
| D-2026-10-04-03, D-2026-10-04-06, D-2026-10-04-11 | Scanner readings, decided 2026-10-05 ([spec 004](../004-capture/spec.md), Readings) | New `vectors.json` scanner rows |

## Open questions

| ID | Question | Default |
|---|---|---|
| Q27 | Which formats come first? | RESOLVED [DELEGATED 2026-10-04, #74]: Two data words and a check word |
| Q30 | Which error classes must the check word detect (one wrong word, swapped words, a dropped word, voice confusions)? | RESOLVED [DELEGATED 2026-10-04, #74]: (d1 + 2 * d2) mod a prime N |
| Q31 | Target wordlist size. Sources differ: 5,000 words and a candidate 10,000 [PRODUCT], and "about 4,000 known words" in the recognition plan [OPERATOR 2026-10-02]. Michael adds that each scope can use its own list (FR-022) [MICHAEL 2026-10-03 #45]. | RESOLVED [DELEGATED 2026-10-04, #74]: The proto-v0 filter yield, at least 1,000 |
| Q32 | Language and licensing of the candidate word source | RESOLVED [DELEGATED 2026-10-04, #74]: EFF long wordlist, English, CC BY 3.0 US |
| Q35 | How are "distinct letter shapes" and "distinct sounds" measured, and what is the pass rule for each? | RESOLVED [DELEGATED 2026-10-04, #74]: Both filters skipped in proto-v0; a confusable-letter table and Double Metaphone for the first real list |
| Q50 | How many parts can a code have? (issue #36) | RESOLVED: no design limit (FR-012) |
| Q51 | `zz@-` versus `zz-@`; more words after a handle? (issue #37) | RESOLVED: same code; qualifiers may follow (FR-010) |
| Q52 | Dots outside handles? (issue #38) | RESOLVED: `.eth` names valid as written (FR-023) |
| Q55 | `zz` inside running text (issue #41) | RESOLVED: typed lookup takes one whole code; scanning boxes candidates (spec 004 FR-013) |
| Q57 | Lookalike characters in field codes (issue #44) | RESOLVED: matching key (FR-024) |
| Q58 | Verify the check word before matching (issue #45) | RESOLVED: yes (FR-022, spec 002 FR-021) |
| Q61 | `zz-` and `zz-zz` as bare marks (issue #48) | RESOLVED: they fail (FR-009) |

## Workflows

| Item | Value |
|---|---|
| Governing workflows | anti-slop-code, production-systems, google-developer-style |
| Owners | Spec: Opus 5.5 through Grok Bot. Decomposition: FORGE. Implementation: cloud coding agent. Filing: SCRIBE. |
| CI to reuse | `.github/workflows/ci.yml` (required `build`), `site-ci.yml` (typecheck and test), `free-security-scan.yml`. No new CI. |
