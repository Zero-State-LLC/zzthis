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
  logo?: { src: string; width: number; height: number; alt: string };
}

// [MICHAEL 2026-10-06 change list] A small zzThat wordmark under zzthat.com on
// About only. Two capitalization variants exist (GPT-Astra assets, orange zz
// #FF5500, deep teal #0B7480). Pick the primary here until Michael and Danny
// finalize capitalization; show only one at a time.
const zzthatLogos = {
  camelcase: {
    src: "images/logos/zzthat-camelcase.webp",
    width: 382,
    height: 96,
    alt: "zzThat",
  },
  lowercase: {
    src: "images/logos/zzthat-lowercase.webp",
    width: 355,
    height: 96,
    alt: "zzThat",
  },
} as const;
export const zzthatLogoVariant: keyof typeof zzthatLogos = "camelcase";

export const aboutPage = {
  title: "About zzThis",
  intro:
    "A code a person can write anywhere, linked to a digital record and the next work.",
  contactCardHeading: "Contact",
  contactCardText: "Invite collaboration and test partners.",
  explorationsHeading: "Current prototypes and explorations",
  prototypeLabel:
    "zzThing is a concept showcase; zzThat is a working prototype, launching soon.",
  handwrittenHeading: "Codes written by hand",
  handwrittenLabel: "Real photos of handwritten codes.",
  locationHeading: "Location",
  locationText:
    "Silicon Valley (Mountain View / Santa Clara; Hacker Dojo) and New York City.",
  nextHeading: "Next action",
  nextText: "Discuss a pilot, test cohort or collaboration.",
};

export const hackerDojo = {
  heading: "Hacker Dojo",
  subtitle: "Innovation community and advisory network",
  // [MICHAEL 2026-10-03 v1.0 change list] One paragraph. The logo stays in the data and is not shown.
  // [MICHAEL 2026-10-06 change list] Paragraph replaced as given.
  paragraphs: [
    "Many of us are at Hacker Dojo, a premier coworking, maker, and networking community in the heart of Silicon Valley, minutes from the headquarters of Google, NVIDIA, Apple, Meta, NASA Ames, Stanford, SRI International, and many more. Every day brings direct discussions with, and participation in, the latest ideas, backed by a deep and broad knowledge, professional, and experience base. We get cutting-edge developments and information, news, and trends for problem solving and opportunities, innovation and creativity, and resources. Its several hundred members cover the full range of skills: blockchain, crypto, and decentralized and distributed systems; software, hardware, devices, IoT, physical AI, and robotics; AI agents and local (on-device) AI; cybersecurity and cryptography; networking and infrastructure; UX and UI design.",
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
    logo: zzthatLogos[zzthatLogoVariant],
    text: "Scanner and creator prototype, launching as a free web, Android, and iOS app. zzThat will be our separate consumer product and brand, for people to create and use zz-codes for their personal uses.",
  },
];
