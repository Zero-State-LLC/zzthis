import { describe, expect, it } from "vitest";
import { formatCode, parseCode } from "../src/lib/grammar";

describe("parseCode", () => {
  it("accepts the spec dash form and lowercases it", () => {
    expect(parseCode("ZZ COPPER LANTERN SKY ZZ")).toEqual({
      ok: true,
      words: ["copper", "lantern", "sky"],
      variant: "dash",
    });
  });

  it("accepts the standard hyphenated form", () => {
    expect(parseCode("zz-copper-lantern-sky-zz")).toEqual({
      ok: true,
      words: ["copper", "lantern", "sky"],
      variant: "dash",
    });
  });

  it("trims surrounding whitespace", () => {
    expect(parseCode("  zz-river-maple-sky-zz \n")).toEqual({
      ok: true,
      words: ["river", "maple", "sky"],
      variant: "dash",
    });
  });

  it("accepts the circled variant", () => {
    expect(parseCode("(zz) camp bravo four two (zz)")).toEqual({
      ok: true,
      words: ["camp", "bravo", "four", "two"],
      variant: "circled",
    });
  });

  it("accepts a circled code without the closing marker", () => {
    expect(parseCode("(ZZ) camp bravo")).toEqual({
      ok: true,
      words: ["camp", "bravo"],
      variant: "circled",
    });
  });

  it("accepts a dash code without the closing marker", () => {
    expect(parseCode("zz-copper-lantern-sky")).toEqual({
      ok: true,
      words: ["copper", "lantern", "sky"],
      variant: "dash",
    });
  });

  it("treats mixed hyphens and spaces as separators", () => {
    expect(parseCode("zz copper - lantern  sky-zz")).toEqual({
      ok: true,
      words: ["copper", "lantern", "sky"],
      variant: "dash",
    });
  });

  it("accepts digits in words", () => {
    expect(parseCode("zz-b2-4-zz")).toEqual({
      ok: true,
      words: ["b2", "4"],
      variant: "dash",
    });
  });

  it("accepts exactly two and exactly five words", () => {
    expect(parseCode("zz-a-b-zz")).toEqual({
      ok: true,
      words: ["a", "b"],
      variant: "dash",
    });
    expect(parseCode("zz-a-b-c-d-e-zz")).toEqual({
      ok: true,
      words: ["a", "b", "c", "d", "e"],
      variant: "dash",
    });
  });

  it("rejects one word and six words", () => {
    expect(parseCode("zz-a-zz")).toEqual({ ok: false, reason: "word-count" });
    expect(parseCode("zz-a-b-c-d-e-f-zz")).toEqual({
      ok: false,
      reason: "word-count",
    });
  });

  it("rejects empty and whitespace-only input", () => {
    expect(parseCode("")).toEqual({ ok: false, reason: "empty" });
    expect(parseCode("   ")).toEqual({ ok: false, reason: "empty" });
  });

  it("rejects input without a marker", () => {
    expect(parseCode("copper")).toEqual({ ok: false, reason: "no-marker" });
    expect(parseCode("zz")).toEqual({ ok: false, reason: "no-marker" });
    expect(parseCode("zzcopper-sky")).toEqual({
      ok: false,
      reason: "no-marker",
    });
  });

  it("rejects words outside the a-z0-9 charset", () => {
    expect(parseCode("zz-lan_tern-sky-zz")).toEqual({
      ok: false,
      reason: "invalid-word",
    });
    expect(parseCode("zz-vitalik.eth-wallet-zz")).toEqual({
      ok: false,
      reason: "invalid-word",
    });
  });
});

describe("formatCode", () => {
  it("wraps words in dash markers", () => {
    expect(formatCode(["copper", "lantern", "sky"])).toBe(
      "zz-copper-lantern-sky-zz",
    );
  });
});
