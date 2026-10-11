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
