# Intent: home hero, bold lead and two new paragraphs

Author: Claude (working with Michael)
Date: 2026-10-17
Status: draft (accepted when Danny merges the PR that adds it)
Product: zzThis (`Zero-State-LLC/zzthis`)

## Proposed outcome

On the home page, in the hero body, as Michael gave it [MICHAEL 2026-10-17]:

- The first sentence of the existing body paragraph is bold: "zzThis is a human-readable, human-writable code for the physical world."
- A new paragraph, same font: **Versatile, custom, any language.** Own words or an organization's custom dictionary; marking offline with only a marker and registering later; each position can carry its own meaning; a hand-drawn picture code (an original cupcake drawing, inline SVG); and two language examples, Korean `zz-구리-등불-하늘-zz` and `zz-נהורא-שמיא-zz`. In the language and picture codes only the `zz` markers are orange.
- A new paragraph, same font: **Blockchain, AI, and macros.** Aliases for blockchain accounts, ledger entries, and smart-contract addresses; verifiable identifiers for AI agents (`zz-AI@-Agentsmith-zz`); macros (`zz-fn-invoice-Acme-zz`) that run only after an authorized person confirms.
- Each code stays on one line.

## Notes

- "verifiable" (not "secure") and "runs only after an authorized person confirms it" keep the site consistent with the xTech white paper, which describes a code as a public pointer to an access-controlled record.
- The Hebrew-script code is wrapped in `<bdi>`, so it renders in the correct right-to-left order inside the line.

## Affected users / systems

`src/content/hero.ts`, `src/components/HeroMore.astro` (new), `src/pages/index.astro`, `src/styles/b-base.css`, `tests/hero.test.ts`.

## Next

Danny reviews and merges. Merging the PR that adds this file accepts it.
