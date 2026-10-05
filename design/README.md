# zzThis design system

This folder is the shared design source for zzThis and for the zzThat apps. The values are extracted from the live site stylesheets. Nothing in `design/tokens.json` is a new palette.

| File | Role |
|---|---|
| [`tokens.json`](tokens.json) | Canonical tokens. Regenerated from `src/styles/tokens.css`, the mount shadow in `src/styles/base.css`, and the pill radius in `src/styles/b-base.css`. |
| [`generated/tokens.css`](generated/tokens.css) | CSS variables for a web client. |
| [`generated/Tokens.swift`](generated/Tokens.swift) | SwiftUI `Color` and `Font` for iOS. |
| [`generated/Tokens.kt`](generated/Tokens.kt) | Compose `Color` and text styles for Android. |
| [`brand/`](brand/) | Logo and mark files already in this repo. |
| [`UX.md`](UX.md) | Patterns for scan, resolve, create, share, errors, empty states, the demo badge, and copy. |
| [`copy.json`](copy.json) | Every sentence the apps and the web client show, by key. Clients build their catalogs from it. Added 2026-10-04. |
| `fonts/` | Not here yet. The build copies the static IBM Plex TTF files the token files name, with `OFL.txt`, from `@ibm/plex-sans` 1.1.0, `@ibm/plex-sans-condensed` 2.0.0, and `@ibm/plex-mono` 2.5.0, pinned as exact devDependencies (OFL-1.1, spec 005 T030). iOS and Android cannot load the site's woff2 files. |

The site still loads `src/styles/tokens.css`. `npm run design:build` reads that file and rewrites this folder. `npm run design:check` fails if the folder drifts. The site build runs the check.

sRGB numbers in the Swift and Kotlin files are the conversion of the oklch (and rgb) values in the stylesheet. The accent token `oklch(65.9% 0.215 38)` converts to `#F85002`. `docs/SPEC.md` also names the logo orange as `#F85000`. The token in the stylesheet wins for these files.

## Change a token

1. Edit `src/styles/tokens.css` (or the cited shadow and radius rules, if that is the value you are changing).
2. Run `npm run design:build`.
3. Commit `src/styles/` and `design/` together.

## Brand files

There is no separate vector drawing of the wordmark in the repo. The canonical artwork is the raster Michael supplied:

| File | Pixels | Use |
|---|---|---|
| `brand/zzthis-logo-on-light.png` | 464 by 129 | Wordmark on a light field. Master for the light SVG. |
| `brand/zzthis-logo-on-light.webp` | 464 by 129 | The same wordmark, the file the site serves. |
| `brand/zzthis-logo-on-dark.webp` | 480 by 140 | Wordmark on a dark field. |
| `brand/mark-zz-code.webp` | 480 by 160 | The zz code mark (`public/images/logos/zz-code-tm.webp`). |

`brand/logo-on-light.svg`, `brand/logo-on-dark.svg`, and `brand/mark.svg` are SVG wrappers around those rasters so a client has an SVG entry. They do not redraw the letters.

## Sync method

**Pinned copy. Not a git submodule.**

zzThat issue #22 task T005 follows this section and no other method. Do not add `Zero-State-LLC/zzthis` as a git submodule. A submodule has to be initialized in every Xcode and Gradle checkout, and a missed init ships an empty design folder. A pinned copy is ordinary source files plus one sha.

The script is [`scripts/pin-design.sh`](../scripts/pin-design.sh) in this repo. It downloads `design/` at one full commit sha and writes a `PIN` file.

From a zzThat checkout, after this folder is on the zzThis commit you are pinning:

```sh
PIN=<full 40-character zzThis commit sha>
curl -fsSL "https://raw.githubusercontent.com/Zero-State-LLC/zzthis/${PIN}/scripts/pin-design.sh" -o /tmp/pin-design.sh
sh /tmp/pin-design.sh vendor/zzthis-design "$PIN"
```

The destination must be a relative path inside the consumer checkout. The script refuses an absolute path, a `..` segment, and anything but a full 40-character sha.

Commit only the pinned files in zzThat. Do not commit a second hand-written palette. Where each file lands in zzThat, and the one pin file (`contracts/ZZTHIS-API-PIN`), are in zzThat `specs/001-zzthat-apps/design.md`. That table replaces the older one here, which named `apps/DESIGN-PIN`.

`UX.md` is the pattern list. Read it. Every screen in the zzThat runtime and the spec 005 web client now has a pattern. Do not generate a local substitute for a pattern it does not name. Open an issue here instead.

`tokens.json` stays in zzThis. The apps compile the Swift and Kotlin files, not the JSON.

To move the pin later, run the script with the new sha and replace those same files in one pull request. Do not track `main`.

[`scripts/pin-zzthis.sh`](../scripts/pin-zzthis.sh) (spec 005 T033) copies the token files, `brand/`, `fonts/`, `copy.json`, the OpenAPI file, the shared test vectors, the wordlists, and `NOTICE` at one sha into one folder, with a `PIN` file, so zzThat keeps one pin for all of them. It takes the same arguments as `pin-design.sh` and fails when any path is missing at that sha. The list of paths is in [spec 005 plan.md](../specs/005-v1-api/plan.md), What zzThat pins. `pin-design.sh` stays until zzThat moves to the new script.
