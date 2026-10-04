import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import type { Application } from "../src/content/applications";
import { homeAppEntries } from "../src/content/homeApps";

describe("home application entries", () => {
  const entries = homeAppEntries();

  it("shows both Postal and parcel images side by side", () => {
    const parcel = entries.find((entry) => entry.id === "parcel");
    expect(parcel?.images.map((image) => image.id)).toEqual(["g", "o"]);
  });

  it("marks Field logistics as wide-only and keeps the other rows", () => {
    const field = entries.find((entry) => entry.id === "field");
    expect(field?.wideOnly).toBe(true);
    expect(field?.images.map((image) => image.id)).toEqual(["j"]);
    const shown = entries.filter((entry) => entry.id !== "field");
    expect(shown.map((entry) => entry.id)).toEqual([
      "parcel",
      "community",
      "aliases",
    ]);
    expect(shown.every((entry) => entry.wideOnly === false)).toBe(true);
  });

  it("drops an application that has no home images", () => {
    const empty: Application = {
      id: "community",
      title: "Empty",
      story: "None",
      homeImages: [],
      pageImages: [],
      homeWideOnly: false,
    };
    expect(homeAppEntries([empty])).toEqual([]);
  });
});

describe("home application presentation", () => {
  const template = readFileSync("src/components/AppIndex.astro", "utf8");
  const css = readFileSync("src/styles/b-bands.css", "utf8");

  it("renders every entry image and the wide-only class", () => {
    expect(template).not.toContain("homeImages[0]");
    expect(template).toContain("entry.images.map");
    expect(template).toContain("app--wide-only");
    expect(template).toContain("app--pair");
  });

  it("hides the wide-only row below 600 px", () => {
    expect(css).toMatch(/\.app--wide-only\s*\{[^}]*display:\s*none/);
    expect(css).toMatch(
      /@media \(min-width: 600px\)\s*\{[^}]*\.app--wide-only\s*\{[^}]*display:\s*grid/,
    );
  });
});
