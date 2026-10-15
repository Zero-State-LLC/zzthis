import { existsSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import * as applicationsModule from "../src/content/applications";
import * as demoModule from "../src/content/demo";
import * as imagesModule from "../src/content/images";
import * as labelsModule from "../src/content/labels";
import * as navigationModule from "../src/content/navigation";
import * as peopleModule from "../src/content/people";
import * as technologyModule from "../src/content/technology";
import * as workflowsModule from "../src/content/workflows";

const { applications } = applicationsModule;
const { images } = imagesModule;
const {
  navItems,
  footerItems,
  footerNotice,
  footerNote,
  zzthisSocial,
  zzthatSocial,
} = navigationModule;
const { advisors, founder, founderOrigin } = peopleModule;
const { demoTitle } = demoModule;
const { technologyDraft } = technologyModule;
const { conceptLabels } = labelsModule;
const { fieldLogistics } = workflowsModule;

describe("navigation and people", () => {
  it("lists nav items in spec order", () => {
    // [MICHAEL 2026-10-08] Demo added between Applications and About.
    expect(navItems.map((item) => item.label)).toEqual([
      "How it works",
      "Applications",
      "Demo",
      "About",
      "Contact",
    ]);
  });

  it("lists the advisors in the current published order, all with initials and retained approved assets", () => {
    // [MICHAEL 2026-10-06 change list] Daniel and Adam move to first.
    // [MICHAEL 2026-10-08] Omer F. Yalcin is removed until his employer
    // gives permission. Aaron Godbout joined on 2026-10-13.
    expect(advisors.map((person) => person.name)).toEqual([
      "Daniel Meyer",
      "Adam Fry",
      "Patrick Muggler",
      "Aaron Godbout",
      "Arshi Chadha",
    ]);
    expect(advisors.every((person) => person.initials !== undefined)).toBe(
      true,
    );
  });

  it("omits drafted advisory closing lines from every advisor bio", () => {
    expect(
      advisors.some((person) => /advises zzThis on/i.test(person.bio ?? "")),
    ).toBe(false);
    // Omer's Q72-approved bio returns without a closing line if he is restored.
    expect(advisors.some((person) => person.name === "Omer F. Yalcin")).toBe(
      false,
    );
  });

  it("lists the footer social links with their owners", () => {
    expect(zzthisSocial).toEqual([
      {
        label: "zzThis on Twitter",
        href: "https://twitter.com/zzthiscom",
        icon: "twitter",
      },
      {
        label: "zzThis on LinkedIn",
        href: "https://www.linkedin.com/company/zzthis",
        icon: "linkedin",
      },
      {
        label: "zzThis on YouTube",
        href: "https://www.youtube.com/@zzthiscom",
        icon: "youtube",
      },
      {
        label: "zzThis on Telegram",
        href: "https://t.me/zzthisapp",
        icon: "telegram",
      },
    ]);
    expect(zzthatSocial).toEqual([
      {
        label: "zzThat on Twitter",
        href: "https://twitter.com/zzthatcom",
        icon: "twitter",
      },
      {
        label: "zzThat on Instagram",
        href: "https://www.instagram.com/zzthatcom/",
        icon: "instagram",
      },
      {
        label: "zzThat on TikTok",
        href: "https://www.tiktok.com/@zzthatcom",
        icon: "tiktok",
      },
      {
        label: "zzThat on YouTube",
        href: "https://www.youtube.com/@zzthat",
        icon: "youtube",
      },
      {
        label: "zzThat on Discord",
        href: "https://discord.gg/hwXvVKYzn4",
        icon: "discord",
      },
      {
        label: "zzThat on Telegram",
        href: "https://t.me/zzthat",
        icon: "telegram",
      },
    ]);
    for (const link of [...zzthisSocial, ...zzthatSocial]) {
      expect(link.href.startsWith("https://")).toBe(true);
      expect(link.label).not.toBe("");
    }
  });

  it("applies Michael's 2026-10-02 answers", () => {
    const byName = (name: string) =>
      advisors.find((person) => person.name === name);
    expect(advisors.some((person) => person.name === "Jim White")).toBe(false);
    // [MICHAEL 2026-10-06 change list] Ridham Bhagat is removed from the site.
    expect(advisors.some((person) => person.name === "Ridham Bhagat")).toBe(
      false,
    );
    expect(byName("Adam Fry")?.role).toBe(
      "AI agents, infrastructure and deployment",
    );
    // [MICHAEL 2026-10-06 change list] Adam's bio now reads "has".
    expect(byName("Adam Fry")?.bio).toMatch(/^Adam Fry has AI-agent/);
    expect(byName("Adam Fry")?.profileUrl).toBeUndefined();
    for (const name of [
      "Patrick Muggler",
      "Aaron Godbout",
      "Arshi Chadha",
      "Daniel Meyer",
      "Adam Fry",
    ]) {
      expect(byName(name)?.bio).toBeTruthy();
    }
    expect(founder.role).toBe(
      "Founder, new products and business models architect, project lead",
    );
    expect(founder.bio.startsWith("I “invent” business models.")).toBe(true);
    expect(founderOrigin.text).toBe(founder.bio);
    expect(founder.photo?.src).toBe("images/people/michael-chung.webp");
    expect(byName("Patrick Muggler")?.photo?.src).toBe(
      "images/people/patrick-muggler.webp",
    );
    expect(byName("Arshi Chadha")?.photo?.src).toBe(
      "images/people/arshi-chadha.webp",
    );
    expect(byName("Ridham Bhagat")?.photo).toBeUndefined();
    expect(byName("Daniel Meyer")?.photo).toBeUndefined();
    // [MICHAEL 2026-10-06 change list] Adam now has a headshot.
    expect(byName("Adam Fry")?.photo?.src).toBe("images/people/adam-fry.webp");
    expect(footerNotice).toBe("Patent pending");
    expect(footerNote).toContain(
      "Third-party names, logos, trademarks, and artwork are shown for illustrative or referential purposes",
    );
    expect(footerNote).toContain(
      "their appearance does not imply endorsement or affiliation.",
    );
    expect(footerItems.map((item) => item.label)).toEqual([
      "How it works",
      "Applications",
      "Demo",
      "About",
      "Contact",
    ]);
    expect(demoTitle).toBe("See zzThis in action.");
    expect(conceptLabels.standalone).toBe("Concept illustration");
    expect(technologyDraft.status).toBe("unpublished");
    // [MICHAEL 2026-10-06 change list] The batched pallet moves to second.
    expect(fieldLogistics.images).toEqual(["a", "c", "alt-b"]);
  });
});

describe("application galleries", () => {
  const ids = (id: string) =>
    applications
      .find((entry) => entry.id === id)
      ?.pageGalleries?.map((gallery) =>
        gallery.items.map((item) => item.image),
      );

  it("keeps parcel, community, and aliases galleries in order", () => {
    expect(ids("parcel")).toEqual([
      ["app-super-identifier", "app-postage-letters"],
      ["app-delivery-1", "app-delivery-2", "app-delivery-3", "app-delivery-4"],
    ]);
    expect(ids("community")).toEqual([
      ["app-for-sale", "app-help-wanted", "app-event-cancelled"],
      ["app-connect", "app-shop-pay", "app-donate"],
      ["app-trail-marker"],
      ["app-share", "app-community", "app-handwritten-works"],
      ["app-tape-before", "app-tape-after"],
      ["app-truck-before", "app-truck-after"],
    ]);
    expect(ids("aliases")).toEqual([["app-wallet-ens"]]);
  });

  it("ships every app image under public and at most 2 MB", () => {
    const appImages = Object.values(images).filter((image) =>
      image.id.startsWith("app-"),
    );
    expect(appImages.length).toBeGreaterThan(0);
    for (const image of appImages) {
      const path = join("public", image.src);
      expect(existsSync(path), path).toBe(true);
      expect(statSync(path).size).toBeLessThanOrEqual(2 * 1024 * 1024);
    }
  });
});
