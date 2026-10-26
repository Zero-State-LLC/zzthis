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
// [MICHAEL 2026-10-20] Bio replaced as given: one paragraph, sections
// separated by " · " (middle dot).
export const founderOrigin: Origin = {
  heading: "Founder origin",
  // [MICHAEL 2026-10-22] Middle of the 2001 section reordered, exact wording.
  text: "I “invent” business models. If you’ve ever paid at the DMV with a card or used Gmail’s inbox tabs, thank me. ;) · In 1992–93, I pitched New York City and initiated a pilot for possibly the world’s first electronic card payment authorizations by municipal agencies for motor-vehicle fines and fees. One barrier was that the card networks’ rules prohibited charging card payers fees different from those for cash or check payments. In 1995, the NYC DMV began accepting cards, and in 1996, the first E-ZPass tolling began in New York State. · In 2001, I had read about the first major wave of email spam and recognized that email had become a critical asynchronous communication channel and learned that targeted direct marketing drove a significant share of the economy: 8% to 9% of US GDP (Direct Marketing Association). I filed a patent application while I was barely familiar with technology or email; I could hardly tell POP from SMTP. My proposed solution was to tag emails and sort them into dedicated tabs (Priority, Ads, Bills, etc.). The application, “Methods and systems for electronic mail, internet target and direct marketing, and electronic mail banner,” was published in 2003 and has been cited by 158 patent applications, the majority from leading tech and Fortune companies. Gmail introduced its tabs in 2013. · My business experience includes 25 years in real estate, including federal GSA RFPs. I was awarded two office-space lease contracts, one of them a fixed 10-year lease worth over $9 million (2006). I have also worked in a variety of small businesses: eateries, supermarkets, merchant credit cards, finance, and direct marketing. · I’ve been in Silicon Valley’s tech startup space “24/7”: in and around blockchain since 2013, and in AI since 2023, averaging 10 to 30+ prompts a day across 2 to 5 AIs. A driver of my business models is discovering and purposefully enabling the unity of deterministic blockchain with probabilistic AI, to target today’s great problematic gaps and to solve for the emerging next-phase civilizational opportunities.",
};

// [MICHAEL 2026-10-15] Title: "business models" (plural).
export const founder: Founder = {
  name: "Michael Chung",
  initials: "MC",
  // [MICHAEL 2026-10-26] Title and bio replaced as given (third person,
  // shortened); founderOrigin above is kept for a later founder-story page.
  role: "Founder; new products and business models architect; project lead",
  photo: {
    src: "images/people/michael-chung.webp",
    width: 440,
    height: 440,
  },
  bio: "Michael invents business models. In 1992–93 he pitched New York City and initiated a pilot for possibly the world’s first electronic card payment authorizations by municipal or state agencies for motor-vehicle fines and fees; the NYC DMV began accepting cards in 1995, and E-ZPass tolling began in New York State in 1996. In 2001 he filed a patent application describing tagging emails and sorting them into dedicated tabs (Priority, Ads, and Bills), 12 years before Gmail introduced its tabs; it has been cited by 158 patent applications, the majority from leading tech and Fortune companies. His 25 years in real estate include two federal GSA lease awards, one a fixed 10-year lease worth over $9 million. He has worked in blockchain since 2013 and AI since 2023.",
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
    // [MICHAEL 2026-10-26] Zero State sentence added (duplicated on Aaron's
    // card for now; to be cleaned up later).
    bio: "Daniel works across front-end and back-end software and supports zzThis application development and integration. He and Aaron founded Zero State LLC, an AI studio building custom agent skills and AI-native apps and installing on-premise AI on NVIDIA, AMD, and Apple Silicon for compliance-focused businesses.",
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
    // [MICHAEL 2026-10-26] Bio tightened as given.
    bio: "Adam has more than 20 years supporting mission-critical hospital, government, and enterprise systems, and develops local AI-agent systems focused on data ownership, auditability, verification, and reliability.",
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
    // [MICHAEL 2026-10-26] Bio trimmed; Zero State sentence as given.
    bio: "Aaron is a founder-operator and AI transformation leader with more than 20 years building and exiting companies in real estate and regulated markets. He co-founded Zero State LLC, an AI studio building custom agent skills and AI-native apps and installing on-premise AI on NVIDIA, AMD, and Apple Silicon for compliance-focused businesses.",
  },
  {
    name: "Arshi Chadha",
    initials: "AC",
    photo: { src: "images/people/arshi-chadha.webp", width: 440, height: 440 },
    role: "AI security",
    profileUrl: "https://www.linkedin.com/in/arshichadha/",
    // [MICHAEL 2026-10-26] OWASP note folded into the bio.
    bio: "Arshi is a security engineer at Zscaler and a co-lead of the OWASP Top 10 for LLM Applications, part of the global OWASP GenAI Security Project on risks in generative and agentic AI. She holds a master’s in information security from Carnegie Mellon.",
  },
];

export const peopleHeadings = {
  founder: "Founder",
  // [MICHAEL 2026-10-22] Plural on purpose.
  advisors: "Team co-founders, advisors",
};
