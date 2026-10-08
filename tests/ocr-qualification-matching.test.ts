import { describe, expect, it } from "vitest";
import {
  matchFiducials,
  normalizedBoxIoU,
  scoreFiducialPairs,
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

    expect(
      result.matches.map(({ prediction_index, truth_index }) => [
        prediction_index,
        truth_index,
      ]),
    ).toEqual([
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

  it("rejects crossed pairing even when every endpoint individually matches", () => {
    const predictions = [
      { ...fiducial("opening", 0.1), pair_id: "pred-cross" },
      { ...fiducial("closing", 0.7), pair_id: "pred-cross" },
      { ...fiducial("opening", 0.1), pair_id: "pred-cross-2" },
      { ...fiducial("closing", 0.7), pair_id: "pred-cross-2" },
    ];
    const truths = [
      { ...fiducial("opening", 0.1), pair_id: "truth-a" },
      { ...fiducial("closing", 0.7), pair_id: "truth-a" },
      { ...fiducial("opening", 0.1), pair_id: "truth-b" },
      { ...fiducial("closing", 0.7), pair_id: "truth-b" },
    ];
    const result = scoreFiducialPairs(predictions, truths, [
      { prediction_index: 0, truth_index: 0 },
      { prediction_index: 1, truth_index: 3 },
      { prediction_index: 2, truth_index: 2 },
      { prediction_index: 3, truth_index: 1 },
    ]);

    expect(result.correct_pairs).toEqual([]);
    expect(result.false_pairs).toEqual([
      {
        predicted_pair_id: "pred-cross",
        prediction_indices: [0, 1],
        matched_truth_pair_ids: ["truth-a", "truth-b"],
      },
      {
        predicted_pair_id: "pred-cross-2",
        prediction_indices: [2, 3],
        matched_truth_pair_ids: ["truth-b", "truth-a"],
      },
    ]);
    expect(result.complete_truth_pair_ids).toEqual(["truth-a", "truth-b"]);
    expect(result.detected_complete_truth_pair_ids).toEqual([
      "truth-a",
      "truth-b",
    ]);
    expect(result.missed_truth_pair_ids).toEqual([]);
    expect(result.correctly_linked_truth_pair_ids).toEqual([]);
  });

  it("does not count endpoint detection as a correctly linked pair", () => {
    const predictions = [
      { ...fiducial("opening", 0.1), pair_id: "pred-open" },
      { ...fiducial("closing", 0.7), pair_id: "pred-close" },
    ];
    const truths = [
      { ...fiducial("opening", 0.1), pair_id: "truth-a" },
      { ...fiducial("closing", 0.7), pair_id: "truth-a" },
    ];
    const result = scoreFiducialPairs(predictions, truths, [
      { prediction_index: 0, truth_index: 0 },
      { prediction_index: 1, truth_index: 1 },
    ]);
    expect(result.detected_complete_truth_pair_ids).toEqual(["truth-a"]);
    expect(result.correctly_linked_truth_pair_ids).toEqual([]);
    expect(result.false_pairs).toEqual([
      {
        predicted_pair_id: "pred-open",
        prediction_indices: [0],
        matched_truth_pair_ids: ["truth-a"],
      },
      {
        predicted_pair_id: "pred-close",
        prediction_indices: [1],
        matched_truth_pair_ids: ["truth-a"],
      },
    ]);
  });

  it("rejects duplicate match assignments and duplicate truth endpoints", () => {
    const predictions = [{ ...fiducial("opening", 0.1), pair_id: "p" }];
    const truths = [{ ...fiducial("opening", 0.1), pair_id: "t" }];
    expect(() =>
      scoreFiducialPairs(predictions, truths, [
        { prediction_index: 0, truth_index: 0 },
        { prediction_index: 0, truth_index: 0 },
      ]),
    ).toThrow("invalid_fiducial_match_assignment");
    expect(() =>
      scoreFiducialPairs(
        predictions,
        [truths[0]!, truths[0]!],
        [{ prediction_index: 0, truth_index: 0 }],
      ),
    ).toThrow("duplicate_truth_pair_endpoint");
  });
});
