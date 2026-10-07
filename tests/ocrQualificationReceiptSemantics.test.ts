import { describe, expect, it } from "vitest";
import { validateReceiptSemantics } from "../scripts/ocr-qualification/receipt-semantics.mjs";

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
    required_buckets: BucketRequirement[];
    gate_results: GateResult[];
  };
};
type FixtureInputs = {
  receipt: ReceiptFixture;
  gateConfig: {
    required_gate_ids: string[];
    required_buckets: BucketRequirement[];
    thresholds: Record<string, number>;
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
    ],
  };
  const finalMetrics = metricSet();
  const observedBuckets = bucketIds.map((bucket_id) => ({
    split: "final",
    bucket_id,
    metrics: { sample_count: 1 },
  }));
  const receipt = {
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
    ],
    false_accepts: [],
    false_valid_cases: [],
    release_gates: {
      required_buckets: bucketIds.map((bucket_id) => ({
        bucket_id,
        minimum_sample_count: 1,
        observed_sample_count: 1,
      })),
      gate_results: [] as GateResult[],
    },
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
      observed: 10,
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
  return validateReceiptSemantics(inputs.receipt, {
    gateConfig: inputs.gateConfig,
    deviceMatrix: inputs.deviceMatrix,
  });
}

describe("OCR qualification receipt semantic guard", () => {
  it("never authorizes promotion, even when its semantic checks pass", () => {
    const result = evaluate(buildInputs());

    expect(result.status).toBe("SEMANTIC_CHECKS_PASS");
    expect(result.authorizesPromotion).toBe(false);
  });

  it("rejects device coverage below the frozen device minimum", () => {
    const inputs = buildInputs();
    inputs.deviceMatrix.entries[0]!.minimum_sample_count = 2;

    const result = evaluate(inputs);

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

    expect(result.status).toBe("INCOMPLETE");
    expect(result.errors).toContain("final bucket below minimum: handwriting");
    expect(result.authorizesPromotion).toBe(false);
  });

  it("rejects a gate result that disagrees with recomputed final metrics", () => {
    const inputs = buildInputs();
    inputs.receipt.release_gates.gate_results[2]!.observed = 0;

    const result = evaluate(inputs);

    expect(result.status).toBe("INCOMPLETE");
    expect(result.errors).toContain(
      "release gate does not reconcile to frozen inputs and final metrics: endpoint-recall",
    );
    expect(result.authorizesPromotion).toBe(false);
  });

  it("rejects missing per-device final p95 latency", () => {
    const inputs = buildInputs();
    Reflect.deleteProperty(
      inputs.receipt.device_coverage[0]!.metrics_by_split.final,
      "latency_ms",
    );

    const result = evaluate(inputs);

    expect(result.status).toBe("INCOMPLETE");
    expect(result.errors).toContain(
      "missing per-device final p95 latency: ios-current",
    );
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
        inputs.receipt.release_gates.gate_results[1]!.observed = 1;
        inputs.receipt.release_gates.gate_results[1]!.result = "fail";
      }

      const result = evaluate(inputs);

      expect(result.status).toBe("INCOMPLETE");
      expect(result.errors).toContain(
        `${caseKey}[0] needs a non-empty disposition and reviewer`,
      );
      expect(result.authorizesPromotion).toBe(false);
    },
  );

  it("fails closed when the frozen gate config is unavailable", () => {
    const inputs = buildInputs();
    const result = validateReceiptSemantics(inputs.receipt, {
      deviceMatrix: inputs.deviceMatrix,
    });

    expect(result.status).toBe("INCOMPLETE");
    expect(result.authorizesPromotion).toBe(false);
  });
});
