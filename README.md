<p align="center">
  <a href="https://zero-state-llc.github.io/zzthis/">
    <picture>
      <source media="(prefers-color-scheme: light)" srcset="docs/readme/banner-light.webp">
      <img src="docs/readme/banner-dark.webp" alt="The zzThis home page: the headline 'Barcodes made things scannable. zzThis makes them writable, and smart.' beside a crate with the code zz-copper-lantern-sky-zz written on blue tape." width="100%">
    </picture>
  </a>
</p>

# zzThis

**Write a code on a thing; find its record by camera, typing, or voice.**

[Live site](https://zero-state-llc.github.io/zzthis/) · [Demo](https://zero-state-llc.github.io/zzthis/demo/) · [Project board](https://github.com/orgs/Zero-State-LLC/projects/24) · [Specs](specs/README.md) · [Spec source](docs/SPEC.md)

[![build](https://img.shields.io/github/actions/workflow/status/Zero-State-LLC/zzthis/ci.yml?branch=main&label=build)](https://github.com/Zero-State-LLC/zzthis/actions/workflows/ci.yml)
[![Pages deploy](https://img.shields.io/github/actions/workflow/status/Zero-State-LLC/zzthis/pages.yml?branch=main&label=pages)](https://github.com/Zero-State-LLC/zzthis/actions/workflows/pages.yml)
[![Node 24](https://img.shields.io/badge/node-24-1c1b19)](package.json)
[![Astro](https://img.shields.io/badge/astro-7-1c1b19)](https://astro.build/)
[![status: prototype](https://img.shields.io/badge/status-prototype-f85000)](#status-and-disclaimer)
[![license: proprietary](https://img.shields.io/badge/license-proprietary-1c1b19)](LICENSE)

Topics: `human-readable-codes` `handwritten-codes` `logistics` `astro` `github-pages` `static-site` `prototype`

zzThis is a human-readable, human-writable code that works alongside barcodes and QR codes. A person writes a code such as `zz-copper-lantern-sky-zz` on tape, a crate, a parcel, or a sign, links it to a digital record, and finds that record later.

This repository holds the marketing site and a scripted click-through demo. It is a static [Astro](https://astro.build/) site published on GitHub Pages under `/zzthis/`.

## Contents

- [Status and disclaimer](#status-and-disclaimer)
- [Quick start](#quick-start)
- [Design tokens](#design-tokens)
- [Repository atlas](#repository-atlas)
- [Architecture](#architecture)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [License](#license)

## Status and disclaimer

zzThis is a **prototype**.

- The site and demo are live. The product behind them is not built.
- The demo uses mock data only. It runs no recognition, makes no network requests, uses no camera or microphone, and stores nothing.
- Images labeled "Concept illustration" are AI renderings, not photos of a working system.
- Handwriting recognition, the resolver, and the wordlist are untested. No accuracy or performance result is claimed.

## Quick start

Requirements: Node 24 (CI uses Node 24; `package.json` allows 22.12 or later) and npm.

```sh
npm ci              # install exact versions from package-lock.json
npm run dev         # start the dev server at http://localhost:4321/zzthis/
npm run lint        # ESLint and Prettier check
npm run typecheck   # astro check and tsc --noEmit
npm run test        # Vitest with enforced 100% coverage on src/lib and the demo state machine
npm run build       # build to dist/ and run scripts/check-dist.mjs
npm run preview     # serve dist/ locally
```

### Base path

The site is served under `/zzthis/`. `astro.config.mjs` sets `base: '/zzthis/'`, and every internal link and asset URL goes through `src/lib/url.ts`. Do not write root-absolute paths such as `/images/...` or `/demo`. `scripts/check-dist.mjs` fails the build on root-absolute links and on other spec checks against `dist/`.

## Design tokens

All values come from [`src/styles/tokens.css`](src/styles/tokens.css). Colors use CSS `light-dark()`, so each token has a light and a dark value. The palette is charcoal and cream with one accent.

### Color

| Token | Light | Dark | Use |
|---|---|---|---|
| `--surface` | `#f4efe4` | `#1c1b19` | Page background |
| `--mount` | `#eae3d4` | `#262421` | Raised panels and image mounts |
| `--text` | `#1c1b19` | `#f4efe4` | Body text |
| `--text-muted` | `#4a463f` | `#c9c2b4` | Secondary text |
| `--edge` | `#cfc6b4` | `#3a3732` | Borders and rules |
| `--accent` | `#f85000` | `#f85000` | The single accent |
| `--on-accent` | `#1c1b19` | `#1c1b19` | Text on the accent |
| `--shadow-color` | `rgb(28 27 25 / 0.12)` | `rgb(0 0 0 / 0.35)` | Shadows |

### Type

Fonts: `--font-sans` is IBM Plex Sans; `--font-mono` is IBM Plex Mono.

| Token | Below 900px | 900px and wider |
|---|---|---|
| `--fs-h1` | 32px | 52px |
| `--fs-h2` | 26px | 34px |
| `--fs-h3` | 20px | 21px |
| `--fs-body` | 17px | 17px |
| `--fs-mono` | 15px | 16px |
| `--fs-caption` | 14px | 14px |
| `--fs-label` | 13px | 13px |

### Spacing and layout

| Token | Value |
|---|---|
| `--s-1` to `--s-8` | 4, 6, 10, 16, 26, 42, 68, 110 px |
| `--cut` | 16px |
| `--gutter` | 16px; 26px from 600px wide |
| `--section-gap` | `--s-7` (68px); `--s-8` (110px) from 900px wide |
| `--measure` | 68ch |

## Repository atlas

| Path | What it holds |
|---|---|
| [`src/pages/`](src/pages/) | One file per route (home, how it works, applications, demo, about, contact) plus `404.astro` |
| [`src/components/`](src/components/) | Shared Astro components such as cards, header, footer, and the theme toggle |
| [`src/content/`](src/content/) | All copy and image metadata as TypeScript; edit copy here, not in pages |
| [`src/lib/`](src/lib/) | Code grammar, resolver mock, image and URL helpers |
| [`src/demo/`](src/demo/) | Demo state machine and its browser island |
| [`src/layouts/`](src/layouts/) | The base page layout |
| [`src/styles/`](src/styles/) | Design tokens and base styles |
| [`tests/`](tests/) | Vitest suites |
| [`public/images/`](public/images/) | Optimized WebP images |
| [`scripts/`](scripts/) | `check-dist.mjs` build checks, `check-agents-md.sh`, `security-scan.sh` |
| [`docs/SPEC.md`](docs/SPEC.md) | Content, layout, behavior, architecture proposal, and the decision log |
| [`docs/BUILD-BRIEF.md`](docs/BUILD-BRIEF.md) | Build constraints and the definition of done |
| [`docs/ASSETS.md`](docs/ASSETS.md) | Image paths and the panels they map to |
| [`docs/screenshots/`](docs/screenshots/), [`docs/wireframes/`](docs/wireframes/) | Review screenshots and wireframes |
| [`specs/`](specs/) | Spec Kit feature specs 001 to 004, with an [index](specs/README.md) and the [2026-10-02 analysis](specs/analysis-2026-10-02.md) |
| [`.specify/`](.specify/) | Spec Kit [constitution](.specify/memory/constitution.md) |
| [`intent/`](intent/) | Intent files that come before specs |
| [`AGENTS.md`](AGENTS.md) | Contract for coding agents working in this repo |
| [`.github/workflows/ci.yml`](.github/workflows/ci.yml) | Required `build` check: lint and build |
| [`.github/workflows/site-ci.yml`](.github/workflows/site-ci.yml) | Typecheck and tests on pull requests |
| [`.github/workflows/pages.yml`](.github/workflows/pages.yml) | Deploys to GitHub Pages after a push to `main` or a manual dispatch; pull requests never deploy |
| [`.github/workflows/free-security-scan.yml`](.github/workflows/free-security-scan.yml) | Security scan |
| [`.github/workflows/project-collaboration.yml`](.github/workflows/project-collaboration.yml) | Adds issues and PRs to the project board |

## Architecture

The site and demo are static and call no API. The product architecture below is a **proposal, not built**. It is copied from [`docs/SPEC.md` Section 10.1](docs/SPEC.md#101-topology): one central server owns codes, records, grants, and the audit log; every app is an API client; revocation, single use, expiry, and rate limits are enforced on the server.

```mermaid
flowchart LR
  subgraph Clients["API clients"]
    Phone["Phone app<br/>on-device recognition"]
    Web["Web app"]
    Partner["Partner systems"]
  end
  subgraph Edge["Edge layer (Cloudflare Workers)"]
    Read["Fast reads<br/>resolve, cached signed records"]
  end
  subgraph Core["Central server (source of truth)"]
    API["Write and signing API<br/>issue, revoke, version, grants"]
    DB[("Portable SQL<br/>codes, records, record_versions,<br/>grants, audit_events")]
    Blob[("Object storage<br/>photos for retries and review")]
    Vision["Cloud vision model<br/>hard cases only"]
  end
  Phone -->|"decoded code"| Read
  Web --> Read
  Partner --> Read
  Read -->|"writes, signing, misses"| API
  API --> DB
  API --> Blob
  Phone -.->|"photo on retry or hard case"| API
  API -.-> Vision
```

## Roadmap

Track work on the [project board](https://github.com/orgs/Zero-State-LLC/projects/24).

### Phase 0: Spec, site, and demo

- [x] Write the spec ([#2](https://github.com/Zero-State-LLC/zzthis/issues/2))
- [x] Marketing site ([#3](https://github.com/Zero-State-LLC/zzthis/issues/3)) and click-through demo ([#4](https://github.com/Zero-State-LLC/zzthis/issues/4)), shipped in [PR #9](https://github.com/Zero-State-LLC/zzthis/pull/9)
- [x] Deploy on GitHub Pages under `/zzthis/`
- [x] Architecture proposal (SPEC Section 10) and Michael's content answers

### Phase 1: Site decisions and polish

- [ ] Answer the open questions for Michael ([#10](https://github.com/Zero-State-LLC/zzthis/issues/10); new grammar and image questions [#36](https://github.com/Zero-State-LLC/zzthis/issues/36) to [#42](https://github.com/Zero-State-LLC/zzthis/issues/42))
- [x] Demo: remove "did you mean" suggestions of live codes ([#12](https://github.com/Zero-State-LLC/zzthis/issues/12), [PR #19](https://github.com/Zero-State-LLC/zzthis/pull/19))
- [x] Code rules for case, spacing, the bare mark, and `@` handles ([#33](https://github.com/Zero-State-LLC/zzthis/issues/33), [#34](https://github.com/Zero-State-LLC/zzthis/issues/34); SPEC Section 2.2a)
- [ ] Demo follows the v1 code rules (spec 001 T029)
- [ ] Image asset curation ([#7](https://github.com/Zero-State-LLC/zzthis/issues/7))
- [ ] Domain and DNS, needs Danny's yes ([#6](https://github.com/Zero-State-LLC/zzthis/issues/6))
- [x] Spec Kit constitution and specs 001 to 004 ([PR #17](https://github.com/Zero-State-LLC/zzthis/pull/17), [`specs/`](specs/README.md))
- [ ] Automate the remaining manual acceptance checks: contrast, reduced motion, Lighthouse, no cross-origin requests

### Phase 2: Submission

- [ ] xTechSearch: confirm eligibility and registrations, decide by Oct 12 ([#11](https://github.com/Zero-State-LLC/zzthis/issues/11))
- [ ] xTechSearch submission prep ([#8](https://github.com/Zero-State-LLC/zzthis/issues/8))

### Phase 3: Product prototype (not started)

- [ ] Wordlist pipeline and check-word library ([#14](https://github.com/Zero-State-LLC/zzthis/issues/14))
- [ ] Minimal exact-match resolver ([#13](https://github.com/Zero-State-LLC/zzthis/issues/13))
- [ ] Capture by camera, typing, or voice; recognition approach still open
- [ ] Phone and web apps; not yet specified

v1 ends with the prototype above. Candidates for v2, such as any-language codes and a trained reader ([#35](https://github.com/Zero-State-LLC/zzthis/issues/35)), are listed in [SPEC Section 12](docs/SPEC.md).

## Contributing

1. Read [`AGENTS.md`](AGENTS.md) and the active file in [`intent/`](intent/).
2. For non-trivial work, start from the relevant spec in [`specs/`](specs/README.md). Branch from `main` and open a pull request. `main` is protected: direct pushes are blocked, the `build` check must pass, and one approving review is required. [`CODEOWNERS`](.github/CODEOWNERS) requests reviewers.
3. Before you push, run `npm run lint`, `npm run typecheck`, `npm run test`, and `npm run build` on Node 24.
4. Edit copy in `src/content/`, not in pages. Keep product claims inside what [`docs/SPEC.md`](docs/SPEC.md) supports.
5. Use the issue templates for bugs, features, and questions.

## License

Proprietary, all rights reserved. See [`LICENSE`](LICENSE). No use, copying, modification, or distribution is permitted without prior written permission.
