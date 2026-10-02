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
import * as workflowsModule from "../src/content/workflows";

const { applications, applicationsPage } = applicationsModule;
const { comparisonColumns, comparisonRows } = comparisonModule;
const { featured, hero } = heroModule;
const { navItems, footerItems, footerNotice } = navigationModule;
const { advisors, founderOrigin } = peopleModule;
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
      "Barcodes made things scannable. zzThis makes them writable\u2014and smart.",
    );
    expect(hero.subline).toBe(
      "Write a code on a thing; find its record by camera, typing, or voice.",
    );
    const { before, code, after } = hero.paragraph;
    expect(before + code + after).toBe(
      "zzThis is a human-readable, human-writable code alongside barcodes and QR codes. Write zz-copper-lantern-sky-zz on tape, a crate, a parcel, or a sign. Link it to a digital record, then find it by camera, typing, or voice.",
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
      "A writable mark establishes identity where the work happens. AI can help identify loose items from photos, compare inventory over time, suggest handling, and prepare a form or request. Touch and voice shorten the path from what a person sees to what the system can help them do.",
    );
  });
});

describe("comparison (spec 3.2 H.3)", () => {
  it("matches the row labels", () => {
    expect(comparisonRows.map((row) => row.label)).toEqual([
      "Create the mark",
      "Read the mark",
      "What it connects",
    ]);
  });

  it("matches all nine cells", () => {
    expect(
      comparisonColumns.map((column) => ({
        name: column.name,
        cells: column.cells,
      })),
    ).toEqual([
      {
        name: "Barcode",
        cells: { create: "Print", read: "Scanner", connects: "Item to data" },
      },
      {
        name: "QR code",
        cells: {
          create: "Print or display",
          read: "Camera",
          connects: "Surface to digital content",
        },
      },
      {
        name: "zzThis",
        cells: {
          create: "Write, print, or display",
          read: "Person, camera, typing, or voice",
          connects: "Thing to its record and next action",
        },
      },
    ]);
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
    expect(founderOrigin.text.startsWith("Michael Chung says he")).toBe(true);
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

describe("content hygiene across all content modules", () => {
  it("collects strings from every module", () => {
    expect(allStrings.length).toBeGreaterThan(100);
  });

  it("contains no em dash outside the hero H1 (Q1)", () => {
    expect(allStrings.filter((text) => text.includes("—"))).toEqual([
      hero.title,
    ]);
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
