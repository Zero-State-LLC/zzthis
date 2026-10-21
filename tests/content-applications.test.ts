import { existsSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import * as applicationsModule from "../src/content/applications";
import * as demoModule from "../src/content/demo";
import * as labelsModule from "../src/content/labels";
import * as navigationModule from "../src/content/navigation";
import * as peopleModule from "../src/content/people";
import * as technologyModule from "../src/content/technology";
import * as walkthroughsModule from "../src/content/walkthroughs";
import * as workflowsModule from "../src/content/workflows";

const { applications, applicationsPage } = applicationsModule;
const { footerItems, footerNotice, zzthisSocial, zzthatSocial } =
  navigationModule;
const { advisors, founder, founderOrigin } = peopleModule;
const { demoTitle } = demoModule;
const { technologyDraft } = technologyModule;
const { conceptLabels } = labelsModule;
const { fieldLogistics } = workflowsModule;

const story = (id: string): string | undefined =>
  applications.find((entry) => entry.id === id)?.story;

// Moved from content.test.ts for the max-lines rule.
describe("applications (spec 3.2 H.7 and 3.4)", () => {
  it("matches the four category stories", () => {
    expect(story("field")).toBe(
      "Field workflow to use handwritten codes on bags, crates, pallets, and mixed goods to connect items to existing identifiers and prepare tasks and inventory work.",
    );
    expect(story("parcel")).toBe(
      "Future postal or parcel workflow, batch work, or project can have optional reference code words to be used for identity before a final parcel code is chosen.",
    );
    // [MICHAEL 2026-10-20] Community and aliases stories removed (page and Home).
    expect(story("community")).toBeUndefined();
    expect(story("aliases")).toBeUndefined();
  });

  it("matches the page intro and the aliases extra sentence", () => {
    // [MICHAEL 2026-10-20] The visible page intro is removed; only a meta
    // description remains.
    expect(applicationsPage).not.toHaveProperty("intro");
    expect(applicationsPage.description).toBe(
      "Ways to use zzThis handwritten codes: field logistics, postal and parcel, everyday and public uses, and digital aliases.",
    );
    expect(applicationsPage.description).not.toMatch(/B\d|v1/);
    // [MICHAEL 2026-10-20] All four status lines and the aliases extra
    // sentence are removed. Field logistics keeps Michael's new extra line.
    expect(applications.find((entry) => entry.id === "field")?.pageExtra).toBe(
      "Future structured profiles and private dictionaries would assign authorized, versioned meanings only after recognition and canonicalization.",
    );
    expect(
      applications.find((entry) => entry.id === "aliases")?.pageExtra,
    ).toBeUndefined();
    expect(applications.map((entry) => entry.status)).toEqual([
      undefined,
      undefined,
      undefined,
      undefined,
    ]);
    expect(applications.find((entry) => entry.id === "community")?.title).toBe(
      "Everyday, community, and public",
    );
  });

  it("lists the advisors in the 2026-10-13 order, all with initials", () => {
    // [MICHAEL 2026-10-06] Daniel and Adam first. [2026-10-08] Omer removed.
    // [MICHAEL 2026-10-13] Aaron Godbout is the fourth advisor.
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
    // [MICHAEL 2026-10-13] Each brand has its own group, led by its logo.
    // Twitter keeps the bird icon and twitter.com addresses.
    expect(zzthisSocial.map((link) => [link.icon, link.href])).toEqual([
      ["twitter", "https://twitter.com/zzthiscom"],
      ["linkedin", "https://www.linkedin.com/company/zzthis"],
      ["youtube", "https://www.youtube.com/@zzthiscom"],
      ["telegram", "https://t.me/zzthisapp"],
    ]);
    expect(zzthatSocial.map((link) => [link.icon, link.href])).toEqual([
      ["twitter", "https://twitter.com/zzthatcom"],
      ["instagram", "https://www.instagram.com/zzthatcom/"],
      ["tiktok", "https://www.tiktok.com/@zzthatcom"],
      ["youtube", "https://www.youtube.com/@zzthat"],
      ["discord", "https://discord.gg/hwXvVKYzn4"],
      ["telegram", "https://t.me/zzthat"],
    ]);
    for (const link of zzthisSocial) {
      expect(link.label.startsWith("zzThis on ")).toBe(true);
    }
    for (const link of zzthatSocial) {
      expect(link.label.startsWith("zzThat on ")).toBe(true);
    }
    for (const link of [...zzthisSocial, ...zzthatSocial]) {
      expect(link.href.startsWith("https://")).toBe(true);
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
    // [MICHAEL 2026-10-20] One paragraph, four middle-dot section breaks.
    expect(founder.bio.split(" · ")).toHaveLength(5);
    expect(founder.bio).toContain(
      "8% to 9% of US GDP (Direct Marketing Association)",
    );
    expect(founder.bio).not.toContain("\n");
    expect(founder.photo?.src).toBe("images/people/michael-chung.webp");
    expect(byName("Patrick Muggler")?.photo?.src).toBe(
      "images/people/patrick-muggler.webp",
    );
    expect(byName("Arshi Chadha")?.photo?.src).toBe(
      "images/people/arshi-chadha.webp",
    );
    expect(byName("Daniel Meyer")?.photo).toBeUndefined();
    // [MICHAEL 2026-10-06 change list] Adam now has a headshot.
    expect(byName("Adam Fry")?.photo?.src).toBe("images/people/adam-fry.webp");
    expect(footerNotice).toBe("Patent pending");
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

describe("applications walkthroughs [MICHAEL 2026-10-11]", () => {
  const { walkthroughs } = walkthroughsModule;

  it("has the pallet and household walkthroughs, five images each", () => {
    expect(walkthroughs.map((walk) => walk.title)).toEqual([
      "Smart force-multiplier automation",
      "Smart packing and handling",
    ]);
    for (const walk of walkthroughs) {
      expect(walk.frames).toHaveLength(5);
    }
  });

  it("ships every walkthrough image and thumbnail under public, each at most 2 MB", () => {
    for (const frame of walkthroughs.flatMap((walk) => walk.frames)) {
      for (const src of [frame.src, frame.thumb]) {
        const path = join("public", src);
        expect(existsSync(path), path).toBe(true);
        expect(statSync(path).size).toBeLessThanOrEqual(2 * 1024 * 1024);
      }
    }
  });
});
