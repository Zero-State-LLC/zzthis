// The photo reader port (spec 005 US5). Q18 picks a reader; until then
// production has none and POST /v1/reads answers 503 not-ready. Tests use a
// port that returns abstain.
export type ReadBand = "accept" | "clarify" | "retry" | "abstain";

export interface ReadOutcome {
  readonly canonical: string | null;
  readonly band: ReadBand;
  readonly reason: string | null;
}

export interface PhotoReader {
  read(photo: Uint8Array, canonical: string | null): Promise<ReadOutcome>;
}
