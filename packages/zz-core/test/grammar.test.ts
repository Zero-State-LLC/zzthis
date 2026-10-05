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

// G2 steps 1, 3, and 6 as the spec lists them (D-2026-10-04-10), typed here
// independently of src/whitespace.ts.
const G2_WHITE_SPACE = [
  ..."\t\n\v\f\r \u0085\u00a0\u1680\u2028\u2029\u202f\u205f\u3000",
  ...Array.from({ length: 11 }, (_, i) => String.fromCharCode(0x2000 + i)),
];
const G2_DASHES = [..."-\u2010\u2011\u2012\u2013\u2014\u2015\u2212"];
// U+FF0D, the fullwidth hyphen-minus, maps to the hyphen in G2 step 1.
const G2_SEPARATORS = new Set([...G2_WHITE_SPACE, ...G2_DASHES, "\uff0d"]);

function escaped(char: string): string {
  return `\\u${char.charCodeAt(0).toString(16).padStart(4, "0")}`;
}

const SEPARATOR_RUN = new RegExp(
  `[${[...G2_SEPARATORS].map(escaped).join("")}]+`,
  "g",
);
const SEPARATORS = [
  ..."- \u00a0\u3000\u0085",
  "--",
  "  ",
  " - ",
  "- -",
  "\u2003-\u2028",
];
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

describe("G2 character sets and mapping (D-2026-10-04-10)", () => {
  it("splits parts on exactly the G2 separators", () => {
    const splitOn: string[] = [];
    for (let unit = 0; unit <= 0xffff; unit += 1) {
      if (unit >= 0xd800 && unit <= 0xdfff) continue;
      const char = String.fromCharCode(unit);
      const parsed = parseCode(`zz-a${char}b-zz`);
      if (parsed.ok && parsed.canonical === "zz-a-b-zz") splitOn.push(char);
    }
    expect(splitOn.map(escaped)).toEqual(
      [...G2_SEPARATORS].sort().map(escaped),
    );
  });

  it("trims every White_Space character at the ends, and U+FEFF never", () => {
    const parsed = parseCode("\u3000\u0085zz-copper-zz\u2028\u00a0");
    expect(parsed.ok && parsed.canonical).toBe("zz-copper-zz");
    expect(parseCode("\ufeffzz-copper-zz")).toEqual({
      ok: false,
      reason: "no-marker",
    });
    expect(parseCode("zz-copper-zz\ufeff")).toEqual({
      ok: false,
      reason: "no-closing-marker",
    });
  });

  it("reads input that is only whitespace as empty, ahead of too-long (G6)", () => {
    for (const input of ["\u2028\u3000\u00a0", "\u3000".repeat(300)]) {
      expect(parseCode(input)).toEqual({ ok: false, reason: "empty" });
    }
    expect(parseCode(`${"\u3000".repeat(300)}zz`)).toEqual({
      ok: false,
      reason: "too-long",
    });
  });

  it("counts the raw input, before NFC changes its length", () => {
    // 258 raw code units, which NFC would shrink to 132.
    expect(parseCode(`zz-${"e\u0301".repeat(126)}-zz`)).toEqual({
      ok: false,
      reason: "too-long",
    });
    // 256 raw code units, which NFC grows to 506: the guard does not rerun.
    expect(parseCode(`zz-${"\u0958".repeat(250)}-zz`)).toEqual({
      ok: false,
      reason: "unsupported-script",
    });
  });

  it("maps fullwidth forms before NFC, then lowercases", () => {
    // Fullwidth capitals, written as escapes (Section 2.2a G7).
    const capitals = parseCode(
      "\uff3a\uff3a\uff0d\uff23\uff2f\uff30\uff30\uff25\uff32\uff0d\uff3a\uff3a",
    );
    expect(capitals.ok && capitals.canonical).toBe("zz-copper-zz");
    // A fullwidth e becomes e first, so NFC composes it with U+0301.
    expect(parseCode("zz-caf\uff45\u0301-zz")).toEqual({
      ok: false,
      reason: "unsupported-script",
    });
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
      if (text.length > 256 && /[^\p{White_Space}]/u.test(text)) {
        expect(parsed).toEqual({ ok: false, reason: "too-long" });
      }
    }
    expect(performance.now() - started).toBeLessThan(5_000);
  });
});
