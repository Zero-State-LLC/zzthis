import { parseCode, type CodeKind, type ParseFailure } from "./grammar.ts";

// spec 004, Scanner rules 1 to 8: find every marker pair in recognized or
// typed text. The scanner never guesses; the person picks a candidate.
export type ScanCandidate =
  | {
      readonly kind: "code";
      readonly canonical: string;
      readonly codeKind: CodeKind;
    }
  | { readonly kind: "bare" }
  | { readonly kind: "partial"; readonly text: string }
  | {
      readonly kind: "invalid";
      readonly reason: ParseFailure;
      readonly text: string;
    };

// "mark" is zz or (zz), which opens or closes a pair. "open" is a zz@ token,
// which opens a pair but never closes one (rule 4).
type Marker = "mark" | "open";

interface Token {
  readonly text: string;
  readonly before: string;
  readonly endsClause: boolean;
  readonly marker: Marker | null;
}

interface Located {
  readonly index: number;
  readonly token: Token;
}

interface Found {
  readonly start: number;
  readonly candidate: ScanCandidate;
}

const SPACES = /[\r\n\t\p{Zs}]/gu;
const SEPARATOR = /^[- \u2010-\u2015\u2212]$/u;
const HYPHEN_RUN = /^[-\u2010-\u2015\u2212]+$/u;
const CIRCLED_SPLIT = /(\(zz\))/i;
const CIRCLED = /^\(zz\)$/i;
const LEADING = /^[(["'\u201c\u2018]+/u;
const TRAILING = /[)\].,;!?"'\u201d\u2019]+$/u;
const MARK = /^zz$/i;
const OPEN = /^zz@/i;
const OPEN_LENGTH = 3;

function markerOf(text: string): Marker | null {
  if (MARK.test(text)) return "mark";
  return OPEN.test(text) ? "open" : null;
}

// Rule 3: set aside punctuation around a token. A trailing colon is set
// aside only from a bare zz, so the grammar still reports reserved-symbol.
function setAside(piece: string, before: string): Token {
  if (CIRCLED.test(piece)) {
    return { text: piece, before, endsClause: false, marker: "mark" };
  }
  const lead = piece.replace(LEADING, "");
  const trimmed = lead.replace(TRAILING, "");
  const text = /^zz:$/i.test(trimmed) ? trimmed.slice(0, -1) : trimmed;
  const endsClause = text.length < lead.length;
  return { text, before, endsClause, marker: markerOf(text) };
}

function pushPieces(tokens: Token[], raw: string, before: string): void {
  const pieces = raw.split(CIRCLED_SPLIT).filter((piece) => piece !== "");
  for (const [index, piece] of pieces.entries()) {
    tokens.push(setAside(piece, index === 0 ? before : ""));
  }
}

// Rules 1 and 2: spaces, then tokens at spaces and hyphens, with a circled
// (zz) split out of any token. Each token keeps the separators before it.
function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  let before = "";
  let raw = "";
  for (const char of input.replace(SPACES, " ")) {
    if (!SEPARATOR.test(char)) {
      raw += char;
      continue;
    }
    if (raw !== "") {
      pushPieces(tokens, raw, before);
      before = "";
      raw = "";
    }
    before += char;
  }
  if (raw !== "") pushPieces(tokens, raw, before);
  return tokens;
}

function isWord(token: Token): boolean {
  return token.text !== "" && token.marker === null;
}

function joinedToWordBefore(tokens: readonly Token[], index: number): boolean {
  const token = tokens[index];
  const previous = tokens[index - 1];
  return (
    token !== undefined &&
    previous !== undefined &&
    HYPHEN_RUN.test(token.before) &&
    isWord(previous)
  );
}

function joinedToWordAfter(tokens: readonly Token[], index: number): boolean {
  const next = tokens[index + 1];
  return next !== undefined && HYPHEN_RUN.test(next.before) && isWord(next);
}

function holdsContent(token: Token): boolean {
  return token.marker === "open" && token.text.length > OPEN_LENGTH;
}

// Rule 5: two markers in a row form a pair unless one of its four
// exceptions holds.
function formsPair(tokens: readonly Token[], a: Located, b: Located): boolean {
  if (b.token.marker !== "mark" || a.token.endsClause) return false;
  const between = tokens.slice(a.index + 1, b.index);
  if (between.some((token) => token.endsClause)) return false;
  const outerBefore = joinedToWordBefore(tokens, a.index);
  const outerAfter = joinedToWordAfter(tokens, b.index);
  if (outerBefore && outerAfter) return false;
  const empty = between.length === 0 && !holdsContent(a.token);
  return !(empty && (outerBefore || outerAfter));
}

// The grammar input drops the set-aside characters and keeps the
// separators as written (rule 6).
function spanText(tokens: readonly Token[], from: number, to: number): string {
  return tokens
    .slice(from, to)
    .map((token, offset) => (offset === 0 ? "" : token.before) + token.text)
    .join("");
}

function pairCandidate(
  tokens: readonly Token[],
  a: Located,
  b: Located,
): Found {
  const text = spanText(tokens, a.index, b.index + 1);
  const parsed = parseCode(text);
  const candidate: ScanCandidate = parsed.ok
    ? { kind: "code", canonical: parsed.canonical, codeKind: parsed.kind }
    : { kind: "invalid", reason: parsed.reason, text };
  return { start: a.index, candidate };
}

function forwardEnd(tokens: readonly Token[], start: number): number {
  for (const [offset, token] of tokens.slice(start).entries()) {
    if (offset > 0 && token.marker !== null) return start + offset;
    if (token.endsClause) return start + offset + 1;
  }
  return tokens.length;
}

function backwardStart(tokens: readonly Token[], end: number): number {
  let start = end;
  for (const token of tokens.slice(0, end).reverse()) {
    if (token.marker !== null || token.endsClause) break;
    start -= 1;
  }
  return start;
}

function partial(tokens: readonly Token[], from: number, to: number): Found {
  return {
    start: from,
    candidate: { kind: "partial", text: spanText(tokens, from, to) },
  };
}

// Rule 7. A zz or (zz) joined by a hyphen to a word before it reads back
// only. Otherwise a marker reads forward when a word follows it; a zz@
// token holds its own word, which comes before any clause end.
function unpaired(tokens: readonly Token[], m: Located): Found {
  if (m.token.marker === "mark" && joinedToWordBefore(tokens, m.index)) {
    return partial(tokens, backwardStart(tokens, m.index), m.index + 1);
  }
  const next = tokens[m.index + 1];
  const wordFollows = !m.token.endsClause && next !== undefined && isWord(next);
  if (holdsContent(m.token) || wordFollows) {
    return partial(tokens, m.index, forwardEnd(tokens, m.index));
  }
  return { start: m.index, candidate: { kind: "bare" } };
}

// Rule 8: reading order, and each canonical code once. Bare marks,
// partials, and invalid candidates each keep their own entry.
function listInOrder(found: Found[]): ScanCandidate[] {
  const seen = new Set<string>();
  const listed: ScanCandidate[] = [];
  for (const { candidate } of found.sort((a, b) => a.start - b.start)) {
    if (candidate.kind === "code" && seen.has(candidate.canonical)) continue;
    if (candidate.kind === "code") seen.add(candidate.canonical);
    listed.push(candidate);
  }
  return listed;
}

export function scanText(input: string): ScanCandidate[] {
  const tokens = tokenize(input);
  const markers = tokens.flatMap((token, index) =>
    token.marker === null ? [] : [{ index, token }],
  );
  const found: Found[] = [];
  const paired = new Set<number>();
  for (const [position, a] of markers.entries()) {
    const b = markers[position + 1];
    if (b === undefined || !formsPair(tokens, a, b)) continue;
    found.push(pairCandidate(tokens, a, b));
    paired.add(a.index).add(b.index);
  }
  for (const m of markers) {
    if (!paired.has(m.index)) found.push(unpaired(tokens, m));
  }
  return listInOrder(found);
}
