# Intent: apply Michael's 2026-10-07 content changes (Home, About)

Author: Claude (working with Michael)
Date: 2026-10-07
Status: draft (accepted when Danny merges the PR that adds it)
Product: zzThis (`Zero-State-LLC/zzthis`)

## Problem / why now

Michael sent a short change list on 2026-10-07 ("zzthis ws modification asks", v2). Applying it here saves Danny's agent from reading the Word file. [verified: Michael's .docx change list, 2026-10-07]

## Proposed outcome

- Home: in "Why the zz markers matter", only "zz" is orange; the rest of the heading uses the normal text color.
- Home: the markers paragraph ends "Two “zz” letters or “marks”, recognizable almost anywhere, in any handwriting." (Michael offered "marks" or "markings"; "marks" is used.)
- Home: the language heading reads "zz- In - any - language -zz", with dashes between the words.
- About: the zzThat wordmark uses the lowercase "zzthat" variant, from Michael's supplied logo file.
- About: the founder bio and the Hacker Dojo paragraph are replaced with Michael's text as given.
- About: zzthis.com replaces zzthing.com in the prototypes section, with the header's two zzthis logos (white "this" on the dark theme, black "this" on the light theme) and a commercial-use blurb; the label above the cards is updated to match.
- Home: the "About and people" heading matches the "Contact" heading size, and the contact email is about half its earlier size.
- All pages: dark is the default for every visitor, whatever their device setting. The header toggle still switches the current page to light; the choice is not stored, because check-dist bans browser storage.
- About: Omer F. Yalcin is added as the fifth advisor, with his headshot and LinkedIn link. The bio is condensed from his LinkedIn profile; the role line is Michael's (2026-10-07); the closing "advises zzThis on" sentence is drafted.

## Constraints

- Michael's wording is used as given [MICHAEL 2026-10-07]. His en dashes stay; no em dash (Q62).
- Code words on the site stay as they are (lowercase). Michael's note: reading ignores case, so the site does not change; capitals for the zzThat apps and a future zzThat site are TBD.

## Affected users / systems

`src/content/anatomy.ts`, `src/components/Anatomy.astro`, `src/styles/b-console.css`, `src/content/contact.ts`, `src/content/people.ts`, `public/images/logos/zzthat-lowercase.webp`, `public/images/people/omer-yalcin.webp`, `tests/content.test.ts`, `src/pages/about.astro`, `src/styles/b-about.css`, `src/styles/b-bands.css`, `src/layouts/BaseLayout.astro`, `src/components/ThemeToggle.astro`.
