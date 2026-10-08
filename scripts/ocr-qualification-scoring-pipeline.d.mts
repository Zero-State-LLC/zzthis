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
