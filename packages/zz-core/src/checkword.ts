import type { Wordlist } from "./wordlist.ts";

// Two data words and one check word (spec 003 Prototype defaults, Q27).
export const ISSUED_PARTS = 3;

export type CheckResult =
  | { readonly result: "ok" | "check-mismatch" | "wrong-length" }
  | { readonly result: "unknown-word"; readonly position: number };

// With N prime, one wrong word in any position changes the result (Q30).
export function checkIndex(
  first: number,
  second: number,
  size: number,
): number {
  return (first + 2 * second) % size;
}

function matches(indexes: readonly number[], size: number): boolean {
  const [first, second, check] = indexes;
  return (
    first !== undefined &&
    second !== undefined &&
    checkIndex(first, second, size) === check
  );
}

// FR-018: exactly one of ok, check-mismatch, unknown-word, wrong-length.
// Positions count from 1, as the classifier's do.
export function verifyCheckWord(
  parts: readonly string[],
  list: Wordlist,
): CheckResult {
  const indexes: number[] = [];
  for (const [position, part] of parts.entries()) {
    const index = list.index.get(part);
    if (index === undefined) {
      return { result: "unknown-word", position: position + 1 };
    }
    indexes.push(index);
  }
  if (indexes.length !== ISSUED_PARTS) return { result: "wrong-length" };
  const ok = matches(indexes, list.words.length);
  return { result: ok ? "ok" : "check-mismatch" };
}
