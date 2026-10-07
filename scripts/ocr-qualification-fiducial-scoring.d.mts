import type { Fiducial } from "./ocr-qualification-matching.mjs";

export function scoreFiducialObservation(
  predictions: Fiducial[],
  truths: Fiducial[],
  fiducialIouThreshold: number,
): {
  endpoint_precision: {
    numerator: number;
    denominator: number;
    rate: number | null;
  };
  endpoint_recall: {
    numerator: number;
    denominator: number;
    rate: number | null;
  };
  false_finder_count: number;
  false_finder_rate: {
    numerator: number;
    denominator: number;
    rate: number | null;
  };
  missed_endpoint_count: number;
  complete_pair_rate: {
    numerator: number;
    denominator: number;
    rate: number | null;
  };
  pair_accuracy: {
    numerator: number;
    denominator: number;
    rate: number | null;
  };
  false_pair_count: number;
  false_pair_rate: {
    numerator: number;
    denominator: number;
    rate: number | null;
  };
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
