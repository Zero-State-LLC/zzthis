import { classifyCode } from "./classify.ts";
import { parseCode, type ParseFailure, type ParseSuccess } from "./grammar.ts";
import { verifyCheckWord } from "./checkword.ts";
import type { Wordlist } from "./wordlist.ts";

export type DecisionBand = "accept" | "clarify" | "retry" | "abstain";

export interface DecisionBandThresholds {
  readonly acceptMinConfidence: number;
  readonly retryBelowConfidence: number;
}

export interface DecisionBandCandidate {
  readonly rawText: string;
  readonly confidenceStatus: "available" | "not-available";
  readonly confidence: number | null;
}

export type CaptureIssue =
  "missing-marker" | "cutoff-marker" | "blur" | "glare" | "bare-mark";

export interface DecisionBandInput {
  readonly candidate: DecisionBandCandidate | null;
  readonly hypothesisCount?: number;
  readonly captureIssue?: CaptureIssue | null;
  readonly wordlist: Wordlist | null;
  readonly thresholds: DecisionBandThresholds;
}

export interface DecisionBandResult {
  readonly band: DecisionBand;
  readonly reason: string;
  /** The decoded observation, never changed using resolver or ground-truth data. */
  readonly observedCode: string | null;
}

function result(
  band: DecisionBand,
  reason: string,
  observedCode: string | null = null,
): DecisionBandResult {
  return { band, reason, observedCode };
}

function validThresholds(thresholds: DecisionBandThresholds): boolean {
  return (
    Number.isFinite(thresholds.acceptMinConfidence) &&
    Number.isFinite(thresholds.retryBelowConfidence) &&
    thresholds.acceptMinConfidence >= 0 &&
    thresholds.retryBelowConfidence >= 0 &&
    thresholds.retryBelowConfidence <= 1 &&
    thresholds.acceptMinConfidence <= 1 &&
    thresholds.retryBelowConfidence < thresholds.acceptMinConfidence
  );
}

function captureIssueResult(issue: CaptureIssue): DecisionBandResult {
  return issue === "bare-mark"
    ? result("abstain", "bare-mark")
    : result("retry", issue);
}

function parseFailureResult(reason: ParseFailure): DecisionBandResult {
  return result("abstain", `grammar:${reason}`);
}

function confidenceResult(
  candidate: DecisionBandCandidate,
  canonical: string,
  thresholds: DecisionBandThresholds,
): DecisionBandResult {
  if (candidate.confidenceStatus === "not-available") {
    return candidate.confidence === null
      ? result("clarify", "confidence-unavailable", canonical)
      : result("abstain", "confidence-status-mismatch", canonical);
  }
  const confidence = candidate.confidence;
  if (
    confidence === null ||
    !Number.isFinite(confidence) ||
    confidence < 0 ||
    confidence > 1
  ) {
    return result("abstain", "invalid-confidence", canonical);
  }
  if (confidence < thresholds.retryBelowConfidence) {
    return result("retry", "confidence-below-retry-threshold", canonical);
  }
  if (confidence < thresholds.acceptMinConfidence) {
    return result("clarify", "confidence-below-accept-threshold", canonical);
  }
  return result("accept", "word-code-passed", canonical);
}

function parsedCandidateResult(
  parsed: ParseSuccess,
  input: DecisionBandInput & { candidate: DecisionBandCandidate },
): DecisionBandResult {
  if (parsed.kind === "handle" || parsed.kind === "name") {
    return result(
      "clarify",
      `manual-confirmation:${parsed.kind}`,
      parsed.canonical,
    );
  }
  if (input.wordlist === null) {
    return result("clarify", "wordlist-unavailable", parsed.canonical);
  }
  const classification = classifyCode(parsed, input.wordlist);
  if (classification.class !== "word") {
    return result(
      "clarify",
      `manual-confirmation:${classification.class}`,
      parsed.canonical,
    );
  }
  const check = verifyCheckWord(parsed.words, input.wordlist);
  if (check.result === "wrong-length") {
    return result("abstain", "checkword:wrong-length", parsed.canonical);
  }
  if (check.result !== "ok") {
    return result("clarify", `checkword:${check.result}`, parsed.canonical);
  }
  return confidenceResult(input.candidate, parsed.canonical, input.thresholds);
}

/**
 * Apply the shared v1 capture bands to one engine-ordered hypothesis.
 * Confidence is the adapter's conservative minimum across payload parts.
 * This function has no resolver, network, or ground-truth input.
 */
export function decideCaptureBand(
  input: DecisionBandInput,
): DecisionBandResult {
  if (input.captureIssue !== undefined && input.captureIssue !== null) {
    return captureIssueResult(input.captureIssue);
  }
  if (input.candidate === null || input.candidate.rawText.trim() === "") {
    return result("retry", "no-candidate");
  }
  if (!validThresholds(input.thresholds)) {
    return result("abstain", "invalid-thresholds");
  }
  if (
    input.hypothesisCount !== undefined &&
    (!Number.isInteger(input.hypothesisCount) || input.hypothesisCount < 1)
  ) {
    return result("abstain", "invalid-hypothesis-count");
  }
  if ((input.hypothesisCount ?? 1) > 1) {
    return result("clarify", "multiple-hypotheses");
  }

  const parsed = parseCode(`zz-${input.candidate.rawText}-zz`);
  if (!parsed.ok) return parseFailureResult(parsed.reason);
  return parsedCandidateResult(parsed, {
    ...input,
    candidate: input.candidate,
  });
}
