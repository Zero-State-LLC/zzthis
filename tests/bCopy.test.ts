import { describe, expect, it } from "vitest";
import { languageExamples } from "../src/content/anatomy";
import {
  badgeText,
  demoIntro,
  flowACopy,
  mockCodes,
} from "../src/content/demo";
import { applications } from "../src/content/applications";
import { architecture } from "../src/content/architecture";
import { consoleCopy } from "../src/content/console";
import { hackerDojo } from "../src/content/contact";
import { footerNote } from "../src/content/navigation";
import { realPhotos } from "../src/content/labels";
import { decisionBands } from "../src/content/workflows";

describe("B v1.0 copy locks", () => {
  it("does not name Coupang and corrects the delivery step", () => {
    const blob = JSON.stringify(applications);
    expect(blob.includes("Coupang")).toBe(false);
    expect(blob.includes("app-delivery-overview")).toBe(false);
    const steps = applications
      .find((app) => app.id === "parcel")
      ?.pageGalleries?.find((gallery) => gallery.ordered)?.items;
    expect(steps?.[2]?.title).toBe("Delivery man only knows drop-off address");
  });

  it("uses one Hacker Dojo paragraph and the decision bands", () => {
    expect(hackerDojo.paragraphs).toHaveLength(1);
    expect(hackerDojo.paragraphs[0]).toContain("Apple");
    expect(decisionBands.names).toEqual([
      "Manual",
      "Rescan",
      "Confirm",
      "Resolve",
    ]);
    expect(decisionBands.note).toBe(
      "Design intent. No threshold has been measured yet.",
    );
    expect(realPhotos).toBe("Real photos.");
    expect(footerNote).toContain("except where marked as real photos");
  });

  it("uses Michael's console labels and architecture detail", () => {
    expect(consoleCopy.confidence).toBe("Confidence: 0.94 (demo)");
    expect(consoleCopy.checksum).toBe(
      "Check word: OK (demo; no algorithm runs)",
    );
    expect(consoleCopy.recordFoot).toBe(
      "Demo record. No network request was made.",
    );
    expect(consoleCopy.comingLater).toBe(
      "Codes in other languages and scripts are coming later. This demo reads v1 codes, written with Latin letters and numbers, for now.",
    );
    const storage = architecture.columns
      .flatMap((column) => column.nodes)
      .find((node) => node.title === "Object storage");
    expect(storage?.detail).toBe("photos for retries and review");
    expect(badgeText).toBe("Demo · demo data");
    expect(demoIntro).toBe(
      "This is a scripted demonstration. No recognition runs; every result is prewritten demo data.",
    );
    expect(flowACopy.checksum).toBe(
      "Checksum: OK (demo state, no algorithm runs)",
    );
    expect(flowACopy.formLabel).toBe("Prepared turn-in form (demo, read-only)");
    const shown = mockCodes.flatMap((entry) => [
      entry.kind,
      ...entry.fields.map((field) => field.value),
    ]);
    expect(shown.filter((text) => /\bmock\b/i.test(text))).toEqual([]);
    expect(shown).toContain("DEMO-0000-00-000-0001");
    expect(shown).toContain("Attached (demo image)");
  });

  it("keeps the confirmed Korean, Japanese, and Aramaic examples", () => {
    expect(languageExamples.map((example) => example.name)).toEqual([
      "Korean",
      "Japanese",
      "German",
      "French",
      "Aramaic",
    ]);
    expect(languageExamples[0]).toEqual({
      name: "Korean",
      code: "zz-구리-등불-하늘-zz",
      lang: "ko",
    });
    expect(languageExamples[1]).toEqual({
      name: "Japanese",
      code: "zz-さくら-ねこ-そら-zz",
      lang: "ja",
      gloss: "(cherry blossom, cat, sky)",
    });
    expect(languageExamples[4]).toEqual({
      name: "Aramaic",
      code: "zz-נהורא-שמיא-zz",
      lang: "arc",
      gloss: "(light, sky)",
      rtl: "נהורא-שמיא",
    });
  });
});
