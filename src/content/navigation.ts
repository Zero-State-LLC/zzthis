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

export const footerNotice = "Patent pending";

export const footerNote =
  "Panel images are concept renderings that show intended use, not a deployed system, except where marked as real photos. Third-party names, logos, trademarks, and artwork are shown for illustrative or referential purposes and remain the property of their respective owners; their appearance does not imply endorsement or affiliation.";
