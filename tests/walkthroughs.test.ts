import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("walkthrough viewer markup and script [DANNY 2026-10-11]", () => {
  const source = readFileSync("src/components/Walkthroughs.astro", "utf8");

  it("hides the thumbnail buttons until the script enhances them", () => {
    expect(source).toMatch(
      /<ol\s+class="wt__thumbs"\s+data-wt-thumbs\s+hidden/,
    );
    expect(source).toContain("thumbsList.hidden = false");
  });

  it("re-syncs the counter from the real scroll position after interrupted scrolls", () => {
    expect(source).toContain('"scrollend"');
    expect(source).toMatch(/const settle = \(\) =>/);
    for (const event of ["pointerdown", "touchstart", "wheel"]) {
      expect(source).toContain(`track.addEventListener("${event}", release`);
    }
  });
});
