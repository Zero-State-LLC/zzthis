import { describe, expect, it } from "vitest";
import { applications } from "../src/content/applications";
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
      "Another view",
      "Confirm",
      "Resolve",
    ]);
    expect(decisionBands.note).toBe(
      "Design intent. No threshold has been measured yet.",
    );
    expect(realPhotos).toBe("Real photos.");
    expect(footerNote).toContain("except where marked as real photos");
  });
});
