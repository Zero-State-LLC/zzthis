import { readFileSync } from "node:fs";
import Ajv2020 from "ajv/dist/2020.js";
import { describe, expect, it } from "vitest";
import { scoreQualificationObservations } from "../scripts/ocr-qualification-scoring-pipeline.mjs";

const receiptSchema = JSON.parse(
  readFileSync(
    new URL(
      "../specs/004-capture/qualification/receipt.schema.json",
      import.meta.url,
    ),
    "utf8",
  ),
);
const validateMetricSet = new Ajv2020({ strict: false }).compile({
  $schema: receiptSchema.$schema,
  $defs: receiptSchema.$defs,
  $ref: "#/$defs/metricSet",
});

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
    expect(result.metric_sets.metrics_by_split.tuning).toMatchObject({
      sample_count: 1,
      endpoint_recall: { numerator: 2, denominator: 2, rate: 1 },
      exact_code_accuracy: { numerator: 1, denominator: 1, rate: 1 },
      wrapped_code_accuracy: { numerator: 0, denominator: 0, rate: null },
      multi_code_accuracy: { numerator: 0, denominator: 0, rate: null },
      crash_count: 0,
      exception_count: 0,
      package_size_delta_bytes: null,
      peak_runtime_memory_bytes: null,
    });
    expect(result.metric_sets.device_coverage[0]).toMatchObject({
      minimum_sample_count: 1,
      observed_sample_count: 2,
    });
    expect(
      result.metric_sets.bucket_metrics.some(
        (row) => row.split === "final" && row.bucket_id === "partial-fiducial",
      ),
    ).toBe(true);

    // The report contains score outcomes, not the raw OCR transcript.
    expect(JSON.stringify(result)).not.toContain("copper lantern sky");
  });

  it("projects every observed group into a schema-valid normative metric set", () => {
    const result = scoreQualificationObservations(inputs());
    const metricSets = [
      ...Object.values(result.metric_sets.metrics_by_split),
      ...result.metric_sets.metrics_by_device_split.map((row) => row.metrics),
      ...result.metric_sets.bucket_metrics.map((row) => row.metrics),
      ...result.metric_sets.device_coverage.flatMap((row) =>
        Object.values(row.metrics_by_split),
      ),
    ];

    for (const metrics of metricSets) {
      expect(metrics).not.toBeNull();
      expect(
        validateMetricSet(metrics),
        JSON.stringify(validateMetricSet.errors),
      ).toBe(true);
    }
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

  it("records runtime failures without fabricating a decision band", () => {
    const value = inputs();
    const failed = value.adapterResults.results[0];
    failed.runtime_outcome = "crash";
    failed.runtime_memory_bytes = 1024;
    failed.fiducials = [];
    failed.rois = [];
    failed.candidates = [];

    const result = scoreQualificationObservations(value);
    const tuning = result.metric_sets.metrics_by_split.tuning;

    if (tuning === null) throw new Error("tuning_metrics_missing");
    expect(tuning.crash_count).toBe(1);
    expect(tuning.exception_count).toBe(0);
    expect(tuning.peak_runtime_memory_bytes).toBe(1024);
    expect(tuning.band_distribution.accept.denominator).toBe(0);
    expect(result.scored_observations[0]?.band).toBeNull();
  });

  it("rejects recognition evidence attached to a crashed adapter observation", () => {
    const value = inputs();
    value.adapterResults.results[0].runtime_outcome = "crash";

    expect(() => scoreQualificationObservations(value)).toThrow(
      "failed_adapter_observation_contains_recognition_output",
    );
  });
});
