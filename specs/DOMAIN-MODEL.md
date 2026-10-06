# zzThis domain model

Evidence classification: **OBSERVED** for statements describing current repository code/tests; **INFERRED** for governance, production gates, or design choices accepted by the convergence intent; **SPECULATIVE** only where explicitly marked as future research.

Status: current V1 model plus reserved future semantic terms.

## V1 entities
- **Account**: authenticated owner/operator subject.
- **Scope**: current product partition used for issuance/access policy.
- **Code**: public, copyable human-writable identifier with lifecycle state.
- **Record**: owner-linked digital record addressed by a code.
- **RecordVersion**: append-only for ordinary record history. Account deletion is the explicit privacy-erasure exception: retained version rows have content/signature fields erased and `erased_at` recorded as required by spec 005 FR-023.
- **AuditEvent**: append-only evidence of state-changing and governed read actions.
- **Report**: safety/moderation report.
- **Session/RefreshFamily**: authentication lifecycle.
- **ReadPhoto**: optional hard-read artifact, disabled in normal V1.
- **Grant**: role/scope authorization.

## Code lifecycle
```
minted/active
  -> used       (single-use successful resolve)
  -> expired    (time boundary)
  -> revoked    (owner/operator/account-delete/reroll)
```

Retired visible codes are not reissued under contract 1.

## Account/session lifecycle
```
account active
  -> suspended -> active
  -> deleted

refresh token active
  -> rotated
  -> revoked
```

Deletion invalidates usable sessions and active codes according to spec 005.

## Future semantic model

These terms are reserved and do not exist as contract-1 persisted entities:

- **Namespace**: future authority/domain binding for semantic interpretation. It is not automatically the same thing as V1 Scope.
- **SemanticProfile**: versioned schema that assigns meaning rules to an explicitly profile-bound code.
- **SemanticDictionaryVersion**: immutable versioned semantic mappings used by a profile.
- **DictionaryRoot**: future commitment to an immutable dictionary version.
- **SemanticResolution**: authorized interpretation produced only after canonicalization and resolver authorization.

### Scope vs Namespace rule

Until a future contract specifies otherwise:
- Scope controls current V1 product/account behavior.
- Namespace is a future semantic authority concept.
- There is no assumed 1:1 mapping, inheritance, or shared identifier.
- The same visible code cannot gain tenant-dependent meaning under contract 1.

A V1.x/V2 implementation proposal must explicitly define Scope↔Namespace cardinality, ownership, lifecycle, selection, migration, and authorization before implementation.

## ZK research entities

Proof, nullifier/replay tag, verifier/audience, authority-state commitment, and dictionary commitment are research-only terms under #83/S1 and create no V1 authority.
