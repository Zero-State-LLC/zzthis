# Cross-artifact analysis: ZZ-SEMANTIC-PROFILE-001

Date: 2026-10-05
Issue: #81
Status: CANON-SHADOW / specification track
Runtime authorization: none

## Goal

Check the structured semantic profile proposal against specs 002 to 005 and `docs/SPEC.md` without changing contract-1 behavior.

## Ownership result

| Concern | Owner | Result |
|---|---|---|
| Authentication, authorization, namespace authority, non-enumerability, semantic disclosure | 002 resolver-core | Clear |
| Syntax, canonicalization, current code kinds, recognition wordlist/check word, structured-profile distinction | 003 wordlist-checkword | Clear |
| OCR/vision/camera/typing observations and confidence | 004 capture | Clear |
| Current wire contract and future namespace-aware contract boundary | 005 v1-api | Clear |
| Product evolution, decision framing, research boundary | docs/SPEC.md | Clear |

**Finding:** no new 006 feature spec is required. Creating one now would duplicate ownership rather than clarify it.

## Contract check

PASS with the following invariants:

1. No existing parser grammar changes.
2. No existing code kind changes.
3. No OpenAPI or contract-1 route/field changes.
4. No `match_key` uniqueness changes.
5. No new runtime dependency.
6. No production vocabulary is introduced.
7. An arbitrary three-part code is not inferred to be structured.
8. `wordlist_version` remains distinct from semantic dictionary versioning.
9. Capture cannot assign semantic meaning or authorization.
10. Resolver authorization remains the disclosure boundary.

## Data-model distinction

The specs now reserve four separate concepts without implementing them:

- `wordlist_version`: recognition/error-correction vocabulary.
- `semantic_profile_id`: interpretation schema.
- `dictionary_version`: semantic mapping version.
- `namespace_id`: authority/domain binding.

No migration is required because none of the three semantic fields is added to contract 1 or persisted by this change.

## Security review

PASS as a specification boundary:

- Physical codes remain public/copyable.
- Security does not depend on semantic obscurity.
- Unknown/unauthorized resolution preserves non-enumerability.
- Namespace keys may not be derived from profile PII.
- Raw imagery remains on-device in the normal v1 path.
- Future server-side vision requires a separately specified retention/isolation/provenance policy.
- Steganography is limited to possible provenance/tamper evidence.
- Merkle commitments and ZK proofs remain V2+ research until a concrete selective-disclosure requirement exists.

## Migration and compatibility

**Migration:** none.

**Backward compatibility:** preserved. Contract 1 and current parser/capture behavior are unchanged.

**Forward compatibility risk:** a later scope-aware contract must define how namespace selection is carried or derived before duplicate visible codes can exist across namespaces. This issue intentionally does not solve that problem.

## Contradiction check

No blocking contradiction found.

Potential terminology risk: existing docs use "scope" for current product/account behavior while issue #81 uses "namespace" for future semantic authority. Keep these terms distinct until a later contract explicitly maps them.

## Acceptance result

- [x] Existing contract-1 behavior unchanged.
- [x] Existing code kinds unchanged.
- [x] Recognition wordlists and semantic dictionaries explicitly distinct.
- [x] Structured semantics opt-in/profile-bound.
- [x] Capture cannot authorize or semantically resolve.
- [x] Resolver remains authoritative for disclosure.
- [x] Scope-aware duplicate visible codes not introduced under contract 1.
- [x] V2/V2+ cryptographic ideas marked research.
- [x] Cross-artifact analysis completed.
- [x] No runtime implementation included.

## Recommendation

Approve this PR as a documentation/specification assimilation only. Keep Issue #81 CANON-SHADOW after merge. Do not create runtime tasks until a separate implementation intent defines the scope-aware contract, persistence model, migration, and acceptance tests.
