export interface ScoredTextSample {
  sample_id: string;
  device_matrix_entry_id: string;
  split: "tuning" | "final";
  exact_code_accuracy: {
    numerator: number;
    denominator: number;
    rate: number | null;
  };
  part_word_accuracy: {
    numerator: number;
    denominator: number;
    rate: number | null;
  };
  character_error_rate: {
    edit_distance: number;
    reference_code_point_count: number;
    rate: number | null;
  };
  false_valid_decode_rate: {
    numerator: number;
    denominator: number;
    rate: number | null;
  };
}

export interface ManifestSampleMetadata {
  sample_id: string;
  split: "tuning" | "final";
  stress_tags: string[];
}

export interface AggregatedTextMetrics {
  sample_count: number;
  observation_count: number;
  exact_code_accuracy: {
    numerator: number;
    denominator: number;
    rate: number | null;
  };
  part_word_accuracy: {
    numerator: number;
    denominator: number;
    rate: number | null;
  };
  character_error_rate: {
    edit_distance: number;
    reference_code_point_count: number;
    rate: number | null;
  };
  false_valid_decode_rate: {
    numerator: number;
    denominator: number;
    rate: number | null;
  };
}

export function aggregateTextScoring(
  scoredSamples: ScoredTextSample[],
  manifestSamples: ManifestSampleMetadata[],
): {
  by_split: Partial<Record<"tuning" | "final", AggregatedTextMetrics>>;
  by_device_split: Array<{
    device_matrix_entry_id: string;
    split: "tuning" | "final";
    metrics: AggregatedTextMetrics;
  }>;
  by_split_bucket: Array<{
    split: "tuning" | "final";
    bucket_id: string;
    metrics: AggregatedTextMetrics;
  }>;
};
