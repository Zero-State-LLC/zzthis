# zzThis site: audit, 2026 trend research, and three redesign samples

Prepared 2026-10-03 for `Zero-State-LLC/zzthis` (live at <https://zero-state-llc.github.io/zzthis/>).
These are static home-page prototypes for design review. They live under `docs/`, so the Astro build never sees
them and nothing here deploys. They use the repo's own images from `public/images/` and the verbatim copy from
`docs/SPEC.md`.

**To view:** from the repo root, run `python3 -m http.server 8000`, then open
<http://localhost:8000/docs/redesign-2026-10-03/>. Use the server rather than opening the files directly: sample
B's camera view needs `http://` to draw its dithered "machine view" (over `file://` it shows the plain crop).

| Sample | Folder | One line |
|---|---|---|
| A · Tape | [`a-tape/`](a-tape/index.html) | Cream paper, blue painter's tape, marker handwriting. The code is *written* across the page, then *read* by a machine. |
| B · Resolver | [`b-resolver/`](b-resolver/index.html) | Dark field instrument. The hero is a working lookup console: camera, typing, or voice → parsed code → mock record. |
| C · Hi-Vis Manifesto | [`c-manifesto/`](c-manifesto/index.html) | Poster type in charcoal and cream, safety-orange highlights, greyscale panels, one colour photograph. |
| **B v1.0 (chosen)** | [`b-resolver-v1/`](b-resolver-v1/index.html) | The original B plus Michael's v1.0 change list, extended to [About](b-resolver-v1/about.html) and [Applications](b-resolver-v1/applications.html). See section 5. |

---

## 1. Audit of the current site (Hallmark audit)

Scope: the home page (`src/pages/index.astro` and its components), the shared layout and styles, checked live at
320, 390, and 1440 px in light and dark. Line numbers are in `Zero-State-LLC/zzthis` at `580bd65`.

**What is already good, and every sample keeps it:** honest labelling (concept tags, "Demo · mock data", no
invented metrics), a skip link, 44 px targets, visible focus rings, eager hero image with `fetchpriority`, lazy
images below the fold, WebP everywhere, light and dark themes, no horizontal scroll at 320 px, and copy managed
in `src/content/`. The engineering is solid. The problems are almost all visual structure and storytelling.

### Critical

1. **One template, eight times (structural).** `src/pages/index.astro:70–140`. Every section is a numbered
   eyebrow, an H2, and a uniform card grid: Top ways 3×2 (`TopWays.astro:99`), comparison 4-up
   (`ComparisonCards.astro:114`), steps 4-up (`Steps.astro:68`), field 3-up (`SwipeRow.astro:118`), photo to
   action 3-up (`PhotoToAction.astro:100`), applications 2×2, about/contact 2-up. Same padding, same rhythm, same
   card. The page reads as a stack of templated grids, which is the main generated-UI tell.
   → Give each section its own shape (ledger rows, a real table, a stage timeline, a photo strip, a console) and
   vary spacing between sections.
2. **The product's core idea never happens on the home page.** zzThis is "write it by hand, a machine reads it",
   but nothing on Home is written or read. The demo is off-nav and linked once in small text.
   → Make the write-to-read moment the hero (sample A writes the code across the page; sample B runs the real
   demo parser in the hero).

### Major

3. **Eyebrow on every section.** `index.astro:70–140` uses `<Eyebrow index="01">` through `"08"`. The numbers are
   not ordinal content, so they are decoration. → Remove them. Keep numbers only where the content is a real
   sequence (Mark → Read → Link → Report).
4. **Type does not match the mark, and the weights are timid.** The logo is a heavy, rounded geometric wordmark;
   the site is IBM Plex Sans 600 over 400 (`base.css:49`, `tokens.css:30, 55`). The H1 is 52 px on desktop and
   32 px on phones, under 2× the 17 px body. A 200-unit weight gap and that small a phone jump read as default
   settings. → Commit to a display face with a heavier weight and a wider phone scale.
5. **The hero headline wraps to five lines at 1440 px.** The 72-character H1 sits in the narrow column of a
   1 : 1.618 split, so at 1440 px it is a five-line block beside the photo. → Split the two sentences into two
   registers: a small setup line ("Barcodes made things scannable.") and a large claim. All three samples do this
   with the copy unchanged.
6. **The real photos are buried.** The four real photos of handwritten codes are only on `/about`
   (`about.astro:14`), while Home is entirely AI concept renders. In 2026 the strongest proof of "made by a
   person" is the real thing. → Bring the real photos onto Home, labelled as real (sample A).
7. **Side-stripe accent in the demo.** `demo.astro:201` uses `box-shadow: inset 3px 0 0 var(--accent)`, the
   thick one-side stripe that reads as generated UI. → Use a top rule or a full hairline.
8. **No share or browser identity.** `BaseLayout.astro` has no favicon, no Open Graph or Twitter card, and no
   canonical URL, and `public/` has no icon. Links pasted into email, Slack, or the xTechSearch portal render as
   bare URLs. → Add a favicon set, an OG image (the crate photo works), and `og:title` and `og:description` from
   the hero copy.
9. **The comparison is four boxes of tiny labels.** Row labels are 13 px uppercase mono with wide tracking, and
   the cards have large dead areas. → Render it as a real table on desktop (A, B) or with CSS subgrid so rows line
   up across cards (C, which meets Michael's "rows align across all four cards" note exactly).

### Minor

10. `base.css:28` uses `overflow-x: hidden` on `body`. Use `clip`: `hidden` breaks `position: sticky` and can trap
    scrolling.
11. `base.css:178, 252` use the browser's default `ease`. Use a named ease-out curve.
12. Top ways cards share a row height while their copy runs from two lines to nine, so short cards are mostly
    empty space (visible at 1440 px).
13. The phone page is 12,925 px tall at 390 px (about 15 screens). Most of the length is uniform cards; ledger
    rows and swipe strips cut it without cutting copy.

**Summary: 2 critical · 7 major · 4 minor.**
**Verdict: well-built, but it reads as a template.** The fix is structural, not a re-skin.

---

## 2. Top 10 web design techniques for late 2026

Research summary. Sources are listed at the end. For browser features, Baseline status is as of 2026-10.

| # | Technique | Why it is trending | Support | Used in |
|---|---|---|---|---|
| 1 | **Hand-made marks and analogue texture** | Called "tactile rebellion" in Creative Bloq's 2026 trends (Landor); Screaming Frog's "Designed by a Human" (Feb 2026); Graphic Design Junction (Aug 2026) rated it a prediction that came true | SVG, masks, CSS: everywhere | **A** (tape, marker hand, real photos), C (tape-block highlight) |
| 2 | **Kinetic, variable type** | Figma and Webflow 2026 trend reports; GSAP SplitText free since 2025 | Variable fonts: everywhere | **A** (each code written with its own informality and bounce settings, then written on letter by letter), **C** (Archivo's width axis stretches on scroll) |
| 3 | **A working product demo in the hero** | Evil Martians' study of 100 dev-tool landing pages (Jul 2025); Linear and Vercel pattern | n/a | **B** (live exact-match console) |
| 4 | **Native CSS scroll-driven animation** | Interop 2026 focus area | Chrome 115+, Safari 26; Firefox behind a flag, so used inside `@supports` | A (route line draws), C (heading sweep, width stretch) |
| 5 | **View Transitions** | Same-document transitions Baseline since Oct 2025; Astro supports them natively | Same-document: Baseline | **B** (parsed tokens morph into the record) |
| 6 | **Hyper-industrial or blueprint look** | Adobe "Hyper Industrial" microtrend (Jul 2026); spec-label and monospace annotation styles | CSS grid | **B** (grid, manifest rows, spec sheet), A (ledger) |
| 7 | **CSS-only interaction details** (anchor positioning, `sibling-index()`, `text-box-trim`) | Anchor positioning Baseline Jan 2026 | Anchor positioning: Baseline | **B** (labels anchored under each part of the code) |
| 8 | **Full OKLCH colour systems** | Webflow and Figma 2026; `contrast-color()` in Interop 2026 | OKLCH: Baseline since 2023 | All three (every colour is an OKLCH token, light and dark) |
| 9 | **Restraint and summary first** | Webflow's "TL;DR" pattern; "barely-there UI" rated a prediction that came true | n/a | **C** (one claim per block), A (two-register headline) |
| 10 | **Shader texture used sparingly** (dither, halftone) | Awwwards Site of the Year 2025 (Lando Norris); dither shaders in 2026 component libraries | Canvas 2D or WebGL: everywhere | **B** (Bayer-dithered "machine view" inside the camera reticle only) |

**Now read as AI tells (all three samples avoid them):** purple-to-blue gradients and neon glows; glassmorphism
and "liquid glass" everywhere; bento grids of identical rounded cards; huge-number heroes with tiny labels; motion
for its own sake (logo marquees, pulsing dots, hover zooms); Inter or Geist by default; italic serif headlines;
chains of em dashes.

---

## 3. The three samples

All three:
- Use the spec copy verbatim, including the H1's spaced hyphen. No em dashes in body copy.
- Keep the honesty rules: "Concept illustration" tags, the group label, "Demo · mock data", "Patent pending", no
  metrics, and lowercase zz in all copy (C's caps headings exempt the brand name so no capital ZZ appears).
- Keep the brand orange `#F85000` as the only accent, converted to OKLCH, with charcoal and cream neutrals from
  the spec.
- Work in light and dark, respect `prefers-reduced-motion`, and have no horizontal scroll at 320, 375, 390, 414,
  768, or 1440 px. All text passes WCAG AA contrast in both themes (computed, not estimated).
- Carry a Hallmark stamp at the top of the CSS, with tokens in `tokens.css`.

### A · Tape (Narrative Workflow)

- **Idea:** the code is a physical object. A strip of blue painter's tape pulls across the full viewport, then
  `zz-copper-lantern-sky-zz` is written on it, letter by letter, in a marker hand. Every other strip of tape on
  the page applies itself as it scrolls into view: it unrolls from alternating ends, lifts slightly, and presses
  flat. The tape on the real photos sticks on the same way. With reduced motion turned on, everything is simply
  there.
- **Type:** Bricolage Grotesque (variable: optical size and width) for display and body. Shantell Sans for
  anything written on tape: each strip has its own informality and bounce settings, so no two hands match.
  IBM Plex Mono for the code as a machine reads it.
- **Shape:**
  1. Hero.
  2. The thesis, with the "distance" drawn as a line through three points.
  3. A ledger of the six uses.
  4. A real comparison table with the zzThis column on tape.
  5. Four numbered stages (1.0 Mark to 4.0 Report), each showing the code's state at that stage.
  6. The four real handwritten photos, pinned up.
  7. The field, photo-to-action, and applications sections.
  8. Contact on masking tape.
- **Best for:** the broadest audience. It explains the idea in one look and feels made by a person.
- **Trade-off:** the most "designed" of the three. The handwriting face has to stay limited to tape.

### B · Resolver (Workbench)

- **Idea:** show the product, don't describe it. The hero is a console running the live demo's own
  `src/lib/grammar.ts` and `src/lib/resolver.ts` (ported line for line) against the same mock records.
  - **Camera:** dithers only what the reticle sees, then reads the tape.
  - **Typing:** parses as you type: markers, words, normalized form, and the failure reason.
  - **Voice:** uses a prewritten transcript.
  - **Look up:** exact match only. A miss says "The demo will not guess", per issue #12.
  - **Keyboard:** `/` jumps to the input, and the arrow keys move between tabs.
- **Type:** IBM Plex Sans Condensed, Plex Sans, and Plex Mono. This keeps the current brand family and is the
  most continuous with today's site.
- **Also proposes:** an annotated "anatomy of a code" with anchor-positioned labels, a spec-sheet comparison, the
  uncertain-reading bands from the How it works copy, and the proposed architecture from `SPEC.md` §10, labelled
  "Proposal, not built."
- **Best for:** xTechSearch reviewers, engineers, and logistics buyers.
- **Trade-off:** dense, and some new section copy needs Michael's approval.

### C · Hi-Vis Manifesto (Manifesto)

- **Idea:** one claim per block, set big enough to read across a room. "Writable" gets a safety-orange block
  that lays down like tape.
- **Colour:** every concept panel is greyscale, so the one colour photograph (the hero crate) and the orange carry
  all the colour. Turning the renders grey also takes the glossy "AI render" look off them.
- **Type:** Archivo, with its width axis running from 62 to 125, for display and body. The four imperatives
  (MARK. READ. LINK. REPORT.) stretch along the width axis as they scroll in. IBM Plex Mono for codes.
- **Comparison:** CSS subgrid aligns the rows across all four cards. The last row (NO / NO / HARD / YES) is set
  as the punchline.
- **Best for:** investors and the brand. It is the most memorable.
- **Trade-off:** the least explanatory per scroll, and greyscale panels may not suit Michael.

---

## 4. Decisions needed before any of this goes into the repo

1. **Which direction (or which mix).** A and B combine well: A's tape and real photos with B's console as the
   hero or as a section.
2. **New copy.** Each sample adds a few lines that are not in `SPEC.md` and need Michael's approval:
   - **A:** "Codes written by hand" section text.
   - **B:** anatomy labels, "Proposed architecture" text, and band names.
   - **All three:** the order of the real-photo and architecture sections.
3. **Fonts.** The samples load Google Fonts for speed. Production must self-host through `@fontsource` (the site
   makes no cross-origin requests). Every face used is on fontsource:
   - **A:** Bricolage Grotesque and Shantell Sans.
   - **B:** IBM Plex Sans Condensed.
   - **C:** Archivo.
4. **Process.** Under `AGENTS.md`, a redesign of `src/` is non-trivial: it needs an intent file accepted by a
   human, then a spec delta (001), then a PR that Danny reviews. Pages deploy on merge.

---

## 5. B v1.0: Michael's change list applied (2026-10-03)

Michael chose sample B. He sent a v1.0 change list (`zzThis_website_v1.0_changes-Claude_to_Daniel.docx`, not committed: it is a private source document).

- **What is applied:** only its "FOR THE WEBSITE AI" blocks, nothing beyond them. The bracketed notes in the doc were for Michael and are not applied.
- **Starting point:** the original B, which is unchanged in `b-resolver/` for comparison.
- **New pages:** the list covers About and Applications as well as Home, so B v1.0 adds those two pages in B's design system.

| § | Change | Where | Notes |
|---|---|---|---|
| 0 | Section and sub-topic headings about 25% smaller on every page. Hero headline, body text, and the small orange numbers unchanged. | `tokens.css` (`--text-section`, `--text-h2`, `--text-sub`) | Measured: section h2 0.75×, hero 1.00×. Sub-topic h3 stop at the 17 px body size (0.85×), so a heading never reads smaller than its text. |
| 1 | Headline second line: "zzThis makes things readable-writable - and smart." New paragraph under the buttons, with `zz-code` in monospace. | Home hero | Michael's change list uses an em dash. Decided (Danny 2026-10-03, revised): no em dash; use a spaced hyphen, as in Q47. Recorded as Q62 in `docs/SPEC.md`. There is no em-dash exception. |
| 2 | Two sentences appended to the section 01 paragraph | Home, under "The shortest, smartest distance…" | Heading and existing text unchanged. |
| 3 | Diagram code 50% smaller. Third label reads "word or check word". | Home diagram | The labels stay at 13 px rather than halving to 6.5 px, which would be unreadable. They now alternate between two tiers with leader lines, so none collide at the smaller size (checked at 800, 1100, and 1440 px). |
| 4 | "Why the zz markers matter" and "In any language" added below the four code types | Home | One line per language on phones; three columns on desktop. Aramaic is wrapped in `<bdi dir="rtl">` and verified right-to-left between the markers. Korean, Japanese, and Hebrew-script glyphs load as tiny IBM Plex subsets. |
| 5 | Founder: same headshot size and card as the advisors; new title line; new bio, word for word; LinkedIn kept | About | All six headshots measure 88 × 88. |
| 6 | Hacker Dojo moved below Advisors; logo removed; new single paragraph; subtitle kept | About | |
| 7 | "Coupang" removed; heading now "End-to-end anonymous concept use cases"; new privacy line; concept line kept; collage removed; Step 3 reads "drop-off address" | Applications | "Coupang" appears nowhere on the page. |

**Michael needs to confirm or fix these before v1.0 ships.** Danny decided items 1, 2, and the headline em dash (item 4) on 2026-10-03. Item 3 is still open.

1. **Bio version. Decided (Danny 2026-10-03).** The doc contains two versions of the bio. Section 5 reads `I “invent” business models … and solve to the emerging …`. The combined block at the end reads `“I invent" …` and `solve-to`. B v1.0 keeps the section 5 bio. No change to the bio text. The doc's other suggested bio edits, such as naming the citing companies, are not applied.
2. **Multilingual codes and the v1 grammar. Decided (Danny 2026-10-03).** Keep the "In any language" examples on the page, including Korean, Japanese, and Aramaic. The Home console does not report a code that contains non-ASCII letters as malformed. It shows a non-error note that codes in other languages and scripts are coming later, and that this demo reads v1 codes written with Latin letters and numbers for now. ASCII input stays exact match only, with no suggestions. Any-language codes remain a v2 candidate (issue #35).
3. **Native-reader check.** Still pending a human check for the Korean, Japanese, and Aramaic codes, as the doc itself advises. Tracked in #51 (Q63).
4. **Headline em dash. Decided (Danny 2026-10-03, revised).** No em dash. The headline reads "zzThis makes things readable-writable - and smart." with a spaced hyphen, as in Q47. Recorded as Q62 in `docs/SPEC.md`. There is no em-dash exception.
5. **For the production build:**
   - Self-host the new script fonts: `@fontsource/ibm-plex-sans-kr`, `-jp`, and `-hebrew`.
   - Specify the rest of the B v1.0 copy in spec 001. The headline dash is already recorded (Q62).

## Sources

- Creative Bloq, "Texture, warmth and tactile rebellion" (2026): <https://creativebloq.com/design/graphic-design/texture-warmth-and-tactile-rebellion-the-big-graphic-design-trends-for-2026>
- Screaming Frog, "Design trends shaping 2026" (Feb 2026): <https://www.screamingfrog.co.uk/blog/design-trends-shaping-2026/>
- Graphic Design Junction, "Did the 2026 web design trends predictions come true?" (Aug 2026): <https://graphicdesignjunction.com/2026/08/did-the-2026-web-design-trends-predictions-come-true/>
- Creative Boom, "10 trends creatives are so over in 2026" (Apr 2026): <https://creativeboom.com/insight/10-trends-creatives-are-so-over-in-2026/>
- Webflow, "Web design trends 2026": <https://webflow.com/blog/web-design-trends-2026>
- Figma, "Web design trends": <https://www.figma.com/resource-library/web-design-trends/>
- Adobe, "Hyper Industrial" microtrend (Jul 2026): <https://www.adobe.com/express/learn/blog/microtrends-hyper-industrial>
- Evil Martians, "We studied 100 dev tool landing pages" (Jul 2025): <https://evilmartians.com/chronicles/we-studied-100-devtool-landing-pages-here-is-what-actually-works-in-2025>
- web.dev, Interop 2026: <https://web.dev/blog/interop-2026>
- web.dev, same-document view transitions Baseline: <https://web.dev/blog/same-document-view-transitions-are-now-baseline-newly-available>
- web.dev, Baseline digest Aug 2026: <https://web.dev/blog/baseline-digest-aug-2026>
- Chrome for Developers, scroll-triggered animations: <https://developer.chrome.com/blog/scroll-triggered-animations>
- Awwwards, Lando Norris (Site of the Year 2025): <https://www.awwwards.com/sites/lando-norris>
- impeccable.style, slop catalogue: <https://www.impeccable.style/slop>
