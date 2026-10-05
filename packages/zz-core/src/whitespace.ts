// docs/SPEC.md Section 2.2a G2 step 1 (D-2026-10-04-10): whitespace is every
// character with the Unicode White_Space property. The list is written out so
// the TypeScript, Swift, and Kotlin libraries agree on any Unicode version.
// It is not \s, which adds U+FEFF and leaves out U+0085, and not trim().
const WHITE_SPACE_CLASS =
  "[\\t\\n\\v\\f\\r \\u0085\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000]";

const WHITE_SPACE = new RegExp(WHITE_SPACE_CLASS, "g");
const BLANK = new RegExp(`^${WHITE_SPACE_CLASS}*$`);

// True when the text is empty or only whitespace.
export function isBlank(text: string): boolean {
  return BLANK.test(text);
}

// Every whitespace character becomes U+0020 (G2 step 2, spec 004 Scanner
// rule 1).
export function plainSpaces(text: string): string {
  return text.replace(WHITE_SPACE, " ");
}
