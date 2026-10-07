import { describe, expect, it } from "vitest";
import {
  matchFiducials,
  normalizedBoxIoU,
} from "../scripts/ocr-qualification-matching.mjs";

const box = (x: number, width = 0.2) => ({
  x,
  y: 0.2,
  width,
  height: 0.2,
});
const fiducial = (role: "opening" | "closing", x: number, width?: number) => ({
  role,
  box: box(x, width),
});

describe("OCR qualification fiducial matching", () => {
  it("computes normalized box IoU", () => {
    expect(normalizedBoxIoU(box(0.1), box(0.2))).toBeCloseTo(1 / 3);
    expect(normalizedBoxIoU(box(0.1), box(0.5))).toBe(0);
  });

  it("uses one-to-one assignment maximizing total eligible IoU", () => {
    // Greedily assigning prediction 0 to truth 0 gives a lower total than the
    // globally optimal cross assignment.
    const predictions = [
      fiducial("opening", 0.1, 0.4),
      fiducial("opening", 0.0, 0.2),
    ];
    const truths = [
      fiducial("opening", 0.0, 0.3),
      fiducial("opening", 0.2, 0.3),
    ];
    const result = matchFiducials(predictions, truths, 0.3);

    expect(result.matches.map(({ prediction_index, truth_index }) => [
      prediction_index,
      truth_index,
    ])).toEqual([
      [0, 1],
      [1, 0],
    ]);
    expect(result.unmatched_prediction_indices).toEqual([]);
    expect(result.unmatched_truth_indices).toEqual([]);
  });

  it("filters role mismatches and below-threshold overlaps", () => {
    const result = matchFiducials(
      [fiducial("opening", 0.1), fiducial("closing", 0.1)],
      [fiducial("closing", 0.1), fiducial("opening", 0.65)],
      0.5,
    );
    expect(result.matches).toEqual([
      { prediction_index: 1, truth_index: 0, iou: 1 },
    ]);
    expect(result.unmatched_prediction_indices).toEqual([0]);
    expect(result.unmatched_truth_indices).toEqual([1]);
  });

  it("keeps an exact-threshold match and rejects invalid inputs", () => {
    const result = matchFiducials(
      [fiducial("opening", 0.1)],
      [fiducial("opening", 0.2)],
      1 / 3,
    );
    expect(result.matches).toHaveLength(1);
    expect(() => matchFiducials([], [], 0)).toThrow(
      "fiducial_iou_threshold_out_of_range",
    );
    expect(() => normalizedBoxIoU(box(0.9, 0.2), box(0.1))).toThrow(
      "invalid_normalized_box",
    );
  });
});
