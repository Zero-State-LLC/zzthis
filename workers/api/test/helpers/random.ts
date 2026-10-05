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
