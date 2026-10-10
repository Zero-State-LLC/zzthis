import { env } from "cloudflare:workers";
import type { RandomUint32 } from "@zzthis/zz-core";

// A random source that repeats the given values, so a test knows which
// code the issuer draws. On fixture-7 a value k picks index k mod 7, so
// [0, 1] draws zz-copper-lantern-sky-zz and [3, 5] zz-maple-harbor-falcon-zz.
export function repeating(...values: number[]): RandomUint32 {
  let next = 0;
  return () => {
    const value = values[next % values.length] as number;
    next += 1;
    return value;
  };
}

// Plays the given values once, then falls back to crypto randomness.
export function scripted(...values: number[]): RandomUint32 {
  const queue = [...values];
  return () =>
    queue.shift() ?? (crypto.getRandomValues(new Uint32Array(1))[0] as number);
}

const FIXTURE_7 = [
  "copper",
  "lantern",
  "sky",
  "maple",
  "river",
  "harbor",
  "falcon",
];

// The 30 codes the issuer can draw from fixture-7 (spec 003, Issuer rule).
export function fixture7Codes(): string[] {
  const out: string[] = [];
  for (let first = 0; first < 7; first += 1) {
    for (let second = 0; second < 7; second += 1) {
      const check = (first + 2 * second) % 7;
      const issuable =
        first !== second &&
        second !== 0 &&
        (first + second) % 7 !== 0 &&
        check !== first &&
        check !== second;
      if (issuable) {
        out.push(
          `zz-${FIXTURE_7[first]}-${FIXTURE_7[second]}-${FIXTURE_7[check]}-zz`,
        );
      }
    }
  }
  return out;
}

// An issuable fixture-7 code that this database has never stored. A fixed
// index is not safe: a world that mints draws from the same 30 codes, so
// the control code would sometimes be a live one (#152).
export async function unknownCode(): Promise<string> {
  const rows = await env.ZZ_DB.prepare("SELECT canonical FROM codes").all<{
    canonical: string;
  }>();
  const taken = new Set(rows.results.map((row) => row.canonical));
  return fixture7Codes().find((code) => !taken.has(code)) as string;
}
