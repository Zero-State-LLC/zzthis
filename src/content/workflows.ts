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
  // [MICHAEL 2026-10-14] "- field" distinguishes this from the consumer block.
  heading: "How it works - field",
  intro:
    "Core identity: MARK a zz code → READ it → LINK it to a record → SPEAK it in a voice handoff.",
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
      text: "Scan it like a bar code or QR code, or type it in.",
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
      title: "Speak",
      text: "Say the code words to another person.",
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
  // [MICHAEL 2026-10-18] Renamed from "From photo to action".
  heading: "Your Super Lens to the Physical World",
  // [DANNY 2026-10-18 5:51 PM PT] This pipeline is not live.
  qualifier: "Planned: camera recognition is not live yet.",
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
    "PHOTOGRAPH one or more items → CONFIRM the proposed identification → choose a handling or inventory action by touch → REVIEW the prepared record or form.",
};

export const howItWorksPage = {
  title: "How it works",
  intro:
    "One code, written by hand, read by camera, spoken over a radio, and linked to the record it names.",
  coreHeading: "Core identity",
  readWays: {
    // [MICHAEL 2026-10-19] One heading in place of the two method boxes,
    // which looked clickable but were labels. Camera recognition is planned,
    // not a live path.
    heading:
      "Manual entry today, camera recognition planned, then send over radio",
    images: ["d", "f"] satisfies ImageId[],
  },
  // [MICHAEL 2026-10-17] Section 03: contested logistics beside the shared
  // naming layer.
  reach: {
    heading: "Contested logistics and sustainment, disaster relief",
    images: ["p", "q"] satisfies ImageId[],
  },
  aiHeading: "Your Super Lens to the Physical World",
  publicRecord: {
    heading: "The code is public; the record is protected",
    text: "The visible words are a public identifier, not a password or private key. Payment and authorization remain in signed backend records.",
  },
};
