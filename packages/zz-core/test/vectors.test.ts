import { describe, expect, it } from "vitest";
import vectors from "../../../specs/003-wordlist-checkword/vectors.json" with { type: "json" };
import { verifyCheckWord } from "../src/checkword.ts";
import { classifyCode, type Classification } from "../src/classify.ts";
import { decideCaptureBand, decideTypedBand } from "../src/decisionBand.ts";
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

interface CameraBandRow {
  readonly name: string;
  readonly source: "camera";
  readonly canonical: string;
  readonly rows: readonly { token: string; line: number; confidence: number }[];
  readonly confirm_only?: boolean;
  readonly band: string;
}

interface TypedBandRow {
  readonly name: string;
  readonly source: "typed";
  readonly input: string;
  readonly confirm_only?: boolean;
  readonly band: string;
}

type BandRow = CameraBandRow | TypedBandRow;

function bandRowInput(row: BandRow): string {
  return JSON.stringify(
    row.source === "camera" ? [row.canonical, row.rows] : row.input,
  );
}

describe("capture-band vectors", () => {
  const table = vectors.capture_band;
  const rows = table.rows as readonly BandRow[];
  const list = loadWordlist("fixture-7");
  const thresholds = {
    acceptMinConfidence: table.thresholds.accept_min_confidence,
    retryBelowConfidence: table.thresholds.retry_below_confidence,
  };

  it("uses the fixture-7 list and the prototype thresholds", () => {
    expect(table.wordlist).toBe("fixture-7");
    expect(list.words).toEqual(vectors.check_word.wordlist);
    expect(thresholds).toEqual({
      acceptMinConfidence: 0.8,
      retryBelowConfidence: 0.5,
    });
  });

  it("pairs every row with a confirm_only counterpart (FR-023)", () => {
    const base = rows.filter((row) => row.confirm_only !== true);
    const flagged = rows.filter((row) => row.confirm_only === true);
    expect(flagged).toHaveLength(base.length);
    for (const row of base) {
      const twins = flagged.filter(
        (other) =>
          other.source === row.source &&
          bandRowInput(other) === bandRowInput(row),
      );
      expect(twins, row.name).toHaveLength(1);
      const expected =
        row.source === "camera" && row.band === "accept" ? "clarify" : row.band;
      expect(twins[0]!.band, row.name).toBe(expected);
    }
    expect(
      base.some((row) => row.source === "camera" && row.band === "accept"),
    ).toBe(true);
  });

  for (const row of rows) {
    it(row.name, () => {
      if (row.source === "typed") {
        expect(decideTypedBand({ text: row.input, wordlist: list }).band).toBe(
          row.band,
        );
        return;
      }
      const decided = decideCaptureBand({
        candidate: {
          rawText: row.rows.map((part) => part.token).join(" "),
          confidenceStatus: "available",
          confidence: Math.min(...row.rows.map((part) => part.confidence)),
        },
        wordlist: list,
        thresholds,
        confirmOnly: row.confirm_only === true,
      });
      expect(decided.band).toBe(row.band);
      expect(decided.observedCode).toBe(row.canonical);
    });
  }
});
