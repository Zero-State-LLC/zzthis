export interface HeroAction {
  label: string;
  path: string;
  variant: "primary" | "secondary";
}

export interface HeroContent {
  title: string;
  subline: string;
  paragraph: { before: string; code: string; after: string };
  imageCaption: string;
  actions: readonly HeroAction[];
}

export interface TextBlock {
  heading: string;
  text: string;
}

export interface LinkBlock extends TextBlock {
  linkText: string;
}

export const hero: HeroContent = {
  // Q62 [DANNY 2026-10-03, revised]: v1.0 headline, spaced hyphen, no em dash.
  title:
    "Barcodes made things scannable. zzThis makes things readable-writable - and smart.",
  subline: "Write a code on a thing; type it to find its record.",
  paragraph: {
    before:
      "zzThis is a human-readable, human-writable code for the physical world. Write a ",
    code: "zz-code",
    after:
      " on tape, a crate, a parcel, an envelope, or a sign, or embed it in text or program code. The prototype supports typed lookup to a digital record. On-device camera recognition is planned for v1 but is not implemented in this build. Voice recognition is planned for a future release, not v1.",
  },
  imageCaption: "Word code on blue tape beside an obscured barcode.",
  actions: [
    {
      label: "See field logistics",
      path: "#field-logistics",
      variant: "primary",
    },
    { label: "How it works", path: "#how-it-works", variant: "secondary" },
  ],
};

export const featured: TextBlock = {
  heading:
    "The shortest, smartest distance between a physical thing, its digital record, and the work that comes next.",
  text: "A zz code gives people a way to create the mark themselves, wherever the work happens. Future AI-assisted workflows could help identify what a camera sees, count what remains, suggest how an item should be handled, and prepare the next task; those capabilities are explorations, not shipped v1 behavior. The same visible code connects the item, its history, and the people responsible for it. It bridges physical things and their digital control. AI may serve as an interface and connector, not as the authority that defines or resolves a zz code.",
};

export const aboutTeaser: LinkBlock = {
  heading: "About and people",
  text: "Meet Michael and the advisors; see prototype explorations.",
  linkText: "About zzThis",
};

export const contactAction: TextBlock = {
  heading: "Contact",
  text: "Discuss field feedback, a pilot, or collaboration.",
};
