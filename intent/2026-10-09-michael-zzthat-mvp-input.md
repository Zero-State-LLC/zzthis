# Product input intake: Michael's zzThat MVP direction (2026-10-09)

Author: Claude (for Michael and Danny)
Date: 2026-10-09
Status: intake. Needs Danny's disposition for each claim. Not implementation authority.
Product: zzThat apps (iOS, Android, web) on the zzThis v1 API (`Zero-State-LLC/zzthis`)

Process: `specs/SCOPE-GOVERNANCE.md` and `intent/_PRODUCT-INPUT-TEMPLATE.md`.
Danny sets the disposition of every row. Do not implement from this file.
Recognition rules and thresholds are Danny's call; Michael's numbers are proposals [MICHAEL 2026-10-08].

## For attention first

Claude's check of these claims against `main` (8189ce1), for Danny and his agents. [AUDIT 2026-10-09: rechecked against `main` 0e9b025; see the audit section below, which supersedes this list where they differ.]

- **This is a re-scope of the zzThat MVP, not a tweak.** Five claims conflict with what Danny has already specified:
  - Codes people write themselves (row 1): v1 only creates codes the system picks (words plus a check word). The reader can read person-made codes, but the app can't create them. Correction: an earlier Claude note to Michael said v1 already accepts them.
  - Duplicates (row 3): every code must be unique today, including expired ones (spec 005 FR-032). Duplicates with location ranking were already planned for v2 (Q56). [CORRECTED 2026-10-09 audit: `specs/RELEASE-ROADMAP.md` now excludes them from v1.2 and gives them no release; they sit in research R-B17 and R-B13. v2.0 (RM-084) covers only scope-aware handles.]
  - A list of matches with % (row 4): today a scan only finds an exact match.
  - Photos to the cloud (row 8): today the photo stays on the phone (SPEC Section 10.3, Q18).
  - The expired message (row 9): today an expired code looks the same as one that doesn't exist, on purpose, so callers can't probe which codes are live.
- `specs/SCOPE-GOVERNANCE.md` treats changes like these as QUEUE by default unless Danny deliberately re-scopes. They are Danny's decisions.
- **Two claims already match the spec:**
  - Spec 004 already accepts a reading at 0.80, so Michael's stricter creation threshold (row 7) fits. [CORRECTED 2026-10-09 audit: only the 0.80 end fits. 0.70 would be Clarify under spec 004, and without a PASS receipt the camera is confirm-only (D-2026-10-10-03), so no automatic Accept exists yet.]
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
| 3 | Duplicates allowed: the same words by different creators (`zz-kathy-found-dog-zz` in California and in New York). After expiry, others may reuse the words. | Q56 / D-2026-10-03-10: free public duplicates with local priority are v2. [CORRECTED 2026-10-09 audit: now unassigned research R-B17, R-B13 (RELEASE-ROADMAP v1.2 Excluded); RM-084 v2.0 is scope-aware handles only.] | Conflict: spec 005 FR-032, `match_key` unique across every code, retired rows included. |
| 4 | A scan shows every registered match at or above the match threshold, with its confidence % beside it. Sort menu: Nearest (only when location is on), Newest, Best match. With location on, Nearest is the top sort; otherwise Newest (newest on top). Never expose the creator's or the scanner's exact location (see below). One match opens directly; two or more show "Multiple matches, pick one"; none shows "No match, scan again" (Lovable POC rule). | Resolve is exact match only (spec 005, SPEC Section 10). | Conflict. New journey (pick from a list). |
| 5 | Close matching for misreads runs against registered codes, not against a word list. The POC used 60% word overlap; Danny can change it. | Snap to the closed wordlist; near-word confirm step (SPEC Section 2.2a). | Conflict for person-made codes. |
| 6 | No near-word "did you mean" for person-made codes: the creation photo and its legibility score do that job. | SPEC near-word check: a part within edit distance 2 of a list word is classified `confirm`. | Conflict: `zz-kathy-lost-cat-zz` asks about all three words today. |
| 7 | Mandatory photo at creation. It binds the code words to the object; OCR on the same photo gives a legibility score. Creation threshold stricter than matching: proposed 70 to 80% or higher. Below it the creator rewrites or retakes. Up to 5 photos per code, kept as reference images for later scans. | Spec 004 capture bands: Accept at 0.80 per word, Clarify 0.50 to 0.80, Retry below 0.50 (Q37 parameters). | Threshold agrees with spec 004. Reference photos per code are new (new persistent entity). |
| 8 | Photos go to the cloud: creator photos and scanner photos, including scans not saved once OCR has run. Used for training and for matching against the creator's reference photos. Uploads are a reduced copy by default (about 1,600 to 2,000 px on the long side; Danny picks); a namespace owner (for example the Army) can choose higher, up to full size. The terms of service say so. | SPEC Section 10.3 steps 2 and 3: the photo stays on the device by default; Q18: no cloud reader in v1; Q34: real photos are measure-only. | Conflict. New sensitive-data class. Michael's reason below. |
| 9 | Liveness: 2 months, rolling from the last use. Use is a scan, or the creator opening the app (which renews all of her codes). The creator's list has Stop and Renew. A scanner of an expired code sees: "This zz-code has expired. If you are its creator, please re-create it for another 2 months live. A code stays live for 2 months from its last use, unless you stop it." The terms of service say data and liveness may change. | `codes.status` has `expired`; `expires_at` exists. | Conflict: resolve returns the same not-found shape for unknown, expired, used, and revoked codes, so callers cannot probe for live codes. |
| 10 | Create menu: Dictionary (None default; BIP39, EFF, Custom greyed); Who can open (Public default; Personal, Group, Community greyed); zzPage permissions (same as Who can open in the MVP); Ranks (Owner only; admin and member greyed). Personal only if easy, with the notice "Personal means other users can't see it. Our system can see it and may use it for training." | Visibility `public` / `private` (spec 005). | Partly new UI; greyed items have no behavior. [CORRECTED 2026-10-09 audit: Personal conflicts. Spec 005 FR-035: `free_public` is always public and only `enterprise` and `logistics` records can be private.] |
| 11 | Destination: a link the creator has, or a zzPage. A scanner can see the zzPage, pick one or more of its links, and save it to the app; a saved zzPage keeps a copy of its text and image for offline viewing (links still need a connection). | Record has title and body; no link field. | New field. [CORRECTED 2026-10-09 audit: Conflict. Spec 005 FR-007 forbids tappable links (phishing); zzPages are research R-ZZPAGE (D-2026-10-10-17).] |
| 12 | Offensive words and trademarks are blocked at create time by a filter. | Issued words come from a curated list; no filter for person-made words. | New. |
| 13 | Points: a running count of points awarded, shown in settings and maybe as a small number on screen. | None in v1. | New. |
| 14 | Case is never distinguished, now and in the long run: upper, lower, and mixed are the same, including the zz prefix and suffix (`ZZ-Kathy-found-dog-zZ`). Reasons: handwriting varies; non-Latin languages have no case; people writing English as a second language tend to write capitals. Create-page examples show code words in capitals with lowercase zz (`zz-KATHY-FOUND-DOG-zz`) to encourage block capitals. The standalone mark is ZZ in our materials; the reader must also recognize a circled (ZZ) or (zz). | SPEC Section 2.2a step 4 case-folds; G3 accepts circled markers in any case; `intent/2026-10-06-v1-display-in-capitals.md` (draft). | Duplicate: matching already behaves this way. Display rule is in the 2026-10-06 intent. |
| 15 | Hidden fields from day one, defaults only in the MVP: a system-made hidden ID per code; namespace `consumer`; dictionary `none`; origin `person-made`. Free and paid are plans inside `consumer`, not separate namespaces. | `codes.scope` (scope is the same idea as namespace); `codes.id`. | Mostly existing. Dictionary and origin are new fields. |
| 16 | Phone numbers in public codes are allowed in alpha, with a report-abuse button. | None. [CORRECTED 2026-10-09 audit: spec 005 FR-007 says no code string holds a phone number; SPEC Section 9a D-2026-10-03-11; zzThat FR-019.] | New. [CORRECTED 2026-10-09 audit: Conflict.] |
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

## Audit against main 0e9b025 (2026-10-09)

Audited by Boof for Danny, after Claude's intake (written against 8189ce1). Sources: `docs/SPEC.md`, specs 002, 004, 005, `specs/RELEASE-ROADMAP.md`, `specs/BACKLOG.md`, `specs/decisions-2026-10-10.md` (#129), and the zzThat spec (`Zero-State-LLC/zzthat` `specs/001-zzthat-apps`, `main` 0f1cbd1). Fixes made in place above are marked `[CORRECTED 2026-10-09 audit]`. No spec file was changed.

Cross-cutting finding: zzThat create depends on `free_public` (zzThat FR-018), and turning on `ZZ_FREE_PUBLIC` is v1.2 (QUEUED, RM-076). v1.0 creates server-chosen codes on the web only; v1.1 is the native apps and camera (RM-065 to RM-075). So a consumer MVP that creates codes in the app is not in v1.0 or v1.1 as planned, independent of the rows below.

| # | Audit | Finding |
|---|---|---|
| 1 | CONFIRMED | Spec 005: "Field codes are never issued in contract 1"; G1 reads field and name kinds. Nearest placements: no-device field-code claim RM-084 (v2.0, Q25); issued format D-2026-10-10-04 (PROPOSED, two words plus check word for v1.0). |
| 2 | CONFIRMED | Hyphens and spaces are already separators (Section 2.2a, normalization step 6). G10 folds lookalikes (0/o, 1/l, 5/s, 2/z, 8/b) and joins digit runs in the match key, so `dock4` vs a numbers field needs a rule against G10. G11 is the no-device unit-prefix format, not a consumer numbers field. |
| 3 | CORRECTED, ALREADY-PLACED | FR-032 conflict confirmed. Not "planned for v2": RELEASE-ROADMAP v1.2 excludes duplicate public codes with local priority and leaves them in research R-B17 and R-B13. RM-084 (v2.0) is scope-aware handles only. zzThat ZQ4 and FR-013 also say no duplicates, no location. |
| 4 | CONFIRMED, ALREADY-PLACED (location) | Exact match only (spec 005 Resolve step 6); zzThat FR-009 and ZQ13 (no nearby live codes). Location is R-B17 (D-2026-10-10-18). A match list with % depends on row 3. |
| 5 | CONFIRMED, ALREADY-PLACED | Suggestions are off everywhere in v1 (Q40, spec 005); per-tenant suggestions are DF-07. Matching against live registered codes is what Q40 forbids ("never a live code"). |
| 6 | CONFIRMED | G1 near-word check (edit distance 2, `confirm`) applies to any letters-only part off the list, so `kathy`, `lost`, `cat` each prompt today. |
| 7 | CORRECTED, ALREADY-PLACED | Creation check is spec 004 FR-017, placed in v1.1 as RM-070 (in-app, on device, passes on canonical equality, not a threshold). Only 0.80 matches spec 004 Accept; 0.70 is Clarify. D-2026-10-10-03: without a PASS receipt the camera is confirm-only. Stored reference photos are new and imply upload (row 8). |
| 8 | CORRECTED, ALREADY-PLACED | Photo upload is v2.2 (B12, RESEARCH-gated, R-B12) and excluded from v1.1 ("No raw photo leaves the device"). `ZZ_PHOTO_READS` false is enforced by the RM-001 config test. Also conflicts with Q34 (measure-only, no training absent consent) and zzThat FR-005, whose consent sentence says "It is not used to train a model." |
| 9 | CONFIRMED | Spec 005 Resolve step 6 and spec 002 FR-011: one not-found shape; zzThat FR-010 and SC-3. No rolling renewal exists; `expires_at` is fixed per mint, and expiring codes in the UI are v1.3 (RM-078). |
| 10 | CORRECTED | Personal conflicts: spec 005 FR-035 allows `private` only in `enterprise` and `logistics`; `free_public` is always public. Dictionary choice is RM-081 (v2.0); ranks map to grants (v1.3, RM-063, RM-080). |
| 11 | CORRECTED, ALREADY-PLACED | Conflict, not just a new field: FR-007 forbids tappable links. zzPages are research R-ZZPAGE (D-2026-10-10-17). |
| 12 | CONFIRMED | RM-028 blocklist covers the issued wordlist only; no filter for person-made text. |
| 13 | CONFIRMED | No points anywhere in either repo. |
| 14 | CONFIRMED | Case-fold in 2.2a; G3 markers in any case, circled `(zz)` needs no separator; Q48 spaces. The display intent `2026-10-06-v1-display-in-capitals.md` is still draft. |
| 15 | CONFIRMED, ALREADY-PLACED | Namespace and Organization model is RM-080 (v2.0, #87 gate); dictionaries RM-081. `consumer` is not a defined scope; the closest is `free_public`. |
| 16 | CORRECTED | Conflict: FR-007 ("no code string holds a phone number"), SPEC 9a D-2026-10-03-11, zzThat FR-019. Report button exists (spec 005 reports; RM-068). |
| 17 | CONFIRMED | zzThat `runtime.md`: three tabs, Scan, Create, My codes. Saved and cloud-synced thumbnails are new and depend on row 8. |

Rows that conflict with the current spec: 1, 3, 4, 5, 6, 8, 9, 10 (Personal), 11, 16. Row 7 conflicts only for stored reference photos.

### Boof recommendation, Danny decides

| # | Recommendation | Reason |
|---|---|---|
| 1 | QUEUE | Core re-scope; needs a contract change and FR-032 relief. Decide with D-2026-10-10-04 and RM-084 rather than inside v1.0. |
| 2 | QUEUE | Rides on row 1; needs a G10 rule for digits next to letters. |
| 3 | QUEUE | Already research R-B17, R-B13; breaks FR-032 and resolve. |
| 4 | QUEUE | Depends on row 3 and R-B17 location privacy. |
| 5 | REJECT for v1 | Q40 forbids matching a misread against live codes (enumeration risk); revisit with row 3. |
| 6 | QUEUE | Only meaningful once person-made codes exist (row 1). |
| 7 | ACCEPT (creation check only) | RM-070 already does it in v1.1; queue stored reference photos with row 8. Thresholds stay with Q37 and the qualification receipt. |
| 8 | QUEUE | v2.2 research; needs consent, data-lifecycle and threat-model updates; contradicts the shipped zzThat consent text. |
| 9 | QUEUE | Rolling renewal is new; keep the uniform not-found shape (anti-probing). An owner-only expired view is safer than a public message. |
| 10 | ACCEPT (Public only, greyed rest) | Public matches today; Personal needs FR-035 change; greyed controls add UI only. |
| 11 | QUEUE | R-ZZPAGE must resolve FR-007 link safety first. |
| 12 | ACCEPT | Needed for any person-made text; extend RM-028 when row 1 lands. |
| 13 | QUEUE | No spec or purpose defined. |
| 14 | ACCEPT | Already true for matching; finish the 2026-10-06 display intent. |
| 15 | QUEUE | RM-080 (v2.0) owns the model; avoid a parallel `consumer` namespace. |
| 16 | REJECT | Directly contradicts FR-007 and D-2026-10-03-11 (personal data in codes). |
| 17 | QUEUE | "Saved" local-only list is small, but cloud sync depends on row 8. |

Process calls (SCOPE-GOVERNANCE classification, bundle assignment) are Prabu's; dispositions are Danny's.

### Future integration path (proposal, per conflicting row)

PROPOSAL by Boof at Danny's request, not a decision. Default placement is further down the roadmap unless the path is cheap and safe. Prior art is cited from general public knowledge of those products and should be rechecked before any design is adopted (RM-010 style).

Shared prerequisite for rows 1, 3, 4, 5, 6: contract 2 (v2.0, RM-087 negotiation and dual-contract tests, D-2026-10-10-12 tolerant readers, RM-075) and the #87 Organization, Scope, Namespace model (RM-080). Contract 1 stays frozen (`docs/CONTRACT-EVOLUTION.md` rule 1), so none of these fit v1.x without breaking existing clients.

**Row 1, person-made codes.**
- Change: a new code `origin` (`issued`, `person-made`) and a `consumer` namespace inside the RM-080 model; mint accepts a person-written canonical form, validated by the G1 grammar, the blocklist (row 12) and a uniqueness or duplicate policy (row 3). Issued codes keep FR-032.
- Privacy and threat model: person-made words are guessable (names, pets, "lost dog"), so enumeration risk is far higher than the D-2026-10-10-04 code-space model. Requires the D-2026-10-10-05 abuse controls, RM-030 /64 limiting, and a threat-model row (RM-029 successor) for squatting popular phrases.
- Prior art: short-link services let users pick a custom back-half only when it is unique within that domain, and branded domains act as namespaces. That maps to per-namespace uniqueness, not global duplicates.
- Fits: v2.0 at the earliest, alongside RM-084 (no-device field-code claim, Q25), which already moves person-written field codes to v2. Touches RM-080, RM-081, RM-084, RM-087, D-2026-10-10-04.

**Row 3, duplicates ranked by date.**
- Change: drop global `match_key` uniqueness for the `consumer` namespace only (FR-032 stays for issued and enterprise codes); resolve returns a list (row 4); add `created_at` ordering and optional coarse location.
- Anti-probing: a duplicate list reveals how many people chose a phrase and when. Mitigate with public-only entries, coarse dates, no owner identity, and the same rate limits as resolve.
- Prior art: what3words avoids duplicates entirely (one address per square) and handles similar addresses by showing location with AutoSuggest; QR and short-link systems have no duplicates by construction. No mainstream system ranks colliding user codes by date, which is a risk signal: newest-on-top lets a later registrant hijack an existing physical code.
- Fits: horizon, after R-B17 and R-B13 exit (already the roadmap placement), not v1.2. Hijack mitigation (owner-confirmed claims, or oldest-active wins with newer shown as "others") must be designed first. Touches FR-032, Q56, Q71, RM-084, D-2026-10-10-18.

**Row 4, match list with confidence %.**
- Change: a contract 2 resolve that can return several candidates, each with a coarse score band rather than a raw %, and a pick screen (zzThat FR-026 already handles several candidates from one photo, so the UI pattern exists).
- Anti-probing: candidates must come only from what the scanner wrote, never from nearby live codes (Q40, ZQ13). Location shows distance bands only (intake privacy notes; R-B17).
- Fits: with row 3 (horizon). Touches spec 005 Resolve, Q40, DF-07, R-B17.

**Row 5, close matching against registered codes.**
- Change: fuzzy lookup over live codes is exactly the suggestion feature Q40 turned off ("never a live code"). A safe variant is fuzzy matching against the code's own creation photo or words only after the scanner already holds an exact candidate.
- Risk: fuzzy live-code matching is an enumeration oracle.
- Fits: DF-07 (deferred), revisit with the R-B12 exit; no earlier than v2.2. Touches Q40, DF-07, R-B12.

**Row 6, no near-word prompt for person-made codes.**
- Change: skip the G1 near-word check when the code's `origin` is `person-made` and the namespace has no dictionary (RM-081 per-scope dictionaries make the check per-namespace). Cheap once rows 1 and 15 exist; a grammar version bump with new vectors (spec 003 FR-019 cross-platform parity).
- Fits: same release as row 1 (v2.0). Touches SPEC 2.2a G1, RM-081.

**Row 8 (and row 7 reference photos, row 17 sync), photos to the cloud and training.**
- Change: R2 photo storage with consent, retention, deletion and export (D-2026-10-10-16, RM-027, RM-085); `ZZ_PHOTO_READS` on and R2 joining the recovery scope (D-2026-10-10-10); new zzThat consent text replacing FR-005 ("not used to train a model"); store privacy labels.
- Privacy and threat model: photos carry faces, addresses, EXIF location; training use needs separate opt-in consent beyond Q34's measurement-only corpus. Strip EXIF on device, downscale (Michael's 1,600 to 2,000 px), separate training opt-in from the service upload.
- Fits: v2.2 (B12, RESEARCH-gated), the existing roadmap placement. Training use should be its own research gate. Touches Q18, Q34, R-B12, RM-001 config test, D-2026-10-10-10, D-2026-10-10-16.

**Row 9, expired message and rolling liveness.**
- Change: rolling expiry is a server-side `expires_at` update on use (data model only, contract additive). The public expired message is the risk: it breaks the one not-found shape (spec 002 FR-011) and lets anyone tell a once-used code from a never-used one.
- Safer path: keep one public not-found; show "expired, renew?" only to the signed-in owner (My codes and owner resolve), and send the owner a renewal reminder. Renewal on scan must not let a scanner keep someone else's code alive indefinitely without the owner's choice (product call).
- Prior art: dynamic QR and short-link services typically show a generic "link inactive" page and offer reactivation in the owner dashboard, not to scanners.
- Fits: owner-only renewal could be v1.3 with RM-078 (expiring codes in the web UI) if additive; the public message is REJECT unless the threat model accepts it. Touches spec 002 FR-011, spec 005 Resolve step 6, zzThat FR-010, RM-078.

**Row 10, Personal visibility.**
- Change: allow `private` in the consumer namespace (FR-035 amendment), which is additive to contract 1 only if clients tolerate it (D-2026-10-10-12). Training use of private content needs the row 8 consent.
- Fits: v2.0 with RM-080, since `free_public` is defined as always public. Touches FR-035, RM-080.

**Row 11, links and zzPages.**
- Change: a structured, non-tappable-by-default link field with an interstitial ("You are leaving zzThat for example.com"), domain display, and link scanning, the pattern URL shorteners use against phishing.
- Fits: R-ZZPAGE exit, then v2.x. Touches FR-007, D-2026-10-10-17.

**Row 16, phone numbers in codes.**
- Change: a phone number in a code string is permanent, public, handwritten and searchable; that is the reason for D-2026-10-03-11. The safer alternative is a contact relay (scanner messages the owner through the app) or a phone number in the record body (allowed today, already behind `create.public_hint`).
- Fits: recommend REJECT for the code string; the relay is a horizon idea. Touches FR-007, D-2026-10-03-11, zzThat FR-019.
