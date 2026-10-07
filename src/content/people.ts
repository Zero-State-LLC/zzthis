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
export const founderOrigin: Origin = {
  heading: "Founder origin",
  text: "I “invent” business models. If you've ever paid at the DMV with a card or used Gmail's inbox tabs, thank me. ;) In 1992–93, I pitched New York City and initiated a pilot for possibly the world's first electronic card payments by the municipal agencies for motor-vehicle fines and fees. In 1995, the NYC DMV began accepting cards, and in 1996, the first E-ZPass tolling began in New York State. In 2003, my patent application was published for sorting tagged emails into their dedicated tabs (Priority, Ads, Bills, etc.); the application was cited by 158 patent applications, majority by leading tech and Fortune companies. I filed the patent application in 2001, when I was barely tech- and email-literate. Gmail first did their tabs in 2013. My business experience includes 25 years in real estate, including federal GSA RFPs (I was awarded two office space lease-contracts, one for a fixed 10-year, nearly $10 million), and other small businesses: eateries, supermarkets, merchant credit cards, finance, and direct marketing. I am in the Silicon Valley's tech startup space “24/7”: since 2013 in and around blockchain, and since 2023 in AI, averaging some 10 to 20 prompts a day across 2 to 5 AIs. A driver of my business models is the discovery and purposeful enabling of the unity of deterministic blockchain with probabilistic AI to target today's great problematic gaps and to solve for the emerging next-phase civilizational opportunities.",
};

// Q24 [OPERATOR 2026-10-02]: the founder card shows Michael's founder origin
// as his bio. The earlier bio came from a funding pitch and was removed.
export const founder: Founder = {
  name: "Michael Chung",
  initials: "MC",
  role: "Founder, business-model architect, and project lead",
  photo: {
    src: "images/people/michael-chung.webp",
    width: 440,
    height: 440,
  },
  bio: founderOrigin.text,
  profileUrl: "https://www.linkedin.com/in/unitynow",
};

// Q6, Q10, Q12, Q16, Q46 [MICHAEL 2026-10-02]: headshots where supplied.
// Daniel Meyer keeps initials. [MICHAEL 2026-10-06 change list] Daniel and
// Adam move to the first two places; Adam's photo and bio are updated.
// Ridham Bhagat is removed from the site.
// [MICHAEL 2026-10-07] Omer F. Yalcin added as an advisor, with photo.
// Earlier: Profile links only where a URL
// was supplied. The 2026-10-02 brief and wireframes drop the Future space
// card. Michael's later 2026-10-02 answers remove Jim White and update
// Ridham and Adam.
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
    name: "Omer F. Yalcin",
    initials: "OY",
    photo: {
      src: "images/people/omer-yalcin.webp",
      width: 400,
      height: 400,
    },
    role: "Data scientist and computational social scientist",
    profileUrl: "https://www.linkedin.com/in/ofyalcin/",
    bio: "Omer is a data scientist and computational social scientist with a Ph.D. in Political Science and Social Data Analytics and more than 8 years of experience in Python, R, and SQL, spanning machine learning, NLP, causal inference, and network analysis. He teaches graduate courses in data science, machine learning, and statistics at UMass Amherst, and his research has appeared in ICWSM, EMNLP Findings, and the Journal of Quantitative Description. He advises zzThis on data analysis, model evaluation, and test design.",
  },
];

export const peopleHeadings = {
  founder: "Founder",
  advisors: "Advisors",
};
