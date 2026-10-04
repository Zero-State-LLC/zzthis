# UX patterns

Patterns for the zzThat apps and for the later zzThis web client. The marketing site already implements the demo strings quoted here. Product clients call `/v1` ([spec 005](../specs/005-v1-api/spec.md)). They do not invent a second grammar or a second error vocabulary.

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

Title and body are the everyday record. Both are what the person typed. The title is required. The body may be empty. No phone number goes in the code or in another field.

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
| 400 `malformed` | `This is not a zz code. A code starts and ends with zz, like zz-copper-lantern-sky-zz.` |
| 400 `malformed` with reason `check-mismatch` | Confirm that code. Do not auto-correct. |
| 422 bare mark | Not resolved. Offer typing. |
| 422 `reserved-handle` | `That name cannot be claimed.` |
| 409 `taken` | `That code is already taken.` Do not show an owner. |
| 403 `reroll-cap` | `These words stay.` The client keeps the current code on screen. |
| 403 `scope-unavailable` or 503 `not-ready` | `Create is not available yet.` |
| 401 on a write | Sign in |
| 403 otherwise | `You cannot do that.` |
| 429 | Wait for `Retry-After`. One line: `Wait a moment, then try again.` Do not say whether the code exists. |
| 500 on a write | `Nothing was saved.` |
| No connection | The offline rules above |

## Account

Sign in with Apple or Sign in with Google. The account screen offers deletion before a store release. Deletion calls `DELETE /v1/me`.
