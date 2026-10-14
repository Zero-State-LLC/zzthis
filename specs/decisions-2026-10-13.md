# Decision records, 2026-10-13: spec-depth gaps

Status: every record here is **ACCEPTED** as recommended (Danny, 2026-10-14, [#170](https://github.com/Zero-State-LLC/zzthis/issues/170#issuecomment-6175348667)). Michael still owns the confusable letter groups (D-2026-10-13-07), the Terms wording (D-2026-10-13-04), and hearing why one-word codes are out (D-2026-10-13-02). It was written as PROPOSED; Each one closes a gap that the 2026-10-13 spec-depth audit ([analysis](analysis-2026-10-13-spec-depth.md)) found: a builder would otherwise have to guess. Each record gives a recommendation and the alternatives. Danny decides (Michael where marked). Until a record is accepted, the current spec text stands and the backlog item stays where it is.

Format follows [decisions-2026-10-10.md](decisions-2026-10-10.md): question, evidence, alternatives and recommendation, consequences, revisit.

## D-2026-10-13-01 Idle expiry and revive under D-2026-10-11-15 option B (ACCEPTED: Danny, 2026-10-14, [#170](https://github.com/Zero-State-LLC/zzthis/issues/170#issuecomment-6175348667))

- **Question.** D-2026-10-11-15 option B says codes expire after 60 days idle plus 30 days of grace, the owner can revive them at any time, and a code is never reissued. Spec 005 has no "last active" value, no expiry step in the daily run, no revive path, and no cache rule for it. What counts as activity, which codes expire, and how does revive work?
- **Evidence.** Spec 005 FR-009 (one not-found body), FR-026 (daily run), the codes data model (`expires_at` only, issuer-set); `workers/api/src/codes/view.ts` (effective status); zzThat already shows `codes.status_expired` in My codes. No email is stored (D-2026-10-11-08 answer 2), so no warning can reach an idle owner. The option B lock is a comment on zzThis #164; the record there still says OPEN.
- **Alternatives and recommendation.**
  1. Activity. (a) The owner's sign-in or token refresh, counted for the whole account. (b) Per-code actions: opening Code detail, saving a version, or a "keep live" tap. (c) Any resolve by anyone. Recommended: (a). It needs no wire change and works while zzThat #54 is open. (c) is rejected because a stranger's scans would keep an abandoned code alive forever, which is the opposite of the intent.
  2. Scope. Recommended: `free_public` codes only. `enterprise` and `logistics` codes keep issuer-set `expires_at` (RM-078, RM-114).
  3. Revive. (a) Automatic: the owner's next sign-in or refresh turns every idle-expired code back on. (b) An explicit per-code revive, by saving a record version. Recommended: (a) for v1.1, because it needs no new route and no app change beyond showing the state; (b) can join RM-114 in v1.3.
  4. Warning. Recommended: none in v1.x. There is no channel to send it, and the Terms say so plainly.
- **Proposed spec text (spec 005, new FR-036).** "Idle expiry (D-2026-10-11-15 option B). Applies to `free_public` codes only. `accounts.last_active_at` is set by `POST /v1/auth/token` and `POST /v1/auth/refresh`, at most once per UTC day. The FR-026 daily run sets `codes.idle_expired_at` on each active `free_public` code whose owner's `last_active_at` is more than 90 days old, in batches of 500 rows, at most 10 batches per run, with one `code.expire` audit event per code. Such a code answers the one not-found body (FR-009) and shows `expired` in `GET /v1/me/codes`. The owner's next sign-in or refresh clears `idle_expired_at` on all their codes in the same batch, with one `code.revive` event each, unless the account is suspended. Re-roll refuses an idle-expired code. A code is never reissued (Q36). The run purges cache keys as FR-023 step 3 does; otherwise the stale window is the FR-018 60 seconds. Migration 0004 adds both columns (`last_active_at` backfilled to the migration time) and their indexes. A scan never changes `last_active_at`. No wire change."
- **Proposed Terms text.** "Inactive codes. If you do not open zzThat while signed in for 90 days, your codes stop showing to the public and work like codes that do not exist. Sign in again at any time and they turn back on. We never give your code to anyone else."
- **Consequences.** New backlog item for the server work in v1.1. It must ship within 80 days of `ZZ_FREE_PUBLIC` turning on, because the first code can expire 90 days after the first public mint. RM-114 keeps issuer-set expiry only. zzThat needs no new copy: an expired code already shows `codes.status_expired`.
- **Revisit when.** A channel to reach owners exists, or Michael wants per-code keep-alive.

## D-2026-10-13-02 Word count and re-rolls for RM-125 (ACCEPTED: Danny, 2026-10-14, [#170](https://github.com/Zero-State-LLC/zzthis/issues/170#issuecomment-6175348667))

- **Question.** D-2026-10-11-11 asks for a 1, 2, or 3 word choice and 5 re-rolls per creation. Today spec 003 issues two data words plus a check word, 1-word and 3-word codes are `wrong-length` everywhere (server 400, apps Abstain), mint has no length field, the OpenAPI schema caps `rerolls_remaining` at 3, and D-2026-10-10-12 freezes contract 1 through v1.1.
- **Evidence.** Spec 003 issued format and check formula; spec 005 FR-006 and FR-010; `openapi.yaml` `rerolls_remaining` `maximum: 3`; `vectors.json` wrong-length rows; D-2026-10-10-12; D-2026-10-11-11 ("check the grammar allows 1-word public codes").
- **Alternatives and recommendation.**
  1. One-word codes. With `proto-v0` (2,663 words) the whole one-word space fills after a few hundred creations, and at the resolve rate limit it can be read end to end in under an hour. Recommended: not issued in contract 1. Michael is told why.
  2. Three-word codes. (a) Now, under a named D-2026-10-10-12 exception that adds an optional `words` field (2 or 3) to `POST /v1/codes`, with a new check formula `(d1 + 2·d2 + 3·d3) mod N`, issuer rules against swaps and deletions, and new vectors in TypeScript, Swift, and Kotlin. (b) At v2.0 with contract 2. Recommended: (b) for v1.1, because the grammar, vectors, and both apps' readers would all change before the first store build. If Michael needs it at launch, (a) is the path, and it must land before the first store build.
  3. Five re-rolls. Recommended: yes for v1.1. A new plain code gets `rerolls_remaining` 5 (six candidates per creation). This is a server rule change (FR-006) and an OpenAPI `maximum` change; neither generated client enforces `maximum`, so it is safe for shipped apps. Record it as a narrow D-2026-10-10-12 exception.
- **Consequences.** v1.1: RM-125 becomes "5 re-rolls, two-word codes, the picker from RM-113". Word count moves to v2.0 with RM-116 unless (2a) is chosen. zzThat's picker (#65) gets 5 rolls with no app change.
- **Revisit when.** Michael insists on 3 words at launch, or contract 2 starts.

## D-2026-10-13-03 Daily mint cap and shutoff numbers for public create (ACCEPTED: Danny, 2026-10-14, [#170](https://github.com/Zero-State-LLC/zzthis/issues/170#issuecomment-6175348667))

- **Question.** RM-072 and D-2026-10-10-21 item 7 need numbers: the durable-key daily cap, whether re-rolls count, and when to turn `ZZ_FREE_PUBLIC` off.
- **Recommendation.** Window: the UTC day. Subject key: HMAC (label `mint-subject`) of `provider:provider_subject`, so it survives account deletion for the window only. Each `free_public` mint and re-roll counts once against the subject (30 a day) and once against the RM-030 IP subject (60 a day); this is the one signed-in call that also counts against an IP row (FR-011 amended). Shut public create off when any report is open more than 48 hours, when more than 2,000 `free_public` codes are drawn in a UTC day, or when the month's Cloudflare usage alert passes $50. Target: 30 minutes from decision to effect, rehearsed on staging.
- **Alternatives.** Lower caps (10 and 20) if abuse appears in the v1.0 soak; no IP row (rejected: account cycling is the abuse it guards).
- **Consequences.** RM-072 becomes Ready with these numbers; OPERATIONS Moderation gains the shutoff triggers.

## D-2026-10-13-04 Terms and 18+ acceptance are client-only (ACCEPTED: Danny, 2026-10-14, [#170](https://github.com/Zero-State-LLC/zzthis/issues/170#issuecomment-6175348667))

- **Question.** RM-103, RM-120, and RM-124 need terms acceptance and an 18+ confirmation before the first create. Does the server store or check either, and where do clients get the current terms version?
- **Recommendation.** No server requirement in v1.1: the server neither stores nor checks acceptance or age. The current version is a `terms.version` value in `design/copy.json` (the Terms effective date), so the web client and both apps read it from the same pin. Each client stores the accepted version on the device and asks again when it changes; account deletion clears it. One combined step before the first create on a device: the person confirms they are 18 or older and accepts the Terms. Scanning and typing need neither. Copy keys, all for Michael: `terms.version`, `terms.accept`, `terms.age_confirm`, `terms.link`, `account.terms`.
- **Alternatives.** A server-side acceptance record (rejected for v1.1: new route and data); a build setting for the version (rejected: two sources of truth).
- **Consequences.** zzThat T097 and T104 become buildable once the Terms are approved and the keys exist. DATA-LIFECYCLE gains an "accepted terms version, device only" row.

## D-2026-10-13-05 v1.1 camera ships confirm-only unless a PASS receipt exists (ACCEPTED: Danny, 2026-10-14, [#170](https://github.com/Zero-State-LLC/zzthis/issues/170#issuecomment-6175348667))

- **Question.** D-2026-10-10-03 (ADOPTED) says a platform without a qualification PASS ships confirm-only, but spec 004's band tables do not define confirm-only, and no threshold numbers exist yet (PR #89 is a draft).
- **Recommendation.** v1.1 ships confirm-only on both platforms unless a signed PASS receipt exists at store submission (RM-064 records it). Confirm-only: a camera candidate that would be Accept becomes Clarify, showing the full canonical code and Confirm. Typed bands do not change. Vectors add the Accept rows with `confirm_only: true`, expecting Clarify. Threshold numbers are set only once the Q34 corpus exists.
- **Consequences.** RM-065 is buildable in spec 004 and zzThat (FR-025, new task).

## D-2026-10-13-06 Staging that can pass its own checks (ACCEPTED: Danny, 2026-10-14, [#170](https://github.com/Zero-State-LLC/zzthis/issues/170#issuecomment-6175348667))

- **Question.** RM-013 and RM-014 cannot pass as written: staging keeps `ZZ_FREE_PUBLIC` false, but the web client only mints `free_public`; the staging workers.dev and preview URLs are on, so turning on developer sign-in there opens public minting (what D-2026-10-10-07 rejected); the reset cannot delete audit rows, because triggers block it.
- **Recommendation.** `wrangler.staging.toml` sets `ZZ_FREE_PUBLIC = "true"`, `workers_dev = false`, and `preview_urls = false`, staging only; acceptance includes "the workers.dev `/v1` no longer answers 200". `workers/api/scripts/staging-reset.sql` drops the two audit triggers, deletes every application table, and recreates the triggers; the staging workflow runs it only against `zzthis-staging`. Limiter windows are not reset, so RM-014 runs before RM-015. Host: `zz-staging.zer0state.com` behind Access (named emails plus a Service Auth token in `cloudflare-staging`); FR-029 is amended. Playwright adds the Access headers only for the staging origin (`page.route`), never globally.
- **Consequences.** RM-012 to RM-015 become executable once Danny creates the host and the Access policy.

## D-2026-10-13-07 The production wordlist build (RM-020, RM-028) (ACCEPTED: Danny, 2026-10-14, [#170](https://github.com/Zero-State-LLC/zzthis/issues/170#issuecomment-6175348667))

- **Question.** RM-020 does not define the confusable-letter table, the collision rule, which word survives, the filter order, or how the private blocklist is applied without breaking FR-019's public, byte-for-byte rebuild. `proto-v0` still holds number words (twelve, thirteen, fifteen, nineteen, thousand), which D-2026-10-11-12 rules out. Production currently accepts `proto-v0`, so a first mint would freeze the unfiltered list.
- **Recommendation.**
  - Filter 4: map letters (and `rn` to m, `cl` to d, `vv` to w) to groups in `wordlists/confusable-v1.json`, which Michael approves; equal shape keys collide.
  - Filter 5: equal Double Metaphone primary codes collide, using an exact-pinned package after dependency review.
  - In both, the earlier word in sort order is kept. Filter 3 also drops every English cardinal number word.
  - The blocklist is applied after filter 6 and before the prime cut, read from `ZZ_BLOCKLIST_FILE` outside the repository. The report gives only the count and the SHA-256 of the normalized list. CI rebuilds the public list without the blocklist and checks that the committed list is an in-order subsequence of it, with the gap equal to the reported count.
  - Version id `prod-v1`; the pipeline takes the version as an argument and `proto-v0` output stays byte-identical. Production accepts only `prod-v1` (`env.ts` and spec 005 Environment); RM-001 depends on RM-020.
  - The freeze cites D-2026-10-10-04's risk acceptance, because no R-B6 corpus exists.
- **Consequences.** RM-020 becomes executable after Michael approves the groups.

## D-2026-10-13-08 Operator account deletion and data-subject requests (ACCEPTED: Danny, 2026-10-14, [#170](https://github.com/Zero-State-LLC/zzthis/issues/170#issuecomment-6175348667))

- **Question.** RM-023 and RM-027 assume the operator can delete an account, but `DELETE /v1/me` needs the account's own token and no operator SQL exists. No email is stored, so an emailed request cannot be matched to an account. A restore also drops `pending_revocations` rows written after the bookmark.
- **Recommendation.** Add `ops/delete-account.sql`: the FR-023 step 2 batch, an `account.delete` audit event with no actor, and a copy of any stored Apple token into `pending_revocations` (attempts 0, due now), with tests in `test/ops.test.ts`. Identity check: the person signs in and quotes the account id shown on `/account/` (new copy key `account.id`, Michael). An access request is answered with that account's rows from `accounts`, `codes`, `records`, and current versions, as JSON. Before a restore, export `audit_events` and `pending_revocations` written after the target time and re-insert them afterwards.
- **Consequences.** RM-023 and RM-027 become executable; the privacy policy names the method.

## D-2026-10-13-09 Unknown enum values gate the first store build (ACCEPTED: Danny, 2026-10-14, [#170](https://github.com/Zero-State-LLC/zzthis/issues/170#issuecomment-6175348667))

- **Question.** RM-075 has two halves. The unknown-key half passes on both apps (zzThat #58) and cleared RM-112 (#161). The unknown-enum half fails on both (zzThat #54). Once the first app version is in a store, any later enum value breaks that cohort.
- **Recommendation.** The enum half is a gate on the first store build, not on any server change. Android sets the generator's `enumUnknownDefaultCase=true`; iOS decodes unknown values to a fallback case. Until it passes, CONTRACT-EVOLUTION adds: no new value in any existing response enum within contract 1.
- **Consequences.** zzThat #54 becomes P0 for v1.1.

## Also needs Danny, not a new record

- **D-2026-10-10-21 status.** Its header says PROPOSED, but its text says the status changes when the record merges, and PR #139 merged it on 2026-10-10. Please confirm on GitHub that public create opens at v1.1. Until then RELEASE-ROADMAP keeps both readings visible.
- **D-2026-10-11-15 lock.** The option B lock is a comment on #164 (2026-10-12), but #164 merged on 2026-10-14 with the record still OPEN. Please record option B as ACCEPTED in `decisions-2026-10-11.md`, so D-2026-10-13-01 has a decided base.
