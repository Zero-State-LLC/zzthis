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

// Q8 [MICHAEL 2026-10-02]: short founder origin for About. A longer founder
// history can follow later.
export const founderOrigin: Origin = {
  heading: "Founder origin",
  text: "Michael Chung says he ‘invents business models.’ His earlier ideas explored email organization and electronic payments for civic services. zzThis follows the same impulse: a useful digital connection should be possible wherever a person can write. A handwritten zz code can give a parcel, crate, tool, or public sign a persistent reference, then connect it to a record and the work around it. Michael is developing the idea across logistics, community use, and AI-assisted workflows.",
};

// Q24 [OPERATOR 2026-10-02]: the founder card shows Michael's founder origin
// as his bio. The earlier bio came from a funding pitch and was removed.
export const founder: Founder = {
  name: "Michael Chung",
  initials: "MC",
  role: "Founder and project lead.",
  bio: founderOrigin.text,
  profileUrl: "https://www.linkedin.com/in/unitynow",
};

// Q6, Q10, Q12, Q16 [MICHAEL 2026-10-02]: initials cards until approved
// headshots arrive; profile links only where a URL was supplied. The
// 2026-10-02 brief and wireframes drop the Future space card. Michael's
// later 2026-10-02 answers remove Jim White and update Ridham and Adam.
export const advisors: readonly Person[] = [
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
    role: "Cybersecurity, cryptography and research methods",
    bio: "Ridham Bhagat will contribute cybersecurity, cryptography, and research methods. He holds degrees in computer science and cybersecurity, develops post-quantum smart wallets, and performs security audits at Postquant Labs. His Northeastern University research included Internet topology and resilient networking.",
    profileUrl: "https://www.linkedin.com/in/ridham-bhagat-22a047106/",
  },
  {
    name: "Daniel Meyer",
    initials: "DM",
    role: "Full-stack development",
    bio: "Daniel works across front-end and back-end software and supports zzThis application development and integration.",
  },
  {
    name: "Adam Fry",
    initials: "AF",
    role: "AI agents, infrastructure and deployment",
    bio: "Adam Fry will contribute AI-agent, infrastructure, and deployment expertise based on more than 20 years supporting mission-critical hospital, government, and enterprise systems and developing local AI-agent systems focused on data ownership, auditability, verification, and reliability.",
  },
];

export const peopleHeadings = {
  founder: "Founder",
  advisors: "Advisors",
};
