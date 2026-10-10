# Feature spec: capture by camera, typing, or voice

Feature ID: 004-capture
Status: shared-library parts implemented (the scanner rules and the classifier in `packages/zz-core`, with vectors); on-device recognition not built in this repository (zzThat, v1.1). Recognition approach decided (Q18, #74): Option A on the device. Engine qualification ZZ-OCR-QUAL-001 is in draft PR #89; a platform without a PASS receipt ships confirm-only (D-2026-10-10-03). Deepened 2026-10-03: grammar path, decision-band triggers, error states, and edge cases. v1 reads English (ASCII) codes with Option A; trained models and other scripts are v2 (issue #35).
Phase: specify (what and why). The how is in [plan.md](plan.md).
Constitution: [.specify/memory/constitution.md](../../.specify/memory/constitution.md).

## Why

A person reads a code by camera, typing, or voice [BRIEF]. Handwriting and print recognition of zz codes is untested [PRODUCT]. Capture must turn a messy real-world mark into exactly one code, or ask for help, and never silently pick the wrong one [PRODUCT] [OPERATOR 2026-10-02].

## User stories

### US1. Read a handwritten code with the phone camera (P1)

As a field user, I point the phone at a handwritten code and get the code, or a request to confirm or retry, so that I can open its record [BRIEF] [OPERATOR 2026-10-02].

Acceptance: recognition runs on the device; only the decoded code goes to the API; every reading is snapped to the closed wordlist and the check word is verified [OPERATOR 2026-10-02].

1. Given a photo of `zz-copper-lantern-sky-zz` written across two lines of tape, the reader returns one code, `zz-copper-lantern-sky-zz` (FR-009).
2. Given a photo of `zz copper lantern sky zz` written in capitals, the reader returns the canonical lowercase form (FR-008).
3. Given a photo with two codes, the reader shows both and the person picks one; it never picks for them (FR-014).
4. Given a reading where one word is uncertain, the person sees a clarify step that asks about that word only, using wordlist candidates, never live codes (FR-006).

### US2. Type or say a code (P1)

As a user without a usable photo, I type or say the words, so that I can still resolve the code [BRIEF].

Acceptance:

1. Typed input goes through the same grammar library as the demo and the resolver; every `docs/SPEC.md` Section 2.2a G9 vector gives the same result here (FR-008).
2. Spoken words are joined into a code and shown back before lookup. If the person says only the words, the client adds the `zz` markers in what it shows back, and lookup waits for the person to confirm (INFERRED; the closing-marker rule applies to written codes, and the confirm step stands in for it in speech).

### US3. Retry a hard case (P2)

As a user whose reading failed, I can send the photo for a server-side read, so that hard cases still work [OPERATOR 2026-10-02].

Acceptance: the photo leaves the device only on a retry or hard case [OPERATOR 2026-10-02].

## Functional requirements

| ID | Requirement | Source |
|---|---|---|
| FR-001 | Inputs: camera, typing, voice. | [BRIEF] |
| FR-002 | On-device recognition first; photo stays on the device by default. | [OPERATOR 2026-10-02]; Q18 is decided [DELEGATED 2026-10-04, #74]: Option A on the device (Apple Vision, ML Kit), no cloud reader in v1 |
| FR-003 | Every reading is snapped to the closed wordlist (spec 003) and the check word is verified. | [OPERATOR 2026-10-02] |
| FR-004 | Calibrated confidence decides accept, clarify, retry, or abstain, separately for voice, image, and typed input. | [PRODUCT]; thresholds OPEN (Q37) |
| FR-005 | A person confirms low-confidence readings. | [OPERATOR 2026-10-02] [PRODUCT] |
| FR-006 | Correction happens on the client against the wordlist and check word, never by asking the server for nearby codes. | [OPERATOR 2026-10-02] |
| FR-007 | Read-back confirmation errors are measured, not assumed away. | [PRODUCT]; method OPEN (Q37) |
| FR-008 | Every reading, from camera, typing, or voice, passes through the v1 grammar library (spec 003 US3) before snapping, and the client sends only the canonical form. | [MICHAEL 2026-10-02 #33] [MICHAEL 2026-10-02 #34] |
| FR-009 | A code written across two lines, or wrapped around an edge, reads as one code when both markers are found. | [MICHAEL 2026-10-02 #33] |
| FR-010 | Wordlist snapping applies only to parts expected to be wordlist words. Handle parts and field-code parts (names, numbers) are read as written, never snapped, and always shown back for confirmation. A part is treated as a field part only after the near-word check (FR-015). | INFERRED, so a name is never turned into a dictionary word |
| FR-011 | A bare mark is reported as a bare mark. v1 does not resolve it; the client says so and offers typed entry. Linking a bare mark by photo, place, and time is a v2 candidate. | [MICHAEL 2026-10-02 #33]; v1 split INFERRED |
| FR-012 | A reading with letters outside ASCII, or with a reserved symbol (`#`, `$`, `/`, `:`), abstains with the grammar reason. It is never snapped to the nearest valid code. | [MICHAEL 2026-10-02 #34]; abstain rule INFERRED |
| FR-013 | Codes inside running text, and several codes in one view: the scanner finds every marker pair, partial code (an opening `zz-` without its close, or a closing `-zz` without its open), and bare `zz`, draws a box around each, and asks the person to pick the one to process. It never guesses. A partial code is labeled "Incomplete code. Rescan." | [MICHAEL 2026-10-03 #41] (Q55); label wording INFERRED |
| FR-014 | When a photo holds more than one code, the client lists them all and the person chooses. | INFERRED from "never silently pick the wrong one" |
| FR-016 | For a word code, the client verifies the check word against the scope's list (spec 003 FR-022) before it sends the code. A mismatch goes to Clarify; it is never sent as is and never auto-corrected to another valid code. A `wrong-length` result goes to Abstain with `scan.wrong_length` and typed entry. It is not sent, and no word is added or dropped. | [MICHAEL 2026-10-03 #45] (Q58); `wrong-length` band INFERRED (D-2026-10-04-07) |
| FR-017 | Creation check: after a person writes a code on an object, the client can photograph it and confirm it reads the handwriting back to the same canonical form. The check runs on the device, or online when the scope needs a uniqueness check. A failed read asks the person to rewrite or confirm. | [MICHAEL 2026-10-03 #45]; flow INFERRED |
| FR-015 | Before snapping is turned off for a part, the client runs the near-word check (`docs/SPEC.md` Section 2.2a G1, spec 003 FR-021). A letters-only part within edit distance 2 of a wordlist word goes to Clarify with the candidates and the part as written. The part is read as written only after the person picks that. A misread word such as `coper` is never silently kept as field data, and never silently snapped. | INFERRED, PR #43 review |

## Decision bands and error states

Thresholds stay OPEN (Q37). The triggers below say which band applies; they set no numbers.

| Band | Trigger | What the person sees |
|---|---|---|
| Accept | Grammar passes, every snapped word is above the accept threshold, and the check word verifies (word codes) | The canonical code, then the record view |
| Clarify | Grammar passes, but one or more words fall between the thresholds, the check word fails with one uncertain word, or the classifier returns `confirm` (a near-word, FR-015) | The uncertain word with wordlist candidates and the part as written; confirm or type it |
| Retry | A marker is missing or cut off, the photo is blurred, or glare hides part of the code | "Take another photo" with the reason; after a set number of retries, offer the server read (US3) |
| Abstain | Grammar fails for any reason other than a missing or cut-off marker (that is Retry), including `unsupported-script` and `reserved-symbol` (FR-012). A bare mark also lands here in v1 (FR-011), and so does a word code whose check-word verify returns `wrong-length` (FR-016) | The reason in plain words, and typed entry |

Handles and field codes never reach Accept without a person confirming them (FR-010).

## Edge cases

- Markers written in capitals: accepted and shown in lowercase (FR-008). The display rule bars a capital-letter zz in our own materials, not in what people write.
- A circled `(zz)` at one end and a plain `zz` at the other: one code (`docs/SPEC.md` Section 2.2a G3).
- Only the opening marker visible: Retry, not a guess.
- Only the closing marker visible: Retry (INFERRED, D-2026-10-04-06).
- A smiley or star drawn next to the code: ignored by the text reader; drawn symbols are a separate v2 mode.
- Korean, Japanese, or other non-ASCII words between markers: Abstain with `unsupported-script` in v1 (issue #35 for v2).
- Voice input that sounds like two different wordlist words: Clarify with both candidates, never auto-pick.

## Success criteria

Not set for this feature. Research accuracy targets are not acceptance criteria and are not kept in this repo (Q24). Option A and B are compared on the same test set before any switch [OPERATOR 2026-10-02].

## Out of scope

The phone and web apps as products (not yet specified; Q33), the resolver (spec 002), and the wordlist (spec 003).

## Client read pipeline for the v1 build (decided 2026-10-04)

Status: decided. Danny said yes on #74 (2026-10-04). Source: [analysis 2026-10-04](../analysis-2026-10-04.md). The iOS and Android apps both scan, so they need one rule for finding codes in text, or the two apps will disagree. The rows in [spec 003 `vectors.json`](../003-wordlist-checkword/vectors.json) (`scanner`) are the test. The web client in v1 is typing only (spec 005 US6), so it uses steps 3 to 6 on the typed text.

1. Recognize text on the device. Join the recognized lines in reading order (top to bottom, then left to right) with spaces. Each line keeps the recognizer's confidence, from 0 to 1: on iOS the top candidate's `VNRecognizedText.confidence`, on Android `Text.Line.getConfidence()`. Never use ML Kit Element or Symbol confidence. Each token remembers the line it came from, and a word takes its line's confidence. A candidate takes the lowest confidence among the lines its words came from, so a code that wraps onto two lines takes the lower of the two. "Every word" in the band table means every part between the markers, including the check word; the markers do not count (INFERRED). The band function takes a list of (token, line index, line confidence), not recognizer objects. The same band rows run in the Swift and Kotlin grammar libraries: for a word code whose check word verifies, every line at 0.80 gives Accept, one line at 0.79 gives Clarify, and a code wrapped across lines at 0.90 and 0.45 gives Retry.
2. Find candidates with the scanner rules below.
3. Classify each plain code against the bundled list (Section 2.2a G1): word, field, or confirm.
4. For a word code, verify the check word (spec 003) when the bundled list version equals `wordlist_version` from `GET /v1`. Otherwise skip the local check. The server still verifies.
5. Set the band (table below).
6. One candidate in Accept: resolve it. More than one candidate: list them all and wait for a tap. Never resolve a candidate the person did not pick (FR-013, FR-014).

### Scanner rules

Rules 1, 3, and 6, and the closing-only partial in rule 7, are the D-2026-10-04-06 reading. Rules 4 and 5, and the `zz@` partial in rule 7, are the D-2026-10-04-03 reading. The empty pair in rule 5 and the listing in rule 8 are the D-2026-10-04-11 reading. All were decided on 2026-10-05 (Readings, below). A `zz@` partial that ends a clause, in rule 7, is D-2026-10-05-06, Danny's decision on zzThat #43 (docs/SPEC.md 9a).

1. Replace every character with the Unicode White_Space property (docs/SPEC.md G2 step 1), such as a line break, a tab, or U+00A0, with U+0020.
2. Split the text into tokens at spaces and at hyphen characters (U+002D, U+2010 to U+2015, U+2212). Split a circled marker `(zz)` out of any token as its own token.
3. Set aside punctuation around each token:
   - The exact token `(zz)` split out in rule 2 is a marker as it stands. Rule 3 does not touch it.
   - For every other token, set aside these leading characters: `(`, `[`, U+0022 `"`, U+0027 `'`, U+201C `“`, and U+2018 `‘`.
   - Set aside these trailing characters: `)`, `]`, `.`, `,`, `;`, `!`, `?`, U+0022, U+0027, U+201D `”`, and U+2019 `’`.
   - Set aside a trailing `:` only when what remains is `zz`. Anywhere else the `:` stays, so the grammar reports `reserved-symbol` (FR-012).
   - A token with trailing characters set aside ends a clause. Leading characters never end a clause.
   - A token left empty is not a word, but it still ends a clause if it had trailing characters.
4. A marker is a token equal to `zz` or `(zz)`, in any case. A token that starts with `zz@`, in any case, is an opening marker (Section 2.2a G2 step 5). It can open a pair but never close one. Any text after its `@` is content.
5. Two markers in a row form a pair, unless: the first one ends a clause; nothing lies between them (text after `zz@` in an opening token counts as lying between) and one of them is joined by a hyphen to a word outside the pair; a token between them ends a clause; or the first marker is joined by a hyphen to the word before it and the second is joined by a hyphen to the word after it (the gap between two hyphenated codes). So `zz-zz` or `(zz) (zz)` on its own is one pair, and the grammar reports `no-content` (Section 2.2a G3).
6. Each pair is a candidate. The grammar input is the text from the start of the first marker to the end of the second marker, with the characters set aside in rule 3 removed and the original separators kept. It is a code (canonical form and kind) or invalid (the parser's reason).
7. A marker in no pair is partial when it does not end a clause and a word follows it. An opening `zz@` token with text after the `@` is partial even when it ends a clause, because the text after its `@` is its word, and its partial text starts at that token. So `see zz@bob.` gives the partial `zz@bob`, not a bare mark (D-2026-10-05-06). The partial text runs to the clause end, the next marker, or the end of the text. An unpaired `zz` or `(zz)` marker (not a `zz@` token) joined by a hyphen to a word before it (not to a marker) is also partial. Its text runs back to the start of the clause, the previous marker, or the start of the text. Such a marker takes only this backward reading, never the forward one, even when a word follows it. Any other unpaired marker is bare.
8. List candidates in reading order. List each canonical code once. Only codes are merged: bare marks, partials, and invalid candidates are each listed where they appear, because each has its own box.

A stray `zz` in running text can still pair with a real marker. The person then sees both candidates and picks. That is the cost of never guessing.

### Prototype band values

Thresholds stay parameters (Q37). These values let the apps ship. They are not measured results.

| Band | Camera trigger | Typed trigger |
|---|---|---|
| Accept | A word code whose check word verifies, with every word at 0.80 confidence or more | A word code whose check word verifies, or a field code, handle, or name as typed |
| Clarify | Any word between 0.50 and 0.80; a near-word (confirm); a check-word mismatch; any field code, handle, or name (FR-010) | A near-word, or a check-word mismatch |
| Retry | A partial candidate, no candidate at all, or a word below 0.50 in a candidate that otherwise passes (Q37) | Not used |
| Abstain | An invalid candidate, a word code whose verify returns `wrong-length` (`scan.wrong_length`), or a bare mark (FR-011) | A parser failure (with its reason), a word code whose verify returns `wrong-length` (`scan.wrong_length`), or a bare mark |

Bands use the local verify only when step 4 ran. When the list versions differ, the server's 400 `wrong-length` maps to `scan.wrong_length` (zzThat spec.md Errors).

After two retries in one scan, a client may offer the server read (US3) only when `GET /v1` reports `photo_reads: true`. It is false in v1, because Q18 chose on-device reading only, so the v1 apps do not show the offer.

The creation check (FR-017) runs the same steps on the person's photo and passes when the picked candidate's canonical form equals the minted code.

## Readings (decided 2026-10-05 by established practice, docs/SPEC.md 9a)

The pre-build audit found that the scanner rules, read literally, could not pair a `zz@name` token, dropped codes inside brackets or before a colon, and read `zz-zz` as two bare marks, and that a `wrong-length` code had no band. Each row records the reading the build uses. They were decided on 2026-10-05 by established practice, each with its sources, as Danny asked on #75. The full rows are in `docs/SPEC.md` Section 9a. None of these readings changes `src/lib/grammar.ts`.

| ID | Reading | New `vectors.json` scanner rows |
|---|---|---|
| D-2026-10-04-03 | The `zz@` opener holds content (rules 4, 5, and 7). | `zz@agentsmith-zz` gives the handle `zz-@agentsmith-zz`. `see zz@bob` gives a partial, `zz@bob`. `ai-zz@bob` gives one partial, `zz@bob`, because a `zz@` token reads forward only. `zz copper zz@bob zz` gives a partial, `zz copper`, then the handle `zz-@bob-zz`. `zz@agentsmith-zz` written all in capitals gives the same handle, `zz-@agentsmith-zz`. |
| D-2026-10-04-06 | The punctuation set, Unicode White_Space characters as spaces, the grammar input, and a closing-only fragment as partial, so it bands as Retry (rules 1, 3, 6, and 7). | `(zz-copper-lantern-sky-zz)`, `See zz-copper-lantern-sky-zz: it is on the box`, and the code in curly quotes each give `zz-copper-lantern-sky-zz`. `copper-lantern-sky-zz` gives a partial. `copper-lantern-sky-zz goes to bay 4` gives one partial, `copper-lantern-sky-zz`, because the backward reading wins. `zz "copper lantern zz` gives `zz-copper-lantern-zz`. `zz-time:-zz` stays invalid with `reserved-symbol`, which guards the narrow `:` rule. |
| D-2026-10-04-07 | A word code whose verify returns `wrong-length` goes to Abstain with `scan.wrong_length` (FR-016 and both band tables). | None. The check-word rows `zz-copper-lantern-zz` and `zz-copper-lantern-sky-maple-zz` already return `wrong-length`. |
| D-2026-10-04-11 | An empty pair is one `no-content` candidate unless a marker is joined by a hyphen to a word outside it (rule 5). Only codes are merged (rule 8). | `zz-zz` and `(zz) (zz)` each give one invalid candidate with `no-content`. `zz-copper-lantern-sky-zz zz` gives the code, then a bare mark. `zz. zz.` gives two bare marks. |

## Open questions

| ID | Question | Default |
|---|---|---|
| Q18 | Fine-tune our own small model (Option B)? Also: must Option A include an on-device model, or may US1 fall back to cloud vision? | RESOLVED [DELEGATED 2026-10-04, #74]: Option A on the device (Apple Vision, ML Kit); no cloud reader in v1; the Option B benchmark is v2 |
| Q33 | Scope of the zzThat app (web, Android, iOS) as a product: which features ship first? | RESOLVED [DELEGATED 2026-10-04, #74]: iOS and Android together with the zzThat spec 001 scope; the web client in spec 005 |
| Q34 | Where the test set of real photos comes from, and consent for using them | RESOLVED [DELEGATED 2026-10-04, #74]: Team-made photos with written consent, no faces or personal data, kept private, used to measure only |
| Q37 | Confidence thresholds for accept, clarify, retry, and abstain, and how read-back errors are measured | RESOLVED [DELEGATED 2026-10-04, #74]: Accept at 0.80, retry below 0.50, as parameters |
| Q38 | Where voice input is processed, and whether audio leaves the device | RESOLVED [DELEGATED 2026-10-04, #74]: No voice in v1; later, on the device only |
| Q55 | How is a `zz` inside running text treated? (issue #41) | RESOLVED: box every candidate, the person picks (FR-013) |

## Workflows

| Item | Value |
|---|---|
| Governing workflows | anti-slop-code, production-systems, google-developer-style |
| Owners | Spec: Opus 5.5 through Grok Bot. Decomposition: FORGE. Implementation: cloud coding agent. Filing: SCRIBE. |
| CI to reuse | `.github/workflows/ci.yml`, `site-ci.yml`, `free-security-scan.yml`. Model training runs outside CI; a training workflow needs Danny's yes and a named file. |
