/* eslint-disable max-lines -- The schema-valid receipt fixture is kept beside its regression tests. */
import { describe, expect, it } from "vitest";
import { validateQualificationReceipt } from "../scripts/ocr-qualification/receipt-semantics.mjs";
import { buildQualificationReceiptArtifact } from "../scripts/ocr-qualification-receipt-report.mjs";
import { createIncompleteQualificationReceiptArtifact } from "../scripts/ocr-qualification-receipt-assembly.mjs";

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
    accept_min_confidence: 0.8,
    retry_below_confidence: 0.5,
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
  it("assembles and semantically validates a non-authorizing preflight receipt", () => {
    const inputs = buildInputs();
    const receipt = inputs.receipt;
    const hashes = {
      manifest: receipt.manifest_sha256,
      candidateBundle: receipt.candidate_bundle_sha256,
      preRunAttestation: receipt.pre_run_attestation_sha256,
      preRunBundle: receipt.pre_run_sigstore_bundle_sha256,
      executionAttestation: receipt.execution_attestation_sha256,
      executionBundle: receipt.execution_sigstore_bundle_sha256,
      deviceMatrix: "6".repeat(64),
      adapterResults: receipt.adapter.adapter_results_sha256 as string,
      gateConfig: receipt.release_gates.gate_config_sha256,
    };
    const documents = {
      manifest: {
        qualification_id: receipt.qualification_id,
        samples: [{ split: "tuning" }, { split: "final" }],
      },
      deviceMatrix: inputs.deviceMatrix,
      candidateBundle: {
        candidate_id: receipt.candidate_id,
        platform: "ios",
        adapter: {
          commit: receipt.adapter.commit,
          artifact_sha256: receipt.adapter.artifact_sha256,
          engine_id: receipt.adapter.engine_id,
          engine_version: receipt.adapter.engine_version,
          config_sha256: receipt.adapter.config_sha256,
          preprocessing_sha256: receipt.adapter.preprocessing_sha256,
          confidence_mapping_sha256: receipt.adapter.confidence_mapping_sha256,
        },
        decoder: receipt.decoder,
      },
      gateConfig: {
        ...inputs.gateConfig,
        thresholds: receipt.release_gates.thresholds,
      },
      executionAttestation: {
        run_id: receipt.run_id,
        started_at_utc: receipt.started_at_utc,
        finished_at_utc: receipt.finished_at_utc,
      },
    };
    const scoring = {
      metric_sets: {
        metrics_by_split: receipt.metrics_by_split,
        device_coverage: receipt.device_coverage,
        bucket_metrics: receipt.bucket_metrics,
      },
      gate_evaluation: { gate_results: receipt.release_gates.gate_results },
      false_accepts: [],
      false_valid_cases: [],
    };
    const { receiptArtifact, receiptAssemblyError } =
      createIncompleteQualificationReceiptArtifact({
        documents,
        hashes,
        scoring: { performed: true, result: scoring },
        sigstoreVerifications: { preRun: { verified: false } },
        rawInputBytes: {
          preRunBundle: Buffer.from("pre-run-bundle"),
          executionBundle: Buffer.from("execution-bundle"),
        },
      });

    expect(receiptAssemblyError).toBeNull();
    expect(receiptArtifact?.validation.schemaValid).toBe(true);
    expect(receiptArtifact?.validation.status).toBe("INCOMPLETE");
    expect(receiptArtifact?.validation.authorizesPromotion).toBe(false);
    expect(receiptArtifact?.receipt.disposition).toBe("INCOMPLETE");
    expect(receiptArtifact?.receipt.release_gates.frozen_at_utc).toBeNull();
    expect(receiptArtifact?.receipt.report_sha256).toMatch(/^[a-f0-9]{64}$/);
  });

  it("hashes a privacy-minimized report from the validated receipt", () => {
    const inputs = buildInputs();

    const artifact = buildQualificationReceiptArtifact(inputs.receipt, {
      gateConfig: inputs.gateConfig,
      deviceMatrix: inputs.deviceMatrix,
    });

    expect(artifact.validation.status).toBe("SEMANTIC_CHECKS_PASS");
    expect(artifact.validation.authorizesPromotion).toBe(false);
    expect(artifact.receipt.report_sha256).toMatch(/^[a-f0-9]{64}$/);
    expect(artifact.markdown).not.toContain("sample-1");
    expect(artifact.markdown).not.toContain("zz-copper-lantern-sky-zz");
    expect(artifact.markdown).toContain("Promotion authorized: no");
  });

  it("reports no-promotion without exposing false-case identities or codes", () => {
    const inputs = buildInputs();
    inputs.receipt.disposition = "NO_PROMOTION";
    inputs.receipt.promoted_engine = null;
    inputs.receipt.no_promotion_reason =
      "A final false-valid case was observed";
    inputs.gateConfig.thresholds.max_false_valid_decode_rate = 1;
    inputs.receipt.release_gates.thresholds.max_false_valid_decode_rate = 1;
    inputs.receipt.metrics_by_split.final.false_valid_decode_count = 1;
    inputs.receipt.metrics_by_split.final.false_valid_decode_rate = rate(1);
    inputs.receipt.false_valid_cases.push({
      device_matrix_entry_id: "ios-current",
      sample_id: "sample-1",
      pair_id: "pair-1",
      expected_codes: ["zz-copper-lantern-sky-zz"],
      observed_codes: ["zz-copper-lantern-maple-zz"],
      disposition: "reproduced wrong-valid decode",
      reviewer: "fixture-reviewer",
    });
    const falseValidGate = inputs.receipt.release_gates.gate_results.find(
      ({ gate_id }) => gate_id === "false-valid-decode-rate",
    )!;
    falseValidGate.threshold = 1;
    falseValidGate.observed = 1;
    falseValidGate.result = "pass";

    const artifact = buildQualificationReceiptArtifact(inputs.receipt, {
      gateConfig: inputs.gateConfig,
      deviceMatrix: inputs.deviceMatrix,
    });

    expect(artifact.validation.status).toBe("NO_PROMOTION");
    expect(artifact.validation.authorizesPromotion).toBe(false);
    expect(artifact.markdown).toContain("False-valid cases: 1");
    expect(artifact.markdown).not.toContain("sample-1");
    expect(artifact.markdown).not.toContain("zz-copper-lantern-sky-zz");
    expect(artifact.markdown).not.toContain("zz-copper-lantern-maple-zz");
  });

  it("validates and reports an explicitly withheld promotion disposition", () => {
    const inputs = buildInputs();
    inputs.receipt.disposition = "NO_PROMOTION";
    inputs.receipt.promoted_engine = null;
    inputs.receipt.no_promotion_reason =
      "Release authorization has not been granted";
    const privacyReview = inputs.receipt.reviews.privacy as Record<
      string,
      unknown
    >;
    privacyReview.status = "blocked";

    const artifact = buildQualificationReceiptArtifact(inputs.receipt, {
      gateConfig: inputs.gateConfig,
      deviceMatrix: inputs.deviceMatrix,
    });

    expect(artifact.validation.status).toBe("NO_PROMOTION");
    expect(artifact.validation.errors).toEqual([]);
    expect(artifact.validation.authorizesPromotion).toBe(false);
    expect(artifact.markdown).toContain("Disposition: NO_PROMOTION");
    expect(artifact.receipt.report_sha256).toMatch(/^[a-f0-9]{64}$/);
  });

  it("validates a failed gate as FAIL without authorizing promotion", () => {
    const inputs = buildInputs();
    inputs.receipt.disposition = "FAIL";
    inputs.receipt.promoted_engine = null;
    inputs.receipt.no_promotion_reason = "Final p95 exceeded its threshold";
    inputs.gateConfig.thresholds.max_p95_latency_ms = 11;
    inputs.receipt.release_gates.thresholds.max_p95_latency_ms = 11;
    const p95Gate = inputs.receipt.release_gates.gate_results.find(
      ({ gate_id }) => gate_id === "p95-latency-ms",
    )!;
    p95Gate.threshold = 11;
    p95Gate.result = "fail";

    const artifact = buildQualificationReceiptArtifact(inputs.receipt, {
      gateConfig: inputs.gateConfig,
      deviceMatrix: inputs.deviceMatrix,
    });

    expect(artifact.validation.status).toBe("FAIL");
    expect(artifact.validation.gateFailures).toContain("p95-latency-ms");
    expect(artifact.validation.authorizesPromotion).toBe(false);
  });

  it("renders a schema-valid incomplete receipt without authorizing promotion", () => {
    const inputs = buildInputs();
    inputs.receipt.disposition = "INCOMPLETE";
    inputs.receipt.promoted_engine = null;
    inputs.receipt.approver = null;
    inputs.receipt.pull_request = null;
    inputs.receipt.no_promotion_reason = "Qualification evidence is incomplete";
    inputs.receipt.release_gates.frozen_at_utc = null as unknown as string;

    const artifact = buildQualificationReceiptArtifact(inputs.receipt, {
      gateConfig: inputs.gateConfig,
      deviceMatrix: inputs.deviceMatrix,
    });

    expect(artifact.validation.status).toBe("INCOMPLETE");
    expect(artifact.validation.authorizesPromotion).toBe(false);
    expect(artifact.receipt.disposition).toBe("INCOMPLETE");
    expect(artifact.markdown).toContain("Disposition: INCOMPLETE");
  });

  it("does not relabel a semantically incomplete receipt as PASS", () => {
    const inputs = buildInputs();
    inputs.receipt.device_coverage[1]!.metrics_by_split.final.latency_ms.p95 =
      null as unknown as number;

    expect(() =>
      buildQualificationReceiptArtifact(inputs.receipt, {
        gateConfig: inputs.gateConfig,
        deviceMatrix: inputs.deviceMatrix,
      }),
    ).toThrow("qualification_receipt_incomplete_disposition_required");
  });

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

  it("rejects schema-valid missing per-device final p95 latency", () => {
    const inputs = buildInputs();
    inputs.receipt.device_coverage[1]!.metrics_by_split.final.latency_ms.p95 =
      null as unknown as number;

    const result = evaluate(inputs);

    expect(result.schemaValid).toBe(true);
    expect(result.status).toBe("INCOMPLETE");
    expect(result.errors).toContain(
      "missing per-device final p95 latency: ios-legacy",
    );
    expect(result.authorizesPromotion).toBe(false);
  });

  it("does not promote a candidate with false-valid cases even when within a nonzero rate cap", () => {
    const inputs = buildInputs();
    inputs.receipt.disposition = "NO_PROMOTION";
    inputs.receipt.promoted_engine = null;
    inputs.receipt.no_promotion_reason =
      "A final false-valid case was observed";
    inputs.gateConfig.thresholds.max_false_valid_decode_rate = 1;
    inputs.receipt.release_gates.thresholds.max_false_valid_decode_rate = 1;
    inputs.receipt.metrics_by_split.final.false_valid_decode_count = 1;
    inputs.receipt.metrics_by_split.final.false_valid_decode_rate = rate(1);
    inputs.receipt.false_valid_cases.push({
      device_matrix_entry_id: "ios-current",
      sample_id: "sample-1",
      pair_id: "pair-1",
      expected_codes: ["zz-copper-lantern-sky-zz"],
      observed_codes: ["zz-copper-lantern-maple-zz"],
      disposition: "reproduced wrong-valid decode",
      reviewer: "fixture-reviewer",
    });
    const falseValidGate = inputs.receipt.release_gates.gate_results.find(
      ({ gate_id }) => gate_id === "false-valid-decode-rate",
    )!;
    falseValidGate.threshold = 1;
    falseValidGate.observed = 1;
    falseValidGate.result = "pass";

    const result = evaluate(inputs);

    expect(result.schemaValid, result.errors.join("\n")).toBe(true);
    expect(result.status).toBe("NO_PROMOTION");
    expect(result.gateFailures).toEqual([]);
    expect(result.authorizesPromotion).toBe(false);
  });

  it("rejects PASS when any false-accept or false-valid case is listed", () => {
    const inputs = buildInputs();
    inputs.receipt.false_accepts.push({
      device_matrix_entry_id: "ios-current",
      sample_id: "sample-1",
      pair_id: null,
      expected_codes: ["zz-copper-lantern-sky-zz"],
      observed_codes: ["zz-copper-lantern-maple-zz"],
      disposition: "reproduced false accept",
      reviewer: "fixture-reviewer",
    });

    const result = evaluate(inputs);

    expect(result.schemaValid).toBe(false);
    expect(result.status).toBe("INCOMPLETE");
    expect(result.errors.join("\n")).toContain(
      "must NOT have more than 0 items",
    );
    expect(result.authorizesPromotion).toBe(false);
  });

  it.each(["false_accepts", "false_valid_cases"] as const)(
    "rejects an undispositioned %s case",
    (caseKey) => {
      const inputs = buildInputs();
      inputs.receipt.disposition = "NO_PROMOTION";
      inputs.receipt.promoted_engine = null;
      inputs.receipt.no_promotion_reason = "Case review is incomplete";
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
