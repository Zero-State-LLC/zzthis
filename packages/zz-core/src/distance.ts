// Levenshtein distance over lowercase ASCII letters: insert, delete, or
// substitute one letter, each costing 1, so a swap of two letters costs 2
// (spec 003 FR-003, D-2026-10-04-05). The list filter, FR-003, and the G1
// near-word check all use this one function.
export function levenshtein(a: string, b: string): number {
  let row = Array.from({ length: b.length + 1 }, (_, index) => index);
  let last = b.length;
  for (let i = 0; i < a.length; i += 1) {
    const letter = a.charCodeAt(i);
    let diagonal = i;
    let left = i + 1;
    row = row.map((above, j) => {
      if (j === 0) return left;
      const cost = letter === b.charCodeAt(j - 1) ? 0 : 1;
      left = Math.min(above + 1, left + 1, diagonal + cost);
      diagonal = above;
      return left;
    });
    last = left;
  }
  return last;
}
