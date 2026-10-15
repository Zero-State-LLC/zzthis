# Intent: About, minor text changes (and one home line)

Author: Claude (working with Michael)
Date: 2026-10-15
Status: draft (accepted when Danny merges the PR that adds it)
Product: zzThis (`Zero-State-LLC/zzthis`)

## Proposed outcome

Text-only changes on About, as Michael gave them [MICHAEL 2026-10-15]:

1. zzthis.com prototype card: "For business uses: companies, enterprises, governments, and defense. Logistics, inventory, and postal workflows, built secure and compliant."
2. Founder title: "Founder, new products and business models architect, project lead".
3. Founder bio, 2003 sentence: names the patent application ("Methods and systems for electronic mail, internet target and direct marketing, and electronic mail banner") and says it described a method for sorting tagged emails into dedicated tabs.
4. Founder bio, 2001 sentence: now "barely familiar with technology or email; I could hardly tell POP from SMTP", followed by two new sentences on the email spam surge and his tag-and-sort solution. Michael's em dash is a semicolon (site rule: no em dash).
5. Hacker Dojo: "Many of us met at Hacker Dojo, ..." (rest unchanged).
6. Location: "Silicon Valley (Santa Clara) and New York City."

7. Home hero sub-headline, last sentence: "The “zz” ends tell our scanner exactly where to look, just like the start and end bars on a barcode and the three corner squares on a QR code."

The patent title is in quotation marks, since the bio is plain text and cannot italicize.

## Affected users / systems

`src/content/people.ts`, `src/content/contact.ts`, `src/content/hero.ts`, `tests/hero.test.ts`, `tests/content.test.ts`, `tests/content-site.test.ts`, `specs/001-marketing-site/spec.md`, `docs/SPEC.md`.

## Next

Danny reviews and merges. Merging the PR that adds this file accepts it.
