# Location capability: research and staged specification proposal

Feature ID: 006-location
Status: proposal; not accepted for implementation
Date: 2026-10-09
Authority: `intent/2026-10-09-location-capability.md`, `specs/SCOPE-GOVERNANCE.md`

This document defines a proposed capability and identifies the decisions needed before implementation. It does not authorize a contract-1 change. It deliberately does not specify or reproduce any existing proprietary location-word system.

## Summary and recommendation

Treat location as optional, versioned data attached to a zzThis record. Keep the record code as the only resolver key. For the first consumer-facing increment, prioritize a user-placed or explicitly selected place on a map, a visible precision/disclosure choice, and a share preview. Do not require a new location-word grammar, external geocoder, or map provider to resolve the record.

The current proposal's recommended architecture is a small location value object with a source point, uncertainty/accuracy metadata when supplied, a disclosure representation, and provenance. The owner explicitly chooses what is published. The implementation must not present device accuracy as a guarantee. Where supported, users can choose a coarse disclosure area independent of the raw device reading. Exact coordinates should not be included in a public response unless the owner deliberately selects and confirms exact sharing.

A proprietary-independent, global human-readable location reference remains a later research option. The candidate should be evaluated against native codebook capacity, recognizability, boundary stability, offline behavior, migration, abuse, and the existing text grammar before selection. It must not be assumed that the current record wordlist or zz-code grammar can represent a location without changing their contracts.

## Current repository boundary

- **OBSERVED:** Contract 1 `EverydayRecord` has `title` and `body` only (`specs/005-v1-api/openapi.yaml`, `specs/005-v1-api/spec.md` FR-007).
- **OBSERVED:** `record_versions` stores `title`, `body`, signatures, and timestamps. The signed payload is currently `[record_id, version, title, body, created_at]` (`specs/005-v1-api/spec.md`, Data model).
- **OBSERVED:** `free_public` records are always public; private records currently exist only in enterprise/logistics (`specs/005-v1-api/spec.md` FR-035).
- **OBSERVED:** Public resolve responses are edge-cached for 60 seconds and record updates purge the code's cache key (`specs/005-v1-api/spec.md` FR-018/FR-019; `specs/005-v1-api/openapi.yaml`).
- **OBSERVED:** The product contains concept surfaces for lost/found, trail information, delivery, and field logistics (`src/content/appImages.ts`, `src/content/applications.ts`). These do not establish implementation requirements by themselves.
- **OBSERVED:** The roadmap is append-closed for active releases. A new user journey, data class, contract field, or permission is presumed scope expansion (`specs/SCOPE-GOVERNANCE.md`).

## What the location concept needs to do

Location functionality can mean several distinct jobs. Do not treat them as one feature:

1. **Attach a place to a record:** an owner chooses where a record applies or where an event occurred.
2. **Capture a position:** a client obtains a device estimate or lets the user place a pin.
3. **Represent a position compactly:** a coordinate or cell becomes a short human-readable reference.
4. **Resolve/display a position:** a client shows a map, locality label, or coarse area.
5. **Use location operationally:** nearby search, navigation, delivery assignment, geofencing, or emergency dispatch.

Only jobs 1 and a tightly bounded part of 2/4 are candidates for a consumer-first initial release. Job 3 is a separate research track. Job 5 belongs to later application bundles and must not be implied by attaching a location.

## Option stress test

| Path | Consumer value | Main failure modes | Cross-release fit | Disposition |
|---|---|---|---|---|
| A. Put latitude/longitude in record text (`body`) | Can be shared today without a contract change | Unstructured, hard to validate, no precision/privacy control, leaks easily, poor display and accessibility | Bad: consumers must parse prose; later migration is ambiguous | Reject as the product contract. Text may remain a user-authored note. |
| B. Add raw coordinates to the current record schema | Simple structured attachment; works with maps and later spatial functions | A public exact coordinate can expose a home/person; current free-public records cannot be private; signed payload, history, cache, clients, and deletion all change | Good as a typed base if provenance and disclosure are modeled from the start | Candidate only after contract/security decision; not a standalone sufficient design. |
| C. Mint a new proprietary-independent location word code over a grid | Writable/offline potential; can fit the existing product thesis | Requires a new encoding contract, code type/grammar or namespace, word allocation and collision/error behavior; capacity and readability compete; grid semantics and boundary rules are permanent; still does not solve privacy or map UX | Could be compatible as a later representation if it decodes to a typed location object and does not become a record resolver key | Research; no grammar or grid chosen here. |
| D. Adopt a public open location-code algorithm as the stored authority | Offline encode/decode and standard libraries can reduce implementation burden | A dependency and externally defined syntax; local shortening requires reference context; easy for users to confuse location code with zz-code; licensing and exact code-length/boundary behavior must be reviewed | Possible adapter, but avoid baking a second identifier authority into the record contract | Keep as benchmark/comparator only; do not make it the product identifier. |
| E. User-selected place with explicit disclosure precision, backed by typed coordinates | Useful to a consumer without inventing a new code; supports pin placement and later code/display adapters | Needs platform UI, privacy model, approximate device fixes, deletion/signature migration, and the ability to publish coarse rather than exact information | Best path: add as an optional versioned location object; later layers can derive codes or render maps without changing the record identifier | Recommend for first consumer scope, subject to human promotion and API/privacy design. |
| F. Reverse geocode to street address automatically | Familiar display | External data source, network and cost/dependency, inconsistent results, address can be false or over-specific; not needed to identify the record | Poor: couples core contract to provider and complicates offline/native clients | Exclude from initial scope; consider as an optional client adapter only after source and consent review. |

### Why path E is preferred

The product needs the consumer to communicate a useful place, not to learn a novel spatial encoding before the first location journey works. A typed location object is a stable integration boundary: a later codebook, open-code adapter, or map can be added as a derived view. The location object must distinguish the exact/source position from what the owner elects to disclose. This avoids both the false precision of a rounded point and premature commitment to a new grammar.

The recommendation is not that coordinates are inherently private, accurate, or safe. The user journey must make publication consequences visible, and the contract must ensure the response contains only the selected disclosure representation.

## Release decomposition

Release assignment below is a proposal for governance review. It does not silently promote work into an active release.

| Release/bundle | Proposed capability | Dependencies and promotion gate |
|---|---|---|
| Contract 1 / current v1 | No location contract change unless the operator explicitly reopens the append-closed outcome. A manual location note in body remains ordinary text, not a supported location feature. | Human scope decision; `SCOPE-GOVERNANCE.md` change test; design decision on public-record privacy and contract/signature impact. |
| Consumer v1.x (proposed B17a) | Add an optional structured place attachment; allow user-placed pin and/or one-time foreground position only after the exact journey is chosen; select disclosed precision; preview what public readers will see. No background access. | API contract versioning; zzThat specification; privacy threat review; iOS/Android approximate/precise permission behavior; map SDK and offline requirements; signed record version migration; cache and deletion tests. |
| B17b, later v1.x or v2 | Human-readable location reference generated from the typed location object, if consumer research shows typing/relay adds value. Evaluate own grid/codebook and existing open algorithms as candidates. Never reuse a record zz-code as a location reference. | Separate encoding spec, frozen test vectors, code capacity and confusion tests, short-form context safety, accuracy and boundary research; operator selects a release. |
| B7 field & enterprise | Place/asset association, indoor/site identifiers, role-based precision, inventory and handoff flows. | B17a data model; site-level coordinate/reference model; grants, audit, offline sync, and operational acceptance. |
| B8 postal/parcel | Delivery destination or handoff location, task-limited disclosure, carrier/customer workflow. | Separate authority and address validation; delivery privacy; partner integration; no inference from public location attachment. |
| B9 community/public | Lost/found, trail, event, and neighborhood records with safe area-level disclosure and optional expiry. | Consumer usability and moderation; precise-to-coarse policy; stale-location handling; safety review. |
| B10 semantic profiles (v2) | A profile can give a typed location field a domain meaning such as site, zone, or target. | #87 Scope/Namespace decision; profile schema and authorization. The location object remains data, not resolver authority. |

## Proposed initial requirements (not accepted)

These requirements define a reviewable first consumer scope. Each must be accepted, revised, or moved to a later bundle before a plan or implementation task is created.

### User stories

- **US1: Add a place to a public record.** As a consumer creating a community record, I can select a place and see exactly what location detail the public record will expose before I save it.
- **US2: Share a useful place without claiming false precision.** As a reader, I can see whether the location is an exact point, an approximate area, or a place description, and I can open it in a map only when a map provider is configured.
- **US3: Decline location access.** As a creator, I can use the record flow without granting location permission or adding a location.
- **US4: Update or remove a location.** As the record owner, I can replace or remove the location through a new signed record version; stale public cache entries age out or are purged under the same rules as other public record updates.

### Functional requirements

- **LR-001:** Location is an optional typed property of a record version. It never changes the record code, record lookup, code grammar, or resolver matching key.
- **LR-002:** A location attachment declares its semantic role: `place` (where a record applies), `event` (where something happened), or a future extension value. Do not treat device current position as the place by default.
- **LR-003:** The owner chooses between a manually placed point and a one-time foreground device estimate only if both modes are approved for the initial bundle. No background permission or recurring sampling is requested.
- **LR-004:** The location value records the coordinate reference system, source kind, capture time when applicable, and source uncertainty when the platform supplies it. Missing uncertainty is represented as unknown, never zero.
- **LR-005:** The owner selects a disclosure representation before publication: exact point or a coarser area/precision, plus optional human-authored place label. The server stores the source and disclosed value separately only if the privacy/data-retention decision approves storing both; otherwise the client sends only the disclosed value.
- **LR-006:** Public response serialization returns only the selected disclosure value and its declared granularity. It never includes device permission state, raw sensor history, or an undisclosed source coordinate.
- **LR-007:** The client previews the location and disclosure level before saving and identifies that a public record is visible to anyone with the record code/link. A location is never attached silently from photo EXIF or device state.
- **LR-008:** Invalid, non-finite, or out-of-range coordinates are rejected. Coordinates use WGS 84 latitude/longitude; latitude is in [-90, 90]. Longitude normalization at ±180 and decimal precision are specified before implementation. The server does not silently clamp, round to a different point, or geocode.
- **LR-009:** An update or removal creates a signed version under an explicitly versioned signing contract; old versions follow current retention and account-erasure rules. If location is added to contract 1, the signed bytes and all verifier implementations must be updated atomically or the field must be excluded by a formally approved compatibility rule.
- **LR-010:** Public response cache purge and maximum stale exposure are tested for location changes. The user sees an update result and does not assume global edge invalidation is instantaneous.
- **LR-011:** Location absence, permission denial, unavailable fix, stale fix, low accuracy, and manual cancellation all leave the record flow usable. The client reports unknown/unavailable state distinctly from coordinates at (0, 0).
- **LR-012:** The client does not claim that a coordinate or rendered map is a guaranteed arrival point, an address, or emergency-service grade.
- **LR-013:** Every saved location has an explicit owner action and a provenance value. Importing a location from a code, record body, photograph, or external provider requires a separately specified user-confirmed path.

### Acceptance evidence

Before promotion, provide:

1. Cross-platform interaction tests for allow, approximate-only, precise, deny, unavailable, stale, and manual pin paths.
2. Contract tests proving undisclosed coordinates and provenance never appear in public response bodies.
3. Boundary vectors for latitude/longitude minimums, maximums, ±180 longitude, precision rounding, and invalid numeric input.
4. Signature vectors for unchanged and changed location values, including absent-to-present, present-to-absent, and precision-only updates.
5. Cache tests showing location edits and removal follow the established purge/fallback contract.
6. Account-deletion tests proving all stored location values and historical versions follow the adopted erasure policy.
7. A human review of the public preview on iOS, Android, and web, including accessibility and localization.
8. A threat review covering stalking, home-location inference, image metadata, link forwarding, stale position, and visibility changes.

## Candidate schema boundary

This is a conceptual schema, not the OpenAPI contract. Field names and storage policy remain OPEN.

```json
{
  "location": {
    "role": "place",
    "disclosed": {
      "kind": "point | area | label",
      "latitude": 0.0,
      "longitude": 0.0,
      "precision_m": 0,
      "label": "optional owner-authored label"
    },
    "provenance": {
      "kind": "manual | foreground-device | imported",
      "captured_at": "optional RFC 3339 timestamp",
      "uncertainty_m": "number or null"
    },
    "scheme_version": "location-v1"
  }
}
```

Do not store both the source coordinate and disclosed coordinate by default. The operator must decide whether source coordinates are necessary to support later edits or derived representations. If both are retained, define access controls, retention, erasure, signature coverage, and public serialization separately. `precision_m: 0` is not a valid representation of unknown precision; unknown uses `null` or a distinct enum.

## Research findings and technical caveats

- **OBSERVED:** The Open Location Code reference implementation documents offline encode/decode and short-code recovery relative to a reference coordinate. It also warns that short-code recovery depends on proximity to the reference location. This makes local shorthand a UX convenience with context risk, not a globally independent address.
- **OBSERVED:** Apple Core Location models horizontal accuracy as an uncertainty radius and uses a negative value to indicate invalid coordinates. Do not map that value directly into a guarantee of positional correctness.
- **OBSERVED:** Android users can grant approximate rather than precise location. Android documentation says the app should continue to work when only approximate permission is granted.
- **INFERRED:** A fixed degree grid has stable mathematical indexing but cells are not equal physical sizes; longitude width decreases with latitude. A meter-square grid needs a projection and explicit polar/dateline behavior. Neither should be selected on the basis of a simple capacity calculation alone.
- **INFERRED:** A location code would need its own validity, error-detection, versioning, ambiguity, truncation, and resolution contracts. The existing record code's check word does not automatically protect a different payload.
- **OPEN:** Consumer research has not established whether people need to type a location reference, or whether a selected pin and share link are enough. No prototype/user test evidence exists in this repository.
- **OPEN:** No selected map SDK, geocoder, coordinate precision, disclosure default, retention policy, or consumer journey is established.

## Spec probes

### Edge probe

| Shape | Probe | Resolution state |
|---|---|---|
| Numeric range | NaN, infinities, latitude outside [-90,90], longitude outside accepted range | Resolved: reject; no clamp. Exact longitude normalization remains unresolved. |
| Precision | Boundary ties and values with more decimal places than the contract allows | Unresolved: specify deterministic representation and tie rule before implementation. |
| Stateful | Add, replace, remove, retry same mutation | Resolved: each accepted edit is a new signed version; request idempotency behavior must match the selected contract. |
| Stateful/I/O | Two concurrent owner updates | Unresolved: use existing guarded write/version semantics or specify conflict behavior. |
| Text/empty | Empty label and whitespace-only label | Resolved: omit label; never infer location from blank text. Label length and normalization remain unresolved. |
| Collection | Multiple locations on one record | Resolved for initial candidate: one location attachment only; multiple locations belong to a later journey spec. |
| I/O | Permission denied, approximate permission, stale/unavailable fix, no network | Resolved: manual selection/no location remains usable; no server geocoder requirement. |
| Encoding | Cell/index encoding, word collisions, short aliases, grammar ambiguity | Unresolved and deliberately outside the first consumer increment. |

### Prohibition probe

- **Resolved:** The feature must not silently attach current device location, photo metadata, or an inferred location from record text.
- **Resolved:** The feature must not publish exact coordinates when the owner selected a coarser disclosure.
- **Resolved:** The location reference must not resolve to a record or replace the record's zz-code.
- **Resolved:** The interface must not describe platform accuracy as guaranteed precision or promise emergency/navigation suitability.
- **Unresolved:** Whether an owner can keep a location private while the rest of a free-public record remains public. This requires a product and contract decision.
- **Unresolved:** Whether the system retains the source coordinate after publishing a coarser view. Retention affects privacy, versioning, and later re-derivation.

## Open decisions before acceptance

1. Release: contract 1 scope-change exception, a new contract-2 release, or consumer v1.x after current launch?
2. First consumer journey and success measure: lost/found, community event/trail, or another workflow?
3. Position entry: manual pin, foreground device position, both, or neither in the first increment?
4. Privacy: can a public record expose only a coarse location, and may the owner later reveal exact position?
5. Storage: retain source and disclosure coordinates, or store only the disclosed value?
6. Precision: what consumer need justifies exact, neighborhood, or broader area disclosure? Gather user evidence before fixing meters or grid size.
7. Map: no map, an optional external map handoff, or embedded map? Who supplies tiles and place labels, and does it work offline?
8. Signing: contract 1 signature payload change versus a new contract version?
9. Native clients: where is the authoritative zzThat spec and who owns cross-platform implementation and release sequencing?

## Sources

- Google Open Location Code reference repository and specification: https://github.com/google/open-location-code
- Apple Core Location `CLLocation` accuracy reference: https://developer.apple.com/documentation/corelocation/cllocation/1423666-init
- Android Developers, Request location permissions: https://developer.android.com/develop/sensors-and-location/location/permissions

## Workflows

1. **Propose:** review this document and the intent; assign disposition, bundle, release, and owner decisions under `specs/SCOPE-GOVERNANCE.md`.
2. **Specify:** after human acceptance, resolve all OPEN rows and convert this proposal into a stable feature spec with contract fields and versioned vectors.
3. **Plan:** identify API, record-signature, database migration, iOS/Android, web, cache, privacy, and localization work as separately verifiable tasks.
4. **Qualify:** run acceptance evidence on staging with synthetic coordinates only; do not use real people or sensitive locations without approved consent and data handling.
5. **Promote:** update the roadmap and traceability only after the operator authorizes the bundle. Implementation and production deployment remain separately gated.
