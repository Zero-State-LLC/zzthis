import { describe, expect, it } from "vitest";
import { aggregateFiducialScoring } from "../scripts/ocr-qualification-fiducial-aggregation.mjs";

function scored(
  sample_id: string,
  device_matrix_entry_id: string,
  split: "tuning" | "final",
  endpoint: [number, number],
  pairs: [number, number],
) {
  const rate = (counts: [number, number]) => ({
    numerator: counts[0],
    denominator: counts[1],
    rate: counts[1] === 0 ? null : counts[0] / counts[1],
  });
  return {
    sample_id,
    device_matrix_entry_id,
    split,
    endpoint_precision: rate(endpoint),
    endpoint_recall: rate(endpoint),
    false_finder_count: endpoint[1] - endpoint[0],
    false_finder_rate: rate([endpoint[1] - endpoint[0], endpoint[1]]),
    missed_endpoint_count: endpoint[1] - endpoint[0],
    complete_pair_rate: rate(pairs),
    pair_accuracy: rate(pairs),
    false_pair_count: pairs[1] - pairs[0],
    false_pair_rate: rate([pairs[1] - pairs[0], pairs[1]]),
  };
}

describe("OCR qualification fiducial aggregation", () => {
  it("sums counts across split, device, and bucket groups", () => {
    const result = aggregateFiducialScoring(
      [
        scored("s1", "device-a", "final", [1, 1], [1, 1]),
        scored("s2", "device-a", "final", [1, 2], [0, 1]),
        scored("s1", "device-b", "final", [0, 1], [0, 1]),
        scored("s3", "device-a", "tuning", [2, 2], [1, 1]),
      ],
      [
        { sample_id: "s1", split: "final", stress_tags: ["glare"] },
        { sample_id: "s2", split: "final", stress_tags: ["glare", "blur"] },
        { sample_id: "s3", split: "tuning", stress_tags: ["clean"] },
      ],
    );

    expect(result.by_split.final?.endpoint_recall).toEqual({
      numerator: 2,
      denominator: 4,
      rate: 0.5,
    });
    expect(result.by_split.final?.sample_count).toBe(2);
    expect(
      result.by_device_split.find(
        (row) => row.device_matrix_entry_id === "device-b",
      )?.metrics.pair_accuracy,
    ).toEqual({ numerator: 0, denominator: 1, rate: 0 });
    expect(
      result.by_split_bucket.find((row) => row.bucket_id === "glare")?.metrics
        .endpoint_precision,
    ).toEqual({ numerator: 2, denominator: 4, rate: 0.5 });
  });

  it("rejects duplicate device/sample rows and overflowing aggregate counts", () => {
    const metadata = [
      { sample_id: "s1", split: "final" as const, stress_tags: [] },
      { sample_id: "s2", split: "final" as const, stress_tags: [] },
    ];
    const first = scored(
      "s1",
      "device-a",
      "final",
      [0, Number.MAX_SAFE_INTEGER],
      [0, 0],
    );
    const second = scored("s2", "device-a", "final", [0, 1], [0, 0]);

    expect(() => aggregateFiducialScoring([first, first], metadata)).toThrow(
      "duplicate_fiducial_device_sample_observation",
    );
    expect(() => aggregateFiducialScoring([first, second], metadata)).toThrow(
      "invalid_fiducial_metric_count:denominator",
    );
  });

  it("rejects inconsistent per-sample count and rate fields", () => {
    const row = scored("s1", "device-a", "final", [1, 2], [1, 1]);
    row.false_finder_count = 0;

    expect(() =>
      aggregateFiducialScoring(
        [row],
        [{ sample_id: "s1", split: "final", stress_tags: [] }],
      ),
    ).toThrow("fiducial_observation_count_mismatch");
  });
});
