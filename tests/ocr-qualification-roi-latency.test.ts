import { describe, expect, it } from "vitest";
import {
  polygonIoU,
  scoreRoiAndLatency,
} from "../scripts/ocr-qualification-roi-latency.mjs";

const square = (x: number, y: number, width: number, height: number) => [
  { x, y },
  { x: x + width, y },
  { x: x + width, y: y + height },
  { x, y: y + height },
];

describe("OCR qualification ROI and latency scoring", () => {
  it("computes polygon IoU for overlapping convex quadrilaterals", () => {
    expect(
      polygonIoU(square(0, 0, 0.5, 0.5), square(0.25, 0, 0.5, 0.5)),
    ).toBeCloseTo(1 / 3);
    expect(polygonIoU(square(0, 0, 0.5, 0.5), square(0, 0, 0.5, 0.5))).toBe(1);
    expect(polygonIoU(square(0, 0, 0.5, 0.5), square(0.5, 0.5, 0.5, 0.5))).toBe(
      0,
    );
  });

  it("scores missing ROI as zero and failed rectification against all truth ROIs", () => {
    const score = scoreRoiAndLatency({
      roiTruth: [
        { pair_id: "a", polygon: square(0, 0, 0.5, 0.5) },
        { pair_id: "b", polygon: square(0.5, 0.5, 0.5, 0.5) },
      ],
      rois: [
        {
          pair_id: "a",
          polygon: square(0, 0, 0.5, 0.5),
          rectification_succeeded: false,
        },
      ],
      elapsedMs: [12],
    });
    expect(score).toMatchObject({
      roi_truth_count: 2,
      roi_mean_iou: 0.5,
      rectification_success_count: 0,
      rectification_denominator: 2,
      rectification_success_rate: 0,
    });
  });

  it("keeps rectification unmeasured when a matched ROI lacks an outcome", () => {
    const score = scoreRoiAndLatency({
      roiTruth: [{ pair_id: "a", polygon: square(0, 0, 0.5, 0.5) }],
      rois: [{ pair_id: "a", polygon: square(0, 0, 0.5, 0.5) }],
      elapsedMs: [],
    });
    expect(score.rectification_success_rate).toBeNull();
    expect(score.rectification_denominator).toBeNull();
    expect(score.rectification_unmeasured_pair_ids).toEqual(["a"]);
    expect(score.latency_ms).toBeNull();
  });

  it("uses conventional median and nearest-rank p95 for the sample latencies", () => {
    const score = scoreRoiAndLatency({
      roiTruth: [],
      rois: [],
      elapsedMs: Array.from({ length: 20 }, (_, index) => index + 1),
    });
    expect(score.latency_ms).toEqual({ p50: 10.5, p95: 19 });
  });

  it("rejects duplicate pair IDs, non-convex polygons, and invalid timing", () => {
    const truth = [{ pair_id: "a", polygon: square(0, 0, 0.5, 0.5) }];
    expect(() =>
      scoreRoiAndLatency({
        roiTruth: truth,
        rois: [
          { pair_id: "a", polygon: square(0, 0, 0.5, 0.5) },
          { pair_id: "a", polygon: square(0, 0, 0.5, 0.5) },
        ],
        elapsedMs: [],
      }),
    ).toThrow(/unique/);
    expect(() =>
      polygonIoU(
        [
          { x: 0, y: 0 },
          { x: 1, y: 0 },
          { x: 0.25, y: 0.25 },
          { x: 0, y: 1 },
        ],
        square(0, 0, 0.5, 0.5),
      ),
    ).toThrow(/convex/);
    expect(() =>
      polygonIoU(
        [
          { x: 0.5, y: 0 },
          { x: 0.8, y: 0.8 },
          { x: 0, y: 0.3 },
          { x: 1, y: 0.3 },
          { x: 0.2, y: 0.8 },
        ],
        square(0, 0, 0.5, 0.5),
      ),
    ).toThrow(/self-intersections/);
    expect(() =>
      scoreRoiAndLatency({ roiTruth: [], rois: [], elapsedMs: [-1] }),
    ).toThrow(/non-negative/);
  });
});
