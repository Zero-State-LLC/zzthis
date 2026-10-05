import { levenshtein } from "./distance.ts";
import type { CodeKind, ParseSuccess } from "./grammar.ts";
import { NUMBER_WORDS } from "./numberWords.ts";
import type { Wordlist } from "./wordlist.ts";

// G1: word, field, or confirm for a plain code; the other kinds pass through.
export type CodeClass =
  "word" | "field" | "confirm" | Exclude<CodeKind, "plain">;

export interface NearWord {
  readonly position: number;
  readonly candidates: readonly string[];
}

export interface Classification {
  readonly class: CodeClass;
  readonly nearWords: readonly NearWord[];
}

// A parameter until the real-photo test set measures it (Section 2.2a G1).
export const MAX_NEAR_DISTANCE = 2;

const LETTERS_ONLY = /^[a-z]+$/;

// Every list word within the limit, by distance, then by list index.
export function nearCandidates(
  part: string,
  list: Wordlist,
  limit: number = MAX_NEAR_DISTANCE,
): string[] {
  const found: { word: string; distance: number }[] = [];
  for (const word of list.words) {
    if (Math.abs(word.length - part.length) > limit) continue;
    const distance = levenshtein(part, word);
    if (distance <= limit) found.push({ word, distance });
  }
  found.sort((a, b) => a.distance - b.distance);
  return found.map((entry) => entry.word);
}

function checkedForNearWords(part: string): boolean {
  return LETTERS_ONLY.test(part) && !NUMBER_WORDS.includes(part);
}

export function classifyCode(
  code: ParseSuccess,
  list: Wordlist,
  limit: number = MAX_NEAR_DISTANCE,
): Classification {
  if (code.kind !== "plain") return { class: code.kind, nearWords: [] };
  const nearWords: NearWord[] = [];
  let allListed = true;
  for (const [index, part] of code.words.entries()) {
    if (list.index.has(part)) continue;
    allListed = false;
    if (!checkedForNearWords(part)) continue;
    const candidates = nearCandidates(part, list, limit);
    if (candidates.length > 0) {
      nearWords.push({ position: index + 1, candidates });
    }
  }
  if (nearWords.length > 0) return { class: "confirm", nearWords };
  return { class: allListed ? "word" : "field", nearWords };
}
