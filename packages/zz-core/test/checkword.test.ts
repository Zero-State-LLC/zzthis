import { describe, expect, it } from "vitest";
import { checkIndex, verifyCheckWord } from "../src/checkword.ts";
import { issuable, issueWordCode } from "../src/issuer.ts";
import { loadWordlist, wordAt, type Wordlist } from "../src/wordlist.ts";
import { seeded } from "./random.ts";

// spec 003 US2 and FR-020: every single wrong word and every swap is
// detected over the whole list, not a fixed sample of codes.

function issuableCodes(list: Wordlist): string[][] {
  const size = list.words.length;
  const codes: string[][] = [];
  for (let first = 0; first < size; first += 1) {
    for (let second = 0; second < size; second += 1) {
      if (!issuable(first, second, size)) continue;
      const check = checkIndex(first, second, size);
      codes.push([first, second, check].map((index) => wordAt(list, index)));
    }
  }
  return codes;
}

function replaced(code: readonly string[], position: number, word: string) {
  return code.map((part, index) => (index === position ? word : part));
}

function swapped(code: readonly string[], a: number, b: number): string[] {
  return code.map((part, index) => {
    if (index === a) return code[b] ?? part;
    if (index === b) return code[a] ?? part;
    return part;
  });
}

describe("verifyCheckWord results (FR-018)", () => {
  const list = loadWordlist("fixture-7");

  it("fails with wrong-length when the check word is removed", () => {
    expect(verifyCheckWord(["copper", "lantern"], list)).toEqual({
      result: "wrong-length",
    });
  });

  it("names the position of a part that is not on the list", () => {
    expect(verifyCheckWord(["copper", "coper", "sky"], list)).toEqual({
      result: "unknown-word",
      position: 2,
    });
  });
});

describe("FR-020 (a): exhaustive on fixture-7", () => {
  const list = loadWordlist("fixture-7");
  const codes = issuableCodes(list);

  it("has the 30 issuable codes", () => {
    expect(codes).toHaveLength(30);
  });

  it("detects every single wrong word in every position", () => {
    for (const code of codes) {
      for (const [position, part] of code.entries()) {
        for (const word of list.words.filter((other) => other !== part)) {
          const result = verifyCheckWord(replaced(code, position, word), list);
          expect(result).toEqual({ result: "check-mismatch" });
        }
      }
    }
  });

  it("detects every swap of two words", () => {
    for (const code of codes) {
      for (const [a, b] of [
        [0, 1],
        [0, 2],
        [1, 2],
      ] as const) {
        const result = verifyCheckWord(swapped(code, a, b), list);
        expect(result).toEqual({ result: "check-mismatch" });
      }
    }
  });
});

describe("FR-020 on proto-v0", () => {
  const list = loadWordlist("proto-v0");
  const size = list.words.length;

  it("is one-to-one in each data position when the other is fixed", () => {
    for (const fixed of [0, 1, 1331, size - 1]) {
      const byFirst = new Set(
        list.words.map((_, first) => checkIndex(first, fixed, size)),
      );
      const bySecond = new Set(
        list.words.map((_, second) => checkIndex(fixed, second, size)),
      );
      expect(byFirst.size).toBe(size);
      expect(bySecond.size).toBe(size);
    }
  });

  it("detects 100,000 seeded single-word substitutions and swaps", () => {
    const random = seeded(1003);
    for (let round = 0; round < 100_000; round += 1) {
      const code = issueWordCode(list, random).words;
      const position = random() % 3;
      const offset = 1 + (random() % (size - 1));
      const current = list.index.get(code[position] ?? "") ?? 0;
      const word = wordAt(list, (current + offset) % size);
      const wrong = verifyCheckWord(replaced(code, position, word), list);
      const swap = verifyCheckWord(
        swapped(code, position, (position + 1) % 3),
        list,
      );
      expect(wrong.result).toBe("check-mismatch");
      expect(swap.result).toBe("check-mismatch");
    }
  });
});
