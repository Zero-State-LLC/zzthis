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
  paragraphs: [
    "zzThis is based at Hacker Dojo, the hackers' coworking and maker space in the heart of Silicon Valley, minutes from the headquarters of Google, NVIDIA, ServiceNow, and many more. Every day it gives us direct participation in, access to, and mentoring from one of the world's premier communities for tech innovation, creativity, and cutting-edge work. That means peerless knowledge, know-how, information, and resources.",
    "Its several hundred members cover the full range of skills, from software, hardware, and robotics to physical AI, IoT, security, and design. Many have decades of experience, and many work at the leading edge of their fields. Members build their own projects and run their own meetups and frequent hackathons, including an AI security series led by our advisor Arshi Chadha. Security is an area of growing importance to the Army and the defense community.",
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
