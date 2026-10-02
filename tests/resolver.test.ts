import { describe, expect, it } from "vitest";
import { flowACode, mockCodes } from "../src/content/demo";
import { resolve, wordDistance } from "../src/lib/resolver";

const entries = (...codes: string[]): { code: string }[] =>
  codes.map((code) => ({ code }));

describe("resolve with the spec 4.4 test inputs", () => {
  it("suggests copper-lantern-sky for zz-coper-lantern-sky-zz", () => {
    expect(resolve("zz-coper-lantern-sky-zz", mockCodes)).toEqual({
      kind: "suggest",
      suggestions: [{ code: flowACode, distance: 1 }],
    });
  });

  it("resolves ZZ COPPER LANTERN SKY ZZ", () => {
    const result = resolve("ZZ COPPER LANTERN SKY ZZ", mockCodes);
    expect(result).toEqual({ kind: "resolved", code: flowACode });
    expect(result.kind === "resolved" && result.code).toBe(flowACode);
  });

  it("abstains on zz-apple-sky-zz", () => {
    expect(resolve("zz-apple-sky-zz", mockCodes)).toEqual({
      kind: "abstain-unknown",
    });
  });

  it("reports copper as malformed", () => {
    expect(resolve("copper", mockCodes)).toEqual({
      kind: "abstain-malformed",
      reason: "no-marker",
    });
  });
});

describe("resolve ranking", () => {
  it("orders ties alphabetically and caps at three", () => {
    const codes = entries(
      "zz-red-green-zz",
      "zz-red-blue-zz",
      "zz-red-blue-green-cat-zz",
      "zz-blue-green-zz",
    );
    expect(resolve("zz-red-blue-green-zz", codes)).toEqual({
      kind: "suggest",
      suggestions: [
        { code: { code: "zz-blue-green-zz" }, distance: 1 },
        { code: { code: "zz-red-blue-green-cat-zz" }, distance: 1 },
        { code: { code: "zz-red-blue-zz" }, distance: 1 },
      ],
    });
  });

  it("orders by distance before name", () => {
    const codes = entries("zz-red-blue-zz", "zz-red-blue-green-cat-dog-zz");
    expect(resolve("zz-red-blue-green-zz", codes)).toEqual({
      kind: "suggest",
      suggestions: [
        { code: { code: "zz-red-blue-zz" }, distance: 1 },
        { code: { code: "zz-red-blue-green-cat-dog-zz" }, distance: 2 },
      ],
    });
  });

  it("suggests at distance 2 and drops distance 3", () => {
    const codes = entries(
      "zz-red-blue-cat-dog-eel-zz",
      "zz-red-blue-cat-dog-zz",
    );
    expect(resolve("zz-red-blue-zz", codes)).toEqual({
      kind: "suggest",
      suggestions: [{ code: { code: "zz-red-blue-cat-dog-zz" }, distance: 2 }],
    });
  });

  it("abstains when the only candidate is at distance 3", () => {
    const codes = entries("zz-red-blue-cat-dog-eel-zz");
    expect(resolve("zz-red-blue-zz", codes)).toEqual({
      kind: "abstain-unknown",
    });
  });

  it("skips entries that do not parse", () => {
    const codes = entries("zz-red-zz", "not a code");
    expect(resolve("zz-red-blue-zz", codes)).toEqual({
      kind: "abstain-unknown",
    });
  });

  it("abstains with an empty code list", () => {
    expect(resolve("zz-red-blue-zz", [])).toEqual({ kind: "abstain-unknown" });
  });

  it("passes the parse failure reason through", () => {
    expect(resolve("zz-a-zz", mockCodes)).toEqual({
      kind: "abstain-malformed",
      reason: "word-count",
    });
  });
});

describe("wordDistance", () => {
  it("is 0 for equal word lists", () => {
    expect(wordDistance(["a", "b"], ["a", "b"])).toBe(0);
  });

  it("counts inserted and deleted words", () => {
    expect(wordDistance([], ["a", "b"])).toBe(2);
    expect(wordDistance(["a", "b"], [])).toBe(2);
    expect(wordDistance(["a", "b"], ["a", "x", "b"])).toBe(1);
    expect(wordDistance(["a", "x", "b"], ["a", "b"])).toBe(1);
  });

  it("prefers delete plus insert over two far substitutions", () => {
    expect(wordDistance(["red", "blue"], ["blue", "red"])).toBe(2);
  });

  it("charges 1 for a near-miss spelling within a third of the length", () => {
    expect(wordDistance(["copper"], ["coper"])).toBe(1);
    expect(wordDistance(["lantern"], ["lxntxrn"])).toBe(1);
  });

  it("charges 2 just past the near-miss limit", () => {
    expect(wordDistance(["lantern"], ["lxxtxrn"])).toBe(2);
    expect(wordDistance(["apple"], ["maple"])).toBe(2);
  });

  it("keeps a minimum near-miss limit of 1 for short words", () => {
    expect(wordDistance(["abc"], ["abd"])).toBe(1);
    expect(wordDistance(["ab"], ["ax"])).toBe(1);
    expect(wordDistance(["ab"], ["cd"])).toBe(2);
  });
});
