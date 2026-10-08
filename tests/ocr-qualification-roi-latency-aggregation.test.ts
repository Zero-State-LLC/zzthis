import { describe, expect, it } from "vitest";
import { aggregateRoiLatencyScoring } from "../scripts/ocr-qualification-roi-latency-aggregation.mjs";

function scored(
  sample_id: string,
  device_matrix_entry_id: string,
  roi_mean_iou: number | null,
  roi_truth_count: number,
  rectification_success_count: number,
  rectification_denominator: number | null,
  elapsed_ms: number[],
) {
  return {
    sample_id,
    device_matrix_entry_id,
    split: "final" as const,
    roi_mean_iou,
    roi_truth_count,
    rectification_success_count,
    rectification_denominator,
    elapsed_ms,
  };
}

describe("OCR qualification ROI and latency aggregation", () => {
  it("weights ROI by truth count and recomputes latency percentiles", () => {
    const result = aggregateRoiLatencyScoring(
      [
        scored("s1", "device-a", 0.5, 2, 1, 2, [10, 20]),
        scored("s2", "device-a", 0.25, 1, 0, 1, [40]),
      ],
      [
        { sample_id: "s1", split: "final", stress_tags: ["glare"] },
        { sample_id: "s2", split: "final", stress_tags: ["glare"] },
      ],
    );

    expect(result.by_split.final).toMatchObject({
      roi_truth_count: 3,
      roi_mean_iou: 5 / 12,
      rectification_success_count: 1,
      rectification_denominator: 3,
      rectification_success_rate: 1 / 3,
      latency_sample_count: 3,
      latency_ms: { p50: 20, p95: 40 },
    });
    expect(result.by_split_bucket[0]?.metrics.roi_mean_iou).toBe(5 / 12);
  });

  it("keeps unmeasured rectification unavailable and rejects duplicate rows", () => {
    const row = scored("s1", "device-a", 1, 1, 0, null, [12]);
    const manifest = [
      { sample_id: "s1", split: "final" as const, stress_tags: [] },
    ];

    expect(
      aggregateRoiLatencyScoring([row], manifest).by_split.final,
    ).toMatchObject({
      rectification_denominator: null,
      rectification_success_rate: null,
      latency_ms: { p50: 12, p95: 12 },
    });
    expect(() => aggregateRoiLatencyScoring([row, row], manifest)).toThrow(
      "duplicate_roi_device_sample_observation",
    );
  });

  it("rejects a mean IoU without any truth ROIs", () => {
    const row = scored("s1", "device-a", 0.5, 0, 0, 0, []);

    expect(() =>
      aggregateRoiLatencyScoring(
        [row],
        [{ sample_id: "s1", split: "final", stress_tags: [] }],
      ),
    ).toThrow("roi_scored_observation_metrics_invalid");
  });
});
