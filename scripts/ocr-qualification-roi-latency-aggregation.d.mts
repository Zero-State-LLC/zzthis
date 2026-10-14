export type RoiLatencyAggregateInput = {
  sample_id: string;
  split: "tuning" | "final";
  device_matrix_entry_id: string;
  roi_truth_count: number;
  roi_mean_iou: number | null;
  rectification_success_count: number;
  rectification_denominator: number | null;
  elapsed_ms: number[];
};

export type AggregatedRoiLatencyMetrics = {
  sample_count: number;
  roi_truth_count: number;
  roi_mean_iou: number | null;
  rectification_success_count: number;
  rectification_denominator: number | null;
  rectification_success_rate: number | null;
  latency_sample_count: number;
  latency_ms: { p50: number; p95: number } | null;
};

export function aggregateRoiLatencyScoring(
  scoredSamples: RoiLatencyAggregateInput[],
  manifestSamples: Array<{
    sample_id: string;
    split: "tuning" | "final";
    stress_tags: string[];
  }>,
): {
  by_split: Partial<Record<"tuning" | "final", AggregatedRoiLatencyMetrics>>;
  by_device_split: Array<{
    device_matrix_entry_id: string;
    split: "tuning" | "final";
    metrics: AggregatedRoiLatencyMetrics;
  }>;
  by_split_bucket: Array<{
    split: "tuning" | "final";
    bucket_id: string;
    metrics: AggregatedRoiLatencyMetrics;
  }>;
};
