import { existsSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import * as applicationsModule from "../src/content/applications";
import * as comparisonModule from "../src/content/comparison";
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
const { featured, hero } = heroModule;
const { images } = imagesModule;
const { navItems, footerItems, footerNotice } = navigationModule;
const { advisors, founder, founderOrigin } = peopleModule;
const { topWays } = usesModule;
const { demoTitle } = demoModule;
const { technologyDraft } = technologyModule;
const { conceptLabels } = labelsModule;
const { coreIdentity, fieldLogistics, photoToAction } = workflowsModule;

const modules: readonly unknown[] = [
  applicationsModule,
  comparisonModule,
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
      "Barcodes made things scannable. zzThis makes them writable - and smart.",
    );
    expect(hero.subline).toBe(
      "Write a code on a thing; find its record by camera, typing, or voice.",
    );
    const { before, code, after } = hero.paragraph;
    expect(before + code + after).toBe(
      "zzThis is a human-readable, human-writable code for the physical world. Write zz-copper-lantern-sky-zz on tape, a crate, a parcel, or a sign. Link it to a digital record, then find it by camera, typing, or voice.",
    );
    expect(code).toBe("zz-copper-lantern-sky-zz");
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
      "A zz code gives people a way to create the mark themselves, wherever the work happens. AI can help identify what a camera sees, count what remains, suggest how an item should be handled, and prepare the next task. The same visible code connects the item, its history, and the people responsible for it.",
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
          read: "Person, camera, voice, typing, or within text",
          connects: "Thing to its record, next action, and authorized macros",
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
  it("matches the core workflow", () => {
    expect(coreIdentity.intro).toBe(
      "Core identity: MARK a lowercase zz code → READ it by camera or manual entry → LINK it to a record → REPORT the words by voice where useful.",
    );
    expect(
      coreIdentity.steps.map((step) => `${step.title}: ${step.text}`),
    ).toEqual([
      "Mark: Write the code on tape, a crate, or a pallet.",
      "Read: Camera or manual entry.",
      "Link: Connect to an existing record and photo.",
      "Report: Say the code words if a voice handoff is useful.",
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
      "A second layer after the handwritten code: see an item, identify it, choose its next task.",
    );
    expect(photoToAction.workflow).toBe(
      "AI-assisted work: PHOTOGRAPH one or more items → CONFIRM the proposed identification → choose a handling or inventory action by touch or voice → REVIEW the prepared record or form.",
    );
    expect(
      photoToAction.sequence.map((step) => `${step.numeral} ${step.title}`),
    ).toEqual(["01 Photograph", "02 Guide", "03 Review"]);
  });
});

describe("applications (spec 3.2 H.7 and 3.4)", () => {
  it("matches the four category stories", () => {
    expect(story("field")).toBe(
      "Hand-mark bags, crates, pallets, and mixed goods; read or relay a code; connect it to existing identifiers. Then photograph loose items, prepare a turn-in, compare inventory, and use touch-first actions.",
    );
    expect(story("parcel")).toBe(
      "Write a reference directly on a parcel; photograph loose items and receive packing guidance before choosing a parcel code.",
    );
    expect(story("community")).toBe(
      "A handwritten code on a lost-cat flyer or other public surface can lead to a useful page.",
    );
    expect(story("aliases")).toBe(
      "A short human-readable code can stand in for a long machine address used by software agents.",
    );
  });

  it("matches the page intro and the aliases extra sentence", () => {
    expect(applicationsPage.intro).toBe(
      "AI belongs across field logistics and parcel workflows. Digital aliases are a separate application.",
    );
    expect(
      applications.find((entry) => entry.id === "aliases")?.pageExtra,
    ).toBe("Deeper blockchain/AI architecture can grow into a later page.");
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

  it("lists the advisors in the 2026-10-02 order, all with initials", () => {
    expect(advisors.map((person) => person.name)).toEqual([
      "Patrick Muggler",
      "Arshi Chadha",
      "Ridham Bhagat",
      "Daniel Meyer",
      "Adam Fry",
    ]);
    expect(advisors.every((person) => person.initials !== undefined)).toBe(
      true,
    );
  });

  it("applies Michael's 2026-10-02 answers", () => {
    const byName = (name: string) =>
      advisors.find((person) => person.name === name);
    expect(advisors.some((person) => person.name === "Jim White")).toBe(false);
    expect(byName("Ridham Bhagat")?.role).toBe(
      "Cybersecurity, cryptography and research methods",
    );
    expect(byName("Ridham Bhagat")?.bio).toMatch(
      /^Ridham Bhagat will contribute/,
    );
    expect(byName("Adam Fry")?.role).toBe(
      "AI agents, infrastructure and deployment",
    );
    expect(byName("Adam Fry")?.bio).toMatch(/^Adam Fry will contribute/);
    expect(byName("Adam Fry")?.profileUrl).toBeUndefined();
    for (const name of [
      "Patrick Muggler",
      "Arshi Chadha",
      "Ridham Bhagat",
      "Daniel Meyer",
      "Adam Fry",
    ]) {
      expect(byName(name)?.bio).toBeTruthy();
    }
    expect(founder.role).toBe(
      "Founder, system architecting, and project lead.",
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
    expect(byName("Ridham Bhagat")?.photo?.src).toBe(
      "images/people/ridham-bhagat.webp",
    );
    expect(byName("Daniel Meyer")?.photo).toBeUndefined();
    expect(byName("Adam Fry")?.photo).toBeUndefined();
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
    expect(fieldLogistics.images).toEqual(["a", "alt-b", "c"]);
  });
});

describe("top ways (Home section 01)", () => {
  it("lists six items with numerals, titles, codes, and text", () => {
    expect(topWays.heading).toBe("Top ways zzThis is used");
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
    expect(topWays.items.map((item) => item.text)).toEqual([
      "Easier handling: mark crates, bags, and parts, then read, link, and hand them off with a phone camera or a few spoken words. For shipping, including across borders, the zz-code can be the shipment's shared identity and hub, where customs, carriers, and payment services find the same information, and its ID on the shared ledger used by every service that handles the goods.",
      "A handwritten zz-code can serve as proof of postage and a trackable reference: write it in the stamp corner of a letter or parcel, and it links to postage, routing, and tracking.",
      "Free for everyone. Write a code on a lost-pet flyer, a moving box, a garage-sale item, or a note, and anyone can scan it, like a QR code you can write by hand. Endless imaginative uses. The zzThat app is coming to Android, iOS, and the web at zzthat.com.",
      "AI agents need identities people can easily know and recognize by name, and enterprises need to name and brand their agents, on the everyday web as well as on blockchains. A zz-code gives an agent a short name people can write, say, and verify, linked to who runs it and what it is allowed to do.",
      "Wallet, account, smart-contract, and agent addresses on networks such as Bitcoin and Ethereum are long strings of random characters. A zz-code is a readable alias for any of them: easier to write, say, and check on screen before you send.",
      "A zz-code can also call a function: a short, human-writable command that asks a system to do something, such as reorder supplies, pay an agent, or open a work order. A macro runs only for an authenticated, authorized user who confirms it; the code itself carries no authority.",
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
      ["app-super-identifier"],
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
    expect(allStrings.filter((text) => text.includes("—"))).toEqual([]);
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
