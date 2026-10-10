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

// [MICHAEL 2026-10-08] Small, discreet social icons in every page's footer.
// X belongs to zzThis. Discord and Instagram belong to zzThat, so they sit
// beside a small zzthat wordmark. A link left empty is not shown.
export type SocialIcon = "x" | "discord" | "instagram";

export interface SocialLink {
  label: string;
  href: string;
  icon: SocialIcon;
}

const shown = (links: readonly SocialLink[]): readonly SocialLink[] =>
  links.filter((link) => link.href !== "");

export const zzthisSocial: readonly SocialLink[] = shown([
  { label: "zzThis on X", href: "https://x.com/zzthisapp", icon: "x" },
]);

// Invite link to the zzThat server, given as permanent (never expires, no use
// limit). On 2026-10-08 Discord's invite API reported an expiry of 2026-11-07
// (UTC), so confirm it is set to never expire (docs/SPEC.md D-2026-10-08-03).
export const zzthatDiscordUrl = "https://discord.gg/hwXvVKYzn4";

export const zzthatSocial: readonly SocialLink[] = shown([
  { label: "zzThat on Discord", href: zzthatDiscordUrl, icon: "discord" },
  {
    label: "zzThat on Instagram",
    href: "https://www.instagram.com/zzthatcom/",
    icon: "instagram",
  },
]);

// Q9 [MICHAEL 2026-10-02]: the footer shows the full words.
export const footerNotice = "Patent pending";

// Site-wide note. The home-only prototype sentence about the console is omitted
// because that sentence is false on every other page.
export const footerNote =
  "Panel images are concept renderings that show intended use, not a deployed system, except where marked as real photos. Third-party names, logos, and artwork shown belong to their respective owners and appear for illustration only; no affiliation is implied.";
