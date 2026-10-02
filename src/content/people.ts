export interface Person {
  name: string;
  role: string;
  initials?: string;
  profileUrl?: string;
}

export interface Founder extends Person {
  initials: string;
  bio: string;
  profileUrl: string;
}

export const founder: Founder = {
  name: "Michael Chung",
  initials: "MC",
  role: "Founder and project lead.",
  bio: "25 years in commercial real estate, small-business finance, and business operations, followed by 13 years in Silicon Valley technology startups, including 10 years of blockchain research and activity and three years in AI. He works from Hacker Dojo in Mountain View, California.",
  profileUrl: "https://www.linkedin.com/in/unitynow",
};

export const advisors: readonly Person[] = [
  {
    name: "Patrick Muggler",
    initials: "PM",
    role: "Connected logistics and IoT",
  },
  { name: "Arshi Chadha", initials: "AC", role: "AI security" },
  {
    name: "Ridham Bhagat",
    initials: "RB",
    role: "Robotics and resilient operations",
    profileUrl: "https://www.linkedin.com/in/ridham-bhagat-22a047106/",
  },
  { name: "Daniel Meyer", initials: "DM", role: "Full-stack development" },
  {
    name: "Future space",
    role: "Additional approved advisor or collaborator.",
  },
];

export const peopleHeadings = {
  founder: "Founder",
  advisors: "Advisors",
};
