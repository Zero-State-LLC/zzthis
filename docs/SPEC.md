# zzThis Spec

> **Spec Kit map (2026-10-02).** This file stays as the source for copy, tags, and decisions. Spec Kit artifacts now hold the requirements. See [`specs/README.md`](../specs/README.md).
>
> | Section | Now lives in |
> |---|---|
> | 2 Product | [`specs/002-resolver-core`](../specs/002-resolver-core/spec.md), [`003-wordlist-checkword`](../specs/003-wordlist-checkword/spec.md), [`004-capture`](../specs/004-capture/spec.md) |
> | 3 to 5 Site, demo, visual system | [`specs/001-marketing-site/spec.md`](../specs/001-marketing-site/spec.md). Verbatim copy stays here. |
> | 6 Stack and repo | [`specs/001-marketing-site/plan.md`](../specs/001-marketing-site/plan.md) |
> | 7 Workflows | Superseded by the Workflows section in each `specs/*/spec.md`. The "OPEN Q13" and "draft PR" text below is stale. |
> | 8 Acceptance | [`specs/001-marketing-site/checklists/requirements.md`](../specs/001-marketing-site/checklists/requirements.md) |
> | 9 Questions | Still the decision log. Q21 to Q39 were added on 2026-10-02. |
> | 10 Architecture | [`specs/002-resolver-core/plan.md`](../specs/002-resolver-core/plan.md), [`specs/004-capture/plan.md`](../specs/004-capture/plan.md) |
>
> Research targets, the funding-pitch founder bio, and the company-stage line were removed from this repo on 2026-10-02 (Q24 RESOLVED).

Status: Draft for operator review. Owner of this document: Opus 5.5 (spec). Implementer: cloud coding agent. Reviewer: operator, through the draft PR.

## How to read this spec

- Square-bracket tags cite the source of each product claim or piece of copy: [BRIEF], [WIRE], [OVERVIEW], [PRODUCT], [OPERATOR]. [PRODUCT] cites Michael's private product write-up dated 2026-09-09, which is not in this repo. A dated tag such as [OPERATOR 2026-10-02] marks an operator decision made on that date. [ASSETS] cites the committed image asset manifest on branch `assets`.
- **INFERRED** marks a design or engineering choice made in this spec. The implementer may follow it without further approval.
- **OPEN** marks a decision that Michael must make. Each OPEN item has a default so the build is not blocked.
- When sources conflict, the [BRIEF] governs the site. For product behavior, [PRODUCT] governs.
- Copy shown in a `copy:` block ships verbatim. Copy marked INFERRED is connective text and may be edited during review.

## Contents

1. Summary and audience
2. Product spec
3. Marketing site
4. Click-through demo (`/demo`)
5. Visual system and components
6. Stack, repo layout, and engineering rules
7. Workflows
8. Acceptance criteria
9. Out of scope and OPEN questions
10. Architecture (proposal, not built)
11. Provenance

## 1. Summary and audience

zzThis is a human-readable, human-writable code that works alongside barcodes and QR codes [BRIEF]. A person writes a code such as `zz-copper-lantern-sky-zz` on tape, a crate, a parcel, or a sign. The person links the code to a digital record and finds it later by camera, typing, or voice [BRIEF]. A second layer uses AI to turn a marked or photographed item into the next task and record [BRIEF].

This spec covers three deliverables and one proposal:

1. The product definition that the site describes (Section 2).
2. The first marketing site (Section 3).
3. A scripted click-through demo at `/demo` (Section 4).
4. A proposed architecture for the real product: central API, edge layer, and on-device capture (Section 10). It is a proposal, not built.

**Audience for the site:** xTechSearch visitors, possible investors, and collaborators [BRIEF].

**Audience for the brief:** Michael Chung (founder and project lead) and Daniel Meyer (full-stack development) [BRIEF].

**Honesty rules that apply everywhere:**

- zzThis has no validated codebook and no controlled comparisons yet [PRODUCT]. Recognition, resolver security, and human-factors performance are untested [PRODUCT].
- No performance figure appears on the site or in this repo until it is measured (Q7, Q24).
- The site makes no claim of pilots, customers, endorsement, or government adoption. The footer shows the words "Patent pending" at Michael's direction [MICHAEL 2026-10-02]; the site makes no other patent claim (Q9 RESOLVED).
- The xTech panel images are concept renderings [ASSETS]. The handwritten photos are real photos of Michael's handwritten codes [ASSETS].

## 2. Product spec

### 2.1 Status: concept versus tested

| Capability | Status | Source |
|---|---|---|
| Architecture, syntax, capacity calculations, postal and privacy workflows | Current work (design) | [PRODUCT] |
| Proof of concept built with Lovable, linked from zzthing.com | Exists; dictionary, generation, and checksum code not yet verified | [PRODUCT] |
| Word codebook | Not validated; no controlled comparisons | [PRODUCT] |
| Handwriting and print recognition of zz codes | Untested | [PRODUCT] |
| Secure resolver | Untested; prototype planned | [PRODUCT] |
| Central API, edge layer, and on-device capture (Section 10) | Proposal, not built | [OPERATOR 2026-10-02] |
| AI photo-to-action, inventory assistant, touch-first handling | Concept, shown as image concepts | [BRIEF] |
| Panels a–o and demo images | Concept renderings | [ASSETS] |
| Handwritten photos of codes on paper | Real photos | [ASSETS] |

### 2.2 Code grammar

**Framing markers.** The standard form opens with `zz-` and closes with `-zz` [BRIEF] [PRODUCT].

**Words.** The site shows lowercase code words: "MARK a lowercase zz code" [BRIEF]. Codes are built from a controlled word codebook designed for handwriting, reading, speech, recall, correction, optical recognition, and error detection [PRODUCT].

**Examples from sources:**

| Code | Context | Source |
|---|---|---|
| `zz-copper-lantern-sky-zz` | Hero example; crate tape | [BRIEF] [ASSETS] |
| `zz-apple-sky-lantern` | Postage code written in the label area | [PRODUCT] |
| `zz-blue-bike-astoria-zz` | Physical thing | [PRODUCT] |
| `zz-vitalik.eth-zz` | Web3 resource | [PRODUCT] |
| `zz@-AgentSmith-neo-zz` | Verified agent | [PRODUCT] |
| `zz-b2-smith-1-zz`, `zz-b2-4-zz` | Duffel and crate tape (panel a) | [ASSETS] |
| `(zz) camp bravo four two (zz)` | Circled marker variant on a pallet (panel c) | [BRIEF] [ASSETS] |
| `zz-river-maple-sky-zz` | Parcel (panel g) | [ASSETS] |
| `zz-kathy-lost-cat-zz` | Lost-cat flyer (panel h) | [ASSETS] |

**Circled-zz variant.** Panel c shows a "circled zz marker variant" on a wrapped mixed-goods pallet [BRIEF], written as `(zz) camp bravo four two (zz)` [ASSETS].

**Namespace marker.** The `@` marker appears in the verified-agent example `zz@-AgentSmith-neo-zz` [PRODUCT]. Verification is a resolver concern, not something the printed characters prove (INFERRED).

**Word counts and capacity:**

- With a 5,000-word dictionary, two ordered words give 25 million raw combinations, and three give 125 billion. These counts come before reserving capacity for checks, exclusions, and policy [PRODUCT].
- [PRODUCT] also proposes a candidate 10,000-word dictionary. Two ordered words from it give 100 million raw combinations, and three give one trillion (arithmetic INFERRED).
- Two or three data words plus a checksum word produce three or four visible words. The checksum does not increase identifier capacity [PRODUCT].

**Checksum word.** A checksum word or other redundancy supports error detection [PRODUCT]. The demo does not implement or imply a real checksum algorithm (INFERRED).

**Formats to model:** two-word, three-word, checksum, prefix, enterprise, one-time, and reusable-account formats [PRODUCT].

**Status of the syntax.** The syntax shown on the site is illustrative. The interaction format is to be selected by measured performance and system cost [PRODUCT].

### 2.3 Resolver

- **Public identifier versus authorization.** The visible words are a public identifier, not a password or private key. Payment and authorization stay in signed backend records [PRODUCT].
- **Controls.** The resolver maps the public code to mutable records and enforces single use, expiration, revocation, signed updates, permissions, rate limits, and auditability [PRODUCT].
- **Uncertain readings.** The system resolves only above a validated threshold; otherwise it requests confirmation, another view, or manual handling [PRODUCT].
- **Abuse cases.** Copied marks, replay, enumeration, unauthorized updates, and malformed input [PRODUCT].

### 2.4 Record linking

- A code links to existing identifiers: NSN, document number, hand receipt, and photo (panel e) [BRIEF].
- In field logistics, the code connects to existing identifiers [BRIEF].
- **No-device marks.** "For a field code made with no device, link and reconcile later" [BRIEF]. A person writes the code first, and a record is attached when a device is available.

### 2.5 Capture by camera, typing, or voice

- **Input paths.** Read by camera or manual entry. Report the words by voice where useful [BRIEF]. Voice and manual entry are alternate input paths [BRIEF].
- **Recognition approach.** Distinctive markers and placement cues are combined with existing printed-text and handwriting models, lexicon-constrained decoding, ranked candidates, and checksum validation [PRODUCT].
- **Decision bands.** Calibrated confidence decides whether the system resolves, asks for confirmation, requests another view, or abstains [PRODUCT]. These are accept, clarify, retry, or abstain decisions, calibrated separately for voice, image, and typed input [PRODUCT].
- **Read-back.** Panel f shows a radio cue and read-back of three code words [BRIEF]: "Tag: copper, lantern, sky. Break." [ASSETS]. Read-back confirmation errors must be evaluated, not assumed away [PRODUCT].

### 2.6 AI-assisted photo-to-record flow

Workflow: PHOTOGRAPH one or more items → CONFIRM the proposed identification → choose a handling or inventory action by touch or voice → REVIEW the prepared record or form. "This is the second layer of the story, not a separate product category." [BRIEF]

- **Photo to action.** A Soldier photographs loose or damaged items. zzThis AI helps identify each one, suggests how to handle, pack, ship, return, repair, or dispose of it, and prepares the relevant form for review [BRIEF].
- **Inventory assistant.** A Soldier photographs a supply shelf at different times. zzThis helps count what remains, identifies what is running low, and suggests a reorder [BRIEF].
- **AI and touch first.** A Soldier drags a recognized item to an action on the screen or speaks a request instead of typing through forms [BRIEF].
- **Human review.** A person confirms the proposed identification and reviews the prepared record or form [BRIEF].

### 2.7 Privacy

Codes are public identifiers, and authorization stays separate [PRODUCT]. Research targets are not part of this repo (Q24).

## 3. Marketing site

### 3.1 Information architecture

**Navigation, in order:** How it works | Applications | About | Contact [BRIEF]. The zzThis logo links to `/` (INFERRED). A theme toggle sits at the end of the nav bar (INFERRED). On viewports narrower than 900 px, the nav collapses into a disclosure button labeled "Menu" (INFERRED).

| Route | H1 | Purpose | Source |
|---|---|---|---|
| `/` | Hero line | Long scrolling page, mobile first | [BRIEF] |
| `/how-it-works` | How it works | Mark, read, link, report; then photograph, confirm, act, record | [BRIEF] |
| `/applications` | Applications | Field logistics, postal and parcel, community use, digital aliases | [BRIEF] |
| `/about` | About zzThis | Michael, advisors, prototypes, business context | [BRIEF] |
| `/contact` | Contact | 1@1000x10.com and a collaboration invitation | [BRIEF] |
| `/demo` | See zzThis in action. | Prototype links, planned zzThat app, scripted click-through with mock data | Operator request; H1 [MICHAEL 2026-10-02] |
| `/technology` | (not built) | Michael's draft wording is stored in `src/content/technology.ts`; the page is built and enters navigation only when it has that explanation plus a supporting example [MICHAEL 2026-10-02] | [BRIEF] [MICHAEL 2026-10-02] |

- `/how-it-works` is a real page that reuses the Home workflow components. Home also exposes `#how-it-works` (INFERRED; the [BRIEF] allows "Anchored Home sections; stable detail route later").
- The demo is not in the main nav. Links to it appear on `/how-it-works`, in the Home core workflow section, and in the footer [MICHAEL 2026-10-02] (Q5 RESOLVED). When the free zzThat app launches, add a prominent "Try zzThat" navigation action that links to zzthat.com [MICHAEL 2026-10-02].
- **Technology page:** `src/content/technology.ts` holds Michael's public draft wording, marked `unpublished`. No route is generated and no page links to it until the page has that explanation plus a supporting example. Do not publish an empty stub [MICHAEL 2026-10-02] (Q14 RESOLVED).
- Every page has exactly one H1, then H2 and H3 by content hierarchy, not by menu [BRIEF].
- Every page has a footer with "Contact: 1@1000x10.com" [BRIEF], the nav links, and a link to `/demo` (INFERRED).

### 3.1a Layout and proportions (wireframes)

[WIRE] is the companion layout source for this spec. It shows Home as three phone scroll segments and two desktop segments of one continuous page [WIRE]. Grey boxes in [WIRE] mark image positions, and type, color, and final imagery follow later [WIRE]. Where [WIRE] and the [BRIEF] differ on copy, the [BRIEF] governs. Where they differ on order or layout, [WIRE] governs, because it is the later and more specific source (INFERRED).

**Home order on phones (3 segments)** [WIRE]

| Segment | Sections, in order | Panels |
|---|---|---|
| 1. First screen and workflow | Header (logo, Menu); H1 hero and subline; hero image; actions; featured statement; comparison strip; How it works (Mark, Read, Link, Report, one card at a time) | b; c close-up, d, e, f |
| 2. Field work and AI | Field logistics (controlled swipe row); From photo to action (j, k, l sequence, then m and n cards) | a, b (alternate), c; j, k, l, m, n |
| 3. Applications and contact | More applications (Postal and parcel, Everyday and community, Digital aliases); About teaser; Contact action; footer | g and o; h; i |

**Home order on desktop (2 segments)** [WIRE]

| Segment | Sections, in order | Panels |
|---|---|---|
| 1. First screen and workflow | Logo and nav; hero text beside hero image; featured statement; comparison (3 cards); core workflow (4 steps); field logistics (3 across); photo to action (j, k, l, 3 across) | b; c close-up, d, e, f; a, b (alternate), c; j, k, l |
| 2. More applications | m and n (2 across); Applications grid 2×2 (Field logistics, Postal and parcel, Community, Digital aliases); About and Contact (2 across); footer | m, n; j thumbnail, g and o, h, i |

On phones, the Applications grid omits the Field logistics card, because the field band sits directly above it [WIRE].

**Grid per breakpoint (INFERRED)**

| Viewport | Container | Columns | Series of 3 | Core workflow | Applications |
|---|---|---|---|---|---|
| 320–599 px | Fluid, 16 px side margins | 1 | Stacked; field a, b, c use a controlled swipe row [BRIEF] [WIRE] | 1 per row [WIRE] | 1 per row |
| 600–899 px | Fluid, 26 px margins | 2 | 2 across, then wrap | 2×2 | 2×2 |
| 900–1199 px | Max 1120 px, 12-column grid | 12 | 3 across [BRIEF] | 2×2 | 2×2 |
| ≥ 1200 px (check at 1440) | Max 1280 px, 12-column grid | 12 | 3 across | 4 across [WIRE] | 2×2 |

The controlled swipe row uses CSS scroll snap and a visible peek of the next card. It has Previous and Next buttons and no auto-advance. The row is a focusable region labeled "Field logistics examples" (INFERRED).

**Golden ratio, 1:1.618** [WIRE]. Michael asked Daniel to use this ratio for the layout [WIRE]. The [BRIEF] allows it only "without constraining responsive layout" [BRIEF].

| Use | Rule (INFERRED) |
|---|---|
| Hero split at ≥ 900 px | `grid-template-columns: minmax(0,1fr) minmax(0,1.618fr)` (text : image) |
| About intro and contact row | Text 1.618 : contact card 1 |
| Founder row | Initials card 1 : bio 1.618 |
| Card image area | Aspect ratio 1.618 : 1, `object-fit: cover`, `object-position` from the focal point |
| Spacing scale | φ steps: 4, 6, 10, 16, 26, 42, 68, 110 px (Section 5) |
| Override | The ratio yields when content would overflow. Columns use `minmax(0, …)`, and long copy wraps [BRIEF] |

**j–l sequence.** Panels j, k, and l form one visible three-step sequence [WIRE]. Render them as an ordered list with step labels "01 Photograph", "02 Guide", and "03 Review", set uppercase by CSS [WIRE]. The mobile wireframe uses "Guidance" and "Prepared form". This spec uses the desktop labels at every width, because [WIRE] says sections and wording stay consistent with mobile (INFERRED). A thin construction line joins the three steps. It runs horizontally at ≥ 900 px and vertically on phones. Panels m and n follow as two more cards titled "Inventory assistant" and "Touch first" [WIRE]. All five cards have equal footprints within their row.

**Concept-gallery label rule.** One short concept-gallery label covers the j–n group, and captions explain each step [WIRE]. The [BRIEF] allows concept status once for the demonstration gallery and once on the prototype links [BRIEF].

- Concept labels [MICHAEL 2026-10-02] (Q17 RESOLVED): a standalone AI-render panel carries the tag "Concept illustration" (the Home hero image b, each Home application card, and single-panel sections on `/applications`). A grouped gallery carries one visible label above its panels: on Home, above the core workflow steps, the Field logistics row, and the From photo to action group. `/how-it-works` and `/applications` keep one page label under the H1, which covers their galleries. Captions name the actual workflow.
- Label copy: standalone tag "Concept illustration" [MICHAEL 2026-10-02]. Group label (INFERRED): "Concept illustrations. These panels show intended use, not a deployed system." Page label (INFERRED): "Concept renderings. The panel images on this page show intended use, not a deployed system." All three live in `src/content/labels.ts`; replace the INFERRED wording if Daniel supplies exact text.
- The second label appears on the About prototype links. Copy (INFERRED): "Both sites are concept-stage explorations."
- `/demo` uses its own "Demo · mock data" label instead (Section 4).

**About layout** [WIRE]

| Order | Phone | ≥ 900 px |
|---|---|---|
| 1 | H1 and intro | H1 and intro (1.618) beside the contact card (1) |
| 2 | Current explorations, stacked | zzthing.com and zzthat.com, 2 across |
| 3 | Founder card | Initials card (1) beside the bio (1.618) |
| 4 | Advisors, one stacked card each [WIRE] | 3 across: Jim White, Patrick Muggler, Arshi Chadha; then Ridham Bhagat, Daniel Meyer, Adam Fry [MICHAEL 2026-10-02] |
| 5 | Codes written by hand (real photos) | 3 across |
| 6 | Location, then Next action | Location and Next action, 2 across [WIRE] |

The 2026-10-02 brief and wireframes list Jim White again ("Local AI and language"), add Adam Fry ("Advisor"), and drop the Future space card [MICHAEL 2026-10-02]. This supersedes the 2026-10-01 wireframe annotation that removed Jim White. Photos: initials cards until Michael supplies approved original headshots, and the implementer does not scrape LinkedIn [MICHAEL 2026-10-02] (Q6 RESOLVED).

**Overrides to H.1–H.3**

1. H.1: Add the subline directly under the H1: "Write a code on a thing; find its record by camera, typing, or voice." [WIRE]
2. H.1 phone order becomes: H1, subline, image b, actions, then the [BRIEF] paragraph [WIRE]. This replaces "image above text on phones". The image still comes before the descriptive paragraph.
3. H.1 desktop: The text column holds the H1, subline, actions, and paragraph. The image column holds b. The 1:1.618 ratio is unchanged.
4. H.1: The focal point of image b sits on the tape code, so the mark stays visible in every crop [WIRE]. Caption: "Word code on blue tape beside an obscured barcode." [BRIEF]
5. H.1: Keep both buttons. The desktop wireframe shows only the primary action, but the [BRIEF] specifies both [BRIEF].
6. H.1: Keep the em dash in "writable—and smart." [MICHAEL 2026-10-02] (Q1 RESOLVED). This is the only em dash allowed in site copy; the no-em-dash rule still applies everywhere else.
7. H.3: Render the comparison as three cards, one per mark: Barcode, QR code, and zzThis [WIRE]. Each card has three labeled rows (Create the mark, Read the mark, What it connects) that use the [BRIEF] cells verbatim. The cards stack on phones [BRIEF]. The zzThis card has an accent edge.
8. The Section 3.2 order conflict is resolved by [WIRE]: comparison → How it works → Field logistics → From photo to action. Q2 is closed.

### 3.2 Home (`/`)

Reading order follows Do / Re / Mi / Fa as rhythm only. No beat labels are printed [BRIEF]. Golden-ratio proportions may inform spacing and image scale [BRIEF].

**Source conflict:** the [BRIEF] destinations row lists "core workflow; field example", while the reading-order table puts Re (field item) before Mi (workflow). This spec follows the reading order and merges both into one Field logistics band (INFERRED; OPEN Q2).

#### H.1 Hero (Do)

Image: `public/images/panels/b-crate-word-code.webp`, eager loaded, `fetchpriority="high"`. At 900 px and wider, the image and text sit side by side at about 1.618:1 (image:text). On phones, the image appears above the text so that the image comes before the description [BRIEF; layout INFERRED].

```copy
H1: Barcodes made things scannable. zzThis makes them writable—and smart.
P:  zzThis is a human-readable, human-writable code alongside barcodes and QR codes. Write zz-copper-lantern-sky-zz on tape, a crate, a parcel, or a sign. Link it to a digital record, then find it by camera, typing, or voice.
Primary button:   See field logistics   → /#field-logistics
Secondary button: How it works          → /how-it-works
```

[BRIEF] Michael chose to keep the em dash [MICHAEL 2026-10-02] (Q1 RESOLVED). Image b carries the "Concept illustration" tag in its caption [MICHAEL 2026-10-02]. Render the code in IBM Plex Mono (INFERRED).

#### H.2 Featured statement (Do)

No image.

```copy
H2: The shortest, smartest distance between a physical thing, its digital record, and the work that comes next.
P:  A writable mark establishes identity where the work happens. AI can help identify loose items from photos, compare inventory over time, suggest handling, and prepare a form or request. Touch and voice shorten the path from what a person sees to what the system can help them do.
```

[BRIEF]

#### H.3 Comparison strip (Do)

H2: "How zzThis compares" (INFERRED). Cells are verbatim [BRIEF]:

| | Barcode | QR code | zzThis |
|---|---|---|---|
| Create the mark | Print | Print or display | Write, print, or display |
| Read the mark | Scanner | Camera | Person, camera, typing, or voice |
| What it connects | Item to data | Surface to digital content | Thing to its record and next action |

Render this table as three cards, per override 7 in Section 3.1a. Also include a visually hidden `<table>` with the same cells so that screen readers can navigate by row and column (INFERRED).

#### H.4 How it works (Mi), `id="how-it-works"`

```copy
H2: How it works
P:  Core identity: MARK a lowercase zz code → READ it by camera or manual entry → LINK it to a record → REPORT the words by voice where useful.
Step 1 H3 Mark:   Write the code on tape, a crate, or a pallet.        [image alt-c]
Step 2 H3 Read:   Camera or manual entry.                              [image d]
Step 3 H3 Link:   Connect to an existing record and photo.             [image e]
Step 4 H3 Report: Say the code words if a voice handoff is useful.     [image f]
P:  Example code: zz-copper-lantern-sky-zz   (lowercase, as text)
P:  For a field code made with no device, link and reconcile later.
Link: Try the scripted demo → /demo
```

Sources: the first paragraph and the closing line are [BRIEF]. The example-code line shows the visible lowercase zz code as text, not as the zz-code logo image [MICHAEL 2026-10-02] (Q11 RESOLVED); the "Example code" label is INFERRED. The step text is [WIRE]. The link text is INFERRED. In each card, the image sits above the step text.

#### H.5 Field logistics (Re), `id="field-logistics"`

```copy
H2: Field logistics
P:  Hand-mark mixed items at the point of work; link the mark to a record.
Cards: a, b (alternate), c, with captions from the Section 3.8 image plan.
```

[WIRE]. This band and H.6 together form the visually largest part of Home, with eight full-size image cards [BRIEF]. Section H.7 uses smaller thumbnails.

#### H.6 From photo to action (Fa), `id="photo-to-action"`

```copy
H2: From photo to action
P:  A second layer after the handwritten code: see an item, identify it, choose its next task.
[Concept group label, Section 3.1a]
Sequence: j (01 Photograph), k (02 Guide), l (03 Review); then cards m (Inventory assistant) and n (Touch first)
P:  AI-assisted work: PHOTOGRAPH one or more items → CONFIRM the proposed identification → choose a handling or inventory action by touch or voice → REVIEW the prepared record or form.
```

The first paragraph and the card labels are [WIRE]. The workflow paragraph is [BRIEF]. Keep this section distinct and after the marking example, never under the digital-alias card [BRIEF].

#### H.7 More applications, `id="applications"`

```copy
H2: More applications
P:  The same writable code works in other settings.
H3 Field logistics (≥ 600 px only): Hand-mark bags, crates, pallets, and mixed goods; read or relay a code; connect it to existing identifiers. Then photograph loose items, prepare a turn-in, compare inventory, and use touch-first actions.   [thumbnail j]
H3 Postal and parcel: Write a reference directly on a parcel; photograph loose items and receive packing guidance before choosing a parcel code.   [g, o]
H3 Everyday and community: A handwritten code on a lost-cat flyer or other public surface can lead to a useful page.   [h]
H3 Digital aliases: A short human-readable code can stand in for a long machine address used by software agents.   [i]
Link: All applications → /applications
```

The story text for each category is [BRIEF]. The intro paragraph and link text are INFERRED. On phones, each card shows one image. The parcel card shows g and o side by side at 50% width each [WIRE].

#### H.8 About teaser

```copy
H2: About and people
P:  Meet Michael and the advisors; see prototype explorations.
Link: About zzThis → /about
```

[WIRE]

#### H.9 Contact action, `id="contact"`

```copy
H2: Contact
P:  Discuss field feedback, a pilot, or collaboration.
Link: 1@1000x10.com → mailto:1@1000x10.com
```

[WIRE] [BRIEF]

#### Footer (all pages)

Footer: How it works | Applications | Demo | About | Contact, then "1@1000x10.com" [BRIEF] and the words "Patent pending" [MICHAEL 2026-10-02] (Q9 RESOLVED).

### 3.3 How it works (`/how-it-works`)

| Order | Section | Content | Source |
|---|---|---|---|
| 1 | H1 "How it works" | Intro: "Two connected workflows: one code for identity, and AI for the work that follows." (INFERRED) | — |
| 2 | H2 "Core identity" | Same as H.4, using the shared component | [BRIEF] [WIRE] |
| 3 | H2 "Three ways to read a code" | H3 Camera; H3 Typing; H3 Voice, each one line: "Read by camera or manual entry. Report the words by voice where useful. Voice and manual entry are alternate input paths." Panels d and f | [BRIEF] |
| 4 | H2 "When a reading is uncertain" | "The design resolves only above a confidence threshold. Otherwise it asks for confirmation, another view, or manual handling." | [PRODUCT] |
| 5 | H2 "AI-assisted work" | Same as H.6, using the shared component | [BRIEF] [WIRE] |
| 6 | H2 "The code is public; the record is protected" | "The visible words are a public identifier, not a password or private key. Payment and authorization remain in signed backend records." | [PRODUCT] |
| 7 | Demo link | "Try the scripted demo" → /demo | INFERRED |

### 3.4 Applications (`/applications`)

H1 "Applications". The intro, verbatim: "AI belongs across field logistics and parcel workflows. Digital aliases are a separate application." [BRIEF]

| H2 | Story copy (verbatim) | Panels | Source |
|---|---|---|---|
| Field logistics | BRIEF category story (see H.7) | a, b alternate, c, d, e, f, j, k, l, m, n | [BRIEF] |
| Postal and parcel | BRIEF category story | g, o | [BRIEF] |
| Everyday and community | BRIEF category story | h | [BRIEF] |
| Digital aliases | BRIEF category story, plus "Deeper blockchain/AI architecture can grow into a later page." | i | [BRIEF] |

Each H2 section carries an `id` (`#field`, `#parcel`, `#community`, `#aliases`) so a later page can link to it (INFERRED). The field section is the largest on this page [BRIEF].

### 3.5 About (`/about`)

The layout follows Section 3.1a.

| Block | Copy | Source |
|---|---|---|
| H1 | About zzThis | [WIRE] |
| Intro | "A code a person can write anywhere, linked to a digital record and the next work." | [MICHAEL 2026-10-02] wireframes |
| Contact card | "1@1000x10.com. Invite collaboration and test partners." | [WIRE] |
| H2 Current explorations | zzthing.com: "Broader showcase and label mockups." zzthat.com: "Scanner/creator prototype; planned free web, Android, and iOS app." [MICHAEL 2026-10-02] Concept label 2 (Section 3.1a) | [WIRE] [BRIEF] |
| H2 Founder | Michael Chung, "Founder and project lead." Bio (founder origin): "Michael Chung says he ‘invents business models.’ His earlier ideas explored email organization and electronic payments for civic services. zzThis follows the same impulse: a useful digital connection should be possible wherever a person can write. A handwritten zz code can give a parcel, crate, tool, or public sign a persistent reference, then connect it to a record and the work around it. Michael is developing the idea across logistics, community use, and AI-assisted workflows." A longer founder history can follow later. LinkedIn: https://www.linkedin.com/in/unitynow | [MICHAEL 2026-10-02] (Q8 RESOLVED); placement [OPERATOR 2026-10-02] (Q24) |
| H2 Advisors | Cards: Jim White, "Local AI and language"; Patrick Muggler, "Connected logistics and IoT"; Arshi Chadha, "AI security"; Ridham Bhagat, "Robotics and smart-contract security"; Daniel Meyer, "Full-stack development"; Adam Fry, "Advisor". Bios for Patrick, Arshi, Ridham, and Daniel are verbatim from the brief (`src/content/people.ts`). | [MICHAEL 2026-10-02] |
| H2 Codes written by hand | Real photos: zz-hackerdojo-zz, zz-helloworld-zz, zz-roto-zz. Label: "Real photos of handwritten codes." | [ASSETS]; label INFERRED |
| Location | "Mountain View / Santa Clara area; Hacker Dojo work base." | [WIRE] [BRIEF] |
| Next action | "Discuss a pilot, test cohort or collaboration." → mailto | [WIRE] |

**Advisor card (INFERRED).** Each card shows initials in IBM Plex Mono at 42 px inside a 1:1 tile, then the name as H3, the role line, the bio where supplied, and a LinkedIn link where a URL was supplied [MICHAEL 2026-10-02]: Michael Chung, Jim White, Patrick Muggler, Arshi Chadha, Ridham Bhagat. Daniel Meyer and Adam Fry have no URL or headshot yet; Adam Fry has no specialty or bio yet (Q10, Q12).

### 3.6 Contact (`/contact`)

| Block | Copy | Source |
|---|---|---|
| H1 | Contact | [BRIEF] |
| P | "Discuss a pilot, field feedback, or collaboration." | [BRIEF] |
| Email | 1@1000x10.com as a `mailto:` link | [BRIEF] |
| Location | "Michael works from the Hacker Dojo area in Mountain View/Santa Clara." | [BRIEF] |

The page has no form, because the site has no backend (INFERRED).

### 3.7 Content model (INFERRED)

All copy lives in `src/content/*.ts` as typed objects [BRIEF]:

```ts
type PanelStatus = "concept" | "real-photo" | "demo-mock" | "logo";
interface ImageMeta {
  id: string;            // "a" … "o", "alt-l", "demo-01", "hw-hackerdojo"
  src: string;           // "/images/panels/b-crate-word-code.webp"
  width: number; height: number;
  title: string; shortCopy: string; alt: string; caption: string;
  focal: { x: number; y: number };   // 0–1, maps to object-position
  destination: Array<"home" | "how" | "applications" | "about" | "demo">;
  status: PanelStatus;
  sourceTag: "BRIEF" | "WIRE" | "ASSETS";
}
```

The other content files are `hero.ts`, `comparison.ts`, `workflows.ts`, `applications.ts`, `people.ts`, `contact.ts`, `technology.ts` (unpublished draft), `labels.ts`, and `demo.ts`.

### 3.8 Image plan

All panel images have status `concept` [ASSETS]. Captions follow the [BRIEF] scene direction or the [WIRE] step text.

| Panel | Path (`public/images/…`) | Alt text (INFERRED) | Caption | Placement |
|---|---|---|---|---|
| a | panels/a-duffels-crate.webp | Olive duffels and a crate with blue tape marked zz-b2-smith-1-zz and zz-b2-4-zz. | No-device marking on duffels and a crate. [BRIEF] | Field band, /applications |
| b | panels/b-crate-word-code.webp | Olive crate with blue tape reading zz-copper-lantern-sky-zz beside an obscured barcode. | Word code on blue tape beside an obscured barcode. [BRIEF] | Hero; demo B |
| b alt | panels/alt-b-weathered-crate.webp | Weathered crate label with a handwritten blue-tape code over a barcode. | Obscured label. [WIRE] | Field band (avoids repeating the hero image) |
| c | panels/c-pallet-circled.webp | Wrapped pallet hand-printed with (zz) camp bravo four two (zz). | Wrapped mixed-goods pallet with circled zz marker. [BRIEF] | Field band |
| c alt | panels/alt-c-circled-tape.webp | Close-up of blue tape reading (zz) camp bravo four two (zz). | Write on tape or an item. [WIRE] | Step 1 Mark |
| d | panels/d-camera-read.webp | Phone camera framing a handwritten crate code with offline and checksum indicators. | Camera or manual entry. [WIRE] | Step 2 Read |
| e | panels/e-linked-record.webp | Tablet record card linking a code to NSN, document number, hand receipt, and photo. | Code linked to NSN, document number, hand receipt, and photo. [BRIEF] | Step 3 Link |
| f | panels/f-radio-readback.webp | Two radios with the handoff "Tag: copper, lantern, sky. Break." and a read-back. | Radio cue and read-back: three code words. [BRIEF] | Step 4 Report |
| g | panels/g-parcel.webp | Parcel with zz-river-maple-sky-zz handwritten beside the address. | Handwritten code on a parcel beside the address. [BRIEF] | Parcel card |
| h | panels/h-lost-cat.webp | Lost-cat flyer with zz-kathy-lost-cat-zz being scanned by a phone. | Lost-cat flyer with handwritten code. [BRIEF] | Community card |
| i | panels/i-agent-alias.webp | Laptop showing a short zz alias mapped to a long agent address. | Short agent alias standing in for a long machine address. [BRIEF] | Aliases card |
| j | panels/j-photo-to-action.webp | Soldier photographing loose and broken items on a vehicle tailgate. | Loose or broken items; spoken note. [WIRE] | 01 Photograph |
| k | panels/k-ai-guidance.webp | Rugged phone boxing each item with a proposed next step. | Confirmed item and handling choices. [WIRE] | 02 Guide |
| l | panels/l-turn-in-form.webp | Tablet turn-in request form with item fields and attached photos. | Prepared form and photos. [WIRE] | 03 Review |
| m | panels/m-shelf-inventory.webp | Day 1 and Day 4 shelf photos; water at about two days left with a reorder prompt. | Same shelf across days; lower stock and proposed reorder. [WIRE] | Inventory card |
| n | panels/n-touch-first.webp | Phone screen with a recognized item being dragged onto large action buttons. | Drag an identified item to an action; offer voice input. [WIRE] | Touch-first card |
| o | panels/o-pack-and-ship.webp | Phone packing guidance for a guitar and an appliance with a zz parcel code. | Guitar and appliance packing guidance; handwritten zz parcel code. [BRIEF] | Parcel card |
| l alt, m alt | removed from `public/` | Not used: Michael confirmed the primary l and m files (Field Tablet Turn-In Request Review, Split-screen water stock drops by Day 4) [MICHAEL 2026-10-02]. The alternates remain on branch `assets`. | — | Q4 RESOLVED |
| demo 01–05 | demo/*.webp | Per step, Section 4.3 | Per step | /demo |
| real photos | handwritten/*.webp | For example: "ZZ-HACKERDOJO-ZZ handwritten on paper." | Real photo. [ASSETS] | /about |
| logos | logos/zzthis-logo-on-light.webp, …-on-dark.webp | "zzThis" | — | Header, swapped by theme |

Handwritten-code scenes [MICHAEL 2026-10-02] (Q11 RESOLVED): b in the hero, a and c (with b alternate) in Field logistics, g for parcel, h for community, and the lowercase zz code as text in the explainer. `zz-dojo-mojo-org-nacho-zz.webp`, `zz-sticky-note.webp`, and `zz-code-tm.webp` stay unrendered.

## 4. Click-through demo (`/demo`)

### 4.1 Rules

- The demo is scripted and has no backend, camera, microphone, network calls, or storage. All data is mock data (INFERRED, per operator).
- Every step shows a persistent badge, "Demo · mock data", at the top of the step panel. The badge is not dismissible and is included in each step's accessible name.
- The intro reads, verbatim: "This is a scripted demonstration. No recognition runs; every result is prewritten mock data." (INFERRED)
- The UI never uses the words "detected live", "scanning", or a spinner that implies processing. Results appear on button press with the label "Show scripted result".
- The demo uses the H1 "See zzThis in action." [MICHAEL 2026-10-02], a lead line, a "Current prototypes" block (zzthing.com, zzthat.com, and the planned free zzThat app), then two H2 tabs: "Flow A: Field item" and "Flow B: Look up a code".

### 4.2 Mock data (`src/content/demo.ts`)

Code strings come from the sources. Every record field is labeled mock.

| Code | Source | Mock record |
|---|---|---|
| zz-copper-lantern-sky-zz | [BRIEF] | Crate, field supply. NSN: "MOCK-0000-00-000-0001". Document number: "MOCK-DOC-0001". Hand receipt: "MOCK-HR-01". Photo: demo/01 |
| zz-river-maple-sky-zz | [ASSETS] | Parcel. Reference: "MOCK-PARCEL-01". Status: "Ready for drop-off (mock)" |
| zz-blue-bike-astoria-zz | [PRODUCT] | Physical thing: bicycle. Owner contact: "Withheld: public code, protected record (mock)" |
| zz-b2-4-zz | [ASSETS] | Duffel group B2, item 4. Hand receipt: "MOCK-HR-02" |

Flow A handling options: Pack, Return, Repair, Dispose [BRIEF]. The mock "suggested" option is Return, with the reason "Damaged handle (mock)". The mock confidence is "0.94 (mock)", and the checksum state is "Checksum: OK (mock state, no algorithm runs)".

### 4.3 Flow A state machine

| State | Screen | Image | Primary action | Back |
|---|---|---|---|---|
| A0 intro | "A field crate, marked by hand." | demo/01 | Start | — |
| A1 mark | "Write the code on tape." Code shown in mono | demo/02 | Photograph (simulated) | A0 |
| A2 photo | "Photo taken (mock image)." | demo/05 | Show scripted result | A1 |
| A3 read | Code, confidence 0.94 (mock), checksum OK (mock). Buttons: Confirm or Retry | demo/02 | Confirm → A4; Retry → A2 | A2 |
| A4 linked | Record card from 4.2 | demo/03 | Next | A3 |
| A5 handle | "AI suggestion (mock): Return." Four large targets; voice chip "Say 'return' (simulated)" | panels/k | Choose an option → A6 | A4 |
| A6 review | Prepared turn-in form, read-only, chosen action filled in | panels/l | Review complete | A5 |
| A7 end | "Nothing was submitted. This was a demo with mock data." Restart and Contact links | demo/04 | Restart → A0 | A6 |

The voice chip is a button. Activating it selects the option and shows the text "Simulated voice input: 'return'". The demo does not use the microphone.

### 4.4 Flow B state machine

Input: a text field labeled "Type a zz code", a Look up button, and example chips for the codes in 4.2.

| State | Trigger | Output |
|---|---|---|
| B0 idle | — | Field and chips |
| B1 resolved | Normalized input matches a mock code | Record card (mock) |
| B2 (removed) | Removed on 2026-10-02 (issue #12). A miss never lists or suggests other codes. | None |
| B3 abstain-unknown | Valid grammar, no exact match | "No match. The demo will not guess. Check the words and try again." Placeholder wording until Q20 is answered |
| B4 abstain-malformed | Parser rejects the input | "This is not a zz code. Use the form zz-word-word-zz." |

**Parser (`src/lib/grammar.ts`, INFERRED, demo only)**

1. Trim the input and lowercase it.
2. Accept the markers `zz-…-zz` and `(zz) … (zz)`. Accept a missing closing marker as well.
3. Treat hyphens and spaces as separators.
4. Require 2–5 words, each matching `[a-z0-9]+`.
5. Return `{ ok, words, variant: "dash" | "circled" }` or `{ ok: false, reason }`.

The resolver mock (`src/lib/resolver.ts`) is pure. It returns `resolved | abstain-unknown | abstain-malformed`. It matches the normalized code exactly and never ranks or suggests other codes (Section 10.4, issue #12). Test inputs: `zz-coper-lantern-sky-zz` → abstain-unknown, with no other code shown. `ZZ COPPER LANTERN SKY ZZ` → resolved. `zz-apple-sky-zz` → abstain-unknown. `copper` → abstain-malformed.

### 4.5 Accessibility and motion (INFERRED)

- Each step change moves focus to the new step heading, which has `tabindex="-1"`. An `aria-live="polite"` region announces "Step 3 of 8: Read result".
- All controls are native buttons, reachable by Tab and activated by Enter or Space. Handling targets form a `radiogroup` with arrow-key navigation. Drag is never required.
- Flow B results render in an `aria-live` region.
- With `prefers-reduced-motion: reduce`, transitions are instant. Otherwise, steps cross-fade in 160 ms or less.
- Without JavaScript, the demo shows a static ordered list of all steps as a fallback.

## 5. Visual system and components

### 5.1 Color tokens (INFERRED values; principles from the operator)

| Token | Dark | Light | Use |
|---|---|---|---|
| `--surface` | #1C1B19 | #F4EFE4 | Page |
| `--mount` | #262421 | #EAE3D4 | Card mount |
| `--text` | #F4EFE4 | #1C1B19 | Body (about 15:1) |
| `--text-muted` | #C9C2B4 | #4A463F | Captions (≥ 7:1) |
| `--edge` | #3A3732 | #CFC6B4 | Fine card edge and construction lines |
| `--accent` | #F85000 | #F85000 | Single accent: primary button fill, zzThis card edge, focus ring, step numerals |
| `--on-accent` | #1C1B19 | #1C1B19 | Text on accent (about 5.0:1) |

Orange on cream is about 3:1, so in light mode the accent never colors body text. Links use `--text` with a 2 px accent underline. The theme follows `prefers-color-scheme` and stores no state, so the toggle resets on reload (INFERRED).

### 5.2 Type and spacing

| Role | Font | Size (mobile → ≥ 900 px) | Line height |
|---|---|---|---|
| H1 | IBM Plex Sans 600 | 32 → 52 px | 1.15 |
| H2 | Plex Sans 600 | 26 → 34 px | 1.2 |
| H3 | Plex Sans 600 | 20 → 21 px | 1.3 |
| Body | Plex Sans 400 | 17 px | 1.6 |
| Caption | Plex Sans 400 | 14 px | 1.45 |
| Codes, labels, badges | IBM Plex Mono 500 | 15–16 px | 1.4 |

Fonts are self-hosted WOFF2 files in `public/fonts` (Latin subset). Spacing tokens follow φ steps of 4, 6, 10, 16, 26, 42, 68, and 110 px. Section gaps use 68 px on phones and 110 px at ≥ 900 px. The maximum line length is 68ch.

### 5.3 Card specification

- The card sits on `--mount` with a 1 px `--edge` border.
- The lower-right corner has a single 16 px cut, made with `clip-path`. The border follows the cut through an SVG overlay or a pseudo-element.
- A separate floating shadow sits beneath the card: a blurred offset element at 8 px down and 0 px across, about 0.35 opacity in dark mode and 0.12 in light mode.
- Cards in a series have equal footprints, enforced with `grid-auto-rows: 1fr`.
- The image comes first, at 1.618:1, then the title, then a one-line caption.

### 5.4 Focus and states

- Focus: `:focus-visible` shows a 2 px `--accent` outline with a 3 px offset on every interactive element. Outlines are never removed.
- Hover: the edge changes to `--text-muted`. Hover never changes layout.
- Disabled: 50% opacity and `aria-disabled`.
- Minimum target size: 44 × 44 px.

## 6. Stack, repo layout, and engineering rules

**Stack:** Astro (static output), INFERRED. Astro builds static HTML with no client JavaScript by default, so only the demo ships JavaScript, as one TypeScript island. The build makes no runtime external requests and includes no analytics. The site has no service worker. IBM Plex is self-hosted through `@fontsource` packages [OPERATOR 2026-10-01].

**Hosting:** GitHub Pages, deployed from the private repo `Zero-State-LLC/zzthis` (organization plan Team). The repo became private on 2026-10-02 [OPERATOR 2026-10-02]. On the Team plan the Pages site stays publicly visible, so rendered copy still follows the public-site rules. Repo access needs an organization seat; outside collaborators on a private repo use a paid seat. Source documents, costs, and credentials still stay out of the repo. The project-site URL is `https://zero-state-llc.github.io/zzthis/`. The site has no custom domain, no DNS, and no Vercel [OPERATOR 2026-10-01].

**Base path:** `astro.config.mjs` sets `output: 'static'`, `site: 'https://zero-state-llc.github.io'`, and `base: '/zzthis/'`. Every internal link and image URL is built from `import.meta.env.BASE_URL`. The source contains no absolute root paths such as `/images/...` or `/demo` [OPERATOR 2026-10-01]. A small helper in `src/lib/url.ts` that joins `BASE_URL` with a relative path keeps this consistent (INFERRED).

```
.github/workflows/
  ci.yml                   (required `build` check; do not edit or duplicate)
  pages.yml                (deploy)
  site-ci.yml              (typecheck and test)
  free-security-scan.yml   (security scan)
  project-collaboration.yml (project board automation)
.specify/memory/           constitution.md
specs/                     001 to 004 feature specs, README.md, analysis
src/
  pages/        index.astro how-it-works.astro applications.astro about.astro contact.astro demo.astro 404.astro
  components/   AdvisorCard AppCards Card ComparisonCards ConceptLabel Eyebrow Footer Header
                PhotoToAction Series Steps SwipeRow ThemeToggle (.astro)
  layouts/      BaseLayout.astro
  demo/         Demo.ts (island) demoMachine.ts dom.ts renderA.ts renderB.ts
  lib/          grammar.ts image.ts resolver.ts url.ts
  content/      *.ts (Section 3.7)
  styles/       tokens.css base.css
scripts/        check-dist.mjs check-agents-md.sh security-scan.sh
tests/          content demo-guard demoMachine grammar image resolver url (.test.ts)
public/images/  optimized WebP images
LICENSE         proprietary, all rights reserved
package-lock.json
```

`src/pages/404.astro` builds to `dist/404.html`, which GitHub Pages serves for unknown paths [OPERATOR 2026-10-01]. Its links also use `BASE_URL`.

| Rule | Requirement |
|---|---|
| TypeScript | `strict: true`, `noUncheckedIndexedAccess`, no `any` (enforced by ESLint `no-explicit-any: error`) |
| Lint and format | ESLint (typescript-eslint, eslint-plugin-astro) and Prettier |
| Tests | Vitest; 100% line and branch coverage on `src/lib/*` and `src/demo/demoMachine.ts`, with thresholds enforced in the config |
| File size | Every source file under 500 lines |
| Images | WebP from `public/images`, referenced through `BASE_URL`; `width` and `height` set; `loading="lazy"` and `decoding="async"` below the fold; hero eager |
| Fonts | IBM Plex from `@fontsource` packages, bundled into the build; no font CDN [OPERATOR 2026-10-01] |
| Scripts | `package.json` defines `lint`, `typecheck` (`astro check && tsc --noEmit`), `test` (`vitest run --coverage`), and `build` |
| Lockfile | Commit `package-lock.json` [OPERATOR 2026-10-01] |
| Required CI | PR #1 is merged to `main`. `main`'s `.github/workflows/ci.yml` (job id `build`, the required check) runs `bash scripts/check-agents-md.sh AGENTS.md`, detects `package.json` and the lockfile, uses Node 24, runs `npm ci` when `package-lock.json` exists, and then runs `npm run lint` and `npm run build` if those scripts exist. Do not edit or duplicate this file. `lint` and `build` must pass under Node 24 [OPERATOR 2026-10-01]. |
| Optional CI | `.github/workflows/site-ci.yml` may run typecheck and test on `pull_request` (Node 24, INFERRED to match `ci.yml`). It must not repeat lint or build [OPERATOR 2026-10-01]. |
| Deploy | `.github/workflows/pages.yml` triggers on `push` to `main` and on `workflow_dispatch`. Permissions: `pages: write`, `id-token: write`, `contents: read`. Concurrency group `pages`. Steps: `npm ci`, `npm run build`, `actions/configure-pages`, `actions/upload-pages-artifact` (path `dist`), and `actions/deploy-pages`. Pull requests do not deploy [OPERATOR 2026-10-01]. |
| Docs | Repo `AGENTS.md` says start at `README.md`, then the spec, which lives at `docs/SPEC.md` [OPERATOR 2026-10-01] |
| Secrets | No passwords, tokens, or private source documents in the repo |

## 7. Workflows

| Item | Value |
|---|---|
| Governing workflows | anti-slop-code, production-systems, google-developer-style, frontend-inspiration-lock, stop-slop (copy) |
| Spec owner | Opus 5.5 (this document) |
| Implementer | Cloud coding agent; opens a draft PR to `main` |
| Reviewer | Operator, through the draft PR |
| CI | `.github/workflows/site-ci.yml`, compatible with PR #1's CI (Section 6; OPEN Q13). The operator's original request named this file `ci.yml`; the new name avoids a clash with PR #1. |

## 8. Acceptance criteria

1. `/zzthis/`, `/zzthis/how-it-works`, `/zzthis/applications`, `/zzthis/about`, `/zzthis/contact`, and `/zzthis/demo` build as static HTML and return content. `/technology` does not exist, and no page links to it.
2. Each page has exactly one `<h1>`, and no heading level is skipped.
3. The nav shows, in order: How it works, Applications, About, Contact. The footer shows How it works, Applications, Demo, About, Contact, then "Patent pending" [MICHAEL 2026-10-02].
4. The hero H1, subline, paragraph, featured statement, comparison cells, workflow lines, and category stories match Sections 3.2–3.4 character for character. This check uses a snapshot test of the content objects.
5. No rendered copy contains an em dash (—), except the hero H1 "writable—and smart." [MICHAEL 2026-10-02].
6. The Home section order matches Section 3.1a. Field logistics and From photo to action contain the most image cards on Home.
7. Panel placement matches Section 3.8. j, k, and l render as an ordered list labeled 01 to 03.
8. Concept labels follow Section 3.1a [MICHAEL 2026-10-02]: standalone panels carry "Concept illustration", each grouped gallery has one label above it, and the About prototype block has one. `/zzthis/demo` shows the "Demo · mock data" badge on every step, A0–A7 and B0–B4.
9. The advisor list is Jim White, Patrick Muggler, Arshi Chadha, Ridham Bhagat, Daniel Meyer, and Adam Fry [MICHAEL 2026-10-02]. Every page footer shows "Patent pending".
10. No page shows a portrait. Advisor and founder cards use initials.
11. Flow A reaches A7 with the keyboard alone. A7 states that nothing was submitted.
12. Flow B produces each outcome for the test inputs in Section 4.4.
13. The demo makes no `getUserMedia`, `fetch`, or storage calls. A grep check runs in CI.
14. No unmeasured performance figure (for example, 95%, 99.9%, or 0.1%) appears in rendered copy. No page contains the words "pilot customer", "endorsed", or "adopted by".
15. Light and dark themes both render correctly at 320, 390, 900, and 1440 px, with no horizontal scroll and no clipped text.
16. Text contrast is at least 4.5:1 in both themes, checked with axe-core in Playwright or an equivalent tool.
17. With reduced motion, the demo makes no animated transitions.
18. Lighthouse mobile scores (INFERRED goals): Performance ≥ 90, Accessibility 100, Best Practices ≥ 95, SEO ≥ 95.
19. The browser makes no network requests to other origins at runtime. Fonts load from the site's own origin [OPERATOR 2026-10-01].
20. The required `build` check from `ci.yml` is green on the PR, with `npm ci`, lint, and build passing under Node 24. If `site-ci.yml` exists, its typecheck and test (100% coverage on the required logic) are green. `ci.yml` is unchanged [OPERATOR 2026-10-01].
21. Repo size budget: images 15 MB or less, and the total build output 20 MB or less (INFERRED). No file exceeds 2 MB.
22. A secret scan (gitleaks or an equivalent tool) is clean, and no private source document is in the repo.
23. Every internal `href` and `src` in `dist/` starts with `/zzthis/` or is relative. A grep check finds no `href="/` or `src="/` that lacks the `/zzthis/` prefix [OPERATOR 2026-10-01].
24. `dist/404.html` exists, and its links resolve under `/zzthis/`.
25. The build output contains no service worker registration.
26. `package-lock.json` is committed, and `npm ci` succeeds from a clean checkout.
27. `pages.yml` matches Section 6: it triggers only on `push` to `main` and `workflow_dispatch`, uses the listed permissions and concurrency group, and uploads `dist`. The PR does not trigger a deploy.
28. After merge, `https://zero-state-llc.github.io/zzthis/` serves Home, and every nav link and image loads without a 404.

## 9. Out of scope and OPEN questions

**Out of scope:** real recognition, camera access, a real resolver, accounts, forms or email backends, analytics, service workers, a custom domain or DNS, Vercel, the technology page, the founder history page (patent, civic payments, HalfHashed Labs, Unity Consensus) [BRIEF], the zzthing.com and zzthat.com apps, and CMS integration. GitHub Pages replaces the earlier Vercel target [OPERATOR 2026-10-01].

Michael's answers arrived on 2026-10-02 through Danny (issue #10), in an updated content brief and updated wireframes. [MICHAEL 2026-10-02] tags each answer.

| # | Question for Michael and Danny | Default or decision |
|---|---|---|
| Q1 | The hero em dash: use a comma or another form? | RESOLVED: keep the em dash in "writable—and smart." Only this line may use one [MICHAEL 2026-10-02] |
| Q2 | Home order | Closed by [WIRE] |
| Q3 | H1 wording for `/demo` | RESOLVED: "See zzThis in action." [MICHAEL 2026-10-02] |
| Q4 | Which l and m renders are the final corrected versions? | RESOLVED: Field Tablet Turn-In Request Review (l) and Split-screen water stock drops by Day 4 (m), already the primary files; the alternates are not used [MICHAEL 2026-10-02] |
| Q5 | Should the demo appear in the main nav? | RESOLVED: no; link from How it works and the footer. Add "Try zzThat" to the nav when the free app launches [MICHAEL 2026-10-02] |
| Q6 | Founder and advisor portraits: should the team supply approved photos? No LinkedIn scraping. | RESOLVED: initials cards until Michael supplies approved original headshots; supplied LinkedIn URLs are profile links [MICHAEL 2026-10-02] |
| Q7 | Should research targets be published, and where? | RESOLVED: do not publish them on the site [MICHAEL 2026-10-02]; removed from the repo (Q24) |
| Q8 | Michael's origin story for the About page | RESOLVED: short founder origin on About (Section 3.5); room for a longer history later [MICHAEL 2026-10-02] |
| Q9 | Should a patent notice appear in the footer? | RESOLVED: footer shows the words "Patent pending" [MICHAEL 2026-10-02] |
| Q10 | Profile URLs and bios for Patrick Muggler, Arshi Chadha, and Daniel Meyer | PARTLY RESOLVED: bios for Patrick, Arshi, and Daniel; LinkedIn URLs for Patrick and Arshi [MICHAEL 2026-10-02]. Still OPEN: Daniel's profile URL and project accomplishments |
| Q11 | Should the remaining handwritten photos and the zz-code mark be used? | RESOLVED: b hero; a and c field logistics; g parcel; h community; lowercase zz code as text in the explainer [MICHAEL 2026-10-02] |
| Q12 | Should Adam Fry (named in [PRODUCT]) be listed? | RESOLVED: yes, initials card, role "Advisor" [MICHAEL 2026-10-02]. Still OPEN: his specialty, bio, profile URL, and photo |
| Q13 | CI | Closed: PR #1 `ci.yml` (job `build`) is the required check; do not edit or duplicate it; optional `site-ci.yml` runs typecheck and test only [OPERATOR 2026-10-01] |
| Q14 | Public wording for the technology page | RESOLVED: draft wording supplied (stored in `technology.ts`); no empty page; the page enters navigation only with that content plus an example [MICHAEL 2026-10-02] |
| Q15 | Domain | Closed for launch: GitHub Pages project URL https://zero-state-llc.github.io/zzthis/, no custom domain or DNS [OPERATOR 2026-10-01] |
| Q16 | Ridham Bhagat's role: "robotics and resilient operations" [BRIEF] or "robotics and operations" [WIRE]? | RESOLVED: "Robotics and smart-contract security", with the supplied bio [MICHAEL 2026-10-02] |
| Q17 | Concept label wording | RESOLVED: "Concept illustration" on standalone AI-render panels; one label above a grouped gallery (Section 3.1a) [MICHAEL 2026-10-02] |
| Q18 | Should we fine-tune our own small model for on-device capture (Option B, Section 10.8)? | OPEN, deferred: ship Option A now, run a 2-week Option B prototype, switch the on-device reader if it wins; cloud vision stays for retries [OPERATOR 2026-10-02] |
| Q19 | How do partner apps authenticate to the API (Section 10.6)? | OPEN; no default chosen yet [OPERATOR 2026-10-02] |
| Q20 | Does the demo's code lookup show "no match" (not "did you mean") for unrelated codes such as `zz-apple-sky-zz` vs `zz-b2-4-zz`? | OPEN; asked in issue #10, not yet answered. Default: "no match" |
| Q21 | Touch-first verbs differ across the brief, wireframe, and demo. Which set is canonical? | OPEN; default: keep the demo as built (spec 001) |
| Q22 | Field logistics panels: a and c [BRIEF], or a, b, and c [WIRE]? | OPEN; default: keep as built (spec 001) |
| Q23 | Should a real handwritten photo replace the hero render? | OPEN; default: keep panel b with its label (spec 001) |
| Q24 | Remove the pitch-sourced founder bio, the company-stage line, the research targets, and the related figures from the repo? | RESOLVED: removed; the About page keeps Michael's founder origin [OPERATOR 2026-10-02] |
| Q25 | How does a person pick a valid code with no device? | OPEN; none chosen (spec 002) |
| Q26 | Purge window for revoked codes and rate-limit values | OPEN; none chosen (spec 002) |
| Q27 | Which code formats come first? | OPEN; none chosen (specs 002, 003) |
| Q28 | Where record-signing keys live and how they rotate | OPEN; none chosen (spec 002) |
| Q29 | Where the resolver code lives | OPEN; none chosen (spec 002) |
| Q30 | Error classes the check word must detect | OPEN; minimum: one wrong word (spec 003) |
| Q31 | Target wordlist size: 5,000 or 10,000 [PRODUCT] versus about 4,000 (Section 10.8) | OPEN; none chosen (spec 003) |
| Q32 | Language and licensing of the word source | OPEN; none chosen (spec 003) |
| Q33 | zzThat app scope (web, Android, iOS) | OPEN; not specified (spec 004) |
| Q34 | Source and consent for the real-photo test set | OPEN; none chosen (spec 004) |
| Q35 | How to measure distinct letter shapes and distinct sounds | OPEN; none chosen (spec 003) |
| Q36 | Can retired codes be reissued? | OPEN; "never reissue" proposed (spec 002) |
| Q37 | Capture confidence thresholds and read-back error method | OPEN; none chosen (spec 004) |
| Q38 | Where voice input is processed | OPEN; none chosen (spec 004) |
| Q39 | What counts as the zzThat launch for the "Try zzThat" nav action? | OPEN; none chosen (spec 001) |

## 10. Architecture (proposal, not built)

**Status: proposal.** Nothing in this section is built. It records the architecture direction that Danny set on 2026-10-02, plus the recommendations he accepted [OPERATOR 2026-10-02]. The marketing site and the `/demo` click-through (Sections 3 and 4) stay static and mock-only; they do not call this API. Product behavior in Section 2 still governs where the two differ. Items marked **INFERRED** are sketch details added in this spec, not operator decisions.

### 10.1 Topology

- One central server, hosted on the web, owns codes, records, grants, and the append-only audit log [OPERATOR 2026-10-02].
- Every app is an API client: the phone app, the web app, and partner systems. No client holds the source of truth [OPERATOR 2026-10-02].
- Revocation, single use, expiry, and rate limits are enforced centrally, on the server, never in a client [OPERATOR 2026-10-02].

```mermaid
flowchart LR
  subgraph Clients["API clients"]
    Phone["Phone app<br/>on-device recognition"]
    Web["Web app"]
    Partner["Partner systems"]
  end
  subgraph Edge["Edge layer (Cloudflare Workers)"]
    Read["Fast reads<br/>resolve, cached signed records"]
  end
  subgraph Core["Central server (source of truth)"]
    API["Write and signing API<br/>issue, revoke, version, grants"]
    DB[("Portable SQL<br/>codes, records, record_versions,<br/>grants, audit_events")]
    Blob[("Object storage<br/>retry photos")]
    Vision["Cloud vision model<br/>hard cases only"]
  end
  Phone -->|"decoded code"| Read
  Web --> Read
  Partner --> Read
  Read -->|"writes, signing, misses"| API
  API --> DB
  API --> Blob
  Phone -.->|"photo on retry or hard case"| API
  API -.-> Vision
```

### 10.2 Edge layer and hosting

- The API sits behind an edge layer. Cloudflare Workers is the recommended host for the prototype and the pilot, with D1 for the database and R2 for stored photos [OPERATOR 2026-10-02].
- Reads are fast at the edge. Writes and signing are centralized: one place issues codes, signs record versions, and writes the audit log [OPERATOR 2026-10-02].
- The schema is portable SQL, so it can move off D1 without a redesign. If a sponsor needs IL4 or IL5, the later path is AWS GovCloud [OPERATOR 2026-10-02].
- Edge caches hold only signed records for reusable codes. Single-use and short-expiry codes are never served from cache: every resolve of these goes to the central server, which marks a single-use code used in the same write (INFERRED). Revoked codes stop resolving at the edge within a stated purge window (INFERRED: short cache lifetimes plus purge on revoke).

### 10.3 Capture

AI reads, grammar verifies [OPERATOR 2026-10-02].

1. Recognition runs on the device with an AI vision model, preferably a small on-device model [OPERATOR 2026-10-02].
2. Only the decoded code goes to the API. The photo stays on the device by default [OPERATOR 2026-10-02].
3. Photos go to the server only on a retry or a hard case. There, a larger cloud vision model can read them [OPERATOR 2026-10-02].
4. Every model read, on device or in the cloud, is snapped to the closed wordlist, and the checksum word is verified [OPERATOR 2026-10-02].
5. Low-confidence reads go to clarify or retry, with a human confirm step, using the decision bands in Section 2.5 [OPERATOR 2026-10-02] [PRODUCT].

Which model does the on-device reading is OPEN. Section 10.8 compares the options.

### 10.4 Security model

The code on paper is public, so security lives in the resolver [OPERATOR 2026-10-02] [PRODUCT].

- **Signed record versions.** Each change to a record is a new version signed by the server.
- **Single use and short expiry** where the code format calls for them (Section 2.2 formats).
- **Rate limits** per client, per role, and per code, to slow enumeration.
- **Tiered views.** The resolver returns a view scoped to the caller's role. SD-JWT (selective disclosure) is an option for these views, not a commitment.
- **Exact match only.** The resolver matches the exact code and never suggests live codes. Fuzzy correction happens on the client against the closed wordlist and checksum, never by asking the server for nearby codes.
- **Handwriting first.** Handwritten codes must work. Printed marks or steganography are optional add-ons only, never required to resolve.

All bullets above are [OPERATOR 2026-10-02].

### 10.5 Offline

- Apps may briefly cache signed records so a person can read them without a connection [OPERATOR 2026-10-02].
- Issuing and revocation always go through the server. An offline app cannot issue, revoke, or mark a code used [OPERATOR 2026-10-02].
- A code written with no device (Section 2.4) is linked later, when the app is back online [BRIEF]. How a person picks a valid code with no device is OPEN: for example, a pre-issued code card, or claiming a handwritten code that the server then checks for checksum and collisions (INFERRED).

### 10.6 API sketch (INFERRED)

A minimal shape for discussion, not a contract. Every call is authenticated and writes an audit event.

| Method and path | Purpose | Notes |
|---|---|---|
| `POST /codes` | Issue a code | Server picks the words and checksum. Body sets format, expiry, single use, and the linked record. |
| `GET /resolve/{code}` | Resolve a code | Exact match only. Response is scoped to the caller's role. Unknown, expired, used, and revoked codes all return the same not-found shape, so callers cannot probe for live codes. Single-use codes always resolve on the central server, which marks them used. |
| `POST /codes/{id}/revoke` | Revoke a code | Takes effect centrally at once. Edge caches are purged within the stated purge window (Section 10.2). |
| `POST /records/{id}/versions` | Add a record version | Server validates, signs, and stores a new version. Older versions are kept. |
| `GET /audit` | Read audit events | Filtered by code, record, or time. Restricted to roles with audit access. |

### 10.7 Data model sketch (INFERRED)

Portable SQL. Column lists are illustrative.

| Table | Purpose | Key fields |
|---|---|---|
| `codes` | Issued codes | `id`, `words`, `checksum_word`, `format`, `status` (active, used, revoked, expired), `single_use`, `expires_at`, `record_id`, `issued_by`, `created_at` |
| `records` | The thing a code points to | `id`, `owner_id`, `current_version_id`, `created_at` |
| `record_versions` | Signed, immutable history | `id`, `record_id`, `version`, `body`, `signature`, `signing_key_id`, `created_by`, `created_at` |
| `grants` | Who sees which view | `id`, `subject_id`, `scope` (code, record, or tenant), `role`, `view_tier`, `expires_at` |
| `audit_events` | Append-only log | `id`, `actor_id`, `action`, `target_type`, `target_id`, `result`, `created_at`. Never updated or deleted. |

### 10.8 Recognition approaches (decision OPEN)

Two ways to build the reader in Section 10.3. Both feed the same grammar: snap to the closed wordlist, verify the checksum word, and confirm with a person when confidence is low [OPERATOR 2026-10-02].

- **Option A: off-the-shelf AI vision.** An existing model does the reading: a cloud vision model, optionally with a small general on-device model. The output is snapped to the wordlist and the checksum is verified [OPERATOR 2026-10-02]. To keep to Section 10.3, the on-device model reads first where it is good enough, and photos go to the cloud model only on a retry or a hard case (INFERRED).
- **Option B: fine-tune our own small model.** For example TrOCR-small, or a small vision-language model with LoRA, trained on the closed wordlist. This is easier than general handwriting recognition because the model only has to pick from about 4,000 known words, not read any text [OPERATOR 2026-10-02].

**Data for Option B.** Data is the hard part. Start with synthetic data: the wordlist rendered in handwriting fonts, with blur, warping, and cardboard and tape textures. Then add real photos [OPERATOR 2026-10-02]. Training takes hours on a single GPU, and the result is small enough to run on a phone [OPERATOR 2026-10-02].

| Factor | Option A: off-the-shelf vision | Option B: fine-tuned small model |
|---|---|---|
| Accuracy in the field | Good on clean text; general models can misread unusual handwriting, but the wordlist snap and checksum catch many errors | Unknown until benchmarked; a model trained only on the wordlist may beat general models on rough handwriting, tape, and cardboard |
| Cost per read | Cloud reads are billed per call by the vision provider; on-device reads cost nothing per read | Near zero per read on device; the main cost is training runs and data collection |
| Offline support | Only with the on-device model; cloud reads need a connection | Full offline reading on the phone |
| Privacy | On-device reads keep the photo on the device; cloud reads send it off the device | Photo stays on the device; only the decoded code is sent |
| Time to first result | Available now | About 2 weeks for a first prototype |
| Data needs | None to start; real photos are still needed to measure accuracy | Synthetic data plus real photos |
| Maintenance | Provider owns the model; versions can change under us, so reads must be re-tested on each change | We own retraining when the wordlist or capture conditions change |

The table rows are a comparison drawn up in this spec from the operator's factors (INFERRED) and are not measured results.

**Recommendation** [OPERATOR 2026-10-02]:

1. Ship with Option A now.
2. Run a 2-week Option B prototype (synthetic data plus a few hundred real photos), benchmarked against Option A on the same test set.
3. If Option B wins, switch the on-device reader to Option B.
4. Keep cloud vision for retries and hard cases either way.

**Decision: OPEN.** Fine-tuning is deferred until the prototype benchmark is in (Q18) [OPERATOR 2026-10-02].

### 10.9 Open items

- **Fine-tune a small handwriting model?** Deferred pending a 2-week prototype benchmark (Section 10.8) [OPERATOR 2026-10-02]. See Q18.
- **API auth for partner apps.** Not decided [OPERATOR 2026-10-02]. See Q19.

## 11. Provenance

| Claim | Tag | Source file |
|---|---|---|
| Hero, featured statement, comparison, nav, destinations, reading order, workflows, categories, panels, advisors, prototypes, contact | [BRIEF] | zzThis - Website Content and Design Brief 2026-10-01.md |
| Segments, hero subline, j–l sequence, concept label rule, About layout, Jim White removal, golden ratio | [WIRE] | zzThis - Website Wireframes 2026-10-01.md |
| Capacity, checksum, formats, resolver controls, POC status, code examples | [PRODUCT] | Michael's private product write-up, 2026-09-09 (not in this repo) |
| Document index and summary | [OVERVIEW] | zzThis - Overview.md |
| Image paths, codes in panels, concept versus real status, brand orange #F85000 | [ASSETS] | Asset manifest, branch `assets` |
| Architecture: central API topology, edge layer, on-device capture, recognition approaches A and B, resolver security model, offline rules, open items (Section 10) | [OPERATOR 2026-10-02] | Operator decision by Daniel Meyer, 2026-10-02 01:21 to 01:22 PT |
