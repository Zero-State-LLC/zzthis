export interface NormalizedBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Fiducial {
  role: "opening" | "closing";
  box: NormalizedBox;
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
