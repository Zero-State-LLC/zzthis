import type { FiducialObservationScore } from "./ocr-qualification-fiducial-scoring.mjs";
import type { RateMetric } from "./ocr-qualification-fiducial-scoring.mjs";

export type AggregatedFiducialMetrics = {
  sample_count: number;
  endpoint_precision: RateMetric;
  endpoint_recall: RateMetric;
  false_finder_count: number;
  false_finder_rate: RateMetric;
  missed_endpoint_count: number;
  complete_pair_rate: RateMetric;
  pair_accuracy: RateMetric;
  false_pair_count: number;
  false_pair_rate: RateMetric;
};

export function aggregateFiducialScoring(
  scoredSamples: Array<
    Pick<
      FiducialObservationScore,
      | "endpoint_precision"
      | "endpoint_recall"
      | "false_finder_count"
      | "false_finder_rate"
      | "missed_endpoint_count"
      | "complete_pair_rate"
      | "pair_accuracy"
      | "false_pair_count"
      | "false_pair_rate"
    > & {
      sample_id: string;
      split: "tuning" | "final";
      device_matrix_entry_id: string;
    }
  >,
  manifestSamples: Array<{
    sample_id: string;
    split: "tuning" | "final";
    stress_tags: string[];
  }>,
): {
  by_split: Partial<Record<"tuning" | "final", AggregatedFiducialMetrics>>;
  by_device_split: Array<{
    device_matrix_entry_id: string;
    split: "tuning" | "final";
    metrics: AggregatedFiducialMetrics;
  }>;
  by_split_bucket: Array<{
    split: "tuning" | "final";
    bucket_id: string;
    metrics: AggregatedFiducialMetrics;
  }>;
};
