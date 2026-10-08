import { existsSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import * as anatomyModule from "../src/content/anatomy";
import * as applicationsModule from "../src/content/applications";
import * as architectureModule from "../src/content/architecture";
import * as comparisonModule from "../src/content/comparison";
import * as consoleModule from "../src/content/console";
import * as contactModule from "../src/content/contact";
import * as demoModule from "../src/content/demo";
import * as heroModule from "../src/content/hero";
import * as imagesModule from "../src/content/images";
import * as labelsModule from "../src/content/labels";
import * as navigationModule from "../src/content/navigation";
import * as peopleModule from "../src/content/people";
import * as technologyModule from "../src/content/technology";
import * as usesModule from "../src/content/uses";
import * as workflowsModule from "../src/content/workflows";

const { applications, applicationsPage } = applicationsModule;
const { comparisonColumns, comparisonNote, comparisonRows } = comparisonModule;
const { whyMarkers } = anatomyModule;
const { featured, hero } = heroModule;
const { images } = imagesModule;
const { navItems, footerItems, footerNotice, footerNote } = navigationModule;
const { advisors, founder, founderOrigin } = peopleModule;
const { topWays } = usesModule;
const { demoTitle } = demoModule;
const { technologyDraft } = technologyModule;
const { conceptLabels } = labelsModule;
const { coreIdentity, fieldLogistics, howItWorksPage, photoToAction } =
  workflowsModule;

const modules: readonly unknown[] = [
  anatomyModule,
  applicationsModule,
  architectureModule,
  comparisonModule,
  consoleModule,
  contactModule,
  demoModule,
  heroModule,
  imagesModule,
  labelsModule,
  navigationModule,
  peopleModule,
  technologyModule,
  usesModule,
  workflowsModule,
];

function collectStrings(value: unknown): string[] {
  if (typeof value === "string") {
    return [value];
  }
  if (typeof value === "object" && value !== null) {
    return Object.values(value).flatMap(collectStrings);
  }
  return [];
}

const allStrings = modules.flatMap(collectStrings);

const story = (id: string): string | undefined =>
  applications.find((entry) => entry.id === id)?.story;

describe("hero and featured statement (spec 3.2)", () => {
  it("matches the hero copy", () => {
    expect(hero.title).toBe(
      "Barcodes made things scannable. zzThis makes things readable-writable - and smart.",
    );
    expect(hero.subline).toBe(
      "Write a code on a thing; type it to find its record.",
    );
    const { before, code, after } = hero.paragraph;
    expect(before + code + after).toBe(
      "zzThis is a human-readable, human-writable code for the physical world. Write a zz-code on tape, a crate, a parcel, an envelope, or a sign, or embed it in text or program code. The prototype supports typed lookup to a digital record. On-device camera recognition is planned for v1 but is not implemented in this build. Voice recognition is planned for a future release, not v1.",
    );
    expect(code).toBe("zz-code");
    expect(hero.actions.map((action) => action.label)).toEqual([
      "See field logistics",
      "How it works",
    ]);
  });

  it("matches the featured statement", () => {
    expect(featured.heading).toBe(
      "The shortest, smartest distance between a physical thing, its digital record, and the work that comes next.",
    );
    expect(featured.text).toBe(
      "A zz code gives people a way to create the mark themselves, wherever the work happens. Future AI-assisted workflows could help identify what a camera sees, count what remains, suggest how an item should be handled, and prepare the next task; those capabilities are explorations, not shipped v1 behavior. The same visible code connects the item, its history, and the people responsible for it. It bridges physical things and their digital control. AI may serve as an interface and connector, not as the authority that defines or resolves a zz code.",
    );
  });
});

describe("comparison (spec 3.2 H.3)", () => {
  it("matches the row labels", () => {
    expect(comparisonRows.map((row) => row.label)).toEqual([
      "Create the mark",
      "Read the mark",
      "What it connects",
      "Easy to say and remember",
    ]);
  });

  it("matches all sixteen cells", () => {
    expect(
      comparisonColumns.map((column) => ({
        name: column.name,
        accent: column.accent,
        cells: column.cells,
      })),
    ).toEqual([
      {
        name: "Barcode",
        accent: false,
        cells: {
          create: "Print",
          read: "Scanner",
          connects: "Item to data",
          remember: "No",
        },
      },
      {
        name: "QR code",
        accent: false,
        cells: {
          create: "Print or display",
          read: "Camera",
          connects: "Surface to digital content",
          remember: "No",
        },
      },
      {
        name: "Alphanumeric code",
        accent: false,
        cells: {
          create: "Print or handwrite",
          read: "Person, scanner, or typing",
          connects: "Shipment or item to its tracking status",
          remember: "Hard (8 to 22 random characters)",
        },
      },
      {
        name: "zzThis",
        accent: true,
        cells: {
          create: "Write, draw, print, or display: words, numbers, or symbols",
          read: "Person or typing; on-device camera recognition planned for v1",
          connects: "Physical thing to its authorized digital record",
          remember: "Yes (2 to 4 words, or short words and numbers)",
        },
      },
    ]);
  });

  it("matches the comparison note", () => {
    expect(comparisonNote).toBe(
      "Alphanumeric example: an 8-character handwritten postage code (Deutsche Post) or a 14–22-character parcel tracking number. zz-codes can be words, numbers, or simple hand-drawn symbols such as a smiley or tally marks, and can be read even when written inside a sentence.",
    );
  });
});

describe("workflows (spec 3.2 H.4 to H.6)", () => {
  it("explains the terminal zz marks as camera index marks", () => {
    expect(whyMarkers.text).toContain("planned on-device camera reader");
    expect(whyMarkers.text).toContain("bound the region to inspect");
    expect(whyMarkers.text).not.toContain("in any handwriting");
  });

  it("separates available typed lookup from planned recognition paths", () => {
    expect(howItWorksPage.intro).toContain("not v1 behavior");
    expect(howItWorksPage.readWays.heading).toBe("Manual and planned camera reading");
    expect(howItWorksPage.readWays.methods).toEqual([
      "Manual entry (available)",
      "Camera recognition (planned)",
    ]);
    expect(howItWorksPage.readWays.line).toContain(
      "On-device camera recognition is planned for v1 but is not implemented yet.",
    );
    expect(howItWorksPage.readWays.line).toContain(
      "Voice recognition is planned for a future release; it is not part of v1.",
    );
  });

  it("matches the core workflow", () => {
    expect(coreIdentity.intro).toBe(
      "Core identity: MARK a lowercase zz code → READ it by manual entry today; on-device camera recognition is planned for v1 → LINK it to a record → REPORT it in a voice handoff to another person if useful.",
    );
    expect(
      coreIdentity.steps.map((step) => `${step.title}: ${step.text}`),
    ).toEqual([
      "Mark: Write the code on tape, a crate, or a pallet.",
      "Read: Manual entry uses the same code grammar and is the available read path in this build. On-device camera recognition is planned for v1 but is not implemented yet.",
      "Link: Connect to an existing record and photo.",
      "Report: Say the code words to another person if a voice handoff is useful; software voice recognition is not part of v1.",
    ]);
    expect(coreIdentity.closing).toBe(
      "For a field code made with no device, link and reconcile later.",
    );
  });

  it("matches field logistics", () => {
    expect(fieldLogistics.intro).toBe(
      "Hand-mark mixed items at the point of work; link the mark to a record.",
    );
  });

  it("matches photo to action", () => {
    expect(photoToAction.intro).toBe(
      "Future exploration (B7, queued): a second layer after the handwritten code could identify an item and suggest its next task.",
    );
    expect(photoToAction.workflow).toBe(
      "Future concept, not v1: PHOTOGRAPH one or more items → CONFIRM the proposed identification → choose a handling or inventory action by touch → REVIEW the prepared record or form.",
    );
    expect(
      photoToAction.sequence.map((step) => `${step.numeral} ${step.title}`),
    ).toEqual(["01 Photograph", "02 Guide", "03 Review"]);
  });
});

describe("applications (spec 3.2 H.7 and 3.4)", () => {
  it("matches the four category stories", () => {
    expect(story("field")).toBe(
      "A future field workflow could use handwritten codes on bags, crates, pallets, and mixed goods to help connect items to existing identifiers and prepare inventory work.",
    );
    expect(story("parcel")).toBe(
      "A future postal/parcel workflow could use a written reference and help prepare items before a parcel code is chosen.",
    );
    expect(story("community")).toBe(
      "A future community use could place a handwritten code on a lost-pet flyer or other public surface and link it to a useful page.",
    );
    expect(story("aliases")).toBe(
      "A future integration could map a short human-readable code to a longer machine address used by software agents.",
    );
  });

  it("matches the page intro and the aliases extra sentence", () => {
    expect(applicationsPage.intro).toBe(
      "These are product directions, not a list of shipped v1 integrations: field/enterprise (B7), postal/parcel (B8), community/free uses (B9), AI-assisted inventory (B7), and agent/ledger/blockchain integrations (B16). AI may be an interface or connector, not the authority that defines or resolves a zz code.",
    );
    expect(applicationsPage.intro).not.toContain("AI is the new UI");
    expect(
      applications.find((entry) => entry.id === "aliases")?.pageExtra,
    ).toBe(
      "These optional integrations are not v1 resolver capabilities or dependencies.",
    );
    expect(applications.map((entry) => entry.status)).toEqual([
      "Exploration: field/enterprise workflows are queued in B7 for v1.x, not shipped v1 capabilities.",
      "Exploration: postal/parcel integration is queued in B8 for v1.x; no carrier service is claimed.",
      "Exploration: free/community use cases are queued in B9 for v1.x.",
      "Exploration: agent/ledger/blockchain integrations are shadowed in B16 for v2+.",
    ]);
  });
});

describe("navigation and people", () => {
  it("lists nav items in spec order", () => {
    expect(navItems.map((item) => item.label)).toEqual([
      "How it works",
      "Applications",
      "About",
      "Contact",
    ]);
  });

  it("lists the reconciled advisor roster with retained approved assets", () => {
    // [MICHAEL 2026-10-06 change list] Daniel and Adam move to first.
    expect(advisors.map((person) => person.name)).toEqual([
      "Daniel Meyer",
      "Adam Fry",
      "Patrick Muggler",
      "Arshi Chadha",
    ]);
    expect(advisors.every((person) => person.initials !== undefined)).toBe(
      true,
    );
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
      "Founder, business-model architect, and project lead",
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

describe("top ways (Home section 01)", () => {
  it("lists six items with numerals, titles, codes, and text", () => {
    expect(topWays.heading).toBe("Potential use cases and explorations");
    expect(topWays.items.map((item) => item.numeral)).toEqual([
      "01",
      "02",
      "03",
      "04",
      "05",
      "06",
    ]);
    expect(topWays.items.map((item) => item.title)).toEqual([
      "Logistics",
      "Postal",
      "Everyday use: zzThat",
      "AI agents",
      "Blockchain addresses",
      "Macros",
    ]);
    expect(topWays.items.map((item) => item.codes)).toEqual([
      ["zz-copper-lantern-sky-zz", "zz-fastfreight-c4821-123-zz"],
      ["zz-post-rock-river-sky-zz"],
      ["zz-kathy-lost-cat-zz", "zz-moving-box-kitchen-3-zz"],
      ["zz-acme-support-agent-zz", "zz-@agentsmith-zz"],
      ["zz-btc-harbor-violet-nine-zz", "zz-harbor-violet-nine-zz"],
      ["zz-fn-pay-agentsmith-zz", "zz-run-reorder-water-zz"],
    ]);
    expect(topWays.items.map((item) => item.status)).toEqual([
      "Exploration: field/enterprise workflows are queued in B7; carrier and ledger integrations are not v1 features.",
      "Exploration: postal/parcel workflows are queued in B8; postage, carrier, routing, and tracking integrations are not v1 services.",
      "Consumer/community uses are queued in B9. zzThat is a working prototype; Android, iOS, and web releases are planned, not shipped.",
      "Exploration: agent/ledger integrations are shadowed in B16; no v1 agent identity or authorization integration.",
      "Exploration: blockchain integration is shadowed in B16 for v2+; it is not a v1 dependency or capability.",
      "Exploration: authorized actions/macros are shadowed in B14; code-triggered actions are not a v1 feature.",
    ]);
    expect(topWays.items.map((item) => item.text)).toEqual([
      "A future workflow could use a handwritten code to help identify and hand off items. The pictured shipping, customs, payment-service, and shared-ledger connections are concepts, not available integrations.",
      "A future postal or parcel workflow could use a handwritten code as a reference. This concept is not proof of postage and does not provide routing or tracking.",
      "Community examples include a lost-pet flyer, a moving box, or a garage-sale item. The zzThat scanner/creator is a working prototype; its consumer releases remain planned.",
      "A future integration could give an agent a short, readable alias. Linking that alias to an operator or permissions is not a v1 capability.",
      "A future integration could map a readable code to a wallet, account, smart-contract, or agent address. No blockchain alias integration is available in v1.",
      "A future authorized-actions design could let a code refer to a command, subject to separate authentication, authorization, and confirmation. The code itself carries no authority, and v1 does not execute macros.",
    ]);
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

describe("content hygiene across all content modules", () => {
  it("collects strings from every module", () => {
    expect(allStrings.length).toBeGreaterThan(100);
  });

  it("contains no standalone capital ZZ", () => {
    expect(allStrings.filter((text) => /\bZZ\b/.test(text))).toEqual([]);
  });

  it("contains no em dash (Q47 hero uses a spaced hyphen)", () => {
    expect(allStrings.filter((text) => text.includes("\u2014"))).toEqual([]);
  });

  it("does not say mock in user-facing copy", () => {
    const hits = allStrings.filter(
      (text) => text !== "demo-mock" && /\bmock\b/i.test(text),
    );
    expect(hits).toEqual([]);
  });

  it('says "check word", not "checksum", in user-facing copy', () => {
    expect(allStrings.filter((text) => /\bchecksums?\b/i.test(text))).toEqual(
      [],
    );
  });

  it("contains no unmeasured performance figures or endorsement claims", () => {
    const banned = [
      "95%",
      "99%",
      "99.9%",
      "0.1%",
      "pilot customer",
      "endorsed",
      "adopted by",
    ];
    expect(
      allStrings.filter((text) =>
        banned.some((term) => text.toLowerCase().includes(term)),
      ),
    ).toEqual([]);
  });
});
