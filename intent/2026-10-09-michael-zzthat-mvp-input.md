# Product input intake: Michael's zzThat MVP direction (2026-10-09)

Author: Claude (for Michael and Danny)
Date: 2026-10-09
Status: intake. Needs Danny's disposition for each claim. Not implementation authority.
Product: zzThat apps (iOS, Android, web) on the zzThis v1 API (`Zero-State-LLC/zzthis`)

Process: `specs/SCOPE-GOVERNANCE.md` and `intent/_PRODUCT-INPUT-TEMPLATE.md`.
Danny sets the disposition of every row. Do not implement from this file.
Recognition rules and thresholds are Danny's call; Michael's numbers are proposals [MICHAEL 2026-10-08].

## For attention first

Claude's check of these claims against `main` (8189ce1), for Danny and his agents:

- **This is a re-scope of the zzThat MVP, not a tweak.** Five claims conflict with what Danny has already specified:
  - Codes people write themselves (row 1): v1 only creates codes the system picks (words plus a check word). The reader can read person-made codes, but the app can't create them. Correction: an earlier Claude note to Michael said v1 already accepts them.
  - Duplicates (row 3): every code must be unique today, including expired ones (spec 005 FR-032). Duplicates with location ranking were already planned for v2 (Q56).
  - A list of matches with % (row 4): today a scan only finds an exact match.
  - Photos to the cloud (row 8): today the photo stays on the phone (SPEC Section 10.3, Q18).
  - The expired message (row 9): today an expired code looks the same as one that doesn't exist, on purpose, so callers can't probe which codes are live.
- `specs/SCOPE-GOVERNANCE.md` treats changes like these as QUEUE by default unless Danny deliberately re-scopes. They are Danny's decisions.
- **Two claims already match the spec:**
  - Spec 004 already accepts a reading at 0.80, so Michael's stricter creation threshold (row 7) fits.
  - G3 already allows a circled zz with no separator, and Q48 already allows spaces between words. Michael's long-run idea (Later) is mostly about telling users it is allowed.

## Source

- Source/person: Michael Chung, reviewing four AI answers on word lists, postal codes and collisions, then his "Blob for MVP" and follow-up notes, 2026-10-09.
- Companion for Danny (human): `zzThat_MVP_decisions_for_Daniel_2026-10-09-cd.docx` (same decisions, with Michael's reasoning).
- Exact claims preserved (Michael's words, lightly cleaned up):
  - "The simplest and also meaningful use case that we want to launch with our zzThat app ... We don't do dictionaries. We focus on letting the users create their own code words, that is anything from one code word up to three."
  - "There's going to be collisions, so the simplest way is to just rank the collisions ... by date when they were registered."
  - "As long as our system accepted [the match], even if low confidence, it has a very high chance of being accurate, thus we go with the most recent at top." "We don't need to solve the location, unless the users have location on."
  - "All the creator users' photos and also the scanner users' photos are coming into our cloud and we are using that for training."
  - "The evaluation or reading at the creation point should be higher than 60% ... perhaps 70 to 80% or higher."
  - "In the long run we don't distinguish between upper and lower case, and even mixed, because people's handwriting is varied; and also in non-Latin languages there are no upper and lower."

## Normalize

| # | Claim [MICHAEL 2026-10-09] | Existing capability/bundle | Duplicate/conflict? |
|---|---|---|---|
| 1 | zzThat MVP creates person-made codes: the user writes 1 to 3 words of their own. No dictionary, no check word. The app can still offer an issued code later. | Spec 005 contract 1 issues word codes (server picks words plus check word) and handles only. | Conflict: "Field codes are never issued in contract 1" (spec 005). The grammar already reads person-made codes (G1, field and name kinds). |
| 2 | Optional numbers field after the words: digits only, up to 15 digits plus up to 5 dashes (dashes ignored for matching), stored as text so leading zeros stay. The number field is the final digit group or groups; a part with letters is a word (`dock4` is a word). | G11 no-device formats (`zz-bravo-1-2-3-4-zz`). | New for consumer create. Check against G1 and G10. |
| 3 | Duplicates allowed: the same words by different creators (`zz-kathy-found-dog-zz` in California and in New York). After expiry, others may reuse the words. | Q56 / D-2026-10-03-10: free public duplicates with local priority are v2. | Conflict: spec 005 FR-032, `match_key` unique across every code, retired rows included. |
| 4 | A scan shows every registered match at or above the match threshold, with its confidence % beside it. Sort menu: Nearest (only when location is on), Newest, Best match. With location on, Nearest is the top sort; otherwise Newest (newest on top). Never expose the creator's or the scanner's exact location (see below). One match opens directly; two or more show "Multiple matches, pick one"; none shows "No match, scan again" (Lovable POC rule). | Resolve is exact match only (spec 005, SPEC Section 10). | Conflict. New journey (pick from a list). |
| 5 | Close matching for misreads runs against registered codes, not against a word list. The POC used 60% word overlap; Danny can change it. | Snap to the closed wordlist; near-word confirm step (SPEC Section 2.2a). | Conflict for person-made codes. |
| 6 | No near-word "did you mean" for person-made codes: the creation photo and its legibility score do that job. | SPEC near-word check: a part within edit distance 2 of a list word is classified `confirm`. | Conflict: `zz-kathy-lost-cat-zz` asks about all three words today. |
| 7 | Mandatory photo at creation. It binds the code words to the object; OCR on the same photo gives a legibility score. Creation threshold stricter than matching: proposed 70 to 80% or higher. Below it the creator rewrites or retakes. Up to 5 photos per code, kept as reference images for later scans. | Spec 004 capture bands: Accept at 0.80 per word, Clarify 0.50 to 0.80, Retry below 0.50 (Q37 parameters). | Threshold agrees with spec 004. Reference photos per code are new (new persistent entity). |
| 8 | Photos go to the cloud: creator photos and scanner photos, including scans not saved once OCR has run. Used for training and for matching against the creator's reference photos. Uploads are a reduced copy by default (about 1,600 to 2,000 px on the long side; Danny picks); a namespace owner (for example the Army) can choose higher, up to full size. The terms of service say so. | SPEC Section 10.3 steps 2 and 3: the photo stays on the device by default; Q18: no cloud reader in v1; Q34: real photos are measure-only. | Conflict. New sensitive-data class. Michael's reason below. |
| 9 | Liveness: 2 months, rolling from the last use. Use is a scan, or the creator opening the app (which renews all of her codes). The creator's list has Stop and Renew. A scanner of an expired code sees: "This zz-code has expired. If you are its creator, please re-create it for another 2 months live. A code stays live for 2 months from its last use, unless you stop it." The terms of service say data and liveness may change. | `codes.status` has `expired`; `expires_at` exists. | Conflict: resolve returns the same not-found shape for unknown, expired, used, and revoked codes, so callers cannot probe for live codes. |
| 10 | Create menu: Dictionary (None default; BIP39, EFF, Custom greyed); Who can open (Public default; Personal, Group, Community greyed); zzPage permissions (same as Who can open in the MVP); Ranks (Owner only; admin and member greyed). Personal only if easy, with the notice "Personal means other users can't see it. Our system can see it and may use it for training." | Visibility `public` / `private` (spec 005). | Partly new UI; greyed items have no behavior. |
| 11 | Destination: a link the creator has, or a zzPage. A scanner can see the zzPage, pick one or more of its links, and save it to the app; a saved zzPage keeps a copy of its text and image for offline viewing (links still need a connection). | Record has title and body; no link field. | New field. |
| 12 | Offensive words and trademarks are blocked at create time by a filter. | Issued words come from a curated list; no filter for person-made words. | New. |
| 13 | Points: a running count of points awarded, shown in settings and maybe as a small number on screen. | None in v1. | New. |
| 14 | Case is never distinguished, now and in the long run: upper, lower, and mixed are the same, including the zz prefix and suffix (`ZZ-Kathy-found-dog-zZ`). Reasons: handwriting varies; non-Latin languages have no case; people writing English as a second language tend to write capitals. Create-page examples show code words in capitals with lowercase zz (`zz-KATHY-FOUND-DOG-zz`) to encourage block capitals. The standalone mark is ZZ in our materials; the reader must also recognize a circled (ZZ) or (zz). | SPEC Section 2.2a step 4 case-folds; G3 accepts circled markers in any case; `intent/2026-10-06-v1-display-in-capitals.md` (draft). | Duplicate: matching already behaves this way. Display rule is in the 2026-10-06 intent. |
| 15 | Hidden fields from day one, defaults only in the MVP: a system-made hidden ID per code; namespace `consumer`; dictionary `none`; origin `person-made`. Free and paid are plans inside `consumer`, not separate namespaces. | `codes.scope` (scope is the same idea as namespace); `codes.id`. | Mostly existing. Dictionary and origin are new fields. |
| 16 | Phone numbers in public codes are allowed in alpha, with a report-abuse button. | None. | New. |
| 17 | On the phone: "My codes" (created) and "Saved" (scanned and saved) lists with small photo copies inside the app. Without sign-in they live on that phone only; with sign-in they come back from the cloud at the reduced size. | zzThat tabs: Scan, Create, My codes. | Adds "Saved". |

## Disposition

Michael's request is the target he asked for. Danny sets the disposition (ASSIMILATE, QUEUE, SHADOW, RESEARCH, REJECT).

| # | Michael's request | Disposition | Bundle | Target release | Reason |
|---|---|---|---|---|---|
| 1 | zzThat MVP | Danny | | | |
| 2 | zzThat MVP | Danny | | | |
| 3 | zzThat MVP | Danny | | | |
| 4 | zzThat MVP | Danny | | | |
| 5 | zzThat MVP | Danny | | | |
| 6 | zzThat MVP | Danny | | | |
| 7 | zzThat MVP | Danny | | | |
| 8 | zzThat MVP | Danny | | | |
| 9 | zzThat MVP | Danny | | | |
| 10 | zzThat MVP (UI shows greyed options) | Danny | | | |
| 11 | zzThat MVP | Danny | | | |
| 12 | zzThat MVP | Danny | | | |
| 13 | zzThat MVP | Danny | | | |
| 14 | Already true for matching; display per the 2026-10-06 intent | Danny | | | |
| 15 | zzThat MVP (defaults only) | Danny | | | |
| 16 | zzThat MVP | Danny | | | |
| 17 | zzThat MVP | Danny | | | |

## Scope-change test

Rows 1, 3, 4, 7, 8, 9, and 11 expand the current release:

- New journey? yes (pick from a list of matches; save a zzPage).
- New authority boundary? no.
- New persistent entity? yes (reference photos; person-made codes; saved zzPages).
- New external integration? no.
- New sensitive-data class? yes (photos stored in the cloud; optional location).
- New deploy dependency? possibly (photo storage).

Under the policy these presume QUEUE unless Danny re-scopes the zzThat MVP. Michael's input is a request to re-scope the zzThat MVP around person-made codes. That is Danny's decision.

## Michael's reasoning on the conflicts

- **Why photos go to the cloud (row 8).** Danny first understood the design as the xTech Army use; the zzthis.com images are military use cases, which suits zzThis. zzThat is consumer, uses no dictionary, and is alpha: the photos are for training and to improve the experience, especially the scanner's. The military will use its own cloud and optionally local devices. If photos stay on the creator's device, a later scanner never benefits from them and the system relies on OCR alone; in the cloud, the creator's photos can be matched against the scanner's.
- **Why newest on top (rows 3 and 4).** Once the system has accepted a match, it is very likely right, so recency works without solving location. Location is used only when users have it on. This is why what3words is not needed for the MVP; it stays a later idea (below).
- **Location privacy (row 4).** Never expose the creator-user's or the scanning user's exact location. Roughly is good. "But in small towns, people probably know who Kathy is." [MICHAEL 2026-10-09]. Claude's suggestions, `[assumed: privacy default]`: store the creator's location only roughly (about neighborhood level); show the scanner a distance band ("within 5 km"), never a pin or an address; widen the band where few people live; never show a scanner's location to anyone.
- **Why a stricter creation threshold (row 7).** The creator can simply retake, the app gently trains creators to print legibly, and a clean creation photo is a better reference for every later scan.

## Later (preserve; not MVP)

- Add-on dictionaries picked at create (BIP39, EFF 7,776 or the short list, custom), and schemes (UPU S10 tracking numbers written `zz-EA-987654321-US-zz` and stored as service, serial, country; Japan Post digital address `zz-ABC-12D6-zz`; the Army's own).
- Word positions with meaning (X1-X2-X3), macros.
- A what3words-style hidden layer and any what3words partnership (Michael's strategy).
- Group and Community access, ranks, a creator's own expiry message, comments on zzPages, open source for the free version.
- Long run, to revisit around 2026-12-09: let users circle the zz prefix and suffix with no dash (G3 already accepts a circled marker with no separator), and possibly drop dashes between words as the OCR improves (spaces are already separators, Q48). A plain `zz` must still be followed by a separator so `buzz` stays a word, and a separator stays before a numbers field.

## Evidence / gates

- Research/evidence needed: the 250-photo set (Q34) for both thresholds; a few spaced and circled samples tagged "later".
- Security/privacy/governance impact: rows 8 (photos in the cloud), 4 (location: never exact, rough only, distance bands; small towns), 9 (expired message vs. not-found shape), 16 (phone numbers).
- Human approval needed: Danny, for every row.

## Implementation authorization

- Implementation authorized: no. Pending Danny's dispositions.
