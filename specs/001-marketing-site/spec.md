# Feature spec: zzThis marketing site and scripted demo

Feature ID: 001-marketing-site
Status: built and live (OBSERVED 2026-10-02 at https://zero-state-llc.github.io/zzthis/, `main` at 40dfa3b). This file restates the requirements in `docs/SPEC.md` in Spec Kit form. It is pending Danny's approval through its PR, as the constitution's Governance section requires.
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

1. Home renders the hero, featured statement, comparison, How it works, Field logistics, From photo to action, More applications, About teaser, and Contact action in the order in `docs/SPEC.md` Section 3.1a [WIRE].
2. Hero, featured statement, comparison cells, workflow lines, and category stories match `docs/SPEC.md` Sections 3.2 to 3.4 character for character [BRIEF].
3. The hero keeps the em dash in "writable—and smart." [MICHAEL 2026-10-02].
4. The core workflow shows the lowercase code as text [MICHAEL 2026-10-02].
5. The comparison shows four cards with four rows each, per `docs/SPEC.md` Section 3.2 H.3 [MICHAEL 2026-10-02].

### US2. See where it applies (P1)

As a reviewer, I can see field logistics first and largest, then postal and parcel, everyday and community, and digital aliases, so that I see the reach of one code grammar [BRIEF].

Acceptance: `/applications` and the Home applications band show the panels in `docs/SPEC.md` Section 3.8, with field logistics largest [BRIEF].

### US3. Know who is behind it (P2)

As an investor or collaborator, I can read the founder origin, see the founder and advisors with roles and short bios, and see the current prototype explorations, so that I know who to talk to [BRIEF] [MICHAEL 2026-10-02].

Acceptance: `/about` follows `docs/SPEC.md` Section 3.5. People use initials cards until approved headshots arrive. Profile links appear only where a URL was supplied [MICHAEL 2026-10-02].

### US4. Try it safely (P2)

As a curious visitor, I can click through a scripted demo of marking, reading, linking, and handling an item, and look up a code, so that I can feel the flow. Nothing I do is sent anywhere [OPERATOR 2026-10-01].

Acceptance: `/demo` follows `docs/SPEC.md` Section 4. Every step shows the "Demo · mock data" badge. The demo uses no camera, microphone, network, or storage.

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
| FR-006 | No rendered em dash except the hero line. | [MICHAEL 2026-10-02] |
| FR-007 | No research target or unmeasured performance figures, and no claims of pilots, customers, endorsement, or adoption, appear on any page. | [MICHAEL 2026-10-02] [PRODUCT] |
| FR-008 | Standalone AI-render panels carry "Concept illustration". Each grouped gallery carries one label above its panels. Captions name the workflow. | [MICHAEL 2026-10-02] |
| FR-009 | Founder and advisor cards use initials until approved headshots are supplied. No LinkedIn scraping. | [MICHAEL 2026-10-02] [WIRE] |
| FR-010 | `/technology` is not built and nothing links to it until it has Michael's draft explanation plus a supporting example. | [MICHAEL 2026-10-02] |
| FR-011 | The demo is scripted: no recognition, no backend, no camera, microphone, network calls, or storage. Every step shows "Demo · mock data". | [OPERATOR 2026-10-01] |
| FR-012 | The demo is fully usable by keyboard. Drag is never required. Reduced motion removes transitions. Without JavaScript, a static list of steps appears. | INFERRED (`docs/SPEC.md` Section 4.5) |
| FR-013 | Flow B (look up a code) never reveals other codes on a miss. | Required by constitution principle III and issue #12. The public demo stays exact match only even though deployments may later enable a suggestion policy (Q20 partly resolved, Q40), because the demo exposes real codes. The wording is a placeholder. Suggestions removed by T010. |
| FR-014 | The site makes no runtime requests to other origins, has no analytics, and has no service worker. | [OPERATOR 2026-10-01] |
| FR-015 | Light and dark themes both meet text contrast of at least 4.5:1. | `docs/SPEC.md` Section 8, item 16 |
| FR-016 | When the free zzThat app launches, the main navigation gains a prominent "Try zzThat" action that links to zzthat.com. | [MICHAEL 2026-10-02]; launch trigger OPEN (Q39) |
| FR-017 | Every zz code in rendered text, titles, and alt text is lowercase, and no page shows a standalone capital "ZZ" as text. | [MICHAEL 2026-10-02] |

## Success criteria

The accepted acceptance criteria are `docs/SPEC.md` Section 8, items 1 to 28. Their verification status is tracked in [checklists/requirements.md](checklists/requirements.md). No new metrics are added here. The Lighthouse goals in item 18 are INFERRED goals, not commitments.

## Edge cases

- A visitor types an unrelated but well-formed code in Flow B. Expected result: "No match" with no hints (FR-013, pending Q20).
- A visitor on a phone without JavaScript opens `/demo`. Expected result: the static step list (FR-012).
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
| Q41 | Source for the alphanumeric example and character counts | Omit note sentence 1; ship the cell as written |
| Q42 | Show the two capital-ZZ photos? | Do not render |
| Q43 | Replace the founder bio with the 2026-10-02 first-person text? | Keep the founder origin |
| Q44 | Add the Hacker Dojo block? | Keep the Location line |
| Q45 | Hacker Dojo logo permission | No logo |
| Q46 | Are the supplied headshots approved originals with consent? | Initials cards |
| Q47 | Adopt the alternate hero and featured copy Michael shared as a reference? | Keep current copy |

## Workflows

| Item | Value |
|---|---|
| Governing workflows | anti-slop-code, production-systems, google-developer-style. stop-slop applies to site copy edits only, because the site is mostly prose. |
| Owners | Spec: Opus 5.5 through Grok Bot. Decomposition: FORGE. Implementation: cloud coding agent or Grok Bot executor. Filing: SCRIBE. |
| CI to reuse | `.github/workflows/ci.yml` (job `build`, required; do not edit), `.github/workflows/site-ci.yml` (typecheck and test), `.github/workflows/free-security-scan.yml`, `.github/workflows/pages.yml` (deploy on push to `main`). No new CI. |

The earlier list in `docs/SPEC.md` Section 7 also named frontend-inspiration-lock. That workflow applied to the first visual build and is not needed for content changes. Re-add it here only for a visual redesign.
