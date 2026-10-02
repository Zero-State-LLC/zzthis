import { contactEmail } from "./navigation";

export const mailto = `mailto:${contactEmail}`;

export const contactPage = {
  title: "Contact",
  text: "Discuss a pilot, field feedback, or collaboration.",
  location:
    "Michael works from the Hacker Dojo area in Mountain View/Santa Clara.",
};

export interface Prototype {
  name: string;
  href: string;
  text: string;
}

export const aboutPage = {
  title: "About zzThis",
  intro:
    "A code a person can write anywhere, linked to a digital record and the next work.",
  contactCardHeading: "Contact",
  contactCardText: "Invite collaboration and test partners.",
  explorationsHeading: "Current explorations",
  prototypeLabel: "Both sites are concept-stage explorations.",
  handwrittenHeading: "Codes written by hand",
  handwrittenLabel: "Real photos of handwritten codes.",
  stageHeading: "Current stage",
  stageText:
    "Company details will follow.",
  locationHeading: "Location",
  locationText: "Mountain View / Santa Clara area; Hacker Dojo work base.",
  nextHeading: "Next action",
  nextText: "Discuss a pilot, test cohort or collaboration.",
};

export const prototypes: readonly Prototype[] = [
  {
    name: "zzthing.com",
    href: "https://zzthing.com",
    text: "Broader showcase and label mockups.",
  },
  {
    name: "zzthat.com",
    href: "https://zzthat.com",
    text: "Scanner/creator prototype; planned free web, Android, and iOS app.",
  },
];
