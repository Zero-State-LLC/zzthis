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
| Field logistics image reorder | ADOPT VIA #113 | The approved image/content changes from merged PR #113 are now in `main`; retain that upstream mapping rather than restoring the older branch order. |
| Parcel pack-and-ship first | ADOPT VIA #113 | The merged main branch now carries the approved postal/parcel image order, including the three-letter postage asset. |
| Five application directions | ADAPT | B5 labels field/enterprise (B7), postal/parcel (B8), community/free uses (B9), semantic/profile concepts (B10), and ledger/agent/blockchain integrations (B16) as queued or shadow explorations. None becomes v1 implementation authority from website copy. |
| Home use-case cards (logistics, postal, community, agents, blockchain, macros) | ADAPT | Each card now carries its roadmap status. Carrier/postage, voice recognition, ledger/blockchain, agent authority, and macro execution are not presented as available v1 integrations. |
| “AI is new UI / connector / flattens stack” | ADAPT | Site describes AI as a possible interface/connector and labels AI-assisted workflows as future exploration, while denying semantic/resolution authority. |
| X1/X2/X3 structured profile | SHADOW via B10 | Site may describe it as planned exploration. #87/#81 remain authoritative; no Contract-1/v1 semantic change. |
| Private versioned dictionaries | SHADOW via B10 | Downstream authorized semantic dictionaries only; not OCR vocabulary or Contract-1 behavior. |
| Recognition separate from interpretation | ADOPT | Matches current architecture. |
| Signed resolution receipts | DEFER | Do not imply a shipped receipt contract until the relevant resolver/contract work defines it. |
| Applications title/caption changes | ADOPT VIA #113 | Keep the approved copy and image updates merged by PR #113; do not revert them while preserving PR #91's roadmap qualification. |
| Super-identifier image sizing | DEFER | Requires visual/component verification. |
| Three-letter postage image | ADOPT VIA #113 | `public/images/applications/postage-three-letters.webp` is present from merged PR #113. |
| “Current prototypes and explorations” | ADOPT | Applied. |
| zzThing concept showcase | ADOPT | Applied as concept showcase language. |
| zzThat working prototype / separate consumer direction | ADAPT | Applied without claiming store/web releases are already shipped. |
| zzThat logo | ADOPT VIA #113 | Main now includes and uses the approved camelcase wordmark asset; a lowercase variant is also present. Keep the exact inline treatment aligned with the merged design rather than reviving the old deferral. |
| Founder bio ending replacement | ADOPT VIA #113 | Retain the founder biography ending merged by PR #113. |
| Advisor order Daniel, Adam, Patrick, Arshi | ADOPT | Applied. |
| Remove Ridham | ADOPT VIA #113 | Removed from the rendered roster and the obsolete headshot asset was removed by merged PR #113. |
| Adam replacement bio/headshot | ADOPT VIA #113 | Retain the approved biography and `public/images/people/adam-fry.webp` headshot merged by PR #113. Adam's profile link remains open under #114 pending the supplied URL. |
| Hacker Dojo paragraph | ADOPT | Current paragraph already matches the compatible intent; retained. |
| Location Silicon Valley + NYC | ADOPT | Applied. |
| Third-party names/logos/artwork disclaimer | ADOPT | Applied site-wide in footer note. |
| Display payload words in capitals | DEFER TO CANON | Do not implement from the old website draft. Display representation must follow the current grammar/fiducial architecture and its acceptance vectors. |
| Lowercase zzThis / zzThat / URLs / filenames | ADOPT | Preserve brand/identifier casing; no protocol change. |
| Existing images stay as-is; new images use revised display | ADAPT | Historical/real photos remain as photographed. New/generated examples must follow canonical representation at time of creation. |
| Standalone capital ZZ exception | DEFER TO CANON | Do not weaken check-dist or display rules from marketing copy. |
| No deploy/DNS/spend | ADOPT | This branch changes repository content only. |
| Later lowercase zzthat inline-logo preference | ADOPT AS TARGET / DEFER ASSET | Governs the eventual asset treatment when the approved logo is available. |

## Follow-ups after merged PR #113

Issue [#114](https://github.com/Zero-State-LLC/zzthis/issues/114) remains open for the About framed-print photo, the carrier-logo image, and Adam Fry's profile link once supplied. These are intentionally not represented as completed by this reconciliation.

## Verification log — 2026-10-07

- An isolated public Cloudflare Worker Preview was built from site commit `03934b0f480331879e83275fad1e829920443bc1` at <https://pr-91-zzthis-site-staging.zer0state-noema.workers.dev/>. The preview requires Astro's base path to be `/`; GitHub Pages continues to use `/zzthis/`.
- Browser review confirmed that `/`, `/about/`, `/applications/`, `/contact/`, `/demo/`, and `/how-it-works/` load from the Worker root. Each route exposes the expected footer navigation and contact link. Lazy-loaded How it works panels appeared after scrolling.
- The home demo's typing lookup returns its demo record and states that it made no network request. Manual visual review found no obvious broken imagery; this was not a complete network trace or asset-by-asset audit.
- Local lint, typecheck, root/site builds, 218 root tests, and 78 site tests passed. `zz-core` passed 234/235 (one property test hit its 30-second timeout); API passed 326/330 (four audit/rate-limit tests hit their 5-second timeouts).
- The prior site commit `33e3f3cf9bf780d92d162d49f0029fdeb149ca0a` had green GitHub CI, site typecheck/test, and security checks. GitHub showed no checks for `03934b0f480331879e83275fad1e829920443bc1` at the time of this review.
- Clef visual comparisons leaned healthy for most pairs, but had low or inconclusive confidence on several; they are not sign-off. PR #89 remains draft/unmerged, so the architecture-claim audit is still pending.
- This was an isolated PR Worker Preview only. The protected/main-only marketing staging workflow, production Worker, DNS, and production controls were not changed.
- After reconciling the PR branch with merged main (`e4e344b`, PR #113), the local lint, typecheck, site build, Worker dry run, and all root/core/web/API tests passed (218 + 235 + 78 + 330 = 861 tests). Wrangler emitted a local log-file permission warning during API lint/build/tests, but each command exited successfully.
- Site code at PR commit `f7b48c53c631e6bf879d02894ea1c99946aaf3c5` is deployed to the isolated public Worker Preview `https://pr-91-zzthis-site-staging.zer0state-noema.workers.dev/` (deployment `0e9fbacf-333b-4d76-b519-b12191c88a19`; unique deployment URL `https://0e9fbacf-zzthis-site-staging.zer0state-noema.workers.dev`). Browser checks confirmed all six primary routes and their footer navigation/contact. After scrolling through each route, all 87 page image elements loaded with no broken images (Home 20/20, About 11/11, Applications 38/38, Contact 2/2, Demo 3/3, How it works 13/13); no horizontal overflow was observed at the browser's default 1280×720 viewport. Live HTTP checks returned 200 for all six routes and the new three-letter postage, both wordmark, and Adam headshot assets. The scripted demo identifies itself as prewritten demo data and states that no recognition/network request runs. The viewport override did not take effect, so mobile layout remains unverified; this is not a complete interactive network trace. The separate architecture-claim audit remains open pending PR #89.
- GitHub Actions for exact head `f7b48c53c631e6bf879d02894ea1c99946aaf3c5` completed successfully for `security`, `CI`, and `Site typecheck and test`; `e2e` was skipped by its workflow condition.

## Acceptance

Before merge:
1. Rebase after the canonical capture/spec PR if necessary and confirm no architecture file is overwritten.
2. Run lint, typecheck, tests, and static build.
3. Verify Home, Applications, About, How it works, Contact, footer, and mobile layout.
4. Verify every claim about shipped/planned behavior against canonical specs.
5. Resolve deferred asset/copy items only from approved source material; do not reconstruct or invent them.
6. GitHub Pages deploys only after merge to main through the existing workflow.
