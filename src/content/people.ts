export interface Person {
  name: string;
  role: string;
  initials?: string;
  bio?: string;
  profileUrl?: string;
  photo?: { src: string; width: number; height: number };
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

// Q43 RESOLVED [MICHAEL 2026-10-02], longer bio used as written.
export const founderOrigin: Origin = {
  heading: "Founder origin",
  text: "I “invent” business models. If you ever used cards for DMV or Gmail tabs, thank me. ; ). In 1992-93, pitched to NYC and initiated a pilot with NYC for possibly the world first electronic payment (by cards) at municipals for motor vehicle fines and fees. In 1995, the NYC DMV began acceptance; and in 1996, the first EZ-Pass for tolls began in NY state. In 2003, my patent application was published for sorting tagged emails to their dedicated tabs (Priority. Address, Bills, etc.), predating Gmail 2013 tabs. Professional experience includes 25 years in real estate and federal GSA RFPs (was awarded two for office spaces, one was a 10-years fixed over $9 million lease-contract), and other small businesses – eateries, supermarkets, merchant credit cards, finance, direct marketing, etc. Recent 13 years in SV in tech startups space, 10+ years in and about the blockchain space, and the recent 3+ years of the AI. A driver of Michael’s business models is purposefully enabling the unity of the deterministic blockchain with the probabilistic AI to solve the current great problematic gaps and the emerging next-phase civilizational opportunities.",
};

// Q24 [OPERATOR 2026-10-02]: the founder card shows Michael's founder origin
// as his bio. The earlier bio came from a funding pitch and was removed.
export const founder: Founder = {
  name: "Michael Chung",
  initials: "MC",
  role: "Founder, system architecting, and project lead.",
  photo: {
    src: "images/people/michael-chung.webp",
    width: 440,
    height: 440,
  },
  bio: founderOrigin.text,
  profileUrl: "https://www.linkedin.com/in/unitynow",
};

// Q6, Q10, Q12, Q16, Q46 [MICHAEL 2026-10-02]: headshots where supplied.
// Daniel Meyer and Adam Fry keep initials. Profile links only where a URL
// was supplied. The 2026-10-02 brief and wireframes drop the Future space
// card. Michael's later 2026-10-02 answers remove Jim White and update
// Ridham and Adam.
export const advisors: readonly Person[] = [
  {
    name: "Patrick Muggler",
    initials: "PM",
    photo: {
      src: "images/people/patrick-muggler.webp",
      width: 300,
      height: 300,
    },
    role: "Connected logistics and IoT",
    profileUrl: "https://www.linkedin.com/in/pmuggler",
    bio: "Patrick leads product and strategic programs at Trackonomy. His work has connected more than 200,000 assets across over 100 airports and 40 countries. He advises zzThis on logistics workflows, connected assets, and commercialization.",
  },
  {
    name: "Arshi Chadha",
    initials: "AC",
    photo: {
      src: "images/people/arshi-chadha.webp",
      width: 440,
      height: 440,
    },
    role: "AI security",
    profileUrl: "https://www.linkedin.com/in/arshichadha/",
    bio: "Arshi is a security engineer at Zscaler and a co-lead of the OWASP Top 10 for LLM Applications work. She earned a master’s degree in information security at Carnegie Mellon and advises zzThis on AI and application security.",
  },
  {
    name: "Ridham Bhagat",
    initials: "RB",
    photo: {
      src: "images/people/ridham-bhagat.webp",
      width: 440,
      height: 440,
    },
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
