import { readFileSync } from "node:fs";
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
import * as walkthroughsModule from "../src/content/walkthroughs";
import * as workflowsModule from "../src/content/workflows";

const { comparisonColumns, comparisonNote, comparisonRows } = comparisonModule;
const { whyMarkers } = anatomyModule;
const { demoPrototypeLinks, demoPlannedApp } = demoModule;
const { aboutPage, prototypes } = contactModule;
const { topWays } = usesModule;
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
  walkthroughsModule,
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

describe("demo prototype decisions", () => {
  it("keeps zzthing.com in the demo pending the October 31 review", () => {
    expect(demoPrototypeLinks.map((link) => link.name)).toEqual([
      "zzthing.com",
      "zzthat.com",
    ]);
    expect(demoPrototypeLinks[0]?.href).toBe("https://zzthing.com");
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
    const all = [whyMarkers.text, ...whyMarkers.points.map((p) => p.text)].join(
      " ",
    );
    expect(all).toContain("camera scanner");
    expect(all).toContain("bound the region to inspect");
    expect(all).not.toContain("in any handwriting");
  });

  it("names manual entry as today's path and camera recognition as planned", () => {
    expect(howItWorksPage.intro).toBe(
      "One code, written by hand, read by camera, spoken over a radio, and linked to the record it names.",
    );
    expect(howItWorksPage.readWays.heading).toBe(
      "Manual entry today, camera recognition planned, then send over radio",
    );
  });

  it("pairs contested logistics with the shared naming layer", () => {
    expect(howItWorksPage.reach.heading).toBe(
      "Contested logistics and sustainment, disaster relief",
    );
    expect(howItWorksPage.reach.images).toEqual(["p", "q"]);
  });

  it("matches the core workflow", () => {
    expect(coreIdentity.intro).toBe(
      "Core identity: MARK a zz code → READ it → LINK it to a record → SPEAK it in a voice handoff.",
    );
    expect(
      coreIdentity.steps.map((step) => `${step.title}: ${step.text}`),
    ).toEqual([
      "Mark: Write the code on tape, a crate, or a pallet.",
      "Read: Scan it like a bar code or QR code, or type it in.",
      "Link: Connect to an existing record and photo.",
      "Speak: Say the code words to another person.",
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
    expect(photoToAction.heading).toBe("Your Super Lens to the Physical World");
    expect(photoToAction.qualifier).toBe(
      "Planned: camera recognition is not live yet.",
    );
    expect(photoToAction.workflow).toBe(
      "PHOTOGRAPH one or more items → CONFIRM the proposed identification → choose a handling or inventory action by touch → REVIEW the prepared record or form.",
    );
    expect(
      photoToAction.sequence.map((step) => `${step.numeral} ${step.title}`),
    ).toEqual(["01 Photograph", "02 Guide", "03 Review"]);
  });

  it("renders the planned label on the photo-to-action pipeline", () => {
    const photoToActionTemplate = readFileSync(
      "src/components/PhotoToAction.astro",
      "utf8",
    );
    const pipelineTemplate = readFileSync(
      "src/components/Pipeline.astro",
      "utf8",
    );
    expect(photoToActionTemplate).toContain("{photoToAction.qualifier}");
    expect(pipelineTemplate).toContain("{photoToAction.qualifier}");
  });
});

describe("About prototypes", () => {
  it("summarizes zzThis and zzThat, with zzThat in alpha/beta testing", () => {
    // [MICHAEL 2026-10-22] The label above the two prototype cards is gone.
    expect("prototypeLabel" in aboutPage).toBe(false);
    expect(aboutPage.team).toContain("Silicon Valley-based team");
    expect(aboutPage.team).toContain("dependable and valuable solutions");
    expect(aboutPage.explorationsHeading).toBe("zzThis and zzThat");
    // [MICHAEL 2026-10-26] zzThat card relabeled as a demo; lead and points replaced.
    const zzthat = prototypes.find(
      (site) => site.name === "zzthat.com (a demo)",
    );
    expect(zzthat?.href).toBe("https://zzthat.com");
    expect(zzthat?.lead).toBe(
      "zzThat is our working proof-of-concept (POC) prototype,",
    );
    expect(zzthat?.points).toEqual([
      "The web, Android and iOS apps are in alpha/beta development and testing.",
      "Our goals and objectives include supporting and developing solutions, platforms, and tokenization models for app, AI, and blockchain developers, enterprises, and NGOs that partner with us.",
    ]);
    const zzthing = prototypes.find(
      (site) => site.name === "zzthing.com (a demo)",
    );
    expect(zzthing?.href).toBe("https://zzthing.com");
    expect(zzthing?.lead).toBe("zzThis is the business-grade version.");
    expect(zzthing?.codes?.map((item) => item.code)).toEqual([
      "zz-ai@-agentsmith-zz",
      "zz-fn-AcmePO-accept-zz",
    ]);
    expect(demoPlannedApp).toBe(
      "The zzThat Android and iOS apps are in alpha/beta testing at zzthat.com.",
    );
    const zzThatReleaseClaims = allStrings.filter((text) =>
      /zzThat/i.test(text),
    );
    expect(
      zzThatReleaseClaims.filter((text) =>
        /launching soon|not shipped|releases are planned|remain planned|Planned public app/i.test(
          text,
        ),
      ),
    ).toEqual([]);
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
    // [MICHAEL 2026-10-20] Status lines removed; texts drop the v1 hedges.
    expect(topWays.items.map((item) => item.status)).toEqual([
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
    ]);
    expect(topWays.items.map((item) => item.text)).toEqual([
      "Future workflows to identify and hand off items with handwritten codes, connected to shipping, customs, payment services, and shared ledgers.",
      "Future postal and parcel workflows using handwritten codes as references.",
      "Community examples include a lost-pet flyer, a moving box, or a garage-sale item. The zzThat Android and iOS apps are in alpha/beta testing.",
      "Future integrations to give agents short, readable aliases.",
      "Future integrations to map readable codes to wallets, accounts, smart-contracts, NFTs, agent addresses, and oracles.",
      "Future authorized actions to let a code refer to a command, subject to separate authentication, authorization, and confirmation. The code itself carries no authority.",
    ]);
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
