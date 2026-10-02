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
  title:
    "Barcodes made things scannable. zzThis makes them writable, and smart.",
  subline:
    "Write a code on a thing; find its record by camera, typing, or voice.",
  paragraph: {
    before:
      "zzThis is a human-readable, human-writable code alongside barcodes and QR codes. Write ",
    code: "zz-copper-lantern-sky-zz",
    after:
      " on tape, a crate, a parcel, or a sign. Link it to a digital record, then find it by camera, typing, or voice.",
  },
  imageCaption: "Word code on blue tape beside an obscured barcode.",
  actions: [
    {
      label: "See field logistics",
      path: "#field-logistics",
      variant: "primary",
    },
    { label: "How it works", path: "how-it-works", variant: "secondary" },
  ],
};

export const featured: TextBlock = {
  heading:
    "The shortest, smartest distance between a physical thing, its digital record, and the work that comes next.",
  text: "A writable mark establishes identity where the work happens. AI can help identify loose items from photos, compare inventory over time, suggest handling, and prepare a form or request. Touch and voice shorten the path from what a person sees to what the system can help them do.",
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
