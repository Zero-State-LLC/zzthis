import type { ImageId } from "./images";

export type ApplicationId = "field" | "parcel" | "community" | "aliases";

export interface Application {
  id: ApplicationId;
  title: string;
  story: string;
  pageExtra?: string;
  homeImages: readonly ImageId[];
  pageImages: readonly ImageId[];
  homeWideOnly: boolean;
}

export const applications: readonly Application[] = [
  {
    id: "field",
    title: "Field logistics",
    story:
      "Hand-mark bags, crates, pallets, and mixed goods; read or relay a code; connect it to existing identifiers. Then photograph loose items, prepare a turn-in, compare inventory, and use touch-first actions.",
    homeImages: ["j"],
    pageImages: ["a", "alt-b", "c", "d", "e", "f", "j", "k", "l", "m", "n"],
    homeWideOnly: true,
  },
  {
    id: "parcel",
    title: "Postal and parcel",
    story:
      "Write a reference directly on a parcel; photograph loose items and receive packing guidance before choosing a parcel code.",
    homeImages: ["g", "o"],
    pageImages: ["g", "o"],
    homeWideOnly: false,
  },
  {
    id: "community",
    title: "Everyday and community",
    story:
      "A handwritten code on a lost-cat flyer or other public surface can lead to a useful page.",
    homeImages: ["h"],
    pageImages: ["h"],
    homeWideOnly: false,
  },
  {
    id: "aliases",
    title: "Digital aliases",
    story:
      "A short human-readable code can stand in for a long machine address used by software agents.",
    pageExtra: "Deeper blockchain/AI architecture can grow into a later page.",
    homeImages: ["i"],
    pageImages: ["i"],
    homeWideOnly: false,
  },
];

export const applicationsHome = {
  heading: "More applications",
  intro: "The same writable code works in other settings.",
  linkText: "All applications",
};

export const applicationsPage = {
  title: "Applications",
  intro:
    "AI belongs across field logistics and parcel workflows. Digital aliases are a separate application.",
};
