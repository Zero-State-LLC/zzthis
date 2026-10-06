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

export const founderOrigin: Origin = {
  heading: "Founder origin",
  text: "I “invent” business models. If you've ever paid at the DMV with a card or used Gmail's inbox tabs, thank me. ;) In 1992–93, I pitched New York City and initiated a pilot for possibly the world's first electronic card payments by the municipal agencies for motor-vehicle fines and fees. In 1995, the NYC DMV began accepting cards, and in 1996, the first E-ZPass tolling began in New York State. In 2002, my patent application was published for sorting tagged emails into their dedicated tabs (Priority, Ads, Bills, etc.) and was cited by 158 patent applications, majority by leading tech and Fortune companies. Gmail did their tabs in 2013. My business experience includes 25 years in real estate, including federal GSA RFPs (I was awarded two office space lease-contracts, one an over $9 million 10-year fixed), and other small businesses: eateries, supermarkets, merchant credit cards, finance, and direct marketing. For the past 13 years I've been in Silicon Valley's tech startup space, with 10+ years in and around blockchain and the last 3+ years in AI. A driver of my business models is the discovery and the purposeful enabling unity of the deterministic blockchain with the probabilistic AI to target today's great problematic gaps and solve to the emerging next-phase civilizational opportunities.",
};

export const founder: Founder = {
  name: "Michael Chung",
  initials: "MC",
  role: "Founder, business-model architect, and project lead",
  photo: { src: "images/people/michael-chung.webp", width: 440, height: 440 },
  bio: founderOrigin.text,
  profileUrl: "https://www.linkedin.com/in/unitynow",
};

// 2026-10-06 website reconciliation: Michael's advisor roster/order is adopted
// where source data is complete. Adam's requested replacement headshot/bio remain
// deferred until the exact approved asset/copy is available; do not invent them.
export const advisors: readonly Person[] = [
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
    photo: { src: "images/people/arshi-chadha.webp", width: 440, height: 440 },
    role: "AI security",
    profileUrl: "https://www.linkedin.com/in/arshichadha/",
    bio: "Arshi is a security engineer at Zscaler and a co-lead of the OWASP Top 10 for LLM Applications work. She earned a master’s degree in information security at Carnegie Mellon and advises zzThis on AI and application security.",
  },
];

export const peopleHeadings = {
  founder: "Founder",
  advisors: "Advisors",
};
