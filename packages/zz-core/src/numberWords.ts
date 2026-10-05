// The number words zero to nine. G10 step 2 turns them into digits, the G1
// near-word check treats them as parts with a digit (D-2026-10-04-08), and
// spec 003 filter (3) drops them from the list.
export const NUMBER_WORDS: readonly string[] = [
  "zero",
  "one",
  "two",
  "three",
  "four",
  "five",
  "six",
  "seven",
  "eight",
  "nine",
];
