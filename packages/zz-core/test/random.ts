import type { RandomUint32 } from "../src/issuer.ts";

// A seeded 32-bit generator (mulberry32), so property tests repeat exactly.
export function seeded(seed: number): RandomUint32 {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = Math.imul(state ^ (state >>> 15), 1 | state);
    value ^= value + Math.imul(value ^ (value >>> 7), 61 | value);
    return (value ^ (value >>> 14)) >>> 0;
  };
}

export function pick<T>(items: readonly T[], random: RandomUint32): T {
  const item = items[random() % items.length];
  if (item === undefined) throw new Error("pick from an empty list");
  return item;
}
