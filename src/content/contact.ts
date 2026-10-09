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
  logo?: {
    src: string;
    /** Optional light-theme version; `src` is then the dark-theme version. */
    srcLight?: string;
    /** Width of the light-theme version, when it differs. */
    widthLight?: number;
    width: number;
    height: number;
    alt: string;
  };
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
    width: 356,
    height: 96,
    alt: "zzThat",
  },
} as const;
export const zzthatLogoVariant: keyof typeof zzthatLogos = "lowercase";

export const aboutPage = {
  title: "About zzThis",
  intro:
    "A code a person can write anywhere, linked to a digital record and the next work.",
  contactCardHeading: "Contact",
  contactCardText: "Invite collaboration and test partners.",
  explorationsHeading: "Current prototypes and explorations",
  // [MICHAEL 2026-10-07] zzthing.com is replaced by zzthis.com.
  prototypeLabel:
    "zzThis is for commercial and government use; zzThat is our free consumer app, launching soon.",
  handwrittenHeading: "Codes written by hand",
  handwrittenLabel: "Real photos of handwritten codes.",
  // [MICHAEL 2026-10-08] One explainer across the three Kathy images.
  handwrittenSetCaption:
    "Concept images. zz-code words, hand printed, for any thing or object. Then scanned, and more.",
  handwrittenSetZzPage:
    "Every zz-code can optionally have its own zzPage (here, zzpage.com/zz/Kathy-found-dog), hosted by zzThis or in the user's own cloud storage: Google Drive or Docs, OneDrive, Dropbox, iCloud, or Box.",
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
  // [MICHAEL 2026-10-07 change list] Paragraph replaced again as given.
  paragraphs: [
    "Many of us are at Hacker Dojo, a premier coworking, maker, and networking community in the heart of Silicon Valley, minutes from the headquarters of Google, NVIDIA, Apple, Meta, NASA Ames, Stanford, SRI International, and many more – where every day brings direct discussions with, and participation in, the latest ideas and experience of deep and broad knowledge base and professional expertise – and “live” the cutting-edge developments and information, news, and breaking trends for problem solving and opportunities, innovation and creativity, and resources; its several hundred members cover a full range of skills: blockchain, crypto, and decentralized and distributed systems; software, hardware, devices, IoT, physical AI, and robotics; AI agents and local (on-device) AI; cybersecurity and cryptography; networking and infrastructure; UX and UI design.",
  ],
  logo: {
    src: "images/logos/hacker-dojo.webp",
    width: 284,
    height: 284,
    alt: "Hacker Dojo logo",
  },
};

export const prototypes: readonly Prototype[] = [
  // [MICHAEL 2026-10-07] zzthis.com replaces zzthing.com, with its wordmark:
  // the same two logos as the header
  // (white "this" on the dark theme, black "this" on the light theme).
  {
    name: "zzthis.com",
    href: "https://zzthis.com",
    logo: {
      src: "images/logos/zzthis-logo-on-dark.webp",
      srcLight: "images/logos/zzthis-logo-on-light.webp",
      widthLight: 345,
      width: 329,
      height: 96,
      alt: "zzThis",
    },
    text: "For commercial use: businesses, enterprises, governments, and defense. Logistics, inventory, and postal workflows, built secure and compliant.",
  },
  {
    name: "zzthat.com",
    href: "https://zzthat.com",
    logo: zzthatLogos[zzthatLogoVariant],
    text: "Scanner and creator prototype, launching as a free web, Android, and iOS app. zzThat will be our separate consumer product and brand, for people to create and use zz-codes for their personal uses.",
  },
];
