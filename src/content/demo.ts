import type { ParseFailure } from "../lib/grammar";
import type { ImageId } from "./images";

export interface MockField {
  label: string;
  value: string;
}

export interface MockCode {
  code: string;
  kind: string;
  fields: readonly MockField[];
  image?: ImageId;
}

export const badgeText = "Demo · demo data";

// Q3 and Q5 [MICHAEL 2026-10-02]
export const demoTitle = "See zzThis in action.";

export const demoLead =
  "A person writes a code; a phone connects it to a record and a next step.";

export const demoPrototypesHeading = "Current prototypes";

export const demoPrototypeLinks: readonly {
  name: string;
  href: string;
  text: string;
}[] = [
  {
    name: "zzthing.com",
    href: "https://zzthing.com",
    text: "Broader showcase.",
  },
  {
    name: "zzthat.com",
    href: "https://zzthat.com",
    text: "Simpler scanner and creator exploration.",
  },
];

export const demoPlannedApp =
  "Planned public app: zzThat will be a free app for web, Android, and iOS at zzthat.com.";

export const demoTryHeading = "Try a workflow";

export const demoTryText =
  "Mark, read, and link a code below; then see the photo-to-action concept.";

export const demoIntro =
  "This is a scripted demonstration. No recognition runs; every result is prewritten demo data.";

export const flowATitle = "Flow A: Field item";
export const flowBTitle = "Flow B: Look up a code";

export const flowACode: MockCode = {
  code: "zz-copper-lantern-sky-zz",
  kind: "Crate, field supply (demo)",
  fields: [
    { label: "NSN", value: "DEMO-0000-00-000-0001" },
    { label: "Document number", value: "DEMO-DOC-0001" },
    { label: "Hand receipt", value: "DEMO-HR-01" },
    { label: "Photo", value: "Attached (demo image)" },
  ],
  image: "demo-01",
};

export const mockCodes: readonly MockCode[] = [
  flowACode,
  {
    code: "zz-river-maple-sky-zz",
    kind: "Parcel (demo)",
    fields: [
      { label: "Reference", value: "DEMO-PARCEL-01" },
      { label: "Status", value: "Ready for drop-off (demo)" },
    ],
  },
  {
    code: "zz-blue-bike-astoria-zz",
    kind: "Physical thing: bicycle (demo)",
    fields: [
      {
        label: "Owner contact",
        value: "Withheld: public code, protected record (demo)",
      },
    ],
  },
  {
    code: "zz-b2-4-zz",
    kind: "Duffel group B2, item 4 (demo)",
    fields: [{ label: "Hand receipt", value: "DEMO-HR-02" }],
  },
];

export const handlingOptions = ["Pack", "Return", "Repair", "Dispose"] as const;
export type HandlingOption = (typeof handlingOptions)[number];

export const suggestedHandling: { option: HandlingOption; reason: string } = {
  option: "Return",
  reason: "Damaged handle (demo)",
};

export const flowACopy = {
  start: "Start",
  photograph: "Photograph (simulated)",
  showResult: "Show scripted result",
  confirm: "Confirm",
  retry: "Retry",
  next: "Next",
  continueToReview: "Continue to review",
  reviewComplete: "Review complete",
  restart: "Restart",
  back: "Back",
  contact: "Contact",
  confidence: "Confidence: 0.94 (demo)",
  checksum: "Checksum: OK (demo state, no algorithm runs)",
  handlingLabel: "Handling options (demo)",
  suggestionLabel: "AI suggestion (demo)",
  voiceChip: "Say 'return' (simulated)",
  voiceResult: "Simulated voice input: 'return'",
  formLabel: "Prepared turn-in form (demo, read-only)",
  chosenAction: "Chosen action",
  code: "Code",
  reason: "Reason",
};

export const flowAStepIds = [
  "A0",
  "A1",
  "A2",
  "A3",
  "A4",
  "A5",
  "A6",
  "A7",
] as const;
export type FlowAStepId = (typeof flowAStepIds)[number];

interface FlowAStepContent {
  name: string;
  text: string;
  summary: string;
  image: ImageId;
}

export const flowASteps = {
  A0: {
    name: "Intro",
    text: "A field crate, marked by hand.",
    summary: "A field crate, marked by hand.",
    image: "demo-01",
  },
  A1: {
    name: "Mark",
    text: "Write the code on tape.",
    summary: "Write the code on tape: zz-copper-lantern-sky-zz.",
    image: "demo-02",
  },
  A2: {
    name: "Photo",
    text: "Photo taken (demo image).",
    summary: "Photo taken (demo image).",
    image: "demo-05",
  },
  A3: {
    name: "Read result",
    text: "",
    summary:
      "Code, confidence 0.94 (demo), checksum OK (demo). Confirm or Retry.",
    image: "demo-02",
  },
  A4: {
    name: "Linked record",
    text: "",
    summary: "Record card (demo).",
    image: "demo-03",
  },
  A5: {
    name: "Handling",
    text: "AI suggestion (demo): Return.",
    summary:
      "AI suggestion (demo): Return. Choose Pack, Return, Repair, or Dispose.",
    image: "k",
  },
  A6: {
    name: "Review",
    text: "",
    summary:
      "Prepared turn-in form, read-only, with the chosen action filled in.",
    image: "l",
  },
  A7: {
    name: "End",
    text: "Nothing was submitted. This was a demo with demo data.",
    summary: "Nothing was submitted. This was a demo with demo data.",
    image: "demo-04",
  },
} satisfies Record<FlowAStepId, FlowAStepContent>;

export const flowBCopy = {
  inputLabel: "Type a zz code",
  lookUp: "Look up",
  examplesLabel: "Example codes",
  unknown: "No match. The demo will not guess. Check the words and try again.",
  malformed:
    "This is not a zz code. A code starts and ends with zz, like zz-copper-lantern-sky-zz.",
  closing: "Add the closing zz at the end of the code.",
  handle: "An @ handle comes right after the first zz, like zz-@agentsmith-zz.",
  reserved: "The symbols # $ / : are reserved and are not used in codes yet.",
  script: "This demo reads English letters and numbers only.",
  bare: "A bare zz mark is found by photo and place, not by typing. Try a code with words.",
};

export function b4Line(reason: ParseFailure): string {
  switch (reason) {
    case "no-closing-marker":
      return flowBCopy.closing;
    case "misplaced-at":
    case "invalid-handle":
      return flowBCopy.handle;
    case "reserved-symbol":
      return flowBCopy.reserved;
    case "unsupported-script":
      return flowBCopy.script;
    case "empty":
    case "no-marker":
    case "no-content":
    case "marker-in-body":
    case "invalid-character":
    case "too-long":
      return flowBCopy.malformed;
  }
}

export const flowBOutcomes: readonly { name: string; text: string }[] = [
  { name: "Type a zz code", text: "Field, Look up button, and example codes." },
  { name: "Record found", text: "Record card (demo)." },
  { name: "No match", text: flowBCopy.unknown },
  { name: "Not a zz code", text: flowBCopy.malformed },
  { name: "Bare mark", text: flowBCopy.bare },
];
