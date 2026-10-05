import { checkIndex } from "./checkword.ts";
import { formatCode } from "./grammar.ts";
import { wordAt, type Wordlist } from "./wordlist.ts";

// A source of uniform 32-bit unsigned integers.
export type RandomUint32 = () => number;

export interface IssuedCode {
  readonly canonical: string;
  readonly words: readonly string[];
  readonly indexes: readonly number[];
}

const RANGE = 2 ** 32;

export function cryptoUint32(): number {
  const bytes = crypto.getRandomValues(new Uint8Array(4));
  return new DataView(bytes.buffer).getUint32(0);
}

// Rejection sampling, so no index is more likely than another.
export function uniformIndex(size: number, random: RandomUint32): number {
  const limit = RANGE - (RANGE % size);
  for (;;) {
    const value = random();
    if (value < limit) return value % size;
  }
}

// The issuer rule redraws the only cases where a swap goes undetected or a
// word repeats (spec 003, Issuer rule).
export function issuable(first: number, second: number, size: number): boolean {
  const check = checkIndex(first, second, size);
  return (
    first !== second &&
    second !== 0 &&
    (first + second) % size !== 0 &&
    check !== first &&
    check !== second
  );
}

export function drawIndexes(size: number, random: RandomUint32): number[] {
  for (;;) {
    const first = uniformIndex(size, random);
    const second = uniformIndex(size, random);
    if (issuable(first, second, size)) {
      return [first, second, checkIndex(first, second, size)];
    }
  }
}

export function issueWordCode(
  list: Wordlist,
  random: RandomUint32 = cryptoUint32,
): IssuedCode {
  const indexes = drawIndexes(list.words.length, random);
  const words = indexes.map((index) => wordAt(list, index));
  return { canonical: formatCode(words), words, indexes };
}
