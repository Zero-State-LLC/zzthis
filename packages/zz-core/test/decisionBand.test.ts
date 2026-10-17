import { describe, expect, it } from "vitest";
import { decideCaptureBand } from "../src/decisionBand.ts";
import { issueWordCode } from "../src/issuer.ts";
import { loadWordlist } from "../src/wordlist.ts";
import { seeded } from "./random.ts";

describe("decideCaptureBand", () => {
  const wordlist = loadWordlist("fixture-7");
  const thresholds = {
    acceptMinConfidence: 0.8,
    retryBelowConfidence: 0.5,
  };
  const candidateFor = (confidence: number | null, available = true) => ({
    rawText: issueWordCode(wordlist, seeded(7)).words.join(" "),
    confidenceStatus: available
      ? ("available" as const)
      : ("not-available" as const),
    confidence: available ? confidence : null,
  });
  const evaluate = (confidence: number | null, available = true) =>
    decideCaptureBand({
      confirmOnly: false,
      candidate: candidateFor(confidence, available),
      wordlist,
      thresholds,
    });

  it("applies the frozen parameter boundaries without changing them", () => {
    expect(evaluate(0.499).band).toBe("retry");
    expect(evaluate(0.5).band).toBe("clarify");
    expect(evaluate(0.799).band).toBe("clarify");
    expect(evaluate(0.8).band).toBe("accept");
  });

  it("retries when there is no candidate or capture is unreadable", () => {
    expect(
      decideCaptureBand({
        confirmOnly: false,
        candidate: null,
        wordlist,
        thresholds,
      }).band,
    ).toBe("retry");
    expect(
      decideCaptureBand({
        confirmOnly: false,
        candidate: {
          rawText: " ",
          confidenceStatus: "not-available",
          confidence: null,
        },
        wordlist,
        thresholds,
      }).reason,
    ).toBe("no-candidate");
    expect(
      decideCaptureBand({
        confirmOnly: false,
        candidate: candidateFor(0.99),
        captureIssue: "glare",
        wordlist,
        thresholds,
      }).band,
    ).toBe("retry");
  });

  it("clarifies rather than inventing confidence or selecting a hypothesis", () => {
    expect(evaluate(null, false)).toMatchObject({
      band: "clarify",
      reason: "confidence-unavailable",
    });
    expect(
      decideCaptureBand({
        confirmOnly: false,
        candidate: candidateFor(0.99),
        hypothesisCount: 2,
        wordlist,
        thresholds,
      }).reason,
    ).toBe("multiple-hypotheses");
  });

  it("clarifies a parsed word code when its wordlist is unavailable", () => {
    expect(
      decideCaptureBand({
        confirmOnly: false,
        candidate: candidateFor(0.99),
        wordlist: null,
        thresholds,
      }),
    ).toMatchObject({ band: "clarify", reason: "wordlist-unavailable" });
  });

  it("does not accept handles, field codes, or names without confirmation", () => {
    const confidence = {
      confidenceStatus: "available" as const,
      confidence: 0.99,
    };
    for (const rawText of ["@agentsmith", "b2 smith 1", "vitalik.eth"]) {
      expect(
        decideCaptureBand({
          confirmOnly: false,
          candidate: { rawText, ...confidence },
          wordlist,
          thresholds,
        }).band,
      ).toBe("clarify");
    }
  });

  it("clarifies check-word mismatches and abstains on wrong length", () => {
    const issued = issueWordCode(wordlist, seeded(11)).words;
    const replacement = wordlist.words.find((word) => word !== issued[2])!;
    expect(
      decideCaptureBand({
        confirmOnly: false,
        candidate: {
          rawText: [...issued.slice(0, 2), replacement].join(" "),
          confidenceStatus: "available",
          confidence: 0.99,
        },
        wordlist,
        thresholds,
      }).band,
    ).toBe("clarify");
    expect(
      decideCaptureBand({
        confirmOnly: false,
        candidate: {
          rawText: "copper lantern",
          confidenceStatus: "available",
          confidence: 0.99,
        },
        wordlist,
        thresholds,
      }).band,
    ).toBe("abstain");
  });

  it("clarifies near-words and rejects inconsistent confidence evidence", () => {
    expect(
      decideCaptureBand({
        confirmOnly: false,
        candidate: {
          rawText: "coppr lantern sky",
          confidenceStatus: "available",
          confidence: 0.99,
        },
        wordlist,
        thresholds,
      }).band,
    ).toBe("clarify");
    expect(evaluate(null).reason).toBe("invalid-confidence");
    expect(
      decideCaptureBand({
        confirmOnly: false,
        candidate: {
          ...candidateFor(0.99),
          confidenceStatus: "not-available",
          confidence: 0.99,
        },
        wordlist,
        thresholds,
      }).reason,
    ).toBe("confidence-status-mismatch");
    expect(
      decideCaptureBand({
        confirmOnly: false,
        candidate: { ...candidateFor(1.01) },
        wordlist,
        thresholds,
      }).reason,
    ).toBe("invalid-confidence");
  });

  it("abstains on malformed grammar, bare marks, and invalid thresholds", () => {
    expect(
      decideCaptureBand({
        confirmOnly: false,
        candidate: {
          rawText: "valid#reserved",
          confidenceStatus: "available",
          confidence: 0.99,
        },
        wordlist,
        thresholds,
      }).band,
    ).toBe("abstain");
    expect(
      decideCaptureBand({
        confirmOnly: false,
        candidate: {
          rawText: "",
          confidenceStatus: "not-available",
          confidence: null,
        },
        wordlist,
        thresholds,
      }).band,
    ).toBe("retry");
    expect(
      decideCaptureBand({
        confirmOnly: false,
        candidate: null,
        captureIssue: "bare-mark",
        wordlist,
        thresholds,
      }).band,
    ).toBe("abstain");
    expect(
      decideCaptureBand({
        confirmOnly: false,
        candidate: candidateFor(0.99),
        wordlist,
        thresholds: { acceptMinConfidence: 0.4, retryBelowConfidence: 0.5 },
      }).reason,
    ).toBe("invalid-thresholds");
    expect(
      decideCaptureBand({
        confirmOnly: false,
        candidate: candidateFor(0.99),
        wordlist,
        thresholds: { acceptMinConfidence: -0.1, retryBelowConfidence: 0 },
      }).reason,
    ).toBe("invalid-thresholds");
    expect(
      decideCaptureBand({
        confirmOnly: false,
        candidate: candidateFor(0.99),
        hypothesisCount: 0,
        wordlist,
        thresholds,
      }).reason,
    ).toBe("invalid-hypothesis-count");
  });

  it("keeps a wrong-but-valid observation unchanged; it has no resolver input", () => {
    const random = seeded(31);
    const expected = issueWordCode(wordlist, random).canonical;
    let observed = issueWordCode(wordlist, random).canonical;
    while (observed === expected)
      observed = issueWordCode(wordlist, random).canonical;
    const result = decideCaptureBand({
      confirmOnly: false,
      candidate: {
        rawText: observed.replace(/^zz-|-zz$/g, "").replaceAll("-", " "),
        confidenceStatus: "available",
        confidence: 0.99,
      },
      wordlist,
      thresholds,
    });
    expect(result.band).toBe("accept");
    expect(result.observedCode).toBe(observed);
  });

  it("confirm-only turns only a camera Accept into Clarify (FR-023)", () => {
    const candidate = candidateFor(0.99);
    const base = decideCaptureBand({
      candidate,
      wordlist,
      thresholds,
      confirmOnly: false,
    });
    expect(base.band).toBe("accept");
    expect(
      decideCaptureBand({ candidate, wordlist, thresholds, confirmOnly: true }),
    ).toEqual({
      band: "clarify",
      reason: "confirm-only",
      observedCode: base.observedCode,
    });
    for (const confidence of [0.3, 0.6]) {
      const input = {
        candidate: candidateFor(confidence),
        wordlist,
        thresholds,
      };
      expect(decideCaptureBand({ ...input, confirmOnly: true })).toEqual(
        decideCaptureBand({ ...input, confirmOnly: false }),
      );
    }
  });
});
