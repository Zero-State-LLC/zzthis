# Intent: show zz-codes in capitals in v1

Author: Claude (for Michael and Danny)
Date: 2026-10-06
Status: draft. Needs Danny's accept. Instructions for the implementing agent.
Product: zzThis (`Zero-State-LLC/zzthis`)

## Problem / why now

Danny wants people to see and write v1 codes in capitals, for example `ZZ-COPPER-LANTERN-SKY-ZZ`. Michael agrees for v1 and lifts the lowercase-only display rule [MICHAEL 2026-10-06]: the reader already ignores case, so `zz`, `Zz`, `zZ`, and `ZZ` (and `(zz)` or `(ZZ)`) are the same marker. Later versions care less about case. [verified: Michael, 2026-10-06 message]

## Proposed outcome

What people see changes; what the system matches does not.

1. **Matching: no change.** `docs/SPEC.md` Section 2.2a step 4 already case-folds before matching, so every code written in any case resolves the same. Do not change `zz-core` parsing, the wordlist, the check word, or the stored canonical key.
2. **Display: capitals.** Wherever a code is shown to a person, show it in capitals: site copy, headings, captions, the specimen on Home, the console, the demo, and the iOS, Android, and web apps. Suggested way to keep this cheap and reversible:
   - Add one display helper in `packages/zz-core` (for example `displayCode(canonical)`, returning the canonical form in capitals), and use it in the apps and the console.
   - On the site, set `text-transform: uppercase` on code elements (`code`, `.specimen__code`, console output) rather than rewriting every string, and uppercase the codes that appear inside running prose in `src/content/*.ts`.
3. **The standalone mark** is shown as `ZZ` or `(ZZ)`.
4. **Keep lowercase:** the brand names zzThis and zzThat, URLs, and file names.
5. **Spec and checks** (Danny's call, after this intent is accepted):
   - Update `docs/SPEC.md`: the display case rule (around the "Case rule" paragraph in Section 2 and the canonical-form bullet that cites D-2026-10-03-01), noting Michael's 2026-10-06 decision.
   - Remove or relax the "standalone capital ZZ" rule in `scripts/check-dist.mjs`, and update the content tests that pin lowercase copy. Per `AGENTS.md`, change these only together with the accepted spec change, not to force green.
6. **Images:** existing renders show lowercase codes and stay as they are. New images use capitals.

## Open questions for Danny and Michael

- Handles and domain-style names (`zz-@agentsmith-zz`, `zz-vitalik.eth-zz`): capitals too, or keep lowercase where the outside system uses lowercase (ENS names, email-style handles)?
- Non-Latin examples (Korean, Japanese, Aramaic) have no case; only their zz markers change.
- The xTech white paper: capitals there too, or lowercase for the Army audience? The original lowercase rule came from the Army concern that a capital Z mark on equipment resembles adversary markings (`docs/SPEC.md`, case rule).

## Affected users / systems

Site copy and styles, console, demo, `packages/zz-core` (display helper only), iOS, Android, and web apps, `docs/SPEC.md`, `scripts/check-dist.mjs`, content tests.

## Non-goals

Changing how codes are parsed, matched, issued, or stored.
