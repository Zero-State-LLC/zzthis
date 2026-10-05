import { WORDLISTS } from "./generated/wordlists.ts";

// A list version id, such as fixture-7 or proto-v0 (spec 003 FR-017).
export type WordlistVersion = keyof typeof WORDLISTS;

export interface Wordlist {
  readonly version: string;
  readonly words: readonly string[];
  readonly index: ReadonlyMap<string, number>;
}

export function makeWordlist(
  version: string,
  words: readonly string[],
): Wordlist {
  return {
    version,
    words,
    index: new Map(words.map((word, position) => [word, position])),
  };
}

export function isWordlistVersion(value: string): value is WordlistVersion {
  return Object.hasOwn(WORDLISTS, value);
}

// Line order is the index (spec 003, Version id).
export function loadWordlist(version: WordlistVersion): Wordlist {
  return makeWordlist(version, WORDLISTS[version].split("\n"));
}

export function wordAt(list: Wordlist, index: number): string {
  const word = list.words[index];
  if (word === undefined) {
    throw new RangeError(`${list.version} has no word at index ${index}`);
  }
  return word;
}
