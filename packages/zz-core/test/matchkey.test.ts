import { describe, expect, it } from "vitest";
import { parseCode, type ParseSuccess } from "../src/grammar.ts";
import { fieldMatchingKey, resolveMatchKey } from "../src/matchkey.ts";

function parsed(input: string): ParseSuccess {
  const result = parseCode(input);
  if (!result.ok) throw new Error(result.reason);
  return result;
}

describe("fieldMatchingKey (G10)", () => {
  it("covers the parts only and joins digit runs after the fold", () => {
    expect(fieldMatchingKey(["bravo", "one", "two", "smith", "1"])).toBe(
      "8rav0-12-5m1th-1",
    );
  });
});

describe("resolveMatchKey (spec 005 Resolve step 6)", () => {
  it("keys a word code on its canonical form", () => {
    expect(resolveMatchKey(parsed("zz-copper-lantern-sky-zz"))).toBe(
      "zz-copper-lantern-sky-zz",
    );
    expect(resolveMatchKey(parsed("zz"))).toBe("zz");
  });

  it("gives a name and the same name written as a handle one key", () => {
    const name = resolveMatchKey(parsed("zz-vitalik.eth-zz"));
    expect(resolveMatchKey(parsed("zz-@vitalik.eth-zz"))).toBe(name);
  });

  it("folds lookalike handles together and keeps other handles apart", () => {
    expect(resolveMatchKey(parsed("zz-@b0b-zz"))).toBe(
      resolveMatchKey(parsed("zz-@bob-zz")),
    );
    expect(resolveMatchKey(parsed("zz-@bob-zz"))).not.toBe(
      resolveMatchKey(parsed("zz-bob-zz")),
    );
  });
});
