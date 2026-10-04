# Feature spec: zzThis marketing site and scripted demo

Feature ID: 001-marketing-site
Status: built and live (OBSERVED 2026-10-03 at https://zero-state-llc.github.io/zzthis/, `main` at d721783 after PR #32). This file restates the requirements in `docs/SPEC.md` in Spec Kit form. It is pending Danny's approval through its PR, as the constitution's Governance section requires.
Phase: specify (what and why). The how lives in [plan.md](plan.md). Work items live in [tasks.md](tasks.md).
Constitution: [.specify/memory/constitution.md](../../.specify/memory/constitution.md).

Verbatim copy, layout tables, image plan, and the decision log stay in [`docs/SPEC.md`](../../docs/SPEC.md). This spec cites them by section instead of copying them, so there is one source for each string.

## Why

zzThis needs a public, honest explanation for xTechSearch visitors, possible investors, and collaborators [BRIEF]. The site explains two layers: anyone can write a useful identifier, and AI can help turn a marked or photographed item into the next task and record [BRIEF]. It also gives people a safe, scripted way to try the idea before any real recognition or resolver exists.

## Users

| User | Need | Source |
|---|---|---|
| xTechSearch reviewer | Understand what zzThis is and how it fits field logistics, quickly | [BRIEF] |
| Possible investor | See the idea, the stage, and the people | [BRIEF] |
| Collaborator or test partner | Find how to get in touch about a pilot, field feedback, or collaboration | [BRIEF] |
| Michael and Daniel | Change copy, cards, and images often without touching layout code | [BRIEF] |

## User stories

### US1. Understand the idea from Home (priority P1)

As a first-time visitor, I can read what zzThis is, see a handwritten code on an object, compare it with barcodes, QR codes, and alphanumeric codes, and follow the core workflow, so that I understand the idea in one scroll.

Acceptance:

1. Home renders the B v1.0 sections in the order in `docs/SPEC.md` Section 3.1b: hero console, featured statement with anatomy and languages, four-card comparison, How it works, Top ways, Field logistics, From photo to action, proposed architecture, More applications, About teaser, and Contact [JEV 2026-10-03].
2. Hero, featured statement, comparison cells, workflow lines, category stories, the founder bio, the Hacker Dojo paragraph, and the anonymous-delivery lines match `docs/SPEC.md` Sections 3.2 to 3.5 character for character [BRIEF] [MICHAEL 2026-10-03 v1.0 change list].
3. The hero H1 reads "Barcodes made things scannable. zzThis makes things readable-writable - and smart." per Michael's v1.0 change list, with a spaced hyphen and no em dash (Q62, FR-006) [DANNY 2026-10-03, revised: "Fix the em dashes"].
4. The core workflow shows the lowercase code as text [MICHAEL 2026-10-02].
5. The Home comparison keeps Michael's four cards (Barcode, QR code, Alphanumeric code, zzThis), the H.3 cells, and the H.3 note [MICHAEL 2026-10-02]. His v1.0 change list does not remove that rule [JEV 2026-10-03].
6. Top ways keeps the H.2a copy and sits after How it works on Home [MICHAEL 2026-10-02] [JEV 2026-10-03].

### US2. See where it applies (P1)

As a reviewer, I can see field logistics first and largest, then postal and parcel, everyday and community, and digital aliases, so that I see the reach of one code grammar [BRIEF].

Acceptance: `/applications` and the Home applications band show the panels in `docs/SPEC.md` Section 3.8, with field logistics largest [BRIEF]. `/applications` also shows the galleries added for postal and parcel, everyday and community, and digital aliases [MICHAEL 2026-10-02]. The delivery block uses the B v1.0 heading, privacy line, and Step 3 title, and it does not show the collage or the word "Coupang" [MICHAEL 2026-10-03 v1.0 change list].

### US3. Know who is behind it (P2)

As an investor or collaborator, I can read the founder origin, see the founder and advisors with roles and short bios, and see the current prototype explorations, so that I know who to talk to [BRIEF] [MICHAEL 2026-10-02].

Acceptance: `/about` follows `docs/SPEC.md` Sections 3.5 and 3.1b. The founder card matches the advisor card and headshot size. The founder title and bio, and the single Hacker Dojo paragraph, are the v1.0 lines. The Hacker Dojo logo is not shown. Profile links appear only where a URL was supplied [MICHAEL 2026-10-02] [MICHAEL 2026-10-03 v1.0 change list].

### US4. Try it safely (P2)

As a curious visitor, I can click through a scripted demo of marking, reading, linking, and handling an item, and look up a code, so that I can feel the flow. Nothing I do is sent anywhere [OPERATOR 2026-10-01].

Acceptance: `/demo` follows `docs/SPEC.md` Section 4. Every step shows the "Demo · demo data" badge. The demo uses no camera, microphone, network, or storage.

### US5. Get in touch (P1)

As a collaborator, I can find the contact email from every page, so that I can discuss a pilot, field feedback, or collaboration [BRIEF].

Acceptance: `/contact`, the Home contact action, the About contact card, and the footer show 1@1000x10.com as a `mailto:` link [BRIEF].

## Functional requirements

| ID | Requirement | Source |
|---|---|---|
| FR-001 | Routes `/`, `/how-it-works`, `/applications`, `/about`, `/contact`, and `/demo` exist under the base path `/zzthis/`. | [OPERATOR 2026-10-01] |
| FR-002 | Main navigation is How it works, Applications, About, Contact, in that order. The demo is not in the main nav. | [BRIEF] [MICHAEL 2026-10-02] |
| FR-003 | The footer shows How it works, Applications, Demo, About, Contact, the contact email, and the words "Patent pending". | [MICHAEL 2026-10-02] |
| FR-004 | Each page has exactly one H1; headings follow content hierarchy without skipping levels. | [BRIEF] |
| FR-005 | Copy in `copy` blocks of `docs/SPEC.md` ships verbatim. Copy lives in typed content objects so that it can change without layout edits. | [BRIEF] |
| FR-006 | No rendered em dash, with no exceptions. The hero H1 uses a spaced hyphen: "readable-writable - and smart." (Q47, Q62). | [MICHAEL 2026-10-02]; [DANNY 2026-10-03, revised: "Fix the em dashes"] |
| FR-007 | No research target or unmeasured performance figures, and no claims of pilots, customers, endorsement, or adoption, appear on any page. | [MICHAEL 2026-10-02] [PRODUCT] |
| FR-008 | Standalone AI-render panels carry "Concept illustration". Each grouped gallery carries one label above its panels. Captions name the workflow. | [MICHAEL 2026-10-02] |
| FR-009 | Founder and advisor cards show a supplied headshot where one exists (Michael, Patrick, Arshi, Ridham) and initials otherwise (Q46). No LinkedIn scraping. | [MICHAEL 2026-10-02] [WIRE] |
| FR-010 | `/technology` is not built and nothing links to it until it has Michael's draft explanation plus a supporting example. | [MICHAEL 2026-10-02] |
| FR-011 | The demo is scripted: no recognition, no backend, no camera, microphone, network calls, or storage. Every step shows "Demo · demo data". User-facing labels say demo instead of mock. | [OPERATOR 2026-10-01]; override [MICHAEL 2026-10-03 #54] [DANNY 2026-10-04] |
| FR-012 | The demo is fully usable by keyboard. Drag is never required. Reduced motion removes transitions. Without JavaScript, a static list of steps appears. | INFERRED (`docs/SPEC.md` Section 4.5) |
| FR-013 | Flow B (look up a code) never reveals other codes on a miss. | Required by constitution principle III and issue #12. The public demo stays exact match only even though deployments may later enable a suggestion policy (Q20 partly resolved, Q40), because the demo exposes real codes. The wording is a placeholder. Suggestions removed by T010. |
| FR-014 | The site makes no runtime requests to other origins, has no analytics, and has no service worker. Fonts are self-hosted. Plex Sans, Plex Sans Condensed, Plex Mono, and Hebrew come from `@fontsource`. The Korean and Japanese faces are committed woff2 subsets of the glyphs the language examples use. | [OPERATOR 2026-10-01] [JEV 2026-10-03] |
| FR-020 | The Home console uses the v1 grammar in `src/lib/grammar.ts` (T029) and `src/lib/resolver.ts`, against the existing mock records. A miss never suggests another code (FR-013). A letter outside A–Z shows the H.1c coming-later note, not an error, even when the grammar would report `unsupported-script`. Camera and voice on Home are simulated and do not call `getUserMedia`, the network, or storage. | [DANNY 2026-10-03]; issue #12 |
| FR-021 | Header, footer, theme toggle, and color and type tokens use the direction B system on every page. How it works, `/demo`, `/contact`, and the 404 keep their current content. | [JEV 2026-10-03] |
| FR-015 | Light and dark themes both meet text contrast of at least 4.5:1. | `docs/SPEC.md` Section 8, item 16 |
| FR-016 | When the free zzThat app launches, the main navigation gains a prominent "Try zzThat" action that links to zzthat.com. | [MICHAEL 2026-10-02]; launch trigger OPEN (Q39) |
| FR-017 | Site copy (text, headings, captions, titles) writes every zz code in lowercase and never writes a standalone capital "ZZ". Photos and renders may show a capital ZZ mark or uppercase letters inside a code; alt text describes them in words or quotes the code as shown. | [MICHAEL 2026-10-02] |
| FR-018 | After T029, Flow B parses input with the v1 grammar (`docs/SPEC.md` Section 2.2a) and maps each result to B1, B3, B4, or the new B5 bare-mark state, using the lines in `docs/SPEC.md` Section 4.4. It still never reveals other codes (FR-013). | [MICHAEL 2026-10-02 #33] [MICHAEL 2026-10-02 #34]; wording INFERRED |
| FR-019 | Images we generate follow the Q48 display rule: no capital-letter zz mark, on its own or in a code; AI renders that break it are regenerated. Real photos are never AI-edited and keep what they show; the three real photos with a capital-letter zz stay. | [MICHAEL 2026-10-02 #33]; [MICHAEL 2026-10-03 #39] (Q53) |

## Success criteria

The accepted acceptance criteria are `docs/SPEC.md` Section 8, items 1 to 31 (items 30 and 31 apply once T029 and T030 land). Their verification status is tracked in [checklists/requirements.md](checklists/requirements.md). No new metrics are added here. The Lighthouse goals in item 18 are INFERRED goals, not commitments.

## Edge cases

- A visitor types an unrelated but well-formed code in Flow B. Expected result: "No match" with no hints (FR-013). Q20 only affects the wording.
- After T029, a visitor types `zz-@agentsmith-zz` (the handle shown in Top ways 04). Expected result: B3 "No match", not "This is not a zz code" (FR-018).
- After T029, a visitor types `zz-copper-lantern-sky` with no closing marker. Expected result: B4 "Add the closing zz at the end of the code." Today the demo resolves it; the v1 grammar does not.
- After T029, a visitor types `zz` alone. Expected result: B5, the bare-mark line.
- After T029, a visitor types `zz-#tag-zz`. Expected result: the reserved-symbol B4 line.
- A visitor types `zz copper lantern sky zz` in capitals. Expected result: B1, the mock record (unchanged).
- A visitor on a phone without JavaScript opens `/demo`. Expected result: the static step list (FR-012).
- A visitor types `zz-구리-등불-하늘-zz` in the Home console. Expected result: the coming-later note, not "This is not a zz code", and the field is not marked invalid (FR-020).
- A visitor types `zz-river-maple-sky-zz` with one letter changed. Expected result: "No match" and no other code (FR-013, FR-020).
- An unknown path under `/zzthis/`. Expected result: `404.html` with working links.

## Out of scope

Real recognition, a real resolver, accounts, forms or email backends, analytics, a custom domain or DNS, the Technology page, the long founder history page, and the zzthing.com and zzthat.com apps [BRIEF] [OPERATOR 2026-10-01].

## Open questions

| ID | Question | Default |
|---|---|---|
| Q10 (part) | Daniel Meyer's profile URL and project accomplishments | Role and bio only |
| Q12 (part) | Adam Fry's profile URL and photo | Specialty and bio supplied [MICHAEL 2026-10-02] |
| Q20 | Flow B behavior on a miss | PARTLY RESOLVED: context dependent [MICHAEL 2026-10-02]; the public demo stays "No match" (FR-013). Policy details: Q40 |
| Q39 | What event or date counts as the zzThat app launch for FR-016? | None chosen |
| Q21 | Which handling verbs does the demo show? The brief lists pack, ship, return, repair, and dispose [BRIEF]; the 2026-10-02 wireframe shows Pack, Ship, Turn In, Dispose; the demo uses Pack, Return, Repair, Dispose (OBSERVED). | Keep the demo as built |
| Q22 | Field logistics panels: the brief says a and c; the 2026-10-02 wireframe shows a, b, c. The site shows a, the b alternate, and c (OBSERVED). | Keep as built |
| Q23 | The brief asks for a real handwritten code beside the hero. Panel b is an AI render, labeled "Concept illustration" (OBSERVED). Should a real photo replace it? | Keep panel b with the label |
| Q24 | Should the About page keep the pitch-sourced founder bio and company-stage sentence? | RESOLVED: removed; the founder card shows Michael's founder origin [OPERATOR 2026-10-02] |
| Q41 | Source for the alphanumeric example and character counts | RESOLVED: use as given [MICHAEL 2026-10-02]. Both note sentences ship. |
| Q42 | Show the two capital-ZZ photos? | RESOLVED: use as given [MICHAEL 2026-10-02]. Both photos are on About. |
| Q43 | Replace the founder bio with the 2026-10-02 first-person text? | RESOLVED: use as given [MICHAEL 2026-10-02]. The longer bio is the founder text. |
| Q44 | Add the Hacker Dojo block? | RESOLVED: use as given [MICHAEL 2026-10-02]. New section after the founder. Location stays. |
| Q45 | Hacker Dojo logo permission | RESOLVED: use as given [MICHAEL 2026-10-02]. Logo is on About. Michael will ask Hacker Dojo for permission once the beta is live. |
| Q46 | Are the supplied headshots approved originals with consent? | RESOLVED: use as given [MICHAEL 2026-10-02]. Four headshots ship. Michael will ask the people pictured for permission once the beta is live. |
| Q47 | Adopt the alternate hero and featured copy Michael shared as a reference? | RESOLVED: use as given [MICHAEL 2026-10-02]. New paragraph and featured text; the H1 uses the spaced hyphen as typed. Q62 keeps the spaced hyphen in the v1.0 H1 "readable-writable - and smart." [DANNY 2026-10-03, revised: "Fix the em dashes"]. |
| Q48 | Are codes case- and space-insensitive? | RESOLVED (issue #33): yes; rules in `docs/SPEC.md` Section 2.2a. The display rule (no capital-letter zz in images) feeds Q53. |
| Q49 | Allow `@` handles like `zz-@agentsmith-zz`? | RESOLVED (issue #34): yes; the Top ways example stays as written. |
| Q53 | Three real photos show a capital-letter zz. Replace or remove? (issue #39) | RESOLVED: keep them [MICHAEL 2026-10-03 #39] (FR-019) |
| Q54 | Keep the blockchain and ledger mentions (Top ways 01 and 05, ENS image)? (issue #40) | RESOLVED: no change [MICHAEL 2026-10-03 #40] |
| Q62 | Use an em dash in the v1.0 hero headline in place of the Q47 spaced hyphen? | RESOLVED: no. The H1 reads "readable-writable - and smart." with a spaced hyphen [DANNY 2026-10-03, revised: "Fix the em dashes"]. There is no exception to FR-006. |
| Q63 | Native-reader check for the Korean, Japanese, and Aramaic examples? | RESOLVED [MICHAEL 2026-10-03 #51]: confirmed. The examples stay on Home as written, including the glosses and the right-to-left Aramaic. |
| Q64 | Approve the B v1.0 prototype microcopy? (issue #54) | RESOLVED [MICHAEL 2026-10-03 #54]: approved as written, with Rescan in the decision bands, demo instead of mock in every user-facing label, and "photos for retries and review" on object storage. |
| Q65 | Should Home show the real handwritten photos from sample A? (issue #55) | RESOLVED: no [MICHAEL 2026-10-03 #55]. Home stays as it is. Those photos stay on Applications. |

## Workflows

| Item | Value |
|---|---|
| Governing workflows | anti-slop-code, production-systems, google-developer-style. stop-slop applies to site copy edits only, because the site is mostly prose. |
| Owners | Spec: Opus 5.5 through Grok Bot. Decomposition: FORGE. Implementation: cloud coding agent or Grok Bot executor. Filing: SCRIBE. |
| CI to reuse | `.github/workflows/ci.yml` (job `build`, required; do not edit), `.github/workflows/site-ci.yml` (typecheck and test), `.github/workflows/free-security-scan.yml`, `.github/workflows/pages.yml` (deploy on push to `main`). No new CI. |

Direction B is the visual redesign named in `intent/2026-10-03-home-redesign.md`. The reference is `docs/redesign-2026-10-03/b-resolver-v1/`. Copy and layout for that pass are `docs/SPEC.md` Section 3.1b.
