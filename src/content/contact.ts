import { contactEmail } from "./navigation";

export const mailto = `mailto:${contactEmail}`;

export const contactPage = {
  title: "Contact",
  text: "Discuss a pilot, field feedback, or collaboration.",
  location: "Silicon Valley (Mountain View / Santa Clara; Hacker Dojo) and New York City.",
};

export interface Prototype {
  name: string;
  href: string;
  text: string;
}

export const aboutPage = {
  title: "About zzThis",
  intro: "A code a person can write anywhere, linked to a digital record and the next work.",
  contactCardHeading: "Contact",
  contactCardText: "Invite collaboration and test partners.",
  explorationsHeading: "Current prototypes and explorations",
  prototypeLabel: "These are prototypes and explorations; capabilities described as planned are not deployed features.",
  handwrittenHeading: "Codes written by hand",
  handwrittenLabel: "Real photos of handwritten codes.",
  locationHeading: "Location",
  locationText: "Silicon Valley (Mountain View / Santa Clara; Hacker Dojo) and New York City.",
  nextHeading: "Next action",
  nextText: "Discuss a pilot, test cohort or collaboration.",
};

export const hackerDojo = {
  heading: "Hacker Dojo",
  subtitle: "Innovation community and advisory network",
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
    text: "Broader concept showcase and label mockups.",
  },
  {
    name: "zzthat.com",
    href: "https://zzthat.com",
    text: "Working scanner/creator prototype and separate consumer product direction; web, Android, and iOS releases are planned.",
  },
];
