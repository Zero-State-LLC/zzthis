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
  bio: "Founder and project lead of zzThis.",
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
