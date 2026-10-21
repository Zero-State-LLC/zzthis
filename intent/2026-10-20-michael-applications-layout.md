# Intent: Applications page side-by-side pairs and the U-Haul concept pair

Author: Claude (working with Michael)
Date: 2026-10-20
Status: draft (accepted when Danny merges the PR that adds it)
Product: zzThis (`Zero-State-LLC/zzthis`)

## Problem / why now

Michael's 2026-10-20 Applications page patch tightens the layout, removes internal planning lines that read as hedges, and adds a U-Haul concept pair. [verified: Michael, 2026-10-20]

## Proposed outcome

- Everyday section is renamed "Everyday, community, and public" (section heading and the Lost cat image title).
- The Lost cat image and the Trail marker image sit side by side at the top of that section, cropped to the same 16:9 proportions, with edges aligned to the galleries below. Their captions are unchanged. They stack on phones.
- The B9 status line and the community story ("A future community use could place...") are removed from the Applications page and the Home card.
- Digital aliases: the B16 status line, the story ("A future integration could map...", page and Home card), and the "These optional integrations are not v1 resolver capabilities or dependencies." line are removed. The agent alias image and the wallet image sit side by side like the pair above, captions unchanged.
- Home "Potential use cases and explorations": all six roadmap status lines (B7/B8/B9/B14/B16) are removed and the texts drop the v1 hedges. Item 05 reads "Future integrations to map readable codes to wallets, accounts, smart-contracts, NFTs, agent addresses, and oracles." [MICHAEL 2026-10-20]; items 01, 02, 04, and 06 follow the same "Future ..." style, and 06 keeps "The code itself carries no authority."
- Applications page: the visible intro ("These are product directions, not a list of shipped v1 integrations...") and the Field logistics (B7) and Postal and parcel (B8) status lines are removed. [MICHAEL 2026-10-20]
- Field logistics and Postal and parcel use Michael's new wording, on the Applications page and the Home cards: field story "Field workflow to use handwritten codes on bags, crates, pallets, and mixed goods to connect items to existing identifiers and prepare tasks and inventory work."; field extra "Future structured profiles and private dictionaries would assign authorized, versioned meanings only after recognition and canonicalization."; postal story "Future postal or parcel workflow, batch work, or project can have optional reference code words to be used for identity before a final parcel code is chosen." [MICHAEL 2026-10-20]
- A U-Haul concept pair closes the Businesses part of the page, below the Filco truck before/after pair, larger than the before/after pairs (portrait images, 3:4). The first image carries "Rental truck signage" and "A zz-code on a truck's door opens its rental page when scanned. Concept illustration; not affiliated with U-Haul." The second is titled "Scan to rent". The page's general disclaimer stays.

## Constraints

- Michael's wording is used as given [MICHAEL 2026-10-20]. The disclaimer avoids "endorsed" and the alt text avoids "mock" to pass the site's copy hygiene checks.
- No new product behavior is claimed. The U-Haul images are concept illustrations; U-Haul is not a partner.
- The page's meta description is a plain list of the four sections, with no roadmap codes.

Non-goals:

- No production deploy, DNS change, or spend.
- No other Home page change: its Everyday card title follows the renamed section, and the Everyday and Digital aliases cards show no story line.

## Claims

| Claim | Label |
|---|---|
| The layout, renames, and removals are Michael's | `[verified: Michael's 2026-10-20 Applications page patch]` |
| The U-Haul images are concept illustrations, not a partnership | `[verified: Michael, 2026-10-20]` |
