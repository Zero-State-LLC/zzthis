import { existsSync, readFileSync, statSync } from "node:fs";
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
import * as walkthroughsModule from "../src/content/walkthroughs";
import * as workflowsModule from "../src/content/workflows";

const { applications, applicationsPage } = applicationsModule;
const { comparisonColumns, comparisonNote, comparisonRows } = comparisonModule;
const { whyMarkers } = anatomyModule;
const { footerItems, footerNotice, zzthisSocial, zzthatSocial } =
  navigationModule;
const { advisors, founder, founderOrigin } = peopleModule;
const { demoTitle, demoPrototypeLinks, demoPlannedApp } = demoModule;
const { aboutPage, prototypes } = contactModule;
const { technologyDraft } = technologyModule;
const { conceptLabels } = labelsModule;
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

const story = (id: string): string | undefined =>
  applications.find((entry) => entry.id === id)?.story;

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
  it("says zzThat is live", () => {
    expect(aboutPage.prototypeLabel).toBe(
      "zzThis is for commercial and government use; zzThat is our free consumer app, and it is live. These are prototypes and explorations; capabilities described as planned are not deployed features.",
    );
    expect(aboutPage.prototypeLabel).not.toContain("launching soon");
    expect(aboutPage.team).toContain("Silicon Valley-based team");
    expect(aboutPage.team).toContain("dependable solutions");
    expect(prototypes.find((site) => site.name === "zzthat.com")?.text).toBe(
      "Working scanner/creator prototype and separate consumer product direction; the Android and iOS apps are live.",
    );
    expect(demoPlannedApp).toBe(
      "The zzThat Android and iOS apps are live at zzthat.com.",
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

describe("applications (spec 3.2 H.7 and 3.4)", () => {
  it("matches the four category stories", () => {
    expect(story("field")).toBe(
      "Handwritten codes on bags, crates, pallets, and mixed goods connect items to existing identifiers and prepare inventory work.",
    );
    expect(story("parcel")).toBe(
      "One zz-code turns a parcel into a node with a digital twin. Shipper, carrier, sorting center, post office, and drop-off store each use their own systems, yet all read and update the same record, the same shared naming layer that lets relief organizations work from one set of words.",
    );
    expect(story("community")).toBe(
      "A handwritten code is linked to its online page or resource.",
    );
    expect(story("aliases")).toBe(
      "Just as domain names stand in for IP addresses, a zz-code stands in for a long machine address, such as an AI agent ID or a wallet address. And just as HTTPS is the verified form of HTTP, an \u201c@\u201d in the code, as in zz-AI@-Agentsmith-zz, marks a trusted alias backed by identification and authentication.",
    );
  });

  it("drops the roadmap hedges [MICHAEL 2026-10-19]", () => {
    expect(applicationsPage).not.toHaveProperty("intro");
    expect(applications.every((entry) => entry.pageExtra === undefined)).toBe(
      true,
    );
    expect(applications.map((entry) => entry.status)).toEqual([
      undefined,
      "The postal, parcel, and carrier workflows are illustrative.",
      undefined,
      undefined,
    ]);
    expect(applications.find((entry) => entry.id === "community")?.title).toBe(
      "Personal and community uses",
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
      "Consumer/community uses are queued in B9. The zzThat Android and iOS apps are live.",
      "Exploration: agent/ledger integrations are shadowed in B16; no v1 agent identity or authorization integration.",
      "Exploration: blockchain integration is shadowed in B16 for v2+; it is not a v1 dependency or capability.",
      "Exploration: authorized actions/macros are shadowed in B14; code-triggered actions are not a v1 feature.",
    ]);
    expect(topWays.items.map((item) => item.text)).toEqual([
      "A future workflow could use a handwritten code to help identify and hand off items. The pictured shipping, customs, payment-service, and shared-ledger connections are concepts, not available integrations.",
      "A future postal or parcel workflow could use a handwritten code as a reference. This concept is not proof of postage and does not provide routing or tracking.",
      "Community examples include a lost-pet flyer, a moving box, or a garage-sale item. The zzThat Android and iOS apps are live.",
      "A future integration could give an agent a short, readable alias. Linking that alias to an operator or permissions is not a v1 capability.",
      "A future integration could map a readable code to a wallet, account, smart-contract, or agent address. No blockchain alias integration is available in v1.",
      "A future authorized-actions design could let a code refer to a command, subject to separate authentication, authorization, and confirmation. The code itself carries no authority, and v1 does not execute macros.",
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
