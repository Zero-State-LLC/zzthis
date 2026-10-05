import { describe, expect, it } from "vitest";
import { classifyCode, nearCandidates } from "../src/classify.ts";
import { levenshtein } from "../src/distance.ts";
import { parseCode } from "../src/grammar.ts";
import { loadWordlist, makeWordlist } from "../src/wordlist.ts";
import { pick, seeded } from "./random.ts";

const LETTERS = [..."abcdefghijklmnopqrstuvwxyz"];

// One random insert, delete, or substitution: a part at distance 1.
function oneEdit(word: string, random: () => number): string {
  const at = random() % (word.length + 1);
  const letter = pick(LETTERS, random);
  const choice = random() % 3;
  if (choice === 0) return word.slice(0, at) + letter + word.slice(at);
  if (choice === 1 && word.length > 1) {
    const cut = Math.min(at, word.length - 1);
    return word.slice(0, cut) + word.slice(cut + 1);
  }
  const spot = Math.min(at, word.length - 1);
  return word.slice(0, spot) + letter + word.slice(spot + 1);
}

describe("levenshtein (FR-003)", () => {
  it("counts a swap of two letters as 2", () => {
    expect(levenshtein("ab", "ba")).toBe(2);
    expect(levenshtein("", "sky")).toBe(3);
    expect(levenshtein("copper", "")).toBe(6);
    expect(levenshtein("kitten", "sitting")).toBe(3);
  });
});

describe("classifyCode", () => {
  const list = makeWordlist("g1a", ["copper", "lantern", "sky", "maple"]);

  it("passes names through", () => {
    const parsed = parseCode("zz-vitalik.eth-zz");
    expect(parsed.ok && classifyCode(parsed, list).class).toBe("name");
  });

  it("honors a smaller near-word limit", () => {
    const parsed = parseCode("zz-coppr-zz");
    expect(parsed.ok && classifyCode(parsed, list, 0).class).toBe("field");
  });
});

describe("near-word property on proto-v0 (spec 003 T012)", () => {
  const list = loadWordlist("proto-v0");

  it("lists the one word at distance 1 first, and no other at 1", () => {
    const random = seeded(12);
    let checked = 0;
    while (checked < 2_000) {
      const word = pick(list.words, random);
      const part = oneEdit(word, random);
      if (part === word || list.index.has(part)) continue;
      const candidates = nearCandidates(part, list);
      expect(candidates[0]).toBe(word);
      for (const other of candidates.slice(1)) {
        expect(levenshtein(part, other)).toBe(2);
      }
      checked += 1;
    }
  });
});
