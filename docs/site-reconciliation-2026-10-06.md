# Website reconciliation disposition — 2026-10-06

Status: implementation reconciliation
Authority: today's canonical architecture/spec work is normative; Michael's 2026-10-06 website notes are subordinate content input.
Tracking: #90
Bundle: **B5 Public Site** · Target: **v1** · Status: **ACTIVE**. Website copy may describe QUEUED/SHADOW/RESEARCH bundles only as clearly labeled future/exploration material; it cannot promote them into v1.

## Non-regression rule

Website content MUST NOT redefine the zz grammar, capture pipeline, resolver authority, semantic-profile model, privacy boundary, or release status.

The current architecture remains:
- terminal `zz` marks are literal grammar markers and camera fiducial/index marks, not payload fields;
- visual capture localizes/pairs fiducials before payload recognition;
- OCR/vision emits evidence only;
- spec 003 owns canonicalization, wordlist/check-word behavior, and decoding;
- semantic profiles interpret structured positions only after canonicalization and authorization;
- raw scan images remain on device in v1;
- cloud/VLM and custom recognition remain later research paths;
- contract 1 is not changed by website copy.

## Source-to-disposition matrix

| Michael note | Disposition | Reconciliation |
|---|---|---|
| Home “Why zz markers matter” visual treatment | DEFER | Intent is compatible, but exact component/style change should land only with verified current design mapping. Architecture already defines the markers normatively in spec 004. |
| “zz- In any language -zz” treatment | ADAPT/DEFER | Compatible as marketing language, but v1 capture remains ASCII/English and other scripts are v2. Do not imply v1 multilingual recognition. |
| Field logistics image reorder | DEFER | Do not guess image-ID-to-caption mapping. Apply after exact asset mapping is verified. |
| Parcel pack-and-ship first | DEFER | Same asset-order verification requirement. |
| Five application directions | ADAPT | B5 may describe them. Field/enterprise maps to B7, postal to B8, community to B9, semantic/profile concepts to B10, and ledger/agent/blockchain integrations to B16. None becomes v1 implementation authority from website copy. |
| “AI is new UI / connector / flattens stack” | ADAPT | Site now describes AI as UI/connector, while explicitly denying semantic/resolution authority. |
| X1/X2/X3 structured profile | SHADOW via B10 | Site may describe it as planned exploration. #87/#81 remain authoritative; no Contract-1/v1 semantic change. |
| Private versioned dictionaries | SHADOW via B10 | Downstream authorized semantic dictionaries only; not OCR vocabulary or Contract-1 behavior. |
| Recognition separate from interpretation | ADOPT | Matches current architecture. |
| Signed resolution receipts | DEFER | Do not imply a shipped receipt contract until the relevant resolver/contract work defines it. |
| Applications title/caption changes | DEFER | Exact approved strings are not fully recoverable from the summary source. |
| Super-identifier image sizing | DEFER | Requires visual/component verification. |
| Three-letter postage image | DEFER | Asset is not present/verified on current main. |
| “Current prototypes and explorations” | ADOPT | Applied. |
| zzThing concept showcase | ADOPT | Applied as concept showcase language. |
| zzThat working prototype / separate consumer direction | ADAPT | Applied without claiming store/web releases are already shipped. |
| zzThat logo | DEFER | Later preference is lowercase inline beside zzthat.com, but exact approved asset is not present/verified on main. |
| Founder bio ending replacement | DEFER | Exact approved replacement text is not available in the reconciliation source; existing bio retained rather than invented. |
| Advisor order Daniel, Adam, Patrick, Arshi | ADOPT | Applied. |
| Remove Ridham | ADOPT | Removed from rendered roster. Physical image deletion can follow once branch asset inventory is verified. |
| Adam replacement bio/headshot | DEFER | Exact approved replacement copy/asset unavailable; existing Adam bio retained and no headshot invented. |
| Hacker Dojo paragraph | ADOPT | Current paragraph already matches the compatible intent; retained. |
| Location Silicon Valley + NYC | ADOPT | Applied. |
| Third-party names/logos/artwork disclaimer | ADOPT | Applied site-wide in footer note. |
| Display payload words in capitals | DEFER TO CANON | Do not implement from the old website draft. Display representation must follow the current grammar/fiducial architecture and its acceptance vectors. |
| Lowercase zzThis / zzThat / URLs / filenames | ADOPT | Preserve brand/identifier casing; no protocol change. |
| Existing images stay as-is; new images use revised display | ADAPT | Historical/real photos remain as photographed. New/generated examples must follow canonical representation at time of creation. |
| Standalone capital ZZ exception | DEFER TO CANON | Do not weaken check-dist or display rules from marketing copy. |
| No deploy/DNS/spend | ADOPT | This branch changes repository content only. |
| Later lowercase zzthat inline-logo preference | ADOPT AS TARGET / DEFER ASSET | Governs the eventual asset treatment when the approved logo is available. |

## Acceptance

Before merge:
1. Rebase after the canonical capture/spec PR if necessary and confirm no architecture file is overwritten.
2. Run lint, typecheck, tests, and static build.
3. Verify Home, Applications, About, How it works, Contact, footer, and mobile layout.
4. Verify every claim about shipped/planned behavior against canonical specs.
5. Resolve deferred asset/copy items only from approved source material; do not reconstruct or invent them.
6. GitHub Pages deploys only after merge to main through the existing workflow.
