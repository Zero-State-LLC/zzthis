export interface NormalizedBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Fiducial {
  role: "opening" | "closing";
  box: NormalizedBox;
  pair_id?: string | null;
}

export function normalizedBoxIoU(
  left: NormalizedBox,
  right: NormalizedBox,
): number;

export function matchFiducials(
  predictions: Fiducial[],
  truths: Fiducial[],
  threshold: number,
): {
  matches: Array<{
    prediction_index: number;
    truth_index: number;
    iou: number;
  }>;
  unmatched_prediction_indices: number[];
  unmatched_truth_indices: number[];
};

export function scoreFiducialPairs(
  predictions: Fiducial[],
  truths: Fiducial[],
  matches: Array<{
    prediction_index: number;
    truth_index: number;
    iou?: number;
  }>,
): {
  correct_pairs: Array<{
    predicted_pair_id: string;
    truth_pair_id: string;
    opening_prediction_index: number;
    closing_prediction_index: number;
  }>;
  false_pairs: Array<{
    predicted_pair_id: string;
    prediction_indices: number[];
    matched_truth_pair_ids: string[];
  }>;
  complete_truth_pair_ids: string[];
  detected_complete_truth_pair_ids: string[];
  missed_truth_pair_ids: string[];
  correctly_linked_truth_pair_ids: string[];
};
