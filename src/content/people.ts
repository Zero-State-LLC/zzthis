export interface Person {
  name: string;
  role: string;
  initials?: string;
  bio?: string;
  profileUrl?: string;
}

export interface Founder extends Person {
  initials: string;
  bio: string;
  profileUrl: string;
}

export interface Origin {
  heading: string;
  text: string;
}

export const founder: Founder = {
  name: "Michael Chung",
  initials: "MC",
  role: "Founder and project lead.",
  bio: "25 years in commercial real estate, small-business finance, and business operations, followed by 13 years in Silicon Valley technology startups, including 10 years of blockchain research and activity and three years in AI. He works from Hacker Dojo in Mountain View, California.",
  profileUrl: "https://www.linkedin.com/in/unitynow",
};

// Q8 [MICHAEL 2026-10-02]: short founder origin for About. A longer founder
// history can follow later.
export const founderOrigin: Origin = {
  heading: "Founder origin",
  text: "Michael Chung says he ‘invents business models.’ His earlier ideas explored email organization and electronic payments for civic services. zzThis follows the same impulse: a useful digital connection should be possible wherever a person can write. A handwritten zz code can give a parcel, crate, tool, or public sign a persistent reference, then connect it to a record and the work around it. Michael is developing the idea across logistics, community use, and AI-assisted workflows.",
};

// Q6, Q10, Q12, Q16 [MICHAEL 2026-10-02]: initials cards until approved
// headshots arrive; profile links only where a URL was supplied. The
// 2026-10-02 brief and wireframes list Jim White again and drop the Future
// space card.
export const advisors: readonly Person[] = [
  {
    name: "Jim White",
    initials: "JW",
    role: "Local AI and language",
    profileUrl: "https://www.linkedin.com/in/jamespaulwhite/",
  },
  {
    name: "Patrick Muggler",
    initials: "PM",
    role: "Connected logistics and IoT",
    profileUrl: "https://www.linkedin.com/in/pmuggler",
    bio: "Patrick leads product and strategic programs at Trackonomy. His work has connected more than 200,000 assets across over 100 airports and 40 countries. He advises zzThis on logistics workflows, connected assets, and commercialization.",
  },
  {
    name: "Arshi Chadha",
    initials: "AC",
    role: "AI security",
    profileUrl: "https://www.linkedin.com/in/arshichadha/",
    bio: "Arshi is a security engineer at Zscaler and a co-lead of the OWASP Top 10 for LLM Applications work. She earned a master’s degree in information security at Carnegie Mellon and advises zzThis on AI and application security.",
  },
  {
    name: "Ridham Bhagat",
    initials: "RB",
    role: "Robotics and smart-contract security",
    bio: "At Addverb, Ridham built deployment and incident-response tools for a fleet of more than 150 robots. His smart-wallet work at Postquant Labs has involved cryptographic components and internal security audits. He advises on resilient operations and cryptographic workflows.",
    profileUrl: "https://www.linkedin.com/in/ridham-bhagat-22a047106/",
  },
  {
    name: "Daniel Meyer",
    initials: "DM",
    role: "Full-stack development",
    bio: "Daniel works across front-end and back-end software and supports zzThis application development and integration.",
  },
  { name: "Adam Fry", initials: "AF", role: "Advisor" },
];

export const peopleHeadings = {
  founder: "Founder",
  advisors: "Advisors",
};
