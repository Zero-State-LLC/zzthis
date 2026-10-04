import { parseCode, type ParseFailure } from "./grammar";

// Exact match only. A miss never reveals other codes: no "did you mean",
// no nearest-code ranking (constitution principle III, issue #12).
export type ResolveResult<T> =
  | { kind: "resolved"; code: T }
  | { kind: "abstain-unknown" }
  | { kind: "abstain-bare" }
  | { kind: "abstain-malformed"; reason: ParseFailure };

export function resolve<T extends { code: string }>(
  input: string,
  codes: readonly T[],
): ResolveResult<T> {
  const parsed = parseCode(input);
  if (!parsed.ok) {
    return { kind: "abstain-malformed", reason: parsed.reason };
  }
  if (parsed.kind === "bare") return { kind: "abstain-bare" };
  const exact = codes.find((entry) => entry.code === parsed.canonical);
  return exact === undefined
    ? { kind: "abstain-unknown" }
    : { kind: "resolved", code: exact };
}
