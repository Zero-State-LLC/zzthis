import { contactEmail } from "./navigation";

export const mailto = `mailto:${contactEmail}`;

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
// About. [MICHAEL 2026-10-08] The same wordmark also sits beside zzThat's
// social icons in every page footer. Two capitalization variants exist (GPT-Astra assets, orange zz
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
export const zzthatLogo = zzthatLogos[zzthatLogoVariant];

export const aboutPage = {
  title: "About zzThis",
  // [MICHAEL 2026-10-17] The intro line carries the open invite now.
  intro:
    "An active, open invite to military and civilian logistics partners and engineers.",
  contactCardHeading: "Contact",
  contactCardText: "We invite collaboration and test partners.",
  explorationsHeading: "Current prototypes and explorations",
  // [MICHAEL 2026-10-07] zzthing.com is replaced by zzthis.com.
  prototypeLabel:
    "zzThis is for commercial and government use; zzThat is our free consumer app, launching soon. These are prototypes and explorations; capabilities described as planned are not deployed features.",
  handwrittenHeading: "Codes written by hand",
  handwrittenLabel: "Real photos of handwritten codes.",
  // [MICHAEL 2026-10-08] One explainer across the three Kathy images.
  handwrittenSetCaption:
    "Concept images. zz-code words, hand printed, for any thing or object. Then scanned, and more.",
  handwrittenSetZzPage:
    "Every zz-code can optionally have its own zzPage (here, zzpage.com/zz/Kathy-found-dog), hosted by zzThis or in the user's own cloud storage: Google Drive or Docs, OneDrive, Dropbox, iCloud, or Box.",
  locationHeading: "Location",
  // [MICHAEL 2026-10-15] Location shortened.
  locationText: "Silicon Valley (Santa Clara) and New York City.",
  nextHeading: "Next action",
  nextText: "Discuss a pilot, test cohort or collaboration.",
};

// [MICHAEL 2026-10-18] Contact is back in the menu. Its lines match About:
// the open invite under the title, the collaboration line in the card.
export const contactPage = {
  title: "Contact",
  text: aboutPage.intro,
  cardText: aboutPage.contactCardText,
  location: aboutPage.locationText,
};

export const hackerDojo = {
  // [MICHAEL 2026-10-15] The Hacker Dojo block becomes a Silicon Valley
  // block: new heading, subtitle, two paragraphs and a skills list, as given.
  // The export keeps its old name; the logo stays in the data, not shown.
  heading: "Silicon Valley: The Heart of Tech",
  subtitle: "Innovation | Community | Networking",
  paragraphs: [
    "Many of us are based in the heart of Silicon Valley and met through its coworking spaces, maker communities, professional networks, and technology events. We work near the headquarters and research centers of Google, NVIDIA, Apple, Meta, NASA Ames, Stanford University, SRI International, and many other leading organizations.",
    "Here, we participate in direct discussions about emerging technologies and draw on a deep, broad base of professional knowledge. We live and work close to cutting-edge developments, breaking trends, new approaches to problem-solving, and opportunities for innovation and collaboration.",
  ],
  networkLead:
    "Our extended network includes hundreds of people who contribute expertise and advice across:",
  skills: [
    "Blockchain, crypto, and decentralized and distributed systems",
    "Software, hardware, connected devices, and IoT",
    "Physical AI and robotics",
    "AI agents and local, on-device AI",
    "Cybersecurity and cryptography",
    "Networking and infrastructure",
    "UX and UI design",
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
    // [MICHAEL 2026-10-15] "For business uses: companies, ..."
    text: "For business uses: companies, enterprises, governments, and defense. Logistics, inventory, and postal workflows, built secure and compliant.",
  },
  {
    name: "zzthat.com",
    href: "https://zzthat.com",
    text: "Working scanner/creator prototype and separate consumer product direction; web, Android, and iOS releases are planned.",
    logo: zzthatLogos[zzthatLogoVariant],
  },
];
