# Feature spec: wordlist and check word

Feature ID: 003-wordlist-checkword
Status: not built. Requested in issue #14.
Phase: specify (what and why). The how is in [plan.md](plan.md).
Constitution: [.specify/memory/constitution.md](../../.specify/memory/constitution.md).

## Why

The code is made of words that people write, read aloud, and type. If two words look alike in handwriting or sound alike on a radio, a code can resolve to the wrong record. The codebook has to be built for handwriting, reading, speech, recall, correction, optical recognition, and error detection [NSF]. No validated codebook exists yet [NSF].

## Users

| User | Need |
|---|---|
| Person writing or reading a code | Words that are hard to confuse by eye or ear |
| Recognition (spec 004) | A closed list to snap readings to, plus a check word to catch errors |
| Resolver (spec 002) | Words to build new codes from |
| Michael and Danny | A yield report showing whether the list is big enough for the code space |

## User stories

### US1. Build the wordlist with a yield report (P1)

As the team, we run a pipeline that filters candidate words and reports how many survive each filter, so that we can see whether the list is large enough [issue #14].

Acceptance: the report lists the count before and after each filter, and compares the final size with the size the code space needs.

### US2. Catch errors with a check word (P1)

As a reader, I get an error when a code has one wrong word, so that a misread code does not resolve to the wrong record [NSF] [issue #14].

Acceptance: a library computes and verifies the check word; tests show it detects the error classes named in Q30 once they are chosen.

## Functional requirements

| ID | Requirement | Source |
|---|---|---|
| FR-001 | Filter for distinct letter shapes when handwritten. | [issue #14]; method and pass rule OPEN (Q35) |
| FR-002 | Remove homophones (distinct sounds). | [issue #14]; method and pass rule OPEN (Q35) |
| FR-003 | Every pair of words has an edit distance of at least 3. | [issue #14] |
| FR-004 | Report yield after each filter and the gap to the needed code-space size. | [issue #14] |
| FR-005 | A check word library tuned to handwriting and voice errors. The check word adds error detection, not capacity. | [issue #14] [NSF] |
| FR-006 | Codes are written in lowercase words between `zz-` and `-zz`. Other forms (circled `(zz)` marker, `@` namespace, prefixes) are product options, not yet accepted grammar. | [BRIEF] [NSF]; grammar beyond the framing markers OPEN (Q27). Mixed case and dots, as in the NSF examples `zz@-AgentSmith-neo-zz` and `zz-vitalik.eth-zz`, are excluded until Q27 is answered. |

## Success criteria

Not set. The size the code space needs depends on the formats chosen (Q27) and the target list size (Q31). The spec does not invent a pass mark for the yield.

## Terms

This spec says "check word". `docs/SPEC.md` also says "checksum word". Both mean the same extra word that detects errors.

## Out of scope

Recognition models (spec 004), the resolver (spec 002), and human-factors studies.

## Open questions

| ID | Question | Default |
|---|---|---|
| Q27 | Which formats come first? | None chosen |
| Q30 | Which error classes must the check word detect (one wrong word, swapped words, a dropped word, voice confusions)? | One wrong word (INFERRED minimum) |
| Q31 | Target wordlist size. Sources differ: 5,000 words and a candidate 10,000 [NSF], and "about 4,000 known words" in the recognition plan [OPERATOR 2026-10-02]. | None chosen |
| Q32 | Language and licensing of the candidate word source | None chosen |
| Q35 | How are "distinct letter shapes" and "distinct sounds" measured, and what is the pass rule for each? | None chosen; blocks the shape and sound filter tasks |

## Workflows

| Item | Value |
|---|---|
| Governing workflows | anti-slop-code, production-systems, google-developer-style |
| Owners | Spec: Opus 5.5 through Grok Bot. Decomposition: FORGE. Implementation: cloud coding agent. Filing: SCRIBE. |
| CI to reuse | `.github/workflows/ci.yml` (required `build`), `site-ci.yml` (typecheck and test), `free-security-scan.yml`. No new CI. |
