// The spec 003 pipeline: ordered filters over the pinned EFF long wordlist,
// each with its count, ending in the list and its yield report (US1,
// FR-004, FR-019, Prototype defaults). Pure apart from hashing, so the test
// can rebuild the committed files byte for byte.
import { createHash } from "node:crypto";
import { levenshtein } from "../src/distance.ts";
import { NUMBER_WORDS } from "../src/numberWords.ts";

export const VERSION = "proto-v0";
export const SOURCE_URL =
  "https://www.eff.org/files/2016/07/18/eff_large_wordlist.txt";
export const SOURCE_SHA256 =
  "addd35536511597a02fa0a9ff1e5284677b8883b83e986e43f15a3db996b903e";
export const SOURCE_PATH =
  "packages/zz-core/wordlists/source/eff_large_wordlist.txt";
export const MIN_SIZE = 1000;
const MIN_DISTANCE = 3;
const DROPPED = ["zz", "fn", "run", ...NUMBER_WORDS];
const LOWERCASE = /^[a-z]+$/;

export interface Removed {
  readonly word: string;
  readonly filter: number;
  readonly collided_with?: string;
}

export interface FilterRow {
  readonly step: number;
  readonly name: string;
  readonly rule: string;
  readonly status: "run" | "skipped";
  readonly count_in: number;
  readonly removed: number;
  readonly count_out: number;
}

export interface Report {
  readonly version: string;
  readonly source: {
    readonly url: string;
    readonly sha256: string;
    readonly path: string;
    readonly lines: number;
    readonly unique_words: number;
  };
  readonly blocklist: "not applied";
  readonly filters: readonly FilterRow[];
  readonly final_size: number;
  readonly code_space: number;
  readonly issuable_codes: number;
  readonly needed_size: number;
  readonly gap: number;
  readonly removed_words: readonly Removed[];
}

export interface PipelineOutput {
  readonly words: readonly string[];
  readonly report: Report;
  readonly list: string;
  readonly reportJson: string;
  readonly reportMarkdown: string;
}

interface Step {
  readonly name: string;
  readonly rule: string;
  readonly run?: (words: readonly string[]) => Kept;
}

interface Kept {
  readonly kept: string[];
  readonly removed: Omit<Removed, "filter">[];
}

function keepIf(
  words: readonly string[],
  test: (word: string) => boolean,
): Kept {
  const kept: string[] = [];
  const removed: Omit<Removed, "filter">[] = [];
  for (const word of words) {
    if (test(word)) kept.push(word);
    else removed.push({ word });
  }
  return { kept, removed };
}

function byLengthThenAlphabet(a: string, b: string): number {
  return a.length - b.length || (a < b ? -1 : a > b ? 1 : 0);
}

// Filter (6): sort by length, then alphabetically, and keep a word only
// when it is at least 3 from every word already kept. Words that differ in
// length by 3 or more are at least 3 apart, so only nearby lengths compare.
function spreadApart(words: readonly string[]): Kept {
  const byLength = new Map<number, string[]>();
  const kept: string[] = [];
  const removed: Omit<Removed, "filter">[] = [];
  for (const word of [...words].sort(byLengthThenAlphabet)) {
    const nearby = [-2, -1, 0].flatMap(
      (offset) => byLength.get(word.length + offset) ?? [],
    );
    const collision = nearby.find(
      (other) => levenshtein(word, other) < MIN_DISTANCE,
    );
    if (collision !== undefined) {
      removed.push({ word, collided_with: collision });
      continue;
    }
    kept.push(word);
    byLength.set(word.length, [...(byLength.get(word.length) ?? []), word]);
  }
  return { kept, removed };
}

function isPrime(value: number): boolean {
  if (value < 2) return false;
  for (let divisor = 2; divisor * divisor <= value; divisor += 1) {
    if (value % divisor === 0) return false;
  }
  return true;
}

export function largestPrimeAtMost(value: number): number {
  let candidate = value;
  while (candidate >= 2 && !isPrime(candidate)) candidate -= 1;
  return candidate;
}

function firstPrimeCount(words: readonly string[]): Kept {
  const size = largestPrimeAtMost(words.length);
  return {
    kept: words.slice(0, size),
    removed: words.slice(size).map((word) => ({ word })),
  };
}

const STEPS: readonly Step[] = [
  {
    name: "lowercase a to z only",
    rule: "every letter is a to z",
    run: (words) => keepIf(words, (word) => LOWERCASE.test(word)),
  },
  {
    name: "length",
    rule: "3 to 8 letters",
    run: (words) =>
      keepIf(words, (word) => word.length >= 3 && word.length <= 8),
  },
  {
    name: "reserved words",
    rule: "not zz, fn, run, or a number word zero to nine",
    run: (words) => keepIf(words, (word) => !DROPPED.includes(word)),
  },
  { name: "letter shapes", rule: "not run in proto-v0 (Q35)" },
  { name: "sounds", rule: "not run in proto-v0 (Q35)" },
  {
    name: "edit distance",
    rule: "Levenshtein distance at least 3 from every word kept before it, in length then alphabetical order",
    run: spreadApart,
  },
  {
    name: "prime size",
    rule: "keep the first N words, N the largest prime not above the count",
    run: firstPrimeCount,
  },
];

// Reads the word after the tab, trims it, and lowercases it. Two words that
// differ only by case collapse to one entry before filtering.
export function readSource(text: string): {
  lines: number;
  words: string[];
} {
  const lines = text.split("\n").filter((line) => line !== "");
  const words = lines.map((line) =>
    line
      .slice(line.indexOf("\t") + 1)
      .trim()
      .toLowerCase(),
  );
  return { lines: lines.length, words: [...new Set(words)] };
}

// FR-016 on the output list: lowercase a to z, unique, and no marker or
// macro prefix. A failure here is a pipeline bug.
export function checkOutputList(words: readonly string[]): void {
  const bad = words.find(
    (word) => !LOWERCASE.test(word) || ["zz", "fn", "run"].includes(word),
  );
  if (bad !== undefined) throw new Error(`FR-016: ${bad} is not allowed`);
  if (new Set(words).size !== words.length) {
    throw new Error("FR-016: the list repeats a word");
  }
}

function applySteps(start: readonly string[]): {
  words: string[];
  filters: FilterRow[];
  removedWords: Removed[];
} {
  let words = [...start];
  const filters: FilterRow[] = [];
  const removedWords: Removed[] = [];
  for (const [index, step] of STEPS.entries()) {
    if (words.length === 0) {
      throw new Error(`filter ${index + 1} received an empty list`);
    }
    const result = step.run?.(words) ?? { kept: words, removed: [] };
    filters.push({
      step: index + 1,
      name: step.name,
      rule: step.rule,
      status: step.run === undefined ? "skipped" : "run",
      count_in: words.length,
      removed: result.removed.length,
      count_out: result.kept.length,
    });
    removedWords.push(
      ...result.removed.map((entry) => ({ ...entry, filter: index + 1 })),
    );
    words = result.kept;
  }
  return { words, filters, removedWords };
}

function markdownCell(value: string | number | undefined): string {
  return value === undefined ? "" : String(value);
}

export function renderMarkdown(report: Report): string {
  const filterRows = report.filters.map(
    (row) =>
      `| ${row.step} | ${row.name} | ${row.rule} | ${row.status} | ${row.count_in} | ${row.removed} | ${row.count_out} |`,
  );
  const removedRows = report.removed_words.map(
    (row) =>
      `| ${row.word} | ${row.filter} | ${markdownCell(row.collided_with)} |`,
  );
  return [
    `# Yield report: ${report.version}`,
    "",
    "Generated by `packages/zz-core/scripts/build-wordlist.ts` (spec 003 pipeline). Do not edit. The same data is in `proto-v0.report.json`.",
    "",
    `- Source: ${report.source.url}`,
    `- Source SHA-256: \`${report.source.sha256}\``,
    `- Source copy: \`${report.source.path}\` (${report.source.lines} lines, ${report.source.unique_words} unique words)`,
    `- Blocklist: ${report.blocklist}`,
    "- License: EFF Long Wordlist, CC BY 3.0 US. This list is adapted: filtered and reordered (see NOTICE).",
    "",
    "## Filters",
    "",
    "| Step | Filter | Rule | Status | Count in | Removed | Count out |",
    "|---|---|---|---|---|---|---|",
    ...filterRows,
    "",
    "## Size",
    "",
    "| Item | Value |",
    "|---|---|",
    `| Final size N | ${report.final_size} |`,
    `| Code space N squared (two data words) | ${report.code_space} |`,
    `| Issuable codes under the issuer rule, (N - 1)(N - 2) | ${report.issuable_codes} |`,
    `| Needed size (Q31 prototype floor) | ${report.needed_size} |`,
    `| Gap (N minus the needed size) | ${report.gap} |`,
    "",
    "## Removed words",
    "",
    "| Word | Filter | Collided with |",
    "|---|---|---|",
    ...removedRows,
    "",
  ].join("\n");
}

export function runPipeline(sourceText: string): PipelineOutput {
  const sha256 = createHash("sha256").update(sourceText).digest("hex");
  if (sha256 !== SOURCE_SHA256) {
    throw new Error(`source SHA-256 is ${sha256}, expected ${SOURCE_SHA256}`);
  }
  const source = readSource(sourceText);
  const { words, filters, removedWords } = applySteps(source.words);
  checkOutputList(words);
  if (words.length < MIN_SIZE) {
    throw new Error(`N is ${words.length}, under ${MIN_SIZE}`);
  }
  const size = words.length;
  const report: Report = {
    version: VERSION,
    source: {
      url: SOURCE_URL,
      sha256,
      path: SOURCE_PATH,
      lines: source.lines,
      unique_words: source.words.length,
    },
    blocklist: "not applied",
    filters,
    final_size: size,
    code_space: size * size,
    issuable_codes: (size - 1) * (size - 2),
    needed_size: MIN_SIZE,
    gap: size - MIN_SIZE,
    removed_words: removedWords,
  };
  return {
    words,
    report,
    list: `${words.join("\n")}\n`,
    reportJson: `${JSON.stringify(report, null, 2)}\n`,
    reportMarkdown: renderMarkdown(report),
  };
}
