import type { ImageId } from "./images";

export interface WorkflowStep {
  numeral: string;
  title: string;
  text: string;
  image: ImageId;
}

export interface TitledImage {
  title: string;
  image: ImageId;
}

export const coreIdentity = {
  heading: "How it works",
  intro:
    "Core identity: MARK a lowercase zz code → READ it by manual entry today; on-device camera recognition is planned for v1 → LINK it to a record → REPORT it in a voice handoff to another person if useful.",
  steps: [
    {
      numeral: "01",
      title: "Mark",
      text: "Write the code on tape, a crate, or a pallet.",
      image: "alt-c",
    },
    {
      numeral: "02",
      title: "Read",
      text: "Manual entry uses the same code grammar and is the available read path in this build. On-device camera recognition is planned for v1 but is not implemented yet.",
      image: "d",
    },
    {
      numeral: "03",
      title: "Link",
      text: "Connect to an existing record and photo.",
      image: "e",
    },
    {
      numeral: "04",
      title: "Report",
      text: "Say the code words to another person if a voice handoff is useful; software voice recognition is not part of v1.",
      image: "f",
    },
  ] satisfies WorkflowStep[],
  // Q11 [MICHAEL 2026-10-02]: show the lowercase zz code as text in the explainer.
  exampleLabel: "Example code",
  exampleCode: "zz-copper-lantern-sky-zz",
  closing: "For a field code made with no device, link and reconcile later.",
  demoLinkText: "Try the scripted demo",
};

export const fieldLogistics = {
  heading: "Field logistics",
  intro:
    "Hand-mark mixed items at the point of work; link the mark to a record.",
  images: ["a", "c", "alt-b"] satisfies ImageId[],
  regionLabel: "Field logistics examples",
};

export const photoToAction = {
  heading: "From photo to action",
  intro:
    "Future exploration (B7, queued): a second layer after the handwritten code could identify an item and suggest its next task.",
  sequenceLabel: "From photo to action, three steps",
  sequence: [
    { numeral: "01", title: "Photograph", image: "j" },
    { numeral: "02", title: "Guide", image: "k" },
    { numeral: "03", title: "Review", image: "l" },
  ] satisfies (TitledImage & { numeral: string })[],
  cards: [
    { title: "Inventory assistant", image: "m" },
    { title: "Touch first", image: "n" },
  ] satisfies TitledImage[],
  workflow:
    "Future concept, not v1: PHOTOGRAPH one or more items → CONFIRM the proposed identification → choose a handling or inventory action by touch → REVIEW the prepared record or form.",
};

export const howItWorksPage = {
  title: "How it works",
  intro:
    "One workflow for code identity; photo-based identification remains future exploration, not v1 behavior.",
  coreHeading: "Core identity",
  readWays: {
    heading: "Manual and planned camera reading",
    methods: ["Manual entry (available)", "Camera recognition (planned)"],
    line: "Manual entry uses the same code grammar and is the available read path in this build. On-device camera recognition is planned for v1 but is not implemented yet. Voice recognition is planned for a future release; it is not part of v1.",
    images: ["d", "f"] satisfies ImageId[],
  },
  uncertain: {
    heading: "When a reading is uncertain",
    text: "When implemented, the camera reader should ask for confirmation, another view, or manual entry if endpoints or words are uncertain; it should not guess a missing endpoint or another live code.",
  },
  aiHeading: "AI-assisted work: future exploration",
  publicRecord: {
    heading: "The code is public; the record is protected",
    text: "The visible words are a public identifier, not a password or private key. Payment and authorization remain in signed backend records.",
  },
};

export const decisionBands = {
  ariaLabel: "Decision bands, from low to high confidence",
  names: ["Manual", "Rescan", "Confirm", "Resolve"] as const,
  note: "Design intent. No threshold has been measured yet.",
};
