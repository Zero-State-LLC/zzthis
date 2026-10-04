// [prototype 2026-10-03 b-resolver-v1] Console microcopy. Not a marketing claim.

export const consoleCopy = {
  heading: "Look up a code",
  tabsLabel: "Read the code by",
  tabs: ["Camera", "Typing", "Voice"] as const,
  photograph: "Photograph (simulated)",
  confidence: "Confidence: 0.94 (mock)",
  checksum: "Checksum: OK (mock state, no algorithm runs)",
  typeLabel: "Type a zz code",
  examplesLabel: "Example codes",
  examples: [
    "zz-copper-lantern-sky-zz",
    "zz-river-maple-sky-zz",
    "zz-blue-bike-astoria-zz",
    "zz-b2-4-zz",
    "(zz) camp bravo four two (zz)",
    "copper lantern sky",
  ] as const,
  voiceCue: "“Tag: copper, lantern, sky. Break.”",
  voiceNote:
    "No microphone is used. The words below are a prewritten transcript.",
  voiceButton: "Simulate voice input",
  voiceHeard: "Simulated voice input: 'copper, lantern, sky'",
  voiceWaiting: "Waiting for simulated voice input.",
  lookup: "Look up",
  empty: "Type a zz code.",
  miss: "No match. The demo will not guess. Check the words and try again.",
  missNote: "Exact match only. A miss never suggests other codes.",
  malformed:
    "This is not a zz code. A code starts and ends with zz, like zz-copper-lantern-sky-zz.",
  comingLater:
    "Codes in other languages and scripts are coming later. This demo reads v1 codes, written with Latin letters and numbers, for now.",
  recordFoot: "Mock record. No network request was made.",
  pillLabel: "Look up a code (press Alt and slash)",
  pillAwayLabel: "Look up a code on the home page (press Alt and slash)",
  pillCode: "zz-···-zz",
  pillText: "Look up a code",
  tokenMarker: "marker",
  tokenWord: "word",
  dashMarkers: "dash markers",
  circledMarkers: "circled markers",
  parsedTokens: "Parsed code",
};

export function parsedStatus(
  how: string,
  count: number,
  normalized: string,
): string {
  return `Parsed: ${how}, ${count} words. Normalized: ${normalized}`;
}

export function reasonNote(reason: string): string {
  return `reason: ${reason}`;
}
