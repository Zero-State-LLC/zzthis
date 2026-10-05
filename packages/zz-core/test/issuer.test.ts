import { describe, expect, it } from "vitest";
import { verifyCheckWord } from "../src/checkword.ts";
import { parseCode } from "../src/grammar.ts";
import {
  cryptoUint32,
  drawIndexes,
  issueWordCode,
  uniformIndex,
} from "../src/issuer.ts";
import { loadWordlist } from "../src/wordlist.ts";

function scripted(values: readonly number[]): () => number {
  let next = 0;
  return () => {
    const value = values[next % values.length];
    next += 1;
    return value ?? 0;
  };
}

describe("issuer (spec 003 Issuer rule)", () => {
  it("rejects draws past the last whole multiple of the list size", () => {
    // 2^32 mod 7 is 4, so 2^32 - 4 and above would bias the low indexes.
    const random = scripted([2 ** 32 - 1, 2 ** 32 - 4, 10]);
    expect(uniformIndex(7, random)).toBe(3);
  });

  it("draws again on a repeat, a zero second word, or a weak swap", () => {
    // (3, 3) repeats; (2, 0) has d2 = 0; (2, 5) sums to N; (1, 2) passes.
    const random = scripted([3, 3, 2, 0, 2, 5, 1, 2]);
    expect(drawIndexes(7, random)).toEqual([1, 2, 5]);
  });

  it("issues a canonical code that verifies", () => {
    const list = loadWordlist("fixture-7");
    const issued = issueWordCode(list);
    const parsed = parseCode(issued.canonical);
    expect(parsed.ok && parsed.canonical).toBe(issued.canonical);
    expect(verifyCheckWord(issued.words, list)).toEqual({ result: "ok" });
  });

  it("reads 32-bit values from the platform crypto source", () => {
    const value = cryptoUint32();
    expect(Number.isInteger(value)).toBe(true);
    expect(value).toBeGreaterThanOrEqual(0);
    expect(value).toBeLessThan(2 ** 32);
  });
});
