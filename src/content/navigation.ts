export type NavKey = "how" | "applications" | "about" | "contact";

export interface NavItem {
  key: NavKey;
  label: string;
  path: string;
}

export const navItems: readonly NavItem[] = [
  { key: "how", label: "How it works", path: "how-it-works" },
  { key: "applications", label: "Applications", path: "applications" },
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
