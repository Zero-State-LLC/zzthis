# UX patterns

Patterns for the zzThat apps and for the later zzThis web client. The marketing site already implements the demo strings quoted here. Product clients call `/v1` ([spec 005](../specs/005-v1-api/spec.md)). They do not invent a second grammar or a second error vocabulary.

Every sentence a person reads is in [copy.json](copy.json), by key. Clients build their string catalogs from that file and do not write their own sentences. The keys named below are copy.json keys.

Copy rules for anything a person reads:

- Say "demo", never "mock".
- Say "check word", never "checksum".
- No em dashes.
- Codes in interface text are the canonical lowercase form, such as `zz-kathy-lost-cat-zz`.
- Do not claim a measured accuracy, a pilot, a customer, an endorsement, or adoption.

## Demo badge

The marketing demo badge is the string `Demo · demo data` (`src/content/demo.ts`). Every step of `/demo` shows it. The demo check line is `Check word: OK (demo; no algorithm runs)`.

A product screen shows that badge only when the data is the scripted demo, not when `/v1` returned a live record. Live records are not labeled demo.

## Scan

Camera and typing are the two ways to read a code. The marketing console also has a simulated Voice tab. The first phone release does not request the microphone (zzThat ZQ10). The later web client follows that: camera and typing, no microphone.

The person starts the camera when they choose to scan. If they deny it, typing still works.

Recognition on the device runs first. The photo stays on the device unless the person accepts this sentence before a retry upload:

> Send this photo so we can read the code? It leaves your phone only for this retry, and it may be kept for review of this read. It is not used to train a model.

The product bands are the spec 004 bands: accept, clarify, retry, abstain. The marketing labels Manual, Rescan, Confirm, and Resolve are the site's microcopy. They are not a second contract.

If the view holds more than one code, the person picks. The client does not pick.

A bare mark (`zz` or `(zz)` alone) is not resolved. Offer typing.

A check-word mismatch asks the person to confirm the words. Do not replace them with a different code.

## Resolve

Show `record.title` and `record.body` from `GET /v1/resolve/{code}`. Do not add a phone-number field.

Unknown, expired, used, and revoked codes, and a private record read while signed out, all use one not-found presentation. The words are:

> No match. Check the words and try again.

The marketing demo adds `The demo will not guess.` under that result. A product client does not add a hint and does not name a similar code.

The screen can offer share. Share sends `share.text` (the canonical code) and does not send a URL. `share.url` is null.

## Create

The server chooses the words, including for a free public code. The person does not submit their own word list.

1. The person is signed in.
2. The client reads `GET /v1`. If `free_public` is false, create stays on the unavailable state and the client does not show a code.
3. Otherwise the client calls `POST /v1/codes`. The response canonical is the code the person writes down.
4. Re-roll (`POST /v1/codes/{id}/reroll`) asks the server for different words. A new code starts with `rerolls_remaining` 3. Each re-roll spends one. At 0, or after the code has been resolved, the server returns `reroll-cap` and the current words stay. The previous words are retired.
5. The person writes the canonical code on the thing. A photo check that the handwriting matches stays on the device.

Unavailable copy:

> Create is not available yet.

The client does not invent a code in that state.

Title and body are the everyday record. Both are what the person typed. The title is required. The body may be empty. The title is 1 to 120 Unicode code points after trim, and the body is 0 to 4000. Input stops at those limits, and a title of only spaces shows `create.title_required` (spec 005 FR-007). No phone number goes in the code, and there is no phone field. The body may hold contact details the owner chooses to share (Q68), and Create shows `create.public_hint` beside it.

## Share

The share sheet sends the canonical code as text. It does not send an https URL.

## Empty states

| Surface | Copy |
|---|---|
| Type field, nothing entered | `Type a zz code.` (the marketing console string) |
| My codes, signed in, none yet | `You have no codes yet.` |
| Create while `free_public` is false | `Create is not available yet.` |
| Offline, nothing cached for this code | `This code is not on this device. Connect and try again.` |

Issue, revoke, and re-roll are refused offline. They are not queued as successes. A local draft, if the client keeps one, is labeled `Not a code yet.` and is not shared as a live code.

## Errors

The client shows one sentence. It does not show the JSON `error` code except where the table says the person must act on it.

| Result | What the person sees |
|---|---|
| 200 public record | The title and the body |
| 404 `not-found` | `No match. Check the words and try again.` |
| 400 `malformed` on resolve or Type | `This is not a zz code. A code starts and ends with zz, like zz-copper-lantern-sky-zz.` |
| 400 `malformed` on a write (mint, record version, report) | `Nothing was saved.` Keep the fields as typed. |
| 400 `malformed` with reason `check-mismatch` | Confirm that code. Do not auto-correct. |
| 400 `malformed` with reason `wrong-length` | `scan.wrong_length`. Offer typing. Do not add or drop a word. |
| 422 bare mark | Not resolved. Offer typing. |
| 422 `reserved-handle` | `That name cannot be claimed.` |
| 409 `taken` | `That code is already taken.` Do not show an owner. |
| 403 `reroll-cap` | `These words stay.` The client keeps the current code on screen. |
| 403 `scope-unavailable` or 503 `not-ready` | `Create is not available yet.` |
| 401 on a write | Sign in |
| 403 otherwise | `You cannot do that.` |
| 429 | Wait for `Retry-After`. One line: `Wait a moment, then try again.` Do not say whether the code exists. |
| 500 on a write | `Nothing was saved.` |
| 503 `not-ready` outside Create | `error.unavailable` |
| No connection | The offline rules above |

## Account

The account screen shows which provider the person signed in with (`account.signed_in_with`), Sign out, Delete account, the support contact (`account.support`), the privacy policy link (`account.privacy`), and `account.licenses`. The support address and the policy URL are build settings, not copy. `{provider}` is the `provider.*` string for the first entry of `providers` from `GET /v1/me`; an account has one provider. `account.licenses` opens the third-party notices (`NOTICE` and `OFL.txt`) as plain text (INFERRED). Deletion calls `DELETE /v1/me` after the Delete confirm pattern.

## Patterns added 2026-10-04

Added so every screen in zzThat `runtime.md` and the spec 005 web client table has a pattern. Each is INFERRED and waits for Michael's review, like the strings it uses.

### Navigation

Three tabs: Scan, Create, My codes (`nav.*`). Account opens from a toolbar button on every tab. The web client shows the same four as a top bar. Back returns to the screen that opened the current one.

### Loading and offline

Loading keeps the previous content on screen and shows a small progress mark, never a blank page. Offline shows `common.offline_banner` above a cached record. Writes are refused offline, and the button says why (`error.no_connection`).

### Scan with the camera

1. The person taps `scan.take_photo`. The app takes one still photo. There is no live video reading in v1.
2. The photo stays on screen. Each candidate from the spec 004 scanner gets a box on it and a row in a list below, in reading order.
3. One candidate in Accept opens at once. Otherwise the list asks `scan.pick_one`, and nothing opens until the person taps a row.
4. Clarify shows the one uncertain word, its list candidates, and `scan.clarify_as_written`. A check-word mismatch shows `scan.check_mismatch` with the words as read, and offers typing.
5. Retry shows `scan.retry` with the reason. Abstain shows the parser reason in plain words, or `scan.bare`, and offers typing. A `wrong-length` result shows `scan.wrong_length` and offers typing; it is not sent.
6. `scan.type_instead` is always one tap away. If the camera is off, the screen shows `scan.camera_off`.
7. iOS shows `scan.camera_purpose` when it asks for the camera.

### Minted code

The code is the largest text on the screen, in the mono font, in lowercase, never truncated. The check word sits in place inside the code and has its own label below (`minted.check_word_label`, `minted.check_word_help`) and its own accessibility label. `minted.reroll` shows while `rerolls_remaining` is above 0. At `reroll-cap` the button goes away and `minted.reroll_cap` shows. `minted.write_check` opens Write check.

### Write check

The person photographs what they wrote. The spec 004 pipeline runs on the phone and compares the picked candidate with the minted code: `writecheck.match` or `writecheck.mismatch`. The note `writecheck.on_device` is always visible. Nothing is uploaded.

### My codes

A list of rows: the code in mono, the record title, and a status word (`codes.status_*`) when the code is not active. Codes retired by a re-roll do not appear. Empty: `codes.empty`. Signed out: `codes.signed_out` with a sign-in button.

### Code detail

The code, the title, the body as plain text, and three actions: Share, Edit (`detail.edit`), and Revoke (`detail.revoke`). Revoke shows only while the code is active. A revoked code shows `detail.revoked_note` and no Edit.

### Edit record

Title and body fields filled from `GET /v1/records/{id}`. The title is required (`create.title_required`). Save is one button. Success returns to Code detail with `edit.saved`. Failure keeps the text in the fields and shows `error.nothing_saved`.

### Revoke confirm and Delete confirm

A system dialog with the title, the body, a destructive action, and Cancel (`revoke.*`, `delete.*`). Cancel is the default.

### Report

A sheet from the Resolve screen: `report.title`, four reasons (`report.reason_*`), an optional note of up to 500 characters, and `report.send`. The answer is always `report.sent`, whether or not the code exists.

### Sign in

`signin.why`, then the provider buttons the platform draws itself: Sign in with Apple and Google on iOS, Google on Android, both on the web when configured. The web shows a provider button only when `GET /v1` lists that provider and its build setting is set (spec 005 Web client). Local builds add `signin.dev`, which uses the same server nonce flow (spec 005 FR-022). A failure shows `signin.failed` and leaves no half session.

### App icon

There is no square mark yet. `brand/mark-zz-code.webp` is 480 by 160. Until Michael supplies a square icon, builds use a placeholder: that mark centered on the paper color. A store submission waits for the real icon.

### Theme and brand parity

Added 2026-10-07. Brand and UI stay consistent across the zzThis site, the web client, and the zzThat apps [DANNY 2026-10-07]. Source: Michael's 2026-10-07 changes (`intent/2026-10-07-michael-content-changes.md`) and `docs/SPEC.md` Section 5.5.

- Every client starts in the dark theme by default and still offers light. The site starts dark on every page whatever the device setting, and its header toggle switches to light. The apps follow the same default instead of the system setting; the zzThat specs carry the app-side change.
- Where a client shows the zzThat wordmark, it uses the lowercase "zzthat" variant (zzThis `public/images/logos/zzthat-lowercase.webp`). It is not in `brand/` yet; add it here before an app shows it.
- Where a client shows the zzThis wordmark, it swaps by theme: `brand/zzthis-logo-on-dark.webp` (white "this") on dark, `brand/zzthis-logo-on-light.webp` (black "this") on light.
- Site menu (added 2026-10-08): the marketing site's top menu is How it works, Applications, Demo, About, Contact, with larger links and a logo that never shrinks (`docs/SPEC.md` Section 3.1, D-2026-10-08-01). The apps and the web client keep the tab set in Navigation above and do not link to `/demo`, so nothing changes there. A client that later links to the site menu or `/demo` uses this order and the word "Demo".
- Social links (added 2026-10-08): the zzThis site footer shows X for zzThis (https://x.com/zzthisapp) and, beside the lowercase zzthat wordmark, zzThat's Discord (https://discord.gg/sp7smSzq7) and Instagram (https://www.instagram.com/zzthatcom/), as 18 px inline-SVG icons in 44 px tap targets (`docs/SPEC.md` Section 3.2, Footer, D-2026-10-08-03). Only X belongs to zzThis; Discord and Instagram belong to zzThat. A zzThat client that shows social links uses those same Discord and Instagram addresses and does not present the zzThis X account as its own; the zzThat docs carry that side.
