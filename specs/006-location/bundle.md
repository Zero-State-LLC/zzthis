# Location capability bundle proposal

**Bundle:** B17 Consumer Location Layer
**Target:** Consumer v1.x candidate; extension points for v2
**Status:** RESEARCH (not implementation-authorized)
**Outcome:** Let a consumer record carry an owner-selected, privacy-aware place attachment without changing the zz-code that identifies the record.
**Source:** `intent/2026-10-09-location-capability.md`; `specs/006-location/spec.md`

## Included candidate capabilities

- Optional typed place attachment on a versioned record.
- Explicit owner selection and public disclosure preview.
- User-placed location and/or one-time foreground device position, only after the initial journey is chosen.
- A declared precision/disclosure representation, distinct from unknown measurement uncertainty.
- Cross-platform permission denial and unavailable-location behavior.
- Cache, signature, historical-version, account-erasure, and public-response rules.
- A later optional human-readable location reference only if consumer evidence supports typing/relay; it must not replace the record code or copy another provider's system.

## Explicitly excluded

- Background tracking, continuous location history, navigation, geofencing, and emergency dispatch.
- Required geocoding vendor, address database, or embedded map dependency.
- A selected grid, cell size, word allocation, or location-code grammar.
- Record resolution by location, proximity-based automatic matching, or automatic selection among records.
- Claims of guaranteed accuracy or emergency-grade performance.

## Dependencies

- Operator disposition and release/scope decision under `specs/SCOPE-GOVERNANCE.md`.
- Privacy and threat review, especially free-public record disclosure.
- Contract/signature compatibility decision for adding fields to signed record versions.
- Authoritative zzThat API/client spec, platform permission behavior, and cross-platform acceptance owner.
- Consumer evidence for first journey, useful granularity, and whether a typed location reference is needed.

## Security, privacy, governance

Coordinates and location labels can expose a home, person, routine, or sensitive site. Treat them as sensitive record content. Store only the location representation required for the selected journey. Do not attach location silently. Public response bodies must honor the selected disclosure and visibility policy. Account deletion must erase location data under the same governed record-erasure path. If source and disclosed coordinates are both stored, access, retention, version history, signatures, and erasure need separate requirements.

## Acceptance gate

B17 cannot move to READY until the open decisions in `specs/006-location/spec.md` are resolved, a contract and migration strategy are accepted, and the required vectors/tests are authored. It cannot become ACTIVE without operator promotion. A later address-code sub-capability requires its own encoding comparison, capacity and confusion evidence, frozen versioned vectors, and explicit grammar/namespace boundary.

## Rollback

Do not remove a published location field by silently changing record meaning. Rollback must preserve old record versions and define how clients display unsupported location versions. A new encoding version must remain decodable or be explicitly labeled unsupported; never reuse a retired location code to mean another place.
