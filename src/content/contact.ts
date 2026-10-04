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
  locationHeading: "Location",
  locationText: "Mountain View / Santa Clara area; Hacker Dojo work base.",
  nextHeading: "Next action",
  nextText: "Discuss a pilot, test cohort or collaboration.",
};

export const hackerDojo = {
  heading: "Hacker Dojo",
  subtitle: "Innovation community and advisory network",
  // [MICHAEL 2026-10-03 v1.0 change list] One paragraph. The logo stays in the data and is not shown.
  paragraphs: [
    "Many of us are at Hacker Dojo, a top coworking, maker, and networking space and community in the heart of Silicon Valley, minutes from the headquarters of Google, NVIDIA, Apple, and more. Every day brings direct participation in, and access to, the latest ideas in problem solving, innovation, and creativity, along with cutting-edge work and trends, a deep and broad knowledge base, news, and resources. Its several hundred members cover the full range of skills, from software, hardware, and robotics to physical AI, IoT, security, and design.",
  ],
  logo: {
    src: "images/logos/hacker-dojo.webp",
    width: 284,
    height: 284,
    alt: "Hacker Dojo logo",
  },
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
