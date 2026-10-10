# ZZ-ZK-SEMANTICS-001 — Formal Statement S1

**Status:** SPECULATIVE / CANON-SHADOW  
**Parent:** #81 ZZ-SEMANTIC-PROFILE-001  
**Tracker:** #83 ZZ-ZK-SEMANTICS-001  
**Runtime authority:** none

## 1. Research objective

Determine whether zzThis can prove a useful predicate about an **authorized semantic resolution** while withholding semantic values that the verifier does not need.

S1 deliberately starts after recognition and canonicalization. It does not prove OCR, handwriting recognition, image interpretation, or neural inference.

## 2. System boundary

```
physical mark
 -> recognition
 -> canonical code C
 -> resolver authentication / authorization
 -> semantic profile P
 -> immutable dictionary version D with commitment root R
 -> hidden semantic resolution M
 -> predicate Q(M, policy context)
 -> proof π
 -> verifier
```

The resolver establishes authority. The proof establishes only the relation stated below.

## 3. Symbols

- `C`: canonical zz code.
- `cid`: commitment to C for the proof context.
- `P`: semantic profile identifier or commitment.
- `D`: immutable semantic dictionary version.
- `R`: commitment root for D.
- `M`: hidden semantic resolution values.
- `Q`: versioned policy predicate.
- `A`: verifier/audience identifier or commitment.
- `N`: verifier challenge/nonce.
- `E`: validity epoch or bounded time window.
- `NS`: semantic namespace identifier/commitment.
- `AR`: authority-state commitment binding approved profile/dictionary/policy state.
- `J`: replay tag/nullifier derived inside the relation.
- `π`: zero-knowledge proof.

## 4. Canonical code commitment

S1 does not require the plaintext canonical code to be public.

Define:

```
cid = H(
  "zzthis:zk:code:v1" ||
  len(C) || UTF8(C) ||
  P || NS
)
```

Length-prefix every variable-length field. The final implementation must freeze an unambiguous binary encoding. JSON stringification is not a canonical commitment encoding.

If a deployment needs the verifier to know C, C may be public and the verifier recomputes `cid`. Otherwise `cid` is public and C remains witness data.

## 5. Semantic dictionary leaf

The research prototype uses one canonical leaf type:

```
LeafV1 {
  leaf_version
  namespace_id
  semantic_profile_id
  dictionary_version
  token_position
  token_commitment
  semantic_type
  semantic_value
  policy_tags
}
```

Canonical leaf bytes:

```
leaf_bytes =
  DOMAIN_LEAF_V1 ||
  enc(leaf_version) ||
  enc(namespace_id) ||
  enc(semantic_profile_id) ||
  enc(dictionary_version) ||
  enc(token_position) ||
  enc(token_commitment) ||
  enc(semantic_type) ||
  enc(semantic_value) ||
  enc(policy_tags)
```

and:

```
leaf_hash = H(leaf_bytes)
```

Requirements:

1. `enc` is deterministic and injective for every allowed field.
2. Variable-length values are length-prefixed.
3. Lists have deterministic ordering.
4. Text normalization is specified before hashing.
5. Leaf and internal-node hashes use distinct domain separators.
6. Duplicate logical keys are rejected when constructing D.
7. Empty-tree and odd-node behavior is specified.
8. Low-entropy `semantic_value` confidentiality MUST NOT rely on hashing it alone.

The first prototype MAY add a per-leaf random hiding salt/nonce to the committed leaf if required to resist offline guessing. If used, it is witness data and its lifecycle must be specified.

## 6. Merkle commitment

For prototype S1:

```
node = H(
  "zzthis:zk:node:v1" ||
  left_hash ||
  right_hash
)
```

Dictionary D is immutable once root R is published/approved.

Any semantic change creates a new dictionary version and root:

```
D17 -> R17
edit
D18 -> R18
```

An authority MUST NOT present two different roots as the same immutable dictionary version.

## 7. Public inputs

The verifier receives or independently obtains:

```
PublicInputsV1 {
  protocol_version,
  semantic_profile_id_or_commitment P,
  dictionary_root R,
  namespace_commitment NS,
  authority_state_commitment AR,
  policy_id_and_version Qid,
  code_commitment cid,
  audience_commitment A,
  challenge N,
  validity_epoch E,
  nullifier J
}
```

The verifier MUST independently bind `R`, `P`, `NS`, `Qid`, and `AR` to authoritative state. Proof validity alone does not establish that a prover-selected root or policy is trusted.

## 8. Private witness

Candidate witness:

```
WitnessV1 {
  canonical_code C,
  code_tokens,
  semantic_leaves,
  leaf_hiding_nonces_if_used,
  merkle_authentication_paths,
  hidden_semantic_resolution M,
  policy_witness,
  prover_replay_secret s
}
```

Identity credentials are intentionally excluded from S1.

## 9. Formal relation

The prover demonstrates knowledge of witness W such that:

```
R_S1(public, W) = TRUE
```

iff all conditions hold:

### 9.1 Code binding

1. C satisfies the canonical-code constraints assumed by the semantic-profile experiment.
2. `H(DOMAIN_CODE_V1 || encode(C, P, NS)) == cid`.
3. Witness token commitments correspond to the intended positions in C.

### 9.2 Dictionary membership and profile binding

For every semantic leaf used by Q:

1. Recompute the canonical `leaf_hash`.
2. Verify its Merkle authentication path to public root R.
3. Leaf `semantic_profile_id == P`.
4. Leaf namespace binds to NS.
5. Leaf dictionary version is the version authorized by AR/R.
6. Leaf token position and token commitment bind the semantic entry to the corresponding token in C.

### 9.3 Semantic consistency

The hidden resolution M is deterministically assembled from the proved leaves according to semantic profile P. No witness value outside the committed leaves may silently influence M unless explicitly declared as policy context.

### 9.4 Predicate

```
Q(M, declared_policy_context) == TRUE
```

The verifier accepts only the exact `Qid` it requested or policy allows. A proof for a weaker/different predicate is not interchangeable.

The first prototype predicate is intentionally narrow:

```
AUTHORIZED_FOR_MAINTENANCE(M) == true
```

Its exact Boolean definition must be frozen with the synthetic dataset before implementation.

### 9.5 Replay-domain binding

S1 binds proof use to verifier context:

```
J = H(
  "zzthis:zk:nullifier:v1" ||
  s ||
  A ||
  N ||
  E ||
  cid ||
  Qid
)
```

The proof demonstrates correct construction of J without revealing s.

The verifier rejects a previously accepted J within the replay domain.

Properties to test:
- changing A changes J;
- changing N changes J;
- changing E changes J;
- changing cid or Qid changes J;
- reuse of the same proof outside its intended challenge/audience fails.

This construction is a research candidate, not a cryptographic recommendation. The selected proof system and field/hash constraints may require a different construction after review.

## 10. Freshness and revocation

A ZK proof does not inherently prove current authority state.

Verifier acceptance requires:
1. E is within the verifier's accepted validity window.
2. AR is a currently trusted authority-state commitment.
3. R/P/Qid remain approved under AR for E.
4. J has not already been consumed where one-time semantics apply.

If a dictionary, policy, or authority binding is revoked, the verifier stops accepting the corresponding authority state even if an old proof remains mathematically valid.

## 11. Disclosure profiles

S1 evaluates these profiles against the same committed data:

- **L0:** prove authorized resolution under P/R.
- **L1:** prove hidden resolution is in a permitted class.
- **L2:** disclose class/purpose; prove exact locus/state and Q.
- **L3:** disclose class + coarse locus; prove exact locus/state and Q.
- **L4:** disclose full authorized resolution. Use a signed non-ZK baseline unless ZK adds another necessary predicate.

Disclosed fields become explicit public inputs and must be bound into the relation.

## 12. Non-ZK baseline

Before claiming ZK value, implement or model an ordinary signed selective-disclosure response:

```
SignedResolutionV1 {
  cid,
  semantic_profile,
  dictionary_version/root,
  disclosed_fields,
  policy_result,
  audience,
  challenge,
  validity,
  authority_signature
}
```

Compare privacy and operational properties against S1.

If signed selective disclosure meets the actual requirement, prefer it.

## 13. Mandatory negative tests

A verifier MUST reject proofs or presentations with:

1. wrong dictionary root;
2. wrong semantic profile;
3. wrong namespace;
4. wrong policy id/version;
5. altered code commitment;
6. leaf from another dictionary;
7. leaf in wrong token position;
8. hidden semantic value inconsistent with committed leaf;
9. predicate false;
10. wrong audience;
11. wrong challenge;
12. expired validity epoch;
13. replayed nullifier where replay is forbidden;
14. untrusted/revoked authority state;
15. malformed/non-canonical public input;
16. proof for a weaker predicate substituted for requested Q;
17. equivocated dictionary version/root;
18. guessed low-entropy leaf opening without the required hiding material.

## 14. Privacy questions the experiment must answer

A valid ZK proof can still leak metadata. Measure or reason about:

- whether `cid` enables code correlation;
- whether stable R/P/NS values identify an organization;
- whether J is linkable across verifiers or epochs;
- whether disclosed predicate ids reveal sensitive workflow information;
- whether dictionary size/tree depth leaks useful information;
- whether timing/proof size differs by hidden value;
- whether low-entropy semantic entries can be enumerated from public commitments.

## 15. Proof-system-neutral acceptance criteria

S1 is ready for proof-system evaluation only when:

- [ ] canonical binary encodings are frozen;
- [ ] synthetic dictionary/profile/predicate fixture is frozen;
- [ ] authority-state binding is specified;
- [ ] challenge/audience/replay semantics are reviewed;
- [ ] selective-disclosure baseline is specified;
- [ ] all mandatory negative tests have unambiguous expected results;
- [ ] privacy leakage table is completed;
- [ ] no claim depends on ZK OCR/vision or hidden assumptions about recognition.

## 16. Proof-system evaluation matrix

After the S1 gate, compare candidate implementations using the same relation and fixtures:

| Dimension | Circuit SNARK | Transparent/STARK-style | zkVM | Signed selective disclosure |
|---|---|---|---|---|
| Trusted setup | measure | measure | measure | n/a |
| Proof size | measure | measure | measure | response/signature size |
| Proving latency | measure | measure | measure | signing latency |
| Verification latency | measure | measure | measure | signature verification |
| Prover memory | measure | measure | measure | baseline |
| Browser/mobile viability | test | test | test | test |
| Implementation complexity | assess | assess | assess | assess |
| Cryptographic maturity/auditability | assess | assess | assess | assess |
| Post-quantum assumptions | document | document | document | document |
| Privacy beyond selective disclosure | demonstrate | demonstrate | demonstrate | baseline |

No family is preferred in advance.

## 17. Promotion rule

S1 remains CANON-SHADOW. A successful prototype proves feasibility only. Promotion to an implementation spec requires a separate decision covering resolver/API integration, persistence, key lifecycle, revocation, operational recovery, external cryptographic review, migration, and acceptance tests.
