import { describe, expect, it } from "vitest";
import { aggregateTextScoring } from "../scripts/ocr-qualification-text-aggregation.mjs";

function scored(
  sample_id: string,
  device_matrix_entry_id: string,
  exact: [number, number],
  cer: [number, number],
  falseValid: [number, number],
  partWord: [number, number] = exact,
) {
  return {
    sample_id,
    device_matrix_entry_id,
    split: "final" as const,
    exact_code_accuracy: {
      numerator: exact[0],
      denominator: exact[1],
      rate: exact[1] === 0 ? null : exact[0] / exact[1],
    },
    part_word_accuracy: {
      numerator: partWord[0],
      denominator: partWord[1],
      rate: partWord[1] === 0 ? null : partWord[0] / partWord[1],
    },
    character_error_rate: {
      edit_distance: cer[0],
      reference_code_point_count: cer[1],
      rate: cer[1] === 0 ? null : cer[0] / cer[1],
    },
    false_valid_decode_rate: {
      numerator: falseValid[0],
      denominator: falseValid[1],
      rate: falseValid[1] === 0 ? null : falseValid[0] / falseValid[1],
    },
  };
}

describe("OCR qualification text aggregation", () => {
  it("sums numerators and denominators instead of averaging percentages", () => {
    const result = aggregateTextScoring(
      [
        scored("s1", "device-a", [1, 1], [0, 10], [0, 1], [3, 3]),
        scored("s2", "device-a", [0, 3], [3, 10], [1, 3], [2, 3]),
      ],
      [
        { sample_id: "s1", split: "final", stress_tags: ["clean"] },
        { sample_id: "s2", split: "final", stress_tags: ["clean"] },
      ],
    );

    expect(result.by_split.final?.exact_code_accuracy).toEqual({
      numerator: 1,
      denominator: 4,
      rate: 0.25,
    });
    expect(result.by_split.final?.false_valid_decode_rate).toEqual({
      numerator: 1,
      denominator: 4,
      rate: 0.25,
    });
    expect(result.by_split.final?.part_word_accuracy).toEqual({
      numerator: 5,
      denominator: 6,
      rate: 5 / 6,
    });
    expect(result.by_split.final?.character_error_rate).toEqual({
      edit_distance: 3,
      reference_code_point_count: 20,
      rate: 0.15,
    });
  });

  it("keeps every device and stress bucket distinct", () => {
    const result = aggregateTextScoring(
      [
        scored("s1", "device-a", [1, 1], [0, 10], [0, 1]),
        scored("s1", "device-b", [0, 1], [5, 10], [1, 1]),
      ],
      [{ sample_id: "s1", split: "final", stress_tags: ["clean", "glare"] }],
    );
    expect(
      result.by_device_split.map((row) => row.device_matrix_entry_id),
    ).toEqual(["device-a", "device-b"]);
    expect(result.by_split_bucket.map((row) => row.bucket_id)).toEqual([
      "clean",
      "glare",
    ]);
    expect(result.by_split_bucket[0]?.metrics.exact_code_accuracy.rate).toBe(
      0.5,
    );
  });

  it("rejects duplicate device/sample rows and split or metric inconsistencies", () => {
    const sample = {
      sample_id: "s1",
      split: "final" as const,
      stress_tags: [],
    };
    const first = scored("s1", "device-a", [1, 1], [0, 10], [0, 1]);
    expect(() => aggregateTextScoring([first, first], [sample])).toThrow(
      "duplicate_device_sample_observation",
    );
    expect(() =>
      aggregateTextScoring(
        [
          {
            ...first,
            exact_code_accuracy: { numerator: 2, denominator: 1, rate: 2 },
          },
        ],
        [sample],
      ),
    ).toThrow("invalid_rate_metric:exact_code_accuracy");
    expect(() =>
      aggregateTextScoring([first], [{ ...sample, split: "tuning" }]),
    ).toThrow("scored_observation_metadata_mismatch");
  });

  it("rejects aggregate counts that exceed the safe integer range", () => {
    const manifest = [
      { sample_id: "s1", split: "final" as const, stress_tags: [] },
      { sample_id: "s2", split: "final" as const, stress_tags: [] },
    ];
    const first = scored(
      "s1",
      "device-a",
      [0, Number.MAX_SAFE_INTEGER],
      [0, 0],
      [0, 0],
    );
    const second = scored("s2", "device-a", [0, 1], [0, 0], [0, 0]);

    expect(() => aggregateTextScoring([first, second], manifest)).toThrow(
      "invalid_metric_count:denominator",
    );
  });
});
