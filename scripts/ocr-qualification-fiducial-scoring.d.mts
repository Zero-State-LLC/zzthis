import type { Fiducial } from "./ocr-qualification-matching.mjs";

export type RateMetric = {
  numerator: number;
  denominator: number;
  rate: number | null;
};

export type FiducialObservationScore = {
  endpoint_precision: RateMetric;
  endpoint_recall: RateMetric;
  false_finder_count: number;
  false_finder_rate: RateMetric;
  missed_endpoint_count: number;
  complete_pair_rate: RateMetric;
  pair_accuracy: RateMetric;
  false_pair_count: number;
  false_pair_rate: RateMetric;
  endpoint_matches: Array<{
    prediction_index: number;
    truth_index: number;
    iou: number;
  }>;
  correct_pairs: Array<Record<string, string | number>>;
  false_pairs: Array<Record<string, string | string[] | number[]>>;
  complete_truth_pair_count: number;
  detected_complete_truth_pair_count: number;
};

export function scoreFiducialObservation(
  predictions: Fiducial[],
  truths: Fiducial[],
  fiducialIouThreshold: number,
): FiducialObservationScore;
