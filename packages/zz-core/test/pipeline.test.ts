import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  checkOutputList,
  largestPrimeAtMost,
  readSource,
  runPipeline,
  SOURCE_SHA256,
} from "../scripts/wordlist-pipeline.ts";

// FR-019: the same source and settings give byte-identical output, so the
// committed proto-v0 files must equal a fresh run.
const listDir = join(import.meta.dirname, "..", "wordlists");
const read = (name: string) => readFileSync(join(listDir, name), "utf8");

describe("spec 003 pipeline", () => {
  const output = runPipeline(read("source/eff_large_wordlist.txt"));

  it("rebuilds the committed list and reports byte for byte", () => {
    expect(output.list).toBe(read("proto-v0.txt"));
    expect(output.reportJson).toBe(read("proto-v0.report.json"));
    expect(output.reportMarkdown).toBe(read("proto-v0.report.md"));
  });

  it("records the source pin, the skipped filters, and the blocklist", () => {
    expect(output.report.source.sha256).toBe(SOURCE_SHA256);
    expect(output.report.blocklist).toBe("not applied");
    const skipped = output.report.filters.filter(
      (row) => row.status === "skipped",
    );
    expect(skipped.map((row) => row.step)).toEqual([4, 5]);
  });

  it("removes the hyphenated words, five, and zero", () => {
    const early = output.report.removed_words
      .filter((row) => row.filter === 1 || row.filter === 3)
      .map((row) => row.word);
    expect(early).toEqual([
      "drop-down",
      "felt-tip",
      "t-shirt",
      "yo-yo",
      "five",
      "zero",
    ]);
  });

  it("states N and the code space", () => {
    expect(output.report.final_size).toBe(2663);
    expect(output.report.code_space).toBe(2663 * 2663);
  });

  it("fails when the source does not match the pin", () => {
    expect(() => runPipeline("11111\tabacus\n")).toThrow(/SHA-256/);
  });

  it("collapses words that differ only by case", () => {
    expect(readSource("11111\tAbacus\n11112\tabacus\n")).toEqual({
      lines: 2,
      words: ["abacus"],
    });
  });

  it("finds the largest prime at or below a count", () => {
    expect(largestPrimeAtMost(2668)).toBe(2663);
    expect(largestPrimeAtMost(7)).toBe(7);
  });

  it("fails an output list that breaks FR-016", () => {
    expect(() => checkOutputList(["copper", "run"])).toThrow(/FR-016/);
    expect(() => checkOutputList(["copper", "copper"])).toThrow(/repeats/);
  });
});
