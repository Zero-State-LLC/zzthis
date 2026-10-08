import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { scoreQualificationObservations } from "../scripts/ocr-qualification-scoring-pipeline.mjs";

function fixture(name: string) {
  return JSON.parse(
    readFileSync(
      new URL(
        `../specs/004-capture/qualification/${name}.json`,
        import.meta.url,
      ),
      "utf8",
    ),
  );
}

function inputs() {
  const candidateBundle = fixture("fixture-candidate-bundle");
  // The fixture corpus uses the repository's synthetic wordlist. Bind the
  // scorer to that actual local decoder version instead of the schema label.
  candidateBundle.decoder.wordlist_version = "fixture-7";
  return {
    manifest: fixture("fixture-manifest"),
    deviceMatrix: fixture("fixture-device-matrix"),
    candidateBundle,
    gateConfig: fixture("fixture-gate-config"),
    adapterResults: fixture("fixture-adapter-results"),
  };
}

describe("OCR qualification scoring pipeline", () => {
  it("recomputes all existing score domains and keeps the result non-authorizing", () => {
    const result = scoreQualificationObservations(inputs());

    expect(result.receipt_ready).toBe(false);
    expect(result.promotion_eligible).toBe(false);
    expect(result.gate_evaluation.gate_results).toHaveLength(8);
    expect(
      result.gate_evaluation.gate_results.every(
        ({ split }) => split === "final",
      ),
    ).toBe(true);
    expect(
      result.aggregates.fiducial.by_split.tuning.endpoint_recall.rate,
    ).toBe(1);
    expect(result.aggregates.roi_latency.by_split.tuning.latency_ms?.p50).toBe(
      12.5,
    );
    expect(
      result.aggregates.text.by_split.tuning.exact_code_accuracy.rate,
    ).toBe(1);
    expect(result.scored_observations[0]?.band).toEqual({
      band: "accept",
      reason: "word-code-passed",
    });
    expect(
      result.aggregates.band_distribution.by_split.tuning.distribution.accept
        .rate,
    ).toBe(1);
    expect(
      result.aggregates.band_distribution.by_split.final.distribution.retry
        .rate,
    ).toBe(1);
    expect(result.band_constraint_violations).toEqual([]);

    // The report contains score outcomes, not the raw OCR transcript.
    expect(JSON.stringify(result)).not.toContain("copper lantern sky");
  });

  it("records wrong-valid accepted outcomes without authorizing promotion", () => {
    const value = inputs();
    value.adapterResults.results[0].candidates[0].raw_text =
      "copper river lantern";

    const result = scoreQualificationObservations(value);

    expect(result.false_accepts).toHaveLength(1);
    expect(result.false_valid_cases).toHaveLength(1);
    expect(result.false_valid_cases[0]).toMatchObject({
      sample_id: "synthetic-one-code",
      split: "tuning",
      expected_code: "zz-copper-lantern-sky-zz",
      observed_code: "zz-copper-river-lantern-zz",
    });
    expect(result.promotion_eligible).toBe(false);
  });

  it("rejects missing or duplicate device/sample evidence", () => {
    const missing = inputs();
    missing.adapterResults.results.pop();
    expect(() => scoreQualificationObservations(missing)).toThrow(
      "adapter_result_coverage_incomplete",
    );

    const duplicate = inputs();
    duplicate.adapterResults.results.push(duplicate.adapterResults.results[0]);
    expect(() => scoreQualificationObservations(duplicate)).toThrow(
      "duplicate_adapter_result_observation",
    );
  });
});
