export type NavKey = "how" | "applications" | "demo" | "about" | "contact";

export interface NavItem {
  key: NavKey;
  label: string;
  path: string;
}

export const navItems: readonly NavItem[] = [
  { key: "how", label: "How it works", path: "how-it-works" },
  { key: "applications", label: "Applications", path: "applications" },
  // [MICHAEL 2026-10-08] Demo joins the top menu, in the footer's order.
  { key: "demo", label: "Demo", path: "demo" },
  { key: "about", label: "About", path: "about" },
  { key: "contact", label: "Contact", path: "contact" },
];

export const contactEmail = "1@1000x10.com";

// Footer order from the 2026-10-02 wireframes:
// How it works | Applications | Demo | About | Contact | Patent pending.
export interface FooterItem {
  label: string;
  path: string;
}

export const footerItems: readonly FooterItem[] = [
  { label: "How it works", path: "how-it-works" },
  { label: "Applications", path: "applications" },
  { label: "Demo", path: "demo" },
  { label: "About", path: "about" },
  { label: "Contact", path: "contact" },
];

// Q9 [MICHAEL 2026-10-02]: the footer shows the full words.
export const footerNotice = "Patent pending";

// Site-wide note. The home-only prototype sentence about the console is omitted
// because that sentence is false on every other page.
export const footerNote =
  "Panel images are concept renderings that show intended use, not a deployed system, except where marked as real photos. Third-party names, logos, and artwork shown belong to their respective owners and appear for illustration only; no affiliation is implied.";
