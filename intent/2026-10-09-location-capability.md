# Intent: Consumer location capability across zzThis releases

Author: Daniel Meyer (drafted with Hermes)
Date: 2026-10-09
Status: draft
Product: zzThis (`Zero-State-LLC/zzthis`)

This file is a proto-spec. It does not authorize implementation or change the active v1 contract.

## Problem / why now

The product concept includes location-shaped use cases: lost/found community notices, trail information, delivery, and field logistics. The repository currently has no location field or location interaction in the contract-1 record model. The only GPS mention is a future candidate in `docs/SPEC.md` §12.2. We need a staged, consumer-first plan that can serve these uses without making a location code a second record identifier or copying a proprietary location-addressing system.

[verified: `specs/005-v1-api/spec.md` FR-007 and Data model; `specs/005-v1-api/openapi.yaml` EverydayRecord; `docs/SPEC.md` §12.2; `src/content/appImages.ts` and `src/content/applications.ts`]

## Proposed outcome

Observable done (a stranger can check this without reading the chat):

- A reviewed feature proposal compares location representations, user journeys, privacy boundaries, and version dependencies, with rejected paths and unresolved operator decisions explicit.
- The proposal names a minimal consumer-facing v1 outcome and separates it from later word-code, logistics, and semantic-profile capabilities; no implementation or contract-1 change occurs before promotion.
- A location object and location-resolution concept have bounded, versioned responsibilities, with acceptance evidence and migration dependencies defined before implementation.

## Affected users / systems

- Users: people creating or reading a public community record; later, delivery and field-logistics users.
- Systems: zzThis `/v1` record contract, zzThat native clients, later web client, record version/signature/cache behavior, location permission UX, and roadmap bundles B7/B8/B10.

## Constraints

Product-true locks (do not reopen in implement):

- A location does not replace or change the zz-code that identifies a record. A location is optional record data, not a resolver authority.
- The plan must not reproduce a proprietary provider's algorithm, word assignments, or user-facing code format. Any location addressing scheme must be independently chosen, documented, tested, and versioned.
- Contract 1 and its release remain append-closed unless the operator explicitly promotes a scope change under `specs/SCOPE-GOVERNANCE.md`.
- Location capture is foreground and user-initiated; no background tracking, continuous history, or silent location attachment.
- Public location disclosure requires an explicit preview/confirmation and a clear precision choice. No exact location is inferred from a record's text, photo metadata, or device location without user action.

Non-goals:

- Navigation, routing, geofencing, live location sharing, or continuous tracking.
- A geocoding vendor, address database, or map-tile dependency as a server authority.
- Changing the v1 text grammar or reusing a record zz-code as a location code.
- Claiming emergency-service suitability or a guaranteed positional accuracy.

## Open questions

- Does the operator promote a small consumer location attachment into contract 1, or target a later contract/release? This is a scope decision, not a technical default.
- Which consumer journey is first: lost/found, community/trail information, or another named use?
- Should v1 accept user-placed pins only, foreground device location only, or both? What permission posture is acceptable on iOS and Android?
- What disclosure choices and default privacy behavior apply to free-public records, which are always public today?
- Is a human-readable global location reference required at the first release, or is an optional location attachment enough?
- Who owns native-client specification and acceptance evidence in the zzThat repository?

## Claims

| Claim | Label |
|---|---|
| Contract-1 EverydayRecord contains only `title` and `body`; the data model stores them in append-only record versions. | `[verified: specs/005-v1-api/spec.md FR-007 and Data model; openapi.yaml EverydayRecord]` |
| Contract 1 makes every `free_public` record public and only allows private records in enterprise/logistics. | `[verified: specs/005-v1-api/spec.md FR-035]` |
| Android allows approximate location permission and the result can be substantially coarser than a pin the user chose manually. | `[verified: Android Developers, Request location permissions, https://developer.android.com/develop/sensors-and-location/location/permissions]` |
| A user-selected point with an explicit disclosure radius is a better first consumer surface than a new location word grammar. | `[assumed: proposal recommendation; validate with operator and consumer workflow review]` |

## Next

A human accepts or revises this file. Then complete specify and plan review in `specs/006-location/`. Do not implement from this file alone.
