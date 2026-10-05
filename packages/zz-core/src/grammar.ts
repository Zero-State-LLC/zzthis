import { isBlank, plainSpaces } from "./whitespace.ts";

export type CodeKind = "plain" | "handle" | "name" | "bare";
export type CodeVariant = "dash" | "circled";

export type ParseFailure =
  | "empty"
  | "too-long"
  | "no-marker"
  | "no-closing-marker"
  | "no-content"
  | "marker-in-body"
  | "unsupported-script"
  | "reserved-symbol"
  | "misplaced-at"
  | "invalid-handle"
  | "invalid-character";

export type ParseSuccess = {
  ok: true;
  kind: CodeKind;
  words: readonly string[];
  variant: CodeVariant;
  canonical: string;
  tag?: string | undefined;
  handle?: string | undefined;
  qualifiers: readonly string[];
};

export type ParseResult = ParseSuccess | { ok: false; reason: ParseFailure };

const MAX_INPUT = 256;
const PLAIN = /^[a-z0-9]+$/;
const NAME = /^[a-z0-9]+(?:\.[a-z0-9]+)*\.eth$/;
const HANDLE_BODY = /^[a-z0-9._]{1,32}$/;
const NON_ASCII_LETTER = /(?![a-z])\p{L}/u;
const RESERVED = /[#$/:]/;
// G2 step 1 (D-2026-10-04-10): the fullwidth forms U+FF01 to U+FF5E sit
// U+FEE0 above their ASCII characters.
const FULLWIDTH = /[\uff01-\uff5e]/g;
const FULLWIDTH_OFFSET = 0xfee0;
const EDGE_SPACE = /^ +| +$/g;
const DASHES = /[\u2010-\u2015\u2212]/g;
// After normalize, every whitespace character is U+0020 and every dash is a
// hyphen, so this is the G2 step 6 separator set.
const SEPARATORS = /[- ]+/;

interface Opened {
  variant: CodeVariant;
  rest: string;
}

interface LocatedAt {
  index: number;
  part: string;
}

function fail(reason: ParseFailure): ParseResult {
  return { ok: false, reason };
}

function fromFullwidth(char: string): string {
  return String.fromCharCode(char.charCodeAt(0) - FULLWIDTH_OFFSET);
}

// G2 step 1, after the guard: map the way the PRECIS UsernameCaseMapped
// profile does, for an ASCII result. Fullwidth forms become ASCII, then NFC,
// so the Kelvin sign U+212A becomes K (D-2026-10-04-10).
function mapped(input: string): string {
  return input.replace(FULLWIDTH, fromFullwidth).normalize("NFC");
}

// G2 steps 2 to 4: every whitespace character is a space and the ends are
// trimmed, dashes are hyphens, and letters take the Unicode lowercase mapping
// without locale rules. A letter that is still not ASCII fails later with
// unsupported-script (earlyFault).
function normalize(text: string): string {
  const spaced = plainSpaces(text).replace(EDGE_SPACE, "");
  return spaced.replace(DASHES, "-").toLowerCase();
}

function opening(text: string): Opened | null {
  if (text.startsWith("(zz)")) {
    return { variant: "circled", rest: text.slice(4) };
  }
  // An @ touching the opening zz is read as separate (D-2026-10-04-04).
  if (text.startsWith("zz@")) {
    return { variant: "dash", rest: text.slice(2) };
  }
  if (/^zz[- ]/.test(text)) {
    return { variant: "dash", rest: text.slice(3) };
  }
  return null;
}

function closing(rest: string): string | "no-closing-marker" | "no-content" {
  if (rest === "zz" || rest === "(zz)") return "no-content";
  if (rest.endsWith("(zz)")) return rest.slice(0, -4);
  if (/[- ]zz$/.test(rest)) return rest.slice(0, -2);
  return "no-closing-marker";
}

// G2 step 5 on the split parts (D-2026-10-04-04): a first part tag@rest
// becomes tag and @rest, and a part that is exactly @ joins the next part.
function splitTagAt(parts: readonly string[]): readonly string[] {
  return parts.flatMap((part, index) => {
    const at = part.indexOf("@");
    if (index > 0 || at < 1 || !PLAIN.test(part.slice(0, at))) return [part];
    return [part.slice(0, at), part.slice(at)];
  });
}

function joinLoneAt(parts: readonly string[]): readonly string[] {
  const joined: string[] = [];
  for (const part of parts) {
    if (joined.at(-1) === "@") joined[joined.length - 1] = `@${part}`;
    else joined.push(part);
  }
  return joined;
}

function soleAt(parts: readonly string[]): LocatedAt | "misplaced" | "none" {
  let found: LocatedAt | "none" = "none";
  for (const [index, part] of parts.entries()) {
    if (!part.includes("@")) continue;
    if (found !== "none") return "misplaced";
    found = { index, part };
  }
  return found;
}

function oneLeadingAt(part: string): boolean {
  return part.startsWith("@") && part.indexOf("@", 1) === -1;
}

function tagPosition(parts: readonly string[], index: number): boolean {
  if (index === 0) return true;
  if (index !== 1) return false;
  let tag = "";
  for (const part of parts) {
    tag = part;
    break;
  }
  return PLAIN.test(tag);
}

function validHandle(part: string): boolean {
  const body = part.slice(1);
  if (!HANDLE_BODY.test(body)) return false;
  if (!/[a-z0-9]/.test(body)) return false;
  if (body.startsWith(".") || body.endsWith(".") || body.includes("..")) {
    return false;
  }
  return true;
}

function atProblem(parts: readonly string[]): ParseFailure | null {
  const found = soleAt(parts);
  if (found === "none") return null;
  if (found === "misplaced") return "misplaced-at";
  if (!oneLeadingAt(found.part)) return "misplaced-at";
  if (!tagPosition(parts, found.index)) return "misplaced-at";
  if (!validHandle(found.part)) return "invalid-handle";
  return null;
}

function qualifiersPlain(parts: readonly string[], skip: number): boolean {
  return parts.every((part, index) => index === skip || PLAIN.test(part));
}

function canonicalOf(parts: readonly string[]): string {
  return `zz-${parts.join("-")}-zz`;
}

function succeedHandle(
  parts: readonly string[],
  variant: CodeVariant,
  found: LocatedAt,
): ParseSuccess {
  const tag = found.index === 1 ? parts[0] : undefined;
  return {
    ok: true,
    kind: "handle",
    words: parts,
    variant,
    canonical: canonicalOf(parts),
    tag,
    handle: found.part,
    qualifiers: parts.slice(found.index + 1),
  };
}

function succeedName(
  parts: readonly string[],
  variant: CodeVariant,
): ParseSuccess {
  return {
    ok: true,
    kind: "name",
    words: parts,
    variant,
    canonical: canonicalOf(parts),
    qualifiers: parts.slice(1),
  };
}

function succeedPlain(
  parts: readonly string[],
  variant: CodeVariant,
): ParseSuccess {
  return {
    ok: true,
    kind: "plain",
    words: parts,
    variant,
    canonical: canonicalOf(parts),
    qualifiers: [],
  };
}

function classifyPlain(
  parts: readonly string[],
  variant: CodeVariant,
): ParseResult {
  for (const first of parts) {
    if (NAME.test(first)) {
      if (!qualifiersPlain(parts, 0)) return fail("invalid-character");
      return succeedName(parts, variant);
    }
    if (!parts.every((part) => PLAIN.test(part))) {
      return fail("invalid-character");
    }
    return succeedPlain(parts, variant);
  }
  return fail("no-content");
}

function classify(parts: readonly string[], variant: CodeVariant): ParseResult {
  const found = soleAt(parts);
  if (typeof found !== "object") return classifyPlain(parts, variant);
  if (!qualifiersPlain(parts, found.index)) return fail("invalid-character");
  return succeedHandle(parts, variant, found);
}

function earlyFault(parts: readonly string[]): ParseFailure | null {
  if (parts.some((part) => part === "zz")) return "marker-in-body";
  if (parts.some((part) => NON_ASCII_LETTER.test(part))) {
    return "unsupported-script";
  }
  if (parts.some((part) => RESERVED.test(part))) return "reserved-symbol";
  return atProblem(parts);
}

export function parseCode(input: string): ParseResult {
  // G2 step 1: the guard counts the raw input in UTF-16 code units, before
  // any mapping. G6 still ranks empty ahead of too-long, and the mapping
  // never turns whitespace into anything else or anything else into
  // whitespace, so a long input that is only whitespace is empty.
  if (input.length > MAX_INPUT) {
    return fail(isBlank(input) ? "empty" : "too-long");
  }
  const prepared = mapped(input);
  if (isBlank(prepared)) return fail("empty");
  const text = normalize(prepared);
  if (text === "zz") {
    return {
      ok: true,
      kind: "bare",
      words: [],
      variant: "dash",
      canonical: "zz",
      qualifiers: [],
    };
  }
  if (text === "(zz)") {
    return {
      ok: true,
      kind: "bare",
      words: [],
      variant: "circled",
      canonical: "zz",
      qualifiers: [],
    };
  }
  const opened = opening(text);
  if (opened === null) return fail("no-marker");
  const body = closing(opened.rest);
  if (body === "no-closing-marker" || body === "no-content") return fail(body);
  const split = body.split(SEPARATORS).filter((part) => part !== "");
  const parts = joinLoneAt(splitTagAt(split));
  const fault = earlyFault(parts);
  if (fault !== null) return fail(fault);
  return classify(parts, opened.variant);
}

export function isNamePart(part: string): boolean {
  return NAME.test(part);
}

export function formatCode(words: readonly string[]): string {
  return `zz-${words.join("-")}-zz`;
}
