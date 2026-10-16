# Intent: About, minor text changes (and one home line)

Author: Claude (working with Michael)
Date: 2026-10-15
Status: accepted (by Danny, 2026-10-15 8:50 PM PT: "Go ahead and merge the edits.")
Product: zzThis (`Zero-State-LLC/zzthis`)

## Proposed outcome

Text-only changes on About, as Michael gave them [MICHAEL 2026-10-15]:

1. zzthis.com prototype card: "For business uses: companies, enterprises, governments, and defense. Logistics, inventory, and postal workflows, built secure and compliant."
2. Founder title: "Founder, new products and business models architect, project lead".
3. Founder bio, 2003 sentence: names the patent application ("Methods and systems for electronic mail, internet target and direct marketing, and electronic mail banner") and says it described a method for sorting tagged emails into dedicated tabs.
4. Founder bio, 2001 sentence: now "barely familiar with technology or email; I could hardly tell POP from SMTP", followed by two new sentences on the email spam surge and his tag-and-sort solution. Michael's em dash is a semicolon (site rule: no em dash).
5. The Hacker Dojo block is replaced by a "Silicon Valley: The Heart of Tech" block [MICHAEL 2026-10-15]: subtitle "Innovation | Community | Networking", two paragraphs, a lead line, and a seven-item skills list (two columns from 48rem), as given. No Hacker Dojo text and no logo. Body text at `--text-base`. See `docs/SPEC.md` (H2 Silicon Valley row).
6. Location: "Silicon Valley (Santa Clara) and New York City."

7. Home hero sub-headline, last sentence: "The “zz” ends tell our scanner exactly where to look, just like the start and end bars on a barcode and the three corner squares on a QR code."

The patent title is in quotation marks, since the bio is plain text and cannot italicize.

## Affected users / systems

`src/content/people.ts`, `src/content/contact.ts`, `src/pages/about.astro`, `src/styles/b-about.css`, `tests/bCopy.test.ts`, `tests/people.test.ts`, `src/content/hero.ts`, `tests/hero.test.ts`, `tests/content.test.ts`, `tests/content-site.test.ts`, `specs/001-marketing-site/spec.md`, `docs/SPEC.md`.

## Next

Accepted by Danny 2026-10-15 8:50 PM PT; merge PR #181.
