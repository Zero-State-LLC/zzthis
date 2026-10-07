# Capability bundle roadmap

Date: 2026-10-06
Governance: SCOPE-GOVERNANCE.md

This roadmap groups fragmented product input into promotable capability bundles. It is not a promise that every bundle ships.

| Bundle | Target | Status | Outcome | Explicitly not in bundle |
|---|---|---|---|---|
| B1 Core Identifier | v1 | ACTIVE | write/type a human-readable zz code, canonicalize/validate it, resolve its authorized record, and manage basic lifecycle | semantic positional meaning, macros, bare contextual matching |
| B2 Camera Capture | v1 | ACTIVE / qualification-gated | find paired terminal zz fiducials, localize ROI, read payload on device, fail closed | cloud OCR, custom/VLM model, stylized finder glyph |
| B3 Native Clients | v1 | ACTIVE | iOS + Android create/scan/type/resolve/share/my-codes/account flows against pinned v1 authority | voice, partner machine client, web-camera capture |
| B4 Production Operations / Cloudflare Runtime | v1 launch | ACTIVE / evidence-gated | Cloudflare runtime substrate plus production security, recovery, OAuth/secrets, monitoring, moderation, privacy/store evidence and deploy authorization | invented SLO/RTO/RPO; future AI/vector products without bundle promotion |
| B5 Public Site | v1 | ACTIVE | truthful site/demo of current product plus clearly labeled explorations | site copy does not promote roadmap scope |
| B6 Production Wordlist | v1 launch | RESEARCH -> READY | freeze a human/OCR-qualified production wordlist before first production mint | changing a list after first production mint |
| B7 Field & Enterprise Workflows | v1.x | QUEUED | cohesive logistics/inventory/enterprise workflows around the core identifier | redefining core grammar per customer |
| B8 Postal / Parcel | v1.x | QUEUED | postal/parcel workflow integration as a bounded application bundle | claiming carrier integration before evidence |
| B9 Community / Public Uses | v1.x | QUEUED | bounded free/community use cases and policies | weakening abuse/non-enumerability controls |
| B10 Semantic Profiles | v2 / Contract 2 | SHADOW, blocked by #87 | versioned X1/X2/X3-style semantic profiles, namespaces and dictionaries after canonical resolution | tenant-dependent meaning in contract 1 |
| B11 Partner Machine API | v2 / Contract 2 | QUEUED | partner auth/contract negotiation and machine resolution | partner route in contract 1 |
| B12 Advanced Recognition | v2 | RESEARCH | custom zz recognizer and/or VLM hard-case verification behind the evidence boundary | v1 cloud fallback |
| B13 Contextual/Bare Marks | v2+ | RESEARCH | context-assisted interpretation of bare/partial marks with explicit privacy/security model | guessing missing endpoints in v1 |
| B14 Authorized Actions/Macros | v2+ | SHADOW | authenticated/authorized/confirmed actions referenced by human-readable codes | code-as-authority |
| B15 ZK / Selective Disclosure | v2+ | SHADOW / RESEARCH | predicate/selective-disclosure proofs subordinate to semantic/resolver authority | proof-system selection before #87/#81 |
| B16 Ledger/Agent/Blockchain Integrations | v2+ | SHADOW | optional integrations using core identifier/semantic contracts | blockchain as a v1 dependency |

## Current release boundary

v1 implementation authority is limited to B1-B5 plus evidence needed to promote B6 and production gates in B4. B7-B16 may inform interfaces and compatibility but do not create v1 implementation tasks unless explicitly promoted under SCOPE-GOVERNANCE.

## Intake examples

- X1 means purpose, X2 means location -> B10 SHADOW, not a v1 grammar change.
- Use Qwen for hard scans -> B12 RESEARCH, not v1 fallback.
- Anonymous parcel delivery -> B8 QUEUED; site may label it exploration.
- AI inventory assistant -> B7 QUEUED; no new resolver authority.
- Run reorder/pay macro -> B14 SHADOW; requires auth/confirmation later.
- Make terminal zz easier for camera finding -> B2 ASSIMILATE only while it preserves the existing visible format; a new glyph/format is B12 RESEARCH unless separately promoted.
