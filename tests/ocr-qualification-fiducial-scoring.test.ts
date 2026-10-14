import { describe, expect, it } from "vitest";
import { scoreFiducialObservation } from "../scripts/ocr-qualification-fiducial-scoring.mjs";

const box = (x: number) => ({ x, y: 0.2, width: 0.1, height: 0.2 });
const marker = (
  role: "opening" | "closing",
  x: number,
  pair_id: string | null,
) => ({ role, box: box(x), pair_id });

describe("OCR qualification fiducial metrics", () => {
  it("counts matched, missed, and false-finder endpoints explicitly", () => {
    const result = scoreFiducialObservation(
      [
        marker("opening", 0.1, "pred-a"),
        marker("closing", 0.7, "pred-a"),
        marker("opening", 0.4, "pred-extra"),
      ],
      [
        marker("opening", 0.1, "truth-a"),
        marker("closing", 0.7, "truth-a"),
        marker("closing", 0.9, "truth-b"),
      ],
      0.5,
    );

    expect(result.endpoint_precision).toEqual({
      numerator: 2,
      denominator: 3,
      rate: 2 / 3,
    });
    expect(result.endpoint_recall).toEqual({
      numerator: 2,
      denominator: 3,
      rate: 2 / 3,
    });
    expect(result.false_finder_count).toBe(1);
    expect(result.false_finder_rate).toEqual({
      numerator: 1,
      denominator: 3,
      rate: 1 / 3,
    });
    expect(result.missed_endpoint_count).toBe(1);
    expect(result.complete_pair_rate).toEqual({
      numerator: 1,
      denominator: 1,
      rate: 1,
    });
    expect(result.pair_accuracy).toEqual({
      numerator: 1,
      denominator: 2,
      rate: 0.5,
    });
    expect(result.false_pair_rate).toEqual({
      numerator: 1,
      denominator: 2,
      rate: 0.5,
    });
  });

  it("separates complete endpoint detection from correctly linked pairs", () => {
    const result = scoreFiducialObservation(
      [
        marker("opening", 0.05, "pred-a"),
        marker("closing", 0.9, "pred-a"),
        marker("opening", 0.65, "pred-b"),
        marker("closing", 0.35, "pred-b"),
      ],
      [
        marker("opening", 0.05, "truth-a"),
        marker("closing", 0.35, "truth-a"),
        marker("opening", 0.65, "truth-b"),
        marker("closing", 0.9, "truth-b"),
      ],
      0.8,
    );

    expect(result.complete_pair_rate.rate).toBe(1);
    expect(result.pair_accuracy.rate).toBe(0);
    expect(result.false_pair_rate.rate).toBe(1);
    expect(result.false_pair_count).toBe(2);
  });

  it("returns null rates when a metric has no observations", () => {
    const result = scoreFiducialObservation([], [], 0.5);
    expect(result.endpoint_precision).toEqual({
      numerator: 0,
      denominator: 0,
      rate: null,
    });
    expect(result.endpoint_recall.rate).toBeNull();
    expect(result.complete_pair_rate.rate).toBeNull();
    expect(result.pair_accuracy.rate).toBeNull();
  });
});
