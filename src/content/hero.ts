// [MICHAEL 2026-10-14] Home top restructured: eyebrow, new headline, the
// barcode/QR comparison sub-headline with the Kathy code, two photos, the
// two hero buttons (How it works first), and the roadmap caveats removed from the hero body.
export interface HeroAction {
  label: string;
  path: string;
  variant: "primary" | "secondary";
}

export interface HeroPhoto {
  src: string;
  width: number;
  height: number;
  alt: string;
}

export interface HeroContent {
  eyebrow: string;
  title: string;
  subline: { before: string; code: string; after: string };
  paragraph: { before: string; code: string; after: string };
  photos: readonly HeroPhoto[];
  actions: readonly HeroAction[];
  imageCaption: string;
}

export interface TextBlock {
  heading: string;
  text: string;
}

export interface LinkBlock extends TextBlock {
  linkText: string;
}

// [MICHAEL 2026-10-15] Sub-headline ends with the barcode start and end bars
// and the QR corner squares.
export const hero: HeroContent = {
  eyebrow: "The next evolution of the barcode",
  title: "A barcode/QR code you can write by hand",
  subline: {
    before:
      "Barcodes use bars. QR codes use dots. zzThis uses everyday words. Just wrap your words in double z’s - like ",
    code: "zz-Kathy-found-dog-zz",
    after:
      " - write it on anything with a marker, and scan it to open its digital record. The “zz” ends tell our scanner exactly where to look, just like the start and end bars on a barcode and the three corner squares on a QR code.",
  },
  paragraph: {
    before:
      "zzThis is a human-readable, human-writable code for the physical world. Write a ",
    code: "zz-code",
    after:
      " on tape, a crate, a parcel, an envelope, or a sign, or embed it in text or program code. zzThis makes things readable-writable-smart.",
  },
  photos: [
    {
      src: "images/hero/kathy-corkboard.webp",
      width: 509,
      height: 492,
      alt: "A polaroid pinned to a cork board: a plush corgi wearing a zz tag, captioned zz-Kathy-found-dog-zz.",
    },
    {
      src: "images/hero/kathy-phone-record.webp",
      width: 594,
      height: 570,
      alt: "A hand holds a phone scanning the plush corgi; the screen reads zz-Kathy-found-dog-zz, Record found, and the record link.",
    },
  ],
  // [MICHAEL 2026-10-15] Buttons restored at Danny's request, How it works first.
  actions: [
    { label: "How it works", path: "#how-it-works", variant: "primary" },
    {
      label: "See field logistics",
      path: "#field-logistics",
      variant: "secondary",
    },
  ],
  imageCaption: "Word code on blue tape beside an obscured barcode.",
};

// [MICHAEL 2026-10-14] "How it works - consumer" block, right under the hero.
export const consumerHow = {
  eyebrow: "Physical-to-digital addressing",
  heading: "Skip the printer. Grab a marker.",
  text: "zzThis is a structurally constrained, human-readable tagging protocol. By bounding ordinary words with a “zz” prefix and suffix, we turn handwriting into a highly secure, scannable data link, from austere environments and logistics to everyday tracking.",
  lead: "zzThis protocol words connect things to their online information.",
  steps: [
    {
      title: "Create it.",
      text: "Choose or create your words and link them to information.",
    },
    {
      title: "Write it.",
      text: "Put the zz-code on your item or sign.",
    },
    {
      title: "Look it up.",
      text: "Scan the words to open the linked information.",
    },
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
