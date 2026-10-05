import { isNamePart, type ParseSuccess } from "./grammar.ts";
import { NUMBER_WORDS } from "./numberWords.ts";

const DIGITS = /^[0-9]+$/;

function numberToDigit(part: string): string {
  const digit = NUMBER_WORDS.indexOf(part);
  return digit === -1 ? part : String(digit);
}

// Lookalikes fold like Crockford base32: o to 0; i and l to 1; s to 5;
// z to 2; b to 8.
function foldLookalikes(part: string): string {
  return part
    .replace(/o/g, "0")
    .replace(/[il]/g, "1")
    .replace(/s/g, "5")
    .replace(/z/g, "2")
    .replace(/b/g, "8");
}

function joinDigitRuns(parts: readonly string[]): string[] {
  const joined: string[] = [];
  let run = "";
  for (const part of parts) {
    if (DIGITS.test(part)) {
      run += part;
      continue;
    }
    if (run !== "") joined.push(run);
    run = "";
    joined.push(part);
  }
  if (run !== "") joined.push(run);
  return joined;
}

// Section 2.2a G10 over the parts only: number words to digits, then the
// lookalike fold, then runs of all-digit parts joined (D-2026-10-04-09).
export function fieldMatchingKey(parts: readonly string[]): string {
  return joinDigitRuns(parts.map(numberToDigit).map(foldLookalikes)).join("-");
}

function dropNameAt(part: string): string {
  return part.startsWith("@") && isNamePart(part.slice(1))
    ? part.slice(1)
    : part;
}

// spec 005 Resolve step 6: a word code keys on its canonical form; a handle
// or a name keys on G10, with the @ dropped from a handle that is a name.
export function resolveMatchKey(code: ParseSuccess): string {
  if (code.kind === "plain" || code.kind === "bare") return code.canonical;
  return fieldMatchingKey(code.words.map(dropNameAt));
}
