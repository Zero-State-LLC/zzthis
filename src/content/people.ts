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

// [MICHAEL 2026-10-03 v1.0 change list] The founder title and bio supersede the Q43 lines.
// [MICHAEL 2026-10-06 change list] The last two sentences of the bio replaced as given.
// [MICHAEL 2026-10-07 change list] Bio replaced as given.
// [MICHAEL 2026-10-13] Founder title updated as given.
// [MICHAEL 2026-10-15] Patent title added; the 2001 filing sentence expanded.
export const founderOrigin: Origin = {
  heading: "Founder origin",
  text: "I “invent” business models. If you've ever paid at the DMV with a card or used Gmail's inbox tabs, thank me. ;) In 1992–93, I pitched New York City and initiated a pilot for possibly the world's first electronic card payments by the municipal agencies for motor-vehicle fines and fees. In 1995, the NYC DMV began accepting cards, and in 1996, the first E-ZPass tolling began in New York State. In 2003, my patent application (“Methods and systems for electronic mail, internet target and direct marketing, and electronic mail banner”) was published, describing a method for sorting tagged emails into dedicated tabs (Priority, Ads, Bills, etc.); the application was cited by 158 patent applications, majority by leading tech and Fortune companies. I filed the patent application in 2001, when I was barely familiar with technology or email; I could hardly tell POP from SMTP. I had read about the first major surge in email spam and recognized that email was a critical communication channel. My proposed solution was to tag emails and sort them into dedicated tabs. Gmail first did their tabs in 2013. My business experience includes 25 years in real estate, including federal GSA RFPs (I was awarded two office space lease-contracts, one for a fixed 10-year, nearly $10 million), and other small businesses: eateries, supermarkets, merchant credit cards, finance, and direct marketing. I am in the Silicon Valley's tech startup space “24/7”: since 2013 in and around blockchain, and since 2023 in AI, averaging some 10 to 20 prompts a day across 2 to 5 AIs. A driver of my business models is the discovery and purposeful enabling of the unity of deterministic blockchain with probabilistic AI to target today's great problematic gaps and to solve for the emerging next-phase civilizational opportunities.",
};

// [MICHAEL 2026-10-15] Title: "business models" (plural).
export const founder: Founder = {
  name: "Michael Chung",
  initials: "MC",
  role: "Founder, new products and business models architect, project lead",
  photo: {
    src: "images/people/michael-chung.webp",
    width: 440,
    height: 440,
  },
  bio: founderOrigin.text,
  profileUrl: "https://www.linkedin.com/in/unitynow",
};

// 2026-10-06 website reconciliation: Michael's advisor roster/order is adopted
// while the approved Adam headshot and bio now present on main are retained.
// Q6, Q10, Q12, Q16, Q46 [MICHAEL 2026-10-02]: headshots where supplied.
// Daniel Meyer keeps initials. [MICHAEL 2026-10-06 change list] Daniel and
// Adam move to the first two places; Adam's photo and bio are updated.
// Ridham Bhagat is removed from the site.
// [MICHAEL 2026-10-07] Omer F. Yalcin added as an advisor, with photo.
// [MICHAEL 2026-10-08] Omer is removed until his employer gives
// permission; restore his entry and photo from #118 when it arrives,
// using the Q72-approved bio with no closing line (D-2026-10-07-03).
// [MICHAEL 2026-10-13] Aaron Godbout added as the fourth advisor, with
// headshot and the bio Michael chose on 2026-10-09; no profile link.
// Earlier: Profile links only where a URL
// was supplied. The 2026-10-02 brief and wireframes drop the Future space
// card. Michael's later 2026-10-02 answers remove Jim White and update
// Ridham and Adam.
export const advisors: readonly Person[] = [
  {
    name: "Daniel Meyer",
    initials: "DM",
    // [MICHAEL 2026-10-15] Co-founder added to the title.
    role: "Co-founder, Full-stack development",
    bio: "Daniel works across front-end and back-end software and supports zzThis application development and integration.",
  },
  {
    name: "Adam Fry",
    initials: "AF",
    photo: {
      src: "images/people/adam-fry.webp",
      width: 440,
      height: 440,
    },
    role: "AI agents, infrastructure and deployment",
    bio: "Adam Fry has AI-agent, infrastructure, and deployment expertise based on more than 20 years supporting mission-critical hospital, government, and enterprise systems and developing local AI-agent systems focused on data ownership, auditability, verification, and reliability.",
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
    bio: "Patrick leads product and strategic programs at Trackonomy. His work has connected more than 200,000 assets across over 100 airports and 40 countries.",
  },
  {
    name: "Aaron Godbout",
    initials: "AG",
    photo: {
      src: "images/people/aaron-godbout.webp",
      width: 440,
      height: 440,
    },
    role: "AI transformation and custom AI agents",
    bio: "Aaron is a founder-operator and AI transformation leader who turns emerging technology into dependable business systems. Over more than 20 years he has built and exited companies across real estate and regulated markets. He founded Zero State LLC, an AI studio building custom agent skills, the Noema multi-agent world, and AI-native apps such as the iOS game HexWire. He also installs on-premise AI across NVIDIA, AMD, and Apple Silicon for compliance-centric businesses.",
  },
  {
    name: "Arshi Chadha",
    initials: "AC",
    photo: { src: "images/people/arshi-chadha.webp", width: 440, height: 440 },
    role: "AI security",
    profileUrl: "https://www.linkedin.com/in/arshichadha/",
    bio: "Arshi is a security engineer at Zscaler and a co-lead of the OWASP Top 10 for LLM Applications work. She earned a master’s degree in information security at Carnegie Mellon.",
  },
];

export const peopleHeadings = {
  founder: "Founder",
  advisors: "Advisors",
};
