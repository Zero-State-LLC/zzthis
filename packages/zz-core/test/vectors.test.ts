import { describe, expect, it } from "vitest";
import vectors from "../../../specs/003-wordlist-checkword/vectors.json" with { type: "json" };
import { verifyCheckWord } from "../src/checkword.ts";
import { classifyCode, type Classification } from "../src/classify.ts";
import { parseCode, type ParseSuccess } from "../src/grammar.ts";
import { issuable } from "../src/issuer.ts";
import { fieldMatchingKey } from "../src/matchkey.ts";
import { scanText, type ScanCandidate } from "../src/scanner.ts";
import { loadWordlist, makeWordlist, wordAt } from "../src/wordlist.ts";

// Every row of specs/003-wordlist-checkword/vectors.json (spec 005 T028).
// Do not edit a row to match a bug.

function parsed(input: string): ParseSuccess {
  const result = parseCode(input);
  if (!result.ok) throw new Error(`${input} failed with ${result.reason}`);
  return result;
}

function nearWordsAsRows(classification: Classification) {
  return Object.fromEntries(
    classification.nearWords.map((near) => [
      String(near.position),
      near.candidates,
    ]),
  );
}

function asVectorRow(candidate: ScanCandidate) {
  if (candidate.kind !== "code") return candidate;
  return {
    kind: candidate.kind,
    canonical: candidate.canonical,
    code_kind: candidate.codeKind,
  };
}

describe("grammar vectors", () => {
  it("has no rows left waiting for T035", () => {
    expect(Object.keys(vectors)).not.toContain("grammar_pending");
  });

  for (const row of vectors.grammar) {
    const name = JSON.stringify(row.input).slice(0, 70);
    it(`parses ${name}`, () => {
      const result = parseCode(row.input);
      if ("fail" in row.expect) {
        expect(result).toEqual({ ok: false, reason: row.expect.fail });
        return;
      }
      const code = parsed(row.input);
      expect(code.kind).toBe(row.expect.kind);
      expect(code.canonical).toBe(row.expect.canonical);
      if ("handle" in row.expect) expect(code.handle).toBe(row.expect.handle);
      if ("tag" in row.expect) expect(code.tag).toBe(row.expect.tag);
      if ("qualifiers" in row.expect) {
        expect(code.qualifiers).toEqual(row.expect.qualifiers);
      }
    });
  }
});

describe("classifier vectors", () => {
  const list = makeWordlist("g1a-fixture", vectors.classifier.wordlist);

  it("uses the limit and metric the rows assume", () => {
    expect(vectors.classifier.max_near_distance).toBe(2);
    expect(vectors.classifier.distance).toBe("levenshtein");
  });

  for (const row of vectors.classifier.rows) {
    it(`classifies ${row.input} as ${row.class}`, () => {
      const classification = classifyCode(parsed(row.input), list);
      expect(classification.class).toBe(row.class);
      expect(nearWordsAsRows(classification)).toEqual(row.near_words);
    });
  }
});

describe("matching-key vectors", () => {
  for (const row of vectors.match_key) {
    it(`${row.a} and ${row.b} share a key: ${row.same_key}`, () => {
      const a = fieldMatchingKey(parsed(row.a).words);
      const b = fieldMatchingKey(parsed(row.b).words);
      expect(a === b).toBe(row.same_key);
    });
  }
});

describe("scanner vectors", () => {
  for (const row of vectors.scanner) {
    it(`scans ${JSON.stringify(row.input)}`, () => {
      expect(scanText(row.input).map(asVectorRow)).toEqual(row.candidates);
    });
  }
});

describe("check-word vectors", () => {
  const table = vectors.check_word;
  const list = loadWordlist("fixture-7");

  it("matches the bundled fixture-7 list", () => {
    expect(list.words).toEqual(table.wordlist);
    expect(table.data_words).toBe(2);
  });

  for (const row of table.verify) {
    it(`verifies ${row.input} as ${row.result}`, () => {
      const result = verifyCheckWord(parsed(row.input).words, list);
      expect(result).toEqual({ result: row.result });
    });
  }

  it("lists exactly the codes the issuer rule allows, in index order", () => {
    const size = list.words.length;
    const codes: string[] = [];
    for (let first = 0; first < size; first += 1) {
      for (let second = 0; second < size; second += 1) {
        if (!issuable(first, second, size)) continue;
        const check = (first + 2 * second) % size;
        const words = [first, second, check].map((i) => wordAt(list, i));
        codes.push(`zz-${words.join("-")}-zz`);
      }
    }
    expect(codes).toEqual(table.issuable_codes);
  });

  for (const code of table.issuable_codes) {
    it(`verifies the issuable code ${code}`, () => {
      expect(verifyCheckWord(parsed(code).words, list)).toEqual({
        result: "ok",
      });
    });
  }
});
