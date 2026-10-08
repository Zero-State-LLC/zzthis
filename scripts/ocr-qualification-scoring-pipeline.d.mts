import type { QualificationGateResult } from "./ocr-qualification-gates.mjs";

export interface QualificationScoringInput {
  manifest: Record<string, unknown>;
  deviceMatrix: Record<string, unknown>;
  candidateBundle: Record<string, unknown>;
  gateConfig: Record<string, unknown>;
  adapterResults: Record<string, unknown>;
}

type RateMetric = {
  numerator: number;
  denominator: number;
  rate: number | null;
};

type ScoringGroups<T> = {
  by_split: Record<"tuning" | "final", T>;
  by_device_split: Array<{
    device_matrix_entry_id: string;
    split: "tuning" | "final";
    metrics: T;
  }>;
  by_split_bucket: Array<{
    split: "tuning" | "final";
    bucket_id: string;
    metrics: T;
  }>;
};

type FiducialMetrics = {
  endpoint_precision: RateMetric;
  endpoint_recall: RateMetric;
  pair_accuracy: RateMetric;
  [key: string]: unknown;
};

type RoiLatencyMetrics = {
  latency_ms: { p50: number; p95: number } | null;
  roi_mean_iou: number | null;
  [key: string]: unknown;
};

type TextMetrics = {
  exact_code_accuracy: RateMetric;
  false_valid_decode_rate: RateMetric;
  [key: string]: unknown;
};

type BandMetrics = {
  sample_count: number;
  observation_count: number;
  distribution: Record<"accept" | "clarify" | "retry" | "abstain", RateMetric>;
};

type BandGroups = {
  by_split: Record<"tuning" | "final", BandMetrics>;
  by_device_split: Array<
    {
      device_matrix_entry_id: string;
      split: "tuning" | "final";
    } & BandMetrics
  >;
  by_split_bucket: Array<
    {
      split: "tuning" | "final";
      bucket_id: string;
    } & BandMetrics
  >;
};

type QualificationMetricSet = {
  sample_count: number;
  endpoint_precision: RateMetric;
  endpoint_recall: RateMetric;
  complete_pair_rate: RateMetric;
  pair_accuracy: RateMetric;
  false_finder_count: number;
  false_finder_rate: RateMetric;
  missed_endpoint_count: number;
  false_pair_count: number;
  false_pair_rate: RateMetric;
  roi_mean_iou: number | null;
  rectification_success_rate: RateMetric;
  exact_code_accuracy: RateMetric;
  part_word_accuracy: RateMetric;
  character_error_rate: number | null;
  false_valid_decode_count: number;
  false_valid_decode_rate: RateMetric;
  false_accept_count: number;
  false_accept_rate: RateMetric;
  no_code_false_positive_count: number;
  no_code_false_positive_rate: RateMetric;
  wrapped_code_accuracy: RateMetric;
  multi_code_accuracy: RateMetric;
  band_distribution: Record<
    "accept" | "clarify" | "retry" | "abstain",
    RateMetric
  >;
  latency_ms: { p50: number; p95: number } | { p50: null; p95: null };
  package_size_delta_bytes: null;
  peak_runtime_memory_bytes: number | null;
  crash_count: number;
  exception_count: number;
  not_measured_reasons?: string[];
};

type QualificationMetricSets = {
  metrics_by_split: Record<"tuning" | "final", QualificationMetricSet | null>;
  metrics_by_device_split: Array<{
    device_matrix_entry_id: string;
    split: "tuning" | "final";
    metrics: QualificationMetricSet | null;
  }>;
  bucket_metrics: Array<{
    split: "tuning" | "final";
    bucket_id: string;
    metrics: QualificationMetricSet;
  }>;
  device_coverage: Array<{
    device_matrix_entry_id: string;
    os_version: string;
    device_class: string;
    minimum_sample_count: number;
    observed_sample_count: number;
    metrics_by_split: Record<"tuning" | "final", QualificationMetricSet | null>;
  }>;
};

/** Deterministically recomputes scoring observations; never authorizes promotion. */
export function scoreQualificationObservations(
  input: QualificationScoringInput,
): {
  qualification_id: string;
  candidate_id: string;
  receipt_ready: false;
  promotion_eligible: false;
  scored_observations: Array<Record<string, unknown>>;
  aggregates: {
    fiducial: ScoringGroups<FiducialMetrics>;
    roi_latency: ScoringGroups<RoiLatencyMetrics>;
    text: ScoringGroups<TextMetrics>;
    band_distribution: BandGroups;
  };
  metric_sets: QualificationMetricSets;
  gate_evaluation: {
    status: "PASS" | "FAIL" | "INCOMPLETE";
    gate_results: QualificationGateResult[];
  };
  false_accepts: Array<Record<string, unknown>>;
  false_valid_cases: Array<Record<string, unknown>>;
  no_code_false_positives: Array<Record<string, unknown>>;
  band_constraint_violations: Array<Record<string, unknown>>;
};
import type { QualificationGateResult } from "./ocr-qualification-gates.mjs";
