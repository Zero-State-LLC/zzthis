import { formatCode, parseCode, type ParseFailure } from "./grammar";

export interface Suggestion<T> {
  code: T;
  distance: number;
}

export type ResolveResult<T> =
  | { kind: "resolved"; code: T }
  | { kind: "suggest"; suggestions: Suggestion<T>[] }
  | { kind: "abstain-unknown" }
  | { kind: "abstain-malformed"; reason: ParseFailure };

const MAX_DISTANCE = 2;
const MAX_SUGGESTIONS = 3;

function editDistance<T>(
  a: readonly T[],
  b: readonly T[],
  substitution: (x: T, y: T) => number,
): number {
  const cols = b.map((token, j) => ({ token, up: j + 1 }));
  let result = b.length;
  for (const [i, x] of a.entries()) {
    let diag = i;
    let left = i + 1;
    for (const col of cols) {
      const value = Math.min(
        col.up + 1,
        left + 1,
        diag + substitution(x, col.token),
      );
      diag = col.up;
      col.up = value;
      left = value;
    }
    result = left;
  }
  return result;
}

function charDistance(a: string, b: string): number {
  return editDistance([...a], [...b], (x, y) => (x === y ? 0 : 1));
}

// Word-level Levenshtein. Inserting or deleting a word costs 1. Substituting
// a near-miss spelling (character distance at most a third of the longer
// word, minimum 1) costs 1; any other substitution costs 2.
function wordCost(a: string, b: string): number {
  if (a === b) {
    return 0;
  }
  const limit = Math.max(1, Math.floor(Math.max(a.length, b.length) / 3));
  return charDistance(a, b) <= limit ? 1 : 2;
}

export function wordDistance(
  a: readonly string[],
  b: readonly string[],
): number {
  return editDistance(a, b, wordCost);
}

function bySuggestionOrder<T extends { code: string }>(
  a: Suggestion<T>,
  b: Suggestion<T>,
): number {
  return a.distance - b.distance || a.code.code.localeCompare(b.code.code);
}

export function resolve<T extends { code: string }>(
  input: string,
  codes: readonly T[],
): ResolveResult<T> {
  const parsed = parseCode(input);
  if (!parsed.ok) {
    return { kind: "abstain-malformed", reason: parsed.reason };
  }
  const normalized = formatCode(parsed.words);
  const exact = codes.find((entry) => entry.code === normalized);
  if (exact !== undefined) {
    return { kind: "resolved", code: exact };
  }
  const suggestions = codes
    .flatMap((entry): Suggestion<T>[] => {
      const candidate = parseCode(entry.code);
      return candidate.ok
        ? [
            {
              code: entry,
              distance: wordDistance(parsed.words, candidate.words),
            },
          ]
        : [];
    })
    .filter((suggestion) => suggestion.distance <= MAX_DISTANCE)
    .sort(bySuggestionOrder)
    .slice(0, MAX_SUGGESTIONS);
  return suggestions.length > 0
    ? { kind: "suggest", suggestions }
    : { kind: "abstain-unknown" };
}
