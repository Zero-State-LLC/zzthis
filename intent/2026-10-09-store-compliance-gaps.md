# Intent: App Store and Google Play compliance gaps for the v1.1 zzThat launch

Author: Grok Bot for Danny
Date: 2026-10-09
Status: accepted (Danny, chat 2026-10-09 23:21 PT)
Product: zzThis (`Zero-State-LLC/zzthis`) and zzThat (`Zero-State-LLC/zzthat`)

## Problem / why now

The 2026-10-09 store compliance audit (zzthat `main` e2bb2a4, zzthis `main` 6afde2f) found eleven gaps between the v1.1 store launch and the live App Store Review Guidelines and Google Play policies. The largest: zzThat FR-035 says "No block list", but Apple 1.2 and Play's UGC policy require blocking once public create (D-2026-10-10-21) opens in v1.1.

[verified: App Review Guidelines 1.2, 4.8, 5.1.1(v), last updated 2026-06-08; Play UGC, account deletion, target API, and ML Kit data disclosure pages, fetched 2026-10-09]

## Proposed outcome

- D-2026-10-10-25 records one decision per gap with a store citation.
- BACKLOG carries RM-101 to RM-112 with release, priority, and owner.
- RELEASE-ROADMAP v1.1 lists them as prerequisites.

## Constraints

- Docs only in this repository. App code is zzThat work (kneelbeforez0D).
- No legal facts are invented; B2 stays with Danny.
- Contract 1 stays frozen through v1.1 (D-2026-10-10-12).
