import { describe, expect, it } from "vitest";
import { isWordlistVersion, loadWordlist, wordAt } from "../src/wordlist.ts";

describe("wordlist loader", () => {
  it("knows the bundled versions", () => {
    expect(isWordlistVersion("fixture-7")).toBe(true);
    expect(isWordlistVersion("proto-v0")).toBe(true);
    expect(isWordlistVersion("toString")).toBe(false);
  });

  it("loads proto-v0 in line order, with a prime size", () => {
    const list = loadWordlist("proto-v0");
    expect(list.words).toHaveLength(2663);
    expect(list.index.get(wordAt(list, 0))).toBe(0);
    expect(list.version).toBe("proto-v0");
  });

  it("refuses an index outside the list", () => {
    const list = loadWordlist("fixture-7");
    expect(() => wordAt(list, 7)).toThrow(RangeError);
  });
});
