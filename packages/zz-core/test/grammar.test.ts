import { describe, expect, it } from "vitest";
import vectors from "../../../specs/003-wordlist-checkword/vectors.json" with { type: "json" };
import {
  formatCode,
  isNamePart,
  parseCode,
  type ParseFailure,
} from "../src/grammar.ts";
import { pick, seeded } from "./random.ts";

// Rows beyond vectors.json that the site's tests also hold, plus the spec
// 003 US3 property tests: idempotence, invariance, and linear time.

const extraFailures: readonly { input: string; reason: ParseFailure }[] = [
  { input: "zz-a@b@c-zz", reason: "misplaced-at" },
  { input: "zz-hello-x@y-zz", reason: "misplaced-at" },
  { input: "zz-1.2-@smith-zz", reason: "misplaced-at" },
  { input: "zz-a_b@c-zz", reason: "misplaced-at" },
  { input: "zz-@_-zz", reason: "invalid-handle" },
  { input: "zz-ai@-zz", reason: "invalid-handle" },
  { input: "zz-@agentsmith-neo!-zz", reason: "invalid-character" },
  { input: "zz-vitalik.eth-wallet!-zz", reason: "invalid-character" },
  { input: "zz-zz@x-zz", reason: "marker-in-body" },
];

const successRows = vectors.grammar.flatMap((row) =>
  "canonical" in row.expect && typeof row.expect.canonical === "string"
    ? [{ input: row.input, canonical: row.expect.canonical }]
    : [],
);

const SEPARATOR_RUN = /[ \t\r\n\u2010-\u2015\u2212-]+/g;
const SEPARATORS = ["-", " ", "--", "  ", " - ", "- -"];
const OPENING = /^(?:\(zz\)|zz)/i;
const CLOSING = /(?:\(zz\)|zz)$/i;

function flipCase(text: string, random: () => number): string {
  return text.replace(/[a-z]/gi, (letter) =>
    random() % 2 === 0 ? letter.toLowerCase() : letter.toUpperCase(),
  );
}

function swapOpening(text: string): string {
  if (text.startsWith("(")) {
    const rest = text.slice(4);
    return /^[-\s@]/.test(rest) ? `zz${rest}` : `zz-${rest}`;
  }
  return `(zz)${text.slice(2)}`;
}

function swapClosing(text: string): string {
  if (text.endsWith(")")) {
    const rest = text.slice(0, -4);
    return /[-\s]$/.test(rest) ? `${rest}zz` : `${rest}-zz`;
  }
  return `${text.slice(0, -2)}(zz)`;
}

function variant(input: string, random: () => number): string {
  let text = input.replace(SEPARATOR_RUN, () => pick(SEPARATORS, random));
  const bare = /^(?:\(zz\)|zz)$/i.test(input);
  if (!bare && OPENING.test(text) && random() % 2 === 0) {
    text = swapOpening(text);
  }
  if (!bare && CLOSING.test(text) && random() % 2 === 0) {
    text = swapClosing(text);
  }
  return flipCase(text, random);
}

describe("parseCode beyond the vectors", () => {
  for (const row of extraFailures) {
    it(`rejects ${row.input} as ${row.reason}`, () => {
      expect(parseCode(row.input)).toEqual({ ok: false, reason: row.reason });
    });
  }

  it("returns a name's qualifiers", () => {
    const parsed = parseCode("zz-vitalik.eth-wallet-zz");
    expect(parsed.ok && parsed.qualifiers).toEqual(["wallet"]);
  });

  it("records circled and dash variants", () => {
    const variants = ["(zz) camp bravo (zz)", "zz-hello-zz", "zz", "(zz)"].map(
      (input) => {
        const parsed = parseCode(input);
        return parsed.ok && parsed.variant;
      },
    );
    expect(variants).toEqual(["circled", "dash", "dash", "circled"]);
  });

  it("formats words and recognizes name parts", () => {
    expect(formatCode(["copper", "lantern", "sky"])).toBe(
      "zz-copper-lantern-sky-zz",
    );
    expect(isNamePart("vitalik.eth")).toBe(true);
    expect(isNamePart("example.com")).toBe(false);
  });
});

describe("parseCode properties (spec 003 US3)", () => {
  it("parses every canonical form back to itself", () => {
    for (const row of successRows) {
      const parsed = parseCode(row.canonical);
      expect(parsed.ok && parsed.canonical).toBe(row.canonical);
    }
  });

  it("ignores case, separator choice, runs, and marker form", () => {
    const random = seeded(20261004);
    for (const row of successRows) {
      for (let round = 0; round < 40; round += 1) {
        const input = variant(row.input, random);
        const parsed = parseCode(input);
        expect(parsed.ok && parsed.canonical, JSON.stringify(input)).toBe(
          row.canonical,
        );
      }
    }
  });

  it("stays linear on random text up to 10,000 characters", () => {
    const random = seeded(7);
    const alphabet = [..."zZ()@-  .#_a1\u00a0\u2013\u212a\uac00\n"];
    const started = performance.now();
    for (let round = 0; round < 500; round += 1) {
      const length = random() % 10_001;
      const text = Array.from({ length }, () => pick(alphabet, random)).join(
        "",
      );
      const parsed = parseCode(text);
      if (text.length > 256 && /[^ \t\r\n]/.test(text)) {
        expect(parsed).toEqual({ ok: false, reason: "too-long" });
      }
    }
    expect(performance.now() - started).toBeLessThan(5_000);
  });
});
