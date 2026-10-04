import {
  formatCode,
  parseCode,
  type CodeVariant,
  type ParseFailure,
} from "./grammar";
import { resolve, type ResolveResult } from "./resolver";

// A letter outside A-Z. Hangul, kana, Hebrew-script, and accented Latin count.
const NON_ASCII_LETTER = /(?![A-Za-z])\p{L}/u;

export function hasNonAsciiLetter(text: string): boolean {
  return NON_ASCII_LETTER.test(text);
}

export type CandidateRead =
  | { kind: "empty" }
  | { kind: "coming-later" }
  | { kind: "malformed"; reason: ParseFailure }
  | {
      kind: "parsed";
      words: string[];
      variant: CodeVariant;
      normalized: string;
    };

// Non-ASCII letters are a non-error note. grammar.ts and resolver.ts stay unchanged.
export function readCandidate(input: string): CandidateRead {
  if (hasNonAsciiLetter(input)) {
    return { kind: "coming-later" };
  }
  const parsed = parseCode(input);
  if (!parsed.ok) {
    if (parsed.reason === "empty") {
      return { kind: "empty" };
    }
    return { kind: "malformed", reason: parsed.reason };
  }
  return {
    kind: "parsed",
    words: parsed.words,
    variant: parsed.variant,
    normalized: formatCode(parsed.words),
  };
}

export type LookupResult<T> = { kind: "coming-later" } | ResolveResult<T>;

export function lookupCode<T extends { code: string }>(
  input: string,
  codes: readonly T[],
): LookupResult<T> {
  if (hasNonAsciiLetter(input)) {
    return { kind: "coming-later" };
  }
  return resolve(input, codes);
}
