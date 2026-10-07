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
    "Core identity: MARK a lowercase zz code → READ it by camera or manual entry → LINK it to a record → REPORT the words by voice where useful.",
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
      text: "For camera reading, find the two zz endpoints first, then read the words between them. Manual entry uses the same code grammar.",
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
      text: "Say the code words if a voice handoff is useful.",
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
  images: ["a", "alt-b", "c"] satisfies ImageId[],
  regionLabel: "Field logistics examples",
};

export const photoToAction = {
  heading: "From photo to action",
  intro:
    "A second layer after the handwritten code: see an item, identify it, choose its next task.",
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
    "AI-assisted work: PHOTOGRAPH one or more items → CONFIRM the proposed identification → choose a handling or inventory action by touch or voice → REVIEW the prepared record or form.",
};

export const howItWorksPage = {
  title: "How it works",
  intro:
    "Two connected workflows: one code for identity, and AI for the work that follows.",
  coreHeading: "Core identity",
  readWays: {
    heading: "Two ways to read a code",
    methods: ["Camera", "Typing"],
    line: "Camera reading uses the two zz endpoints to frame the code before reading the words between them. Manual entry uses the same code grammar. Voice recognition is planned for a future release; it is not part of v1.",
    images: ["d", "f"] satisfies ImageId[],
  },
  uncertain: {
    heading: "When a reading is uncertain",
    text: "If the endpoints or words are uncertain, the design asks for confirmation, another view, or manual entry. It does not guess a missing endpoint or another live code.",
  },
  aiHeading: "AI-assisted work",
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
