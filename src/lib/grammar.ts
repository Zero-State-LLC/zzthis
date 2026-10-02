export type CodeVariant = "dash" | "circled";

export type ParseFailure =
  "empty" | "no-marker" | "word-count" | "invalid-word";

export type ParseResult =
  | { ok: true; words: string[]; variant: CodeVariant }
  | { ok: false; reason: ParseFailure };

interface Marked {
  variant: CodeVariant;
  body: string;
}

const MIN_WORDS = 2;
const MAX_WORDS = 5;
const WORD = /^[a-z0-9]+$/;

function splitMarkers(text: string): Marked | null {
  if (text.startsWith("(zz)")) {
    return { variant: "circled", body: text.slice(4).replace(/\(zz\)$/, "") };
  }
  if (/^zz[-\s]/.test(text)) {
    return { variant: "dash", body: text.slice(3).replace(/[-\s]zz$/, "") };
  }
  return null;
}

export function parseCode(input: string): ParseResult {
  const text = input.trim().toLowerCase();
  if (text === "") {
    return { ok: false, reason: "empty" };
  }
  const marked = splitMarkers(text);
  if (marked === null) {
    return { ok: false, reason: "no-marker" };
  }
  const words = marked.body.split(/[-\s]+/).filter((word) => word !== "");
  if (words.length < MIN_WORDS || words.length > MAX_WORDS) {
    return { ok: false, reason: "word-count" };
  }
  if (!words.every((word) => WORD.test(word))) {
    return { ok: false, reason: "invalid-word" };
  }
  return { ok: true, words, variant: marked.variant };
}

export function formatCode(words: readonly string[]): string {
  return `zz-${words.join("-")}-zz`;
}
