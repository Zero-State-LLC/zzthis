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

export const badgeText = "Demo · mock data";

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
  "This is a scripted demonstration. No recognition runs; every result is prewritten mock data.";

export const flowATitle = "Flow A: Field item";
export const flowBTitle = "Flow B: Look up a code";

export const flowACode: MockCode = {
  code: "zz-copper-lantern-sky-zz",
  kind: "Crate, field supply (mock)",
  fields: [
    { label: "NSN", value: "MOCK-0000-00-000-0001" },
    { label: "Document number", value: "MOCK-DOC-0001" },
    { label: "Hand receipt", value: "MOCK-HR-01" },
    { label: "Photo", value: "Attached (mock image)" },
  ],
  image: "demo-01",
};

export const mockCodes: readonly MockCode[] = [
  flowACode,
  {
    code: "zz-river-maple-sky-zz",
    kind: "Parcel (mock)",
    fields: [
      { label: "Reference", value: "MOCK-PARCEL-01" },
      { label: "Status", value: "Ready for drop-off (mock)" },
    ],
  },
  {
    code: "zz-blue-bike-astoria-zz",
    kind: "Physical thing: bicycle (mock)",
    fields: [
      {
        label: "Owner contact",
        value: "Withheld: public code, protected record (mock)",
      },
    ],
  },
  {
    code: "zz-b2-4-zz",
    kind: "Duffel group B2, item 4 (mock)",
    fields: [{ label: "Hand receipt", value: "MOCK-HR-02" }],
  },
];

export const handlingOptions = ["Pack", "Return", "Repair", "Dispose"] as const;
export type HandlingOption = (typeof handlingOptions)[number];

export const suggestedHandling: { option: HandlingOption; reason: string } = {
  option: "Return",
  reason: "Damaged handle (mock)",
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
  confidence: "Confidence: 0.94 (mock)",
  checksum: "Checksum: OK (mock state, no algorithm runs)",
  handlingLabel: "Handling options (mock)",
  suggestionLabel: "AI suggestion (mock)",
  voiceChip: "Say 'return' (simulated)",
  voiceResult: "Simulated voice input: 'return'",
  formLabel: "Prepared turn-in form (mock, read-only)",
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
    text: "Photo taken (mock image).",
    summary: "Photo taken (mock image).",
    image: "demo-05",
  },
  A3: {
    name: "Read result",
    text: "",
    summary:
      "Code, confidence 0.94 (mock), checksum OK (mock). Confirm or Retry.",
    image: "demo-02",
  },
  A4: {
    name: "Linked record",
    text: "",
    summary: "Record card (mock).",
    image: "demo-03",
  },
  A5: {
    name: "Handling",
    text: "AI suggestion (mock): Return.",
    summary:
      "AI suggestion (mock): Return. Choose Pack, Return, Repair, or Dispose.",
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
    text: "Nothing was submitted. This was a demo with mock data.",
    summary: "Nothing was submitted. This was a demo with mock data.",
    image: "demo-04",
  },
} satisfies Record<FlowAStepId, FlowAStepContent>;

export const flowBCopy = {
  inputLabel: "Type a zz code",
  lookUp: "Look up",
  examplesLabel: "Example codes",
  unknown: "No match. The demo will not guess. Check the words and try again.",
  malformed: "This is not a zz code. Use the form zz-word-word-zz.",
};

export const flowBOutcomes: readonly { name: string; text: string }[] = [
  { name: "Type a zz code", text: "Field, Look up button, and example codes." },
  { name: "Record found", text: "Record card (mock)." },
  { name: "No match", text: flowBCopy.unknown },
  { name: "Not a zz code", text: flowBCopy.malformed },
];
