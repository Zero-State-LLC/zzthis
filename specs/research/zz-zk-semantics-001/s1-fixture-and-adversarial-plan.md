# S1 synthetic fixture and adversarial test plan

**Status:** SPECULATIVE / CANON-SHADOW  
**Formal relation:** `formal-statement-s1.md`

## Purpose

Freeze a proof-system-neutral fixture before selecting cryptographic tooling.

## Synthetic profile

`semantic_profile_id = facilities-maintenance-s1`

Three positions:

- X1: class selector
- X2: locus
- X3: state/action qualifier

No value in this fixture is production vocabulary or a real location.

## Synthetic dictionary

Build 64 leaves total.

Required positive path:

```
zz-copper-lantern-sky-zz

X1 copper  -> class = electrical
X2 lantern -> locus = zone-07
X3 sky     -> state = maintenance-authorized
```

Required negative/control values include:

- class = plumbing
- locus = zone-08
- state = inspection-only
- state = revoked
- state = public-information

Populate remaining leaves with synthetic random labels and values so the tree contains 64 committed leaves.

## Predicate Q1

`Qid = facilities:authorized-for-maintenance:v1`

Freeze Q1 as:

```
Q1(M) =
  M.class == "electrical"
  AND M.state == "maintenance-authorized"
  AND M.locus is a member of {"zone-01", ..., "zone-16"}
```

The locus set is part of the versioned policy definition. It is not inferred from prose.

## Disclosure cases

Test the same positive resolution under:

- L0: no semantic fields disclosed; prove profile/root-bound resolution.
- L1: disclose only `permitted_class = true`; hide exact class/locus/state.
- L2: disclose `class = electrical`; hide locus/state; prove Q1.
- L3: disclose `class = electrical`, `locus_group = zone-01..08`; hide exact locus/state; prove Q1.
- L4: disclose class/locus/state through the signed baseline.

## Authority fixture

Freeze synthetic authority state:

```
namespace = ns-synthetic-facilities
dictionary_version = d-s1-001
profile = facilities-maintenance-s1
policy = facilities:authorized-for-maintenance:v1
epoch = e-001
```

The fixture generator outputs the dictionary root and an authority-state manifest. The verifier trusts the manifest out-of-band for the experiment.

## Required test vectors

Each vector has an expected ACCEPT/REJECT result and reason code.

1. positive canonical code -> ACCEPT
2. wrong root -> REJECT ROOT_MISMATCH
3. wrong profile -> REJECT PROFILE_MISMATCH
4. wrong namespace -> REJECT NAMESPACE_MISMATCH
5. wrong Qid -> REJECT POLICY_MISMATCH
6. altered cid -> REJECT CODE_BINDING
7. X2 leaf from another committed dictionary -> REJECT MEMBERSHIP
8. valid leaf used at wrong token position -> REJECT POSITION_BINDING
9. witness says zone-07 but committed leaf says zone-08 -> REJECT SEMANTIC_BINDING
10. inspection-only state -> REJECT PREDICATE_FALSE
11. wrong audience -> REJECT AUDIENCE_BINDING
12. wrong challenge -> REJECT CHALLENGE_BINDING
13. expired epoch -> REJECT EXPIRED
14. replay accepted J -> REJECT REPLAY
15. revoked authority manifest -> REJECT AUTHORITY_REVOKED
16. malformed canonical public encoding -> REJECT NON_CANONICAL_INPUT
17. proof of L0 substituted when Q1 requested -> REJECT STATEMENT_MISMATCH
18. same dictionary version label with different root -> REJECT AUTHORITY_EQUIVOCATION
19. low-entropy leaf guess without hiding nonce when fixture uses hiding -> REJECT OPENING
20. valid proof with changed disclosed L2 class -> REJECT DISCLOSURE_BINDING

## Measurement record

Every implementation records:

```
implementation
version/commit
proof_system_family
security_parameters
hash/commitment primitives
setup requirements
proving_key_bytes
verifying_key_bytes
proof_bytes
dictionary_build_ms
prove_ms
verify_ms
peak_prover_memory_bytes
peak_verifier_memory_bytes
browser_result
mobile_result
negative_vectors_passed / 20
notes
```

## Stop conditions

Stop and return to the formal statement if:
- two implementations require materially different statements to appear successful;
- a public input is not independently authority-bound;
- the circuit/program cannot distinguish Q1 from a weaker predicate;
- replay protection depends on verifier memory that was not declared;
- hidden low-entropy values are recoverable from commitments;
- the selective-disclosure baseline satisfies every intended privacy property with materially lower operational risk.

No implementation result promotes this track automatically.
