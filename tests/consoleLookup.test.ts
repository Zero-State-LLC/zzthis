import { describe, expect, it } from "vitest";
import { consoleCopy, parsedStatus, reasonNote } from "../src/content/console";
import { mockCodes } from "../src/content/demo";
import {
  hasNonAsciiLetter,
  lookupCode,
  readCandidate,
} from "../src/lib/consoleLookup";

describe("readCandidate", () => {
  it("treats letters outside A-Z as coming later, before grammar", () => {
    expect(hasNonAsciiLetter("zz-구리-등불-하늘-zz")).toBe(true);
    expect(hasNonAsciiLetter("zz-copper-lantern-sky-zz")).toBe(false);
    expect(readCandidate("zz-さくら-ねこ-そら-zz")).toEqual({
      kind: "coming-later",
    });
    expect(lookupCode("zz-נהורא-שמיא-zz", mockCodes)).toEqual({
      kind: "coming-later",
    });
  });

  it("reports an empty field without calling it malformed", () => {
    expect(readCandidate("   ")).toEqual({ kind: "empty" });
  });

  it("reports a Latin string that is not a zz code", () => {
    expect(readCandidate("copper lantern sky")).toEqual({
      kind: "malformed",
      reason: "no-marker",
    });
  });

  it("parses a dash code and a circled code without matching them", () => {
    expect(readCandidate("zz-copper-lantern-sky-zz")).toEqual({
      kind: "parsed",
      codeKind: "plain",
      words: ["copper", "lantern", "sky"],
      variant: "dash",
      normalized: "zz-copper-lantern-sky-zz",
    });
    expect(readCandidate("(zz) camp bravo four two (zz)")).toEqual({
      kind: "parsed",
      codeKind: "plain",
      words: ["camp", "bravo", "four", "two"],
      variant: "circled",
      normalized: "zz-camp-bravo-four-two-zz",
    });
  });

  it("accepts a handle and a one-word code as parsed codes", () => {
    expect(readCandidate("zz-@agentsmith-zz")).toEqual({
      kind: "parsed",
      codeKind: "handle",
      words: ["@agentsmith"],
      variant: "dash",
      normalized: "zz-@agentsmith-zz",
    });
    expect(readCandidate("zz-hello-zz")).toEqual({
      kind: "parsed",
      codeKind: "plain",
      words: ["hello"],
      variant: "dash",
      normalized: "zz-hello-zz",
    });
  });
});

describe("lookupCode", () => {
  it("returns the mock record only on an exact normalized match", () => {
    const hit = lookupCode("zz-copper-lantern-sky-zz", mockCodes);
    expect(hit.kind).toBe("resolved");
    if (hit.kind === "resolved") {
      expect(hit.code.code).toBe("zz-copper-lantern-sky-zz");
    }
    expect(lookupCode("zz-copper-lantern-ski-zz", mockCodes)).toEqual({
      kind: "abstain-unknown",
    });
    expect(lookupCode("(zz) camp bravo four two (zz)", mockCodes)).toEqual({
      kind: "abstain-unknown",
    });
    expect(lookupCode("copper lantern sky", mockCodes)).toEqual({
      kind: "abstain-malformed",
      reason: "no-marker",
    });
    expect(lookupCode("zz-@agentsmith-zz", mockCodes)).toEqual({
      kind: "abstain-unknown",
    });
    expect(lookupCode("zz-hello-zz", mockCodes)).toEqual({
      kind: "abstain-unknown",
    });
    expect(lookupCode("zz", mockCodes)).toEqual({ kind: "abstain-bare" });
  });
});

describe("console copy", () => {
  it("keeps the coming-later note and the miss note", () => {
    expect(consoleCopy.comingLater).toBe(
      "Codes in other languages and scripts are coming later. This demo reads v1 codes, written with Latin letters and numbers, for now.",
    );
    expect(consoleCopy.missNote).toBe(
      "Exact match only. A miss never suggests other codes.",
    );
    expect(parsedStatus("dash markers", 3, "zz-copper-lantern-sky-zz")).toBe(
      "Parsed: dash markers, 3 words. Normalized: zz-copper-lantern-sky-zz",
    );
    expect(reasonNote("no-marker")).toBe("reason: no-marker");
  });
});
