// Levenshtein distance over lowercase ASCII letters: insert, delete, or
// substitute one letter, each costing 1, so a swap of two letters costs 2
// (spec 003 FR-003, D-2026-10-04-05). The list filter, FR-003, and the G1
// near-word check all use this one function.
export function levenshtein(a: string, b: string): number {
  const other = [...b];
  let previous = Array.from({ length: other.length + 1 }, (_, index) => index);
  let last = other.length;
  for (const [i, letter] of [...a].entries()) {
    let diagonal = i;
    let left = i + 1;
    const current = [left];
    for (const [j, above] of previous.slice(1).entries()) {
      const cost = letter === other[j] ? 0 : 1;
      left = Math.min(above + 1, left + 1, diagonal + cost);
      diagonal = above;
      current.push(left);
    }
    previous = current;
    last = left;
  }
  return last;
}
