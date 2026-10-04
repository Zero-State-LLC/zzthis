import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  b4Line,
  flowACode,
  flowBCopy,
  flowBOutcomes,
  mockCodes,
} from "../src/content/demo";
import { resolve } from "../src/lib/resolver";

const entries = (...codes: string[]): { code: string }[] =>
  codes.map((code) => ({ code }));

describe("resolve with the spec 4.4 test inputs", () => {
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

  it("passes the parse failure reason through", () => {
    expect(resolve("zz-copper-lantern-sky", mockCodes)).toEqual({
      kind: "abstain-malformed",
      reason: "no-closing-marker",
    });
  });

  it("treats a one-word code and a handle as valid misses", () => {
    expect(resolve("zz-a-zz", mockCodes)).toEqual({ kind: "abstain-unknown" });
    expect(resolve("zz-@agentsmith-zz", mockCodes)).toEqual({
      kind: "abstain-unknown",
    });
  });

  it("abstains on a bare mark without calling it a miss", () => {
    expect(resolve("zz", mockCodes)).toEqual({ kind: "abstain-bare" });
    expect(resolve("(ZZ)", mockCodes)).toEqual({ kind: "abstain-bare" });
  });
});

describe("B4 lines", () => {
  it("maps each parser reason to the Section 4.4 line", () => {
    expect(b4Line("no-closing-marker")).toBe(flowBCopy.closing);
    expect(b4Line("misplaced-at")).toBe(flowBCopy.handle);
    expect(b4Line("invalid-handle")).toBe(flowBCopy.handle);
    expect(b4Line("reserved-symbol")).toBe(flowBCopy.reserved);
    expect(b4Line("unsupported-script")).toBe(flowBCopy.script);
    for (const reason of [
      "empty",
      "no-marker",
      "no-content",
      "marker-in-body",
      "invalid-character",
      "too-long",
    ] as const) {
      expect(b4Line(reason)).toBe(flowBCopy.malformed);
    }
    expect(flowBCopy.bare).toContain("bare zz mark");
    expect(flowBCopy.malformed).not.toContain("did you mean");
  });
});

describe("exact match only: a near miss reveals no other code (issue #12)", () => {
  const nearMisses = [
    "zz-coper-lantern-sky-zz", // one misspelled word
    "zz-copper-lantern-zz", // a dropped word
    "zz-copper-lantern-sky-blue-zz", // an extra word
    "zz-lantern-copper-sky-zz", // swapped words
    "zz-river-mapel-sky-zz", // a typo in another mock code
  ];

  for (const input of nearMisses) {
    it(`${input} returns only abstain-unknown`, () => {
      const result = resolve(input, mockCodes);
      expect(result).toEqual({ kind: "abstain-unknown" });
      const shown = JSON.stringify(result);
      for (const entry of mockCodes) {
        expect(shown).not.toContain(entry.code);
      }
    });
  }

  it("abstains with an empty code list", () => {
    expect(resolve("zz-red-blue-zz", [])).toEqual({ kind: "abstain-unknown" });
  });

  it("ignores entries that are not valid codes", () => {
    expect(resolve("zz-red-blue-zz", entries("not a code"))).toEqual({
      kind: "abstain-unknown",
    });
  });

  it("uses a neutral no-match message that names no code", () => {
    for (const entry of mockCodes) {
      expect(flowBCopy.unknown).not.toContain(entry.code);
    }
    expect(flowBCopy.unknown.toLowerCase()).not.toContain("did you mean");
  });

  it("lists no suggestion outcome on the demo page", () => {
    const names = flowBOutcomes.map((outcome) => outcome.name.toLowerCase());
    expect(names).not.toContain("did you mean");
  });

  it("renders no suggestion list in Flow B", () => {
    const source = readFileSync("src/demo/renderB.ts", "utf8");
    expect(source).not.toMatch(/suggest/i);
  });
});
