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
// G2 steps 1, 2, and 6 name these sets exactly (D-2026-10-04-10), so the
// TypeScript, Swift, and Kotlin parsers agree. No Unicode-wide \s or trim().
const BLANK = /^[ \t\r\n]*$/;
const LINE_SPACE = /[\t\r\n]/g;
const EDGE_SPACE = /^ +| +$/g;
const DASHES = /[\u2010-\u2015\u2212]/g;
const ASCII_UPPER = /[A-Z]/g;
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

function lowerAscii(letter: string): string {
  return String.fromCharCode(letter.charCodeAt(0) + 32);
}

function normalize(input: string): string {
  const spaced = input.replace(LINE_SPACE, " ").replace(EDGE_SPACE, "");
  return spaced.replace(DASHES, "-").replace(ASCII_UPPER, lowerAscii);
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
  if (BLANK.test(input)) return fail("empty");
  if (input.length > MAX_INPUT) return fail("too-long");
  const text = normalize(input);
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

export function formatCode(words: readonly string[]): string {
  return `zz-${words.join("-")}-zz`;
}
