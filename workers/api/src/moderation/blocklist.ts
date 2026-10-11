// FR-024: ZZ_BLOCKLIST holds lowercase terms, one per line, kept out of the
// repo. Title and body are checked case-folded, on whole words.

export interface Blocklist {
  readonly terms: readonly string[];
  matches(text: string): boolean;
}

// RM-039: format characters (general category Cf, such as a zero-width
// space) are removed before matching, so they cannot split a term.
function fold(text: string): string {
  return text
    .normalize("NFKC")
    .replace(/\p{Cf}/gu, "")
    .toLowerCase();
}

function escaped(term: string): string {
  return term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function parseBlocklist(raw: string | undefined): Blocklist {
  const terms = [
    ...new Set(
      (raw ?? "")
        .split("\n")
        .map((line) => fold(line.trim()))
        .filter((line) => line !== ""),
    ),
  ];
  if (terms.length === 0) return { terms, matches: () => false };
  // A term is a whole word when no letter or digit touches either end.
  const pattern = new RegExp(
    `(?<![\\p{L}\\p{N}])(?:${terms.map(escaped).join("|")})(?![\\p{L}\\p{N}])`,
    "u",
  );
  return { terms, matches: (text) => pattern.test(fold(text)) };
}
