# Decisions 2026-10-11

Records adopted on 2026-10-11 PT. Earlier October decisions live in [decisions-2026-10-10.md](decisions-2026-10-10.md).

## D-2026-10-11-01 Michael's zzThat MVP input: dispositions and person-made plan (ACCEPTED: Danny, 2026-10-11 ~12:49 AM PT)

- **Question.** PR [#138](https://github.com/Zero-State-LLC/zzthis/pull/138) (`intent/2026-10-09-michael-zzthat-mvp-input.md`) asked Danny to dispose seventeen product claims and to choose how person-made codes enter the roadmap after research against specs, contracts, threat model, and comparable products.
- **Evidence.** The audited intake and Boof recommendations in #138; the research pass (what3words uniqueness, Bitly permanent vanity, ICANN redemption-before-reuse, Snap/Spotify system IDs, Apple 1.2 / Play UGC, Apple privacy and AI-consent norms); `docs/CONTRACT-EVOLUTION.md` (contract 1 frozen through v1.1; uniqueness and namespace changes need a new contract); `docs/THREAT-MODEL.md` (exact match, uniform not-found, no live-code hints); `specs/RELEASE-ROADMAP.md` (duplicates excluded from v1.2; photo reads v2.2; Q25/RM-084 at v2.0); zzThat FR-017 / ZQ11 (server-chosen words; person-written claim dropped); D-2026-10-10-21 (public create at v1.1 stays server-chosen).
- **Alternatives for person-made codes (row 1).**
  - (A) Full person-made claim at **v2.0** under contract 2 (Q25 / RM-084 shape: first-come, global FR-032 uniqueness, min entropy, blocklist/trademark on code parts, no fuzzy live match, new OCR qualification). Selected for the real capability.
  - (B) Earliest additive contract-1 slice (optional mint field / prefix) at v1.2 or v1.3. **Not planned.** Would need an explicit contract amendment after the v1.1 freeze (D-2026-10-10-12) and still would not deliver duplicates or open-vocab OCR safely.
  - (C) Suggested / re-roll **server-chosen** words at **v1.1** with `ZZ_FREE_PUBLIC` (picker UX; mint and re-roll unchanged on the wire). Selected for the near-term create experience.
- **Decision (accepted by Danny, 2026-10-11 PT).**
  1. Adopt the researched dispositions in the Disposition table of `intent/2026-10-09-michael-zzthat-mvp-input.md` (rows 1–17). Highest-impact: row 1 QUEUE v2.0 with (C) at v1.1; row 3 keep out of v1.x; row 5 REJECT live-code fuzzy match; row 8 QUEUE v2.2 with consent; row 9 owner-only renew QUEUE v1.3 and REJECT public expired message.
  2. Person-made plan: **(C)** now, **(A)** at v2.0; **(B)** is not on the roadmap.
  3. New BACKLOG items: RM-113 (v1.1 suggested-word picker), RM-114 (v1.3 owner-only renew), RM-115 (zzThat local Saved), RM-116 (v2.0 person-made claim design + threat-model row), RM-117 (v2.2 cloud photo / training consent before RM-092 / RM-097).
  4. RM-084 remains the no-device field-code claim vehicle; RM-116 is the consumer person-made claim design that must stay consistent with RM-084, FR-032, and CONTRACT-EVOLUTION.
  5. Process calls (bundle assignment, SCOPE-GOVERNANCE classification of follow-on PRs) stay with Prabu; product dispositions in this record are Danny's.
- **Consequences.** #138 may merge as intake with filled dispositions. zzThat specs gain RM-113 and RM-115 requirements (separate PR). No wire change in this decision. Contract 1 stays frozen through v1.1.
- **Revisit when.** RM-116 design review, R-B17/R-B13 exit, or a store or abuse finding that forces earlier claim work (still requires a contract amendment if before v2.0).

## Michael's answers of 2026-10-11 (D-2026-10-11-02 to D-2026-10-11-15)

Source: Michael's reply "zzThat: answers for Dan" (2026-10-11), answering Danny's two messages of 2026-10-10 (19 store and privacy questions; the #138 MVP list). Intake: [intent/2026-10-11-michael-store-privacy-mvp-answers.md](../intent/2026-10-11-michael-store-privacy-mvp-answers.md). Michael owns product answers; Prabu and Zod own the build; Danny approves merges. Builds land in zzThat issues, not here.

## D-2026-10-11-02 iOS v1: Sign in with Apple beside Google (ACCEPTED: Michael, 2026-10-11)

- **Decision.** Keep Google sign-in. iOS v1 also offers Sign in with Apple at equal prominence (App Store Review Guideline 4.8).
- **Consequences.** RM-118. Spec 005 already carries the Apple identity and `identities.apple_client_id`; the zzThat client must ship the button and flow.

## D-2026-10-11-03 iOS v1: in-app account deletion with Apple token revocation (ACCEPTED: Michael, 2026-10-11)

- **Decision.** A signed-in user can delete the account from inside the app (Guideline 5.1.1(v)). Deletion revokes the stored Apple token. The web deletion link https://zz.zer0state.com/account/ stays for the store forms.
- **Consequences.** RM-119. Server side is spec 005 FR-023 (`DELETE /v1/me` revokes the Apple token first); the client needs the entry point, confirmation, and signed-out end state.

## D-2026-10-11-04 Public contact address zzsupport@zer0state.com (ACCEPTED: Michael, 2026-10-11)

- **Decision.** `zzsupport@zer0state.com` is the only public address for the apps: support, privacy contact, store contact, and abuse reports. It appears in the app and in the site footer. It is kept apart from zer0state's other mail so it can be handed over later.
- **Consequences.** RM-122. **Action for Danny:** create the mailbox (and routing to Danny and Michael) before any surface shows it.

## D-2026-10-11-05 Early release is 18+ (ACCEPTED: Michael, 2026-10-11)

- **Decision.** Early release is adults only (18+), stated in the Terms. Store age ratings are whatever Apple's and Google's questionnaires produce. 13+ may come later and would need a new decision.
- **Consequences.** RM-120 (age gate or affirmation at sign-up, Terms clause, rating questionnaires).

## D-2026-10-11-06 Name it "early release" (ACCEPTED: Michael, 2026-10-11)

- **Decision.** The store listings and the app say "early release". Never "alpha", "beta", or "test" (Apple rejects public apps labeled beta or test). The Terms carry the early-release clauses (D-2026-10-11-09).
- **Consequences.** RM-121: copy sweep of the app, `design/copy.json` keys used by zzThat, and listing text.

## D-2026-10-11-07 No zzThis mention on zzThat surfaces (ACCEPTED: Michael, 2026-10-11)

- **Decision.** No "zzThis" or "zzthis.com" anywhere in the zzThat app, store listings, privacy policy, or Terms. This covers visible copy and URLs a user can see. API hostnames that the user never sees are not copy; any visible link must use a zzThat or zer0state host.
- **Consequences.** RM-121 sweep includes this check; D-2026-10-11-08 picks a policy host that satisfies it.

## D-2026-10-11-08 Privacy answers 1 to 19 (ACCEPTED: Michael, 2026-10-11)

| # | Answer |
|---|---|
| 1 | Declare what Google's sign-in SDK collects in App Store and Play privacy answers, per Xcode's privacy report. |
| 2 | Policy wording, verbatim: "We do not keep your name or email. If you choose Google or Apple sign-in, that provider handles your sign-in under its own privacy policy and sends us only an account ID." |
| 3 | Same approach on Google Play. |
| 4 | Legal entity: zer0state's exact legal name. zer0state publishes and owns the developer accounts. **Danny to supply the exact name.** |
| 5 | Postal address: zer0state's business address. **Danny to supply.** |
| 6 | Effective date: the day the policy goes live, on or before the first store submission. |
| 7 | Privacy contact: zzsupport@zer0state.com. |
| 8 | 18+ for early release (D-2026-10-11-05). |
| 9 | US-only launch: no EU/UK controller, basis, or transfer sections yet. |
| 10 | California: we do not sell or share, as long as no ad or analytics SDK shares data. Adding any such SDK reopens this answer. |
| 11 | Governing law: zer0state's home state. **Danny to confirm the state.** |
| 12 | Policy host: Danny's call; see D-2026-10-11-09. |
| 13 | EU DSA trader status: not needed while US-only. |
| 14 | Android upload key and Play App Signing: Danny's. If the Play account is a zer0state organization account, the 12-tester closed test does not apply. |
| 15 | Age ratings: whatever the questionnaires give, with 18+ in the Terms. |
| 16 | Enter store privacy answers from the drafts; deletion link https://zz.zer0state.com/account/. No Photos entry: no photo leaves the phone in v1. Plus in-app deletion on iOS. |
| 17 | 24-hour report handling: Danny is the moderator, Michael the backup. |
| 18 | Terms: see D-2026-10-11-10. |
| 19 | zzsupport@zer0state.com in the app and the site footer. |

## D-2026-10-11-09 Privacy policy URL on zzthat.com (PROPOSED: awaiting Danny)

- **Question.** Michael left the host to Danny: zzthat.com or the zer0state site. The repo has no host yet; zzThis reads `PUBLIC_PRIVACY_URL` from the environment and zzThat #47 tracks the broken link.
- **Recommendation.** Publish at `https://zzthat.com/privacy` (and `/terms`). A zzThat-branded host fits D-2026-10-11-07 and moves cleanly with the app if it is handed over. Fallback: a zer0state.com path.
- **Consequences if accepted.** RM-123; set `PUBLIC_PRIVACY_URL`; close zzThat #47 against it. **Action for Danny:** confirm, and confirm zzthat.com DNS/hosting.

## D-2026-10-11-10 Terms of Use and content policy go to Michael before publishing (ACCEPTED: Michael, 2026-10-11)

- **Decision.** The Terms must include: early release; provided as is, without warranties; features may change; we may suspend or discontinue the app at any time; codes and data may be lost or deleted; use at your own risk; liability limited as far as the law allows; users must be 18 or older; public codes are visible to anyone, so no private information in them. Michael also listed "codes stay live 2 months from last use, then the words may be reused"; that clause is **held** by OPEN D-2026-10-11-15.
- **Consequences.** RM-124: draft Terms and content policy for Michael's review. Not final legal text; nothing publishes before Michael approves (and counsel, if Danny wants it).

## D-2026-10-11-11 v1.1 code creation: length choice and re-roll limit (ACCEPTED: Michael, 2026-10-11; limit set by Danny's team)

- **Decision.** Michael confirms option (C) of D-2026-10-11-01. The user picks a 1, 2, or 3 word code; the app suggests the words; the user takes a set or rolls again. Re-roll limit: **5 rolls per creation** (our call, as Michael delegated). Rolls are also rate-limited per account and device on the server so the limit is not the only control. Writing your own words stays at v2.0 (RM-116).
- **Consequences.** RM-125 extends RM-113. Open check for build: confirm the G1 grammar and FR-032 minimum-entropy rules allow a 1-word public code; if not, the 1-word option waits and Michael is told.

## D-2026-10-11-12 Confirmed rejects (ACCEPTED: Michael, 2026-10-11)

- No near-miss matching against live codes. No public "expired" message: an expired code looks like one that never existed; the owner still sees it in their own app. No phone numbers inside codes.
- Confirms D-2026-10-11-01 rows 5 and 9 and adds the phone-number rule to the blocklist (RM-125 acceptance).

## D-2026-10-11-13 Links and zzPages: requirements for when they come (ACCEPTED: Michael, 2026-10-11)

- **Decision.** Out of the early release. When built: sign-in required to add a link; known-bad-site check on add and on open; a "You're leaving zzThat" screen showing the full address; a Report button; a daily limit per account. Sign-in, not email collection.
- **Consequences.** RM-126 (horizon, unscheduled).

## D-2026-10-11-14 Points unscheduled; photo training v2.2 opt-in (ACCEPTED: Michael, 2026-10-11)

- **Points.** Not scheduled until Michael writes a short purpose (what earns them, what they are for, no cash value).
- **Photos.** No photo leaves the phone in v1. Training uploads wait for v2.2 with explicit opt-in (confirms RM-117).

## D-2026-10-11-15 Code reuse after expiry vs. uniqueness (ACCEPTED: option B, Danny, 2026-10-14, [#170](https://github.com/Zero-State-LLC/zzthis/issues/170#issuecomment-6175348667); locked in a #164 comment 2026-10-12)

- **Conflict.** Michael's Terms list says "codes stay live 2 months from last use, then the words may be reused." Current rule: codes stay unique, never reissued, through v1.x pending research (spec 005 FR-032; Q36; D-2026-10-11-01 row 3 QUEUE, hijack risk; DATA-LIFECYCLE "retired codes never reissued").
- **Uniqueness rule is unchanged** until Danny decides. The reuse clause is held out of the Terms draft.
- **Options.**
  - (A) Keep uniqueness: Terms say inactive codes may expire, and say nothing about reuse. No spec change. Tell Michael why (a reused code points old printed labels at a stranger).
  - (B) Accept 2-month expiry from last use but no reuse in v1.x; reuse revisited with RM-116 / contract 2 research. Needs a "last use" definition and an expiry job; uniqueness unchanged.
  - (C) Adopt reuse after a quarantine (ICANN-style redemption period, e.g. 2 months live + N months held), only for free public codes, in contract 2. Needs threat-model row, FR-032 change, and DATA-LIFECYCLE change.
- **Owner.** Danny. **Recommendation.** (A) or (B) for early release; (C) only with RM-116.
