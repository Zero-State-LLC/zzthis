/* eslint-disable max-lines -- The schema-valid receipt fixture is kept beside its regression tests. */
import { describe, expect, it } from "vitest";
import {
  validateQualificationReceipt,
  validateReceiptSemantics,
} from "../scripts/ocr-qualification/receipt-semantics.mjs";

const bucketIds = [
  "handwriting",
  "print",
  "low-contrast",
  "glare",
  "blur",
  "motion-blur",
  "perspective",
  "rotation",
  "distance",
  "wrapped",
  "multi-code",
  "partial-fiducial",
  "false-zz",
  "ambiguous-pairing",
  "unequal-fiducial-size",
  "curved-surface",
  "candidate-overflow",
  "running-text",
  "confusable-character",
  "near-word",
  "invalid-reserved-character",
  "no-code",
  "handle",
  "field-code-part",
] as const;

const gateIds = [
  "false-accept-count",
  "false-valid-decode-rate",
  "endpoint-recall",
  "pair-accuracy",
  "exact-code-accuracy",
  "character-error-rate",
  "rectification-success-rate",
  "p95-latency-ms",
] as const;

const rate = (value = 1) => ({
  numerator: value,
  denominator: 1,
  rate: value,
});

type MetricSet = ReturnType<typeof metricSet>;
type CaseDisposition = {
  device_matrix_entry_id: string;
  sample_id: string;
  pair_id: string | null;
  expected_codes: string[];
  observed_codes: string[];
  disposition: string;
  reviewer: string;
};
type GateResult = {
  gate_id: (typeof gateIds)[number];
  split: string;
  operator: "lte" | "gte";
  threshold: number;
  observed: number;
  result: string;
};
type BucketRequirement = {
  bucket_id: string;
  minimum_sample_count: number;
  observed_sample_count?: number;
};
type ReceiptFixture = {
  [key: string]: unknown;
  schema_version: 1;
  qualification_id: string;
  candidate_id: string;
  run_id: string;
  started_at_utc: string;
  finished_at_utc: string;
  manifest_sha256: string;
  candidate_bundle_sha256: string;
  pre_run_attestation_sha256: string;
  pre_run_attestation_ref: string;
  pre_run_sigstore_bundle_sha256: string;
  pre_run_sigstore_bundle_ref: string;
  execution_attestation_sha256: string;
  execution_attestation_ref: string;
  execution_sigstore_bundle_sha256: string;
  execution_sigstore_bundle_ref: string;
  split_counts: { tuning: number; final: number };
  adapter: Record<string, unknown>;
  decoder: Record<string, unknown>;
  reviews: Record<string, unknown>;
  report_sha256: string;
  disposition: string;
  metrics_by_split: { tuning: MetricSet; final: MetricSet };
  bucket_metrics: Array<{
    split: string;
    bucket_id: string;
    metrics: { sample_count: number };
  }>;
  device_coverage: Array<{
    device_matrix_entry_id: string;
    os_version: string;
    device_class: string;
    minimum_sample_count: number;
    observed_sample_count: number;
    metrics_by_split: { tuning: MetricSet; final: MetricSet };
  }>;
  false_accepts: CaseDisposition[];
  false_valid_cases: CaseDisposition[];
  release_gates: {
    [key: string]: unknown;
    frozen_at_utc: string;
    pre_run_attestation_sha256: string;
    execution_attestation_sha256: string;
    corpus_manifest_sha256: string;
    device_matrix_sha256: string;
    gate_config_sha256: string;
    required_gate_ids: string[];
    required_buckets: BucketRequirement[];
    thresholds: Record<string, number | string>;
    gate_results: GateResult[];
  };
  promoted_engine: string | null;
  approver: string | null;
  pull_request: string | null;
  no_promotion_reason: string | null;
};
type FixtureInputs = {
  receipt: ReceiptFixture;
  gateConfig: {
    required_gate_ids: string[];
    required_buckets: BucketRequirement[];
    thresholds: Record<string, number | string>;
  };
  deviceMatrix: {
    entries: Array<{
      device_matrix_entry_id: string;
      os_version: string;
      device_class: string;
      minimum_sample_count: number;
    }>;
  };
};

function metricSet({
  p95 = 10,
  falseAcceptCount = 0,
  falseValidCount = 0,
} = {}) {
  return {
    sample_count: 1,
    endpoint_precision: rate(),
    endpoint_recall: rate(),
    complete_pair_rate: rate(),
    pair_accuracy: rate(),
    false_finder_count: 0,
    false_finder_rate: rate(0),
    missed_endpoint_count: 0,
    false_pair_count: 0,
    false_pair_rate: rate(0),
    roi_mean_iou: 1,
    rectification_success_rate: rate(),
    exact_code_accuracy: rate(),
    part_word_accuracy: rate(),
    character_error_rate: 0,
    false_valid_decode_count: falseValidCount,
    false_valid_decode_rate: rate(falseValidCount),
    false_accept_count: falseAcceptCount,
    false_accept_rate: rate(falseAcceptCount),
    no_code_false_positive_count: 0,
    no_code_false_positive_rate: rate(0),
    wrapped_code_accuracy: rate(),
    multi_code_accuracy: rate(),
    band_distribution: {
      accept: rate(),
      clarify: rate(0),
      retry: rate(0),
      abstain: rate(0),
    },
    latency_ms: { p50: p95, p95 },
    package_size_delta_bytes: null,
    peak_runtime_memory_bytes: null,
    crash_count: 0,
    exception_count: 0,
  };
}

function buildInputs(): FixtureInputs {
  const thresholds = {
    max_false_accept_count: 0,
    max_false_valid_decode_rate: 0,
    min_endpoint_recall: 1,
    min_pair_accuracy: 1,
    min_exact_code_accuracy: 1,
    max_character_error_rate: 0,
    min_rectification_success_rate: 1,
    max_p95_latency_ms: 100,
  };
  const gateConfig = {
    required_gate_ids: [...gateIds],
    required_buckets: bucketIds.map((bucket_id) => ({
      bucket_id,
      minimum_sample_count: 1,
    })),
    thresholds,
  };
  const deviceMatrix = {
    entries: [
      {
        device_matrix_entry_id: "ios-current",
        os_version: "fixture-os",
        device_class: "fixture-phone",
        minimum_sample_count: 1,
      },
      {
        device_matrix_entry_id: "ios-legacy",
        os_version: "fixture-os-old",
        device_class: "fixture-phone-old",
        minimum_sample_count: 1,
      },
    ],
  };
  const finalMetrics = metricSet();
  const observedBuckets = bucketIds.map((bucket_id) => ({
    split: "final",
    bucket_id,
    metrics: metricSet(),
  }));
  const receipt: ReceiptFixture = {
    schema_version: 1,
    qualification_id: "ZZ-OCR-QUAL-001",
    candidate_id: "fixture-candidate",
    run_id: "fixture-run",
    started_at_utc: "2026-10-07T12:00:00Z",
    finished_at_utc: "2026-10-07T12:01:00Z",
    manifest_sha256: "a".repeat(64),
    candidate_bundle_sha256: "b".repeat(64),
    pre_run_attestation_sha256: "c".repeat(64),
    pre_run_attestation_ref: "https://example.test/pre-run.json",
    pre_run_sigstore_bundle_sha256: "d".repeat(64),
    pre_run_sigstore_bundle_ref: "https://example.test/pre-run.sigstore.json",
    execution_attestation_sha256: "e".repeat(64),
    execution_attestation_ref: "https://example.test/execution.json",
    execution_sigstore_bundle_sha256: "f".repeat(64),
    execution_sigstore_bundle_ref:
      "https://example.test/execution.sigstore.json",
    split_counts: { tuning: 1, final: 1 },
    adapter: {
      commit: "1".repeat(40),
      artifact_sha256: "2".repeat(64),
      platform: "ios",
      engine_id: "fixture-engine",
      engine_version: "1.0.0-fixture",
      config_sha256: "3".repeat(64),
      preprocessing_sha256: "4".repeat(64),
      confidence_mapping_sha256: "5".repeat(64),
      device_matrix_sha256: "6".repeat(64),
      adapter_results_sha256: "7".repeat(64),
    },
    decoder: {
      commit: "8".repeat(40),
      wordlist_sha256: "9".repeat(64),
      vectors_sha256: "a".repeat(64),
      wordlist_version: "fixture-v1",
      checkword_version: "fixture-v1",
      checkword_sha256: "b".repeat(64),
      band_mapping_sha256: "c".repeat(64),
    },
    disposition: "PASS",
    metrics_by_split: { tuning: metricSet(), final: finalMetrics },
    bucket_metrics: observedBuckets,
    device_coverage: [
      {
        device_matrix_entry_id: "ios-current",
        os_version: "fixture-os",
        device_class: "fixture-phone",
        minimum_sample_count: 1,
        observed_sample_count: 1,
        metrics_by_split: {
          tuning: metricSet(),
          final: metricSet(),
        },
      },
      {
        device_matrix_entry_id: "ios-legacy",
        os_version: "fixture-os-old",
        device_class: "fixture-phone-old",
        minimum_sample_count: 1,
        observed_sample_count: 1,
        metrics_by_split: {
          tuning: metricSet({ p95: 12 }),
          final: metricSet({ p95: 12 }),
        },
      },
    ],
    false_accepts: [],
    false_valid_cases: [],
    release_gates: {
      frozen_at_utc: "2026-10-07T11:59:00Z",
      pre_run_attestation_sha256: "c".repeat(64),
      execution_attestation_sha256: "e".repeat(64),
      corpus_manifest_sha256: "a".repeat(64),
      device_matrix_sha256: "6".repeat(64),
      gate_config_sha256: "d".repeat(64),
      required_gate_ids: [...gateIds],
      required_buckets: bucketIds.map((bucket_id) => ({
        bucket_id,
        minimum_sample_count: 1,
        observed_sample_count: 1,
      })),
      thresholds: {
        ...thresholds,
        fiducial_iou_threshold: 0.5,
        cer_normalization: "nfc-code-points-v1",
      },
      gate_results: [] as GateResult[],
    },
    reviews: {
      dependency_license: {
        status: "approved",
        reviewer: "fixture-reviewer",
        evidence_ref: "https://example.test/reviews/dependency",
      },
      privacy: {
        status: "approved",
        reviewer: "fixture-reviewer",
        evidence_ref: "https://example.test/reviews/privacy",
      },
      security: {
        status: "approved",
        reviewer: "fixture-reviewer",
        evidence_ref: "https://example.test/reviews/security",
      },
      qualification: {
        status: "approved",
        reviewer: "fixture-reviewer",
        evidence_ref: "https://example.test/reviews/qualification",
      },
    },
    report_sha256: "f".repeat(64),
    promoted_engine: "fixture-engine",
    approver: "fixture-approver",
    pull_request: "https://github.com/Zero-State-LLC/zzthis/pull/89",
    no_promotion_reason: null,
  };

  const gateFacts: Record<
    (typeof gateIds)[number],
    { operator: "lte" | "gte"; threshold: number; observed: number }
  > = {
    "false-accept-count": {
      operator: "lte",
      threshold: thresholds.max_false_accept_count,
      observed: 0,
    },
    "false-valid-decode-rate": {
      operator: "lte",
      threshold: thresholds.max_false_valid_decode_rate,
      observed: 0,
    },
    "endpoint-recall": {
      operator: "gte",
      threshold: thresholds.min_endpoint_recall,
      observed: 1,
    },
    "pair-accuracy": {
      operator: "gte",
      threshold: thresholds.min_pair_accuracy,
      observed: 1,
    },
    "exact-code-accuracy": {
      operator: "gte",
      threshold: thresholds.min_exact_code_accuracy,
      observed: 1,
    },
    "character-error-rate": {
      operator: "lte",
      threshold: thresholds.max_character_error_rate,
      observed: 0,
    },
    "rectification-success-rate": {
      operator: "gte",
      threshold: thresholds.min_rectification_success_rate,
      observed: 1,
    },
    "p95-latency-ms": {
      operator: "lte",
      threshold: thresholds.max_p95_latency_ms,
      observed: 12,
    },
  };
  receipt.release_gates.gate_results = gateIds.map((gate_id) => ({
    gate_id,
    split: "final",
    ...gateFacts[gate_id],
    result: "pass",
  }));

  return { receipt, gateConfig, deviceMatrix };
}

function evaluate(inputs: ReturnType<typeof buildInputs>) {
  return validateQualificationReceipt(inputs.receipt, {
    gateConfig: inputs.gateConfig,
    deviceMatrix: inputs.deviceMatrix,
  });
}

describe("OCR qualification receipt semantic guard", () => {
  it("never authorizes promotion, even when its semantic checks pass", () => {
    const result = evaluate(buildInputs());

    expect(result.schemaValid, result.errors.join("\n")).toBe(true);
    expect(result.status).toBe("SEMANTIC_CHECKS_PASS");
    expect(result.authorizesPromotion).toBe(false);
  });

  it("rejects device coverage below the frozen device minimum", () => {
    const inputs = buildInputs();
    inputs.deviceMatrix.entries[0]!.minimum_sample_count = 2;

    const result = evaluate(inputs);

    expect(result.schemaValid).toBe(true);
    expect(result.status).toBe("INCOMPLETE");
    expect(result.errors).toContain(
      "device coverage below minimum: ios-current",
    );
    expect(result.authorizesPromotion).toBe(false);
  });

  it("rejects a required stress bucket below its frozen minimum", () => {
    const inputs = buildInputs();
    inputs.gateConfig.required_buckets[0]!.minimum_sample_count = 2;

    const result = evaluate(inputs);

    expect(result.schemaValid).toBe(true);
    expect(result.status).toBe("INCOMPLETE");
    expect(result.errors).toContain("final bucket below minimum: handwriting");
    expect(result.authorizesPromotion).toBe(false);
  });

  it("rejects a gate result that disagrees with recomputed final metrics", () => {
    const inputs = buildInputs();
    inputs.receipt.release_gates.gate_results[2]!.observed = 0;

    const result = evaluate(inputs);

    expect(result.schemaValid).toBe(true);
    expect(result.status).toBe("INCOMPLETE");
    expect(result.errors).toContain(
      "release gate does not reconcile to frozen inputs and final metrics: endpoint-recall",
    );
    expect(result.authorizesPromotion).toBe(false);
  });

  it("rejects frozen gate IDs that differ from the receipt and protocol", () => {
    const inputs = buildInputs();
    inputs.gateConfig.required_gate_ids = ["endpoint-recall"];

    const result = evaluate(inputs);

    expect(result.schemaValid).toBe(true);
    expect(result.status).toBe("INCOMPLETE");
    expect(result.errors).toContain(
      "receipt gate IDs do not match frozen gate config",
    );
    expect(result.authorizesPromotion).toBe(false);
  });

  it("rejects receipt thresholds that differ from the frozen gate config", () => {
    const inputs = buildInputs();
    inputs.receipt.release_gates.thresholds.max_p95_latency_ms = 1000;

    const result = evaluate(inputs);

    expect(result.schemaValid).toBe(true);
    expect(result.status).toBe("INCOMPLETE");
    expect(result.errors).toContain(
      "receipt thresholds do not match frozen gate config",
    );
    expect(result.authorizesPromotion).toBe(false);
  });

  it("rejects missing device coverage", () => {
    const inputs = buildInputs();
    inputs.receipt.device_coverage.splice(1, 1);

    const result = evaluate(inputs);

    expect(result.schemaValid).toBe(true);
    expect(result.status).toBe("INCOMPLETE");
    expect(result.errors).toContain("missing device coverage: ios-legacy");
    expect(result.authorizesPromotion).toBe(false);
  });

  it("rejects missing per-device final p95 latency in semantic validation", () => {
    const inputs = buildInputs();
    const legacyCoverage = inputs.receipt.device_coverage[1]!;
    delete (
      legacyCoverage.metrics_by_split.final.latency_ms as Partial<{
        p95: number;
      }>
    ).p95;

    const result = validateReceiptSemantics(inputs.receipt, {
      gateConfig: inputs.gateConfig,
      deviceMatrix: inputs.deviceMatrix,
    });

    expect(result.status).toBe("INCOMPLETE");
    expect(result.errors).toContain(
      "missing per-device final p95 latency: ios-legacy",
    );
    expect(result.authorizesPromotion).toBe(false);
  });

  it("honors the frozen false-valid rate when dispositioned cases are within threshold", () => {
    const inputs = buildInputs();
    inputs.gateConfig.thresholds.max_false_valid_decode_rate = 0.5;
    inputs.receipt.release_gates.thresholds.max_false_valid_decode_rate = 0.5;
    inputs.receipt.metrics_by_split.final.false_valid_decode_count = 1;
    inputs.receipt.metrics_by_split.final.false_valid_decode_rate = {
      numerator: 1,
      denominator: 2,
      rate: 0.5,
    };
    inputs.receipt.false_valid_cases.push({
      device_matrix_entry_id: "ios-current",
      sample_id: "sample-1",
      pair_id: "pair-1",
      expected_codes: ["zz-copper-lantern-sky-zz"],
      observed_codes: ["zz-copper-lantern-maple-zz"],
      disposition: "investigated wrong valid decode",
      reviewer: "fixture-reviewer",
    });
    const falseValidGate = inputs.receipt.release_gates.gate_results.find(
      ({ gate_id }) => gate_id === "false-valid-decode-rate",
    )!;
    falseValidGate.threshold = 0.5;
    falseValidGate.observed = 0.5;

    const result = evaluate(inputs);

    expect(result.schemaValid, result.errors.join("\n")).toBe(true);
    expect(result.status).toBe("SEMANTIC_CHECKS_PASS");
    expect(result.authorizesPromotion).toBe(false);
  });

  it("returns no-promotion when the false-valid rate exceeds the frozen threshold", () => {
    const inputs = buildInputs();
    inputs.receipt.metrics_by_split.final.false_valid_decode_count = 1;
    inputs.receipt.metrics_by_split.final.false_valid_decode_rate = {
      numerator: 1,
      denominator: 2,
      rate: 0.5,
    };
    inputs.receipt.false_valid_cases.push({
      device_matrix_entry_id: "ios-current",
      sample_id: "sample-1",
      pair_id: "pair-1",
      expected_codes: ["zz-copper-lantern-sky-zz"],
      observed_codes: ["zz-copper-lantern-maple-zz"],
      disposition: "investigated wrong valid decode",
      reviewer: "fixture-reviewer",
    });
    const falseValidGate = inputs.receipt.release_gates.gate_results.find(
      ({ gate_id }) => gate_id === "false-valid-decode-rate",
    )!;
    falseValidGate.observed = 0.5;
    falseValidGate.result = "fail";

    const result = validateReceiptSemantics(inputs.receipt, {
      gateConfig: inputs.gateConfig,
      deviceMatrix: inputs.deviceMatrix,
    });

    expect(result.status).toBe("NO_PROMOTION");
    expect(result.gateFailures).toContain("false-valid-decode-rate");
    expect(result.authorizesPromotion).toBe(false);
  });

  it.each(["false_accepts", "false_valid_cases"] as const)(
    "rejects an undispositioned %s case",
    (caseKey) => {
      const inputs = buildInputs();
      inputs.receipt[caseKey].push({
        device_matrix_entry_id: "ios-current",
        sample_id: "sample-1",
        pair_id: caseKey === "false_accepts" ? null : "pair-1",
        expected_codes: ["zz-copper-lantern-sky-zz"],
        observed_codes: ["zz-copper-lantern-maple-zz"],
        disposition: " ",
        reviewer: " ",
      });
      if (caseKey === "false_accepts") {
        inputs.receipt.metrics_by_split.final.false_accept_count = 1;
      } else {
        inputs.receipt.metrics_by_split.final.false_valid_decode_count = 1;
        inputs.receipt.metrics_by_split.final.false_valid_decode_rate = rate(1);
      }

      const result = evaluate(inputs);

      expect(result.schemaValid).toBe(true);
      expect(result.status).toBe("INCOMPLETE");
      expect(result.errors).toContain(
        `${caseKey}[0] needs a non-empty disposition and reviewer`,
      );
      expect(result.authorizesPromotion).toBe(false);
    },
  );

  it("fails closed when the frozen gate config is unavailable", () => {
    const inputs = buildInputs();
    const result = validateQualificationReceipt(inputs.receipt, {
      deviceMatrix: inputs.deviceMatrix,
    });

    expect(result.schemaValid).toBe(true);
    expect(result.status).toBe("INCOMPLETE");
    expect(result.authorizesPromotion).toBe(false);
  });

  it("fails closed for malformed frozen device-matrix input", () => {
    const inputs = buildInputs();
    inputs.deviceMatrix.entries[0] = null as never;

    const result = evaluate(inputs);

    expect(result.schemaValid).toBe(true);
    expect(result.status).toBe("INCOMPLETE");
    expect(result.errors).toContain("frozen inputs are incomplete");
    expect(result.authorizesPromotion).toBe(false);
  });
});
