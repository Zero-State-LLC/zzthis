import { describe, expect, it } from "vitest";
import {
  evaluateQualificationGates,
  type QualificationGateInput,
} from "../scripts/ocr-qualification-gates.mjs";

const thresholds = {
  max_false_accept_count: 0,
  max_false_valid_decode_rate: 0,
  min_endpoint_recall: 1,
  min_pair_accuracy: 1,
  min_exact_code_accuracy: 1,
  max_character_error_rate: 0,
  min_rectification_success_rate: 1,
  max_p95_latency_ms: 100,
};
const ids = [
  "false-accept-count",
  "false-valid-decode-rate",
  "endpoint-recall",
  "pair-accuracy",
  "exact-code-accuracy",
  "character-error-rate",
  "rectification-success-rate",
  "p95-latency-ms",
];

function input(): QualificationGateInput {
  return {
    aggregates: {
      fiducial: {
        by_split: {
          final: {
            endpoint_recall: { rate: 1 },
            pair_accuracy: { rate: 1 },
          },
        },
      },
      text: {
        by_split: {
          final: {
            false_valid_decode_rate: { rate: 0 },
            exact_code_accuracy: { rate: 1 },
            character_error_rate: { rate: 0 },
          },
        },
      },
      roi_latency: {
        by_split: { final: { rectification_success_rate: 1 } },
        by_device_split: [
          {
            device_matrix_entry_id: "ios-a",
            split: "final",
            metrics: { latency_ms: { p50: 60, p95: 80 } },
          },
          {
            device_matrix_entry_id: "android-b",
            split: "final",
            metrics: { latency_ms: { p50: 70, p95: 100 } },
          },
        ],
      },
    },
    falseAccepts: [],
    deviceMatrix: {
      entries: [
        { device_matrix_entry_id: "ios-a" },
        { device_matrix_entry_id: "android-b" },
      ],
    },
    gateConfig: { required_gate_ids: ids, thresholds },
  };
}

describe("OCR qualification final-split gates", () => {
  it("recomputes the eight fixed gates from final metrics", () => {
    const result = evaluateQualificationGates(input());

    expect(result.status).toBe("PASS");
    expect(result.gate_results.map(({ gate_id }) => gate_id)).toEqual(ids);
    expect(result.gate_results.every(({ split }) => split === "final")).toBe(
      true,
    );
    expect(result.gate_results.at(-1)).toMatchObject({
      observed: 100,
      threshold: 100,
      result: "pass",
    });
  });

  it("uses the maximum device p95 and fails a final false accept", () => {
    const values = input();
    values.aggregates.roi_latency.by_device_split[1]!.metrics.latency_ms = {
      p50: 80,
      p95: 101,
    };
    values.falseAccepts.push({ split: "final" });

    const result = evaluateQualificationGates(values);

    expect(result.status).toBe("FAIL");
    expect(result.gate_results[0]?.observed).toBe(1);
    expect(result.gate_results[0]?.result).toBe("fail");
    expect(result.gate_results.at(-1)?.observed).toBe(101);
    expect(result.gate_results.at(-1)?.result).toBe("fail");
  });

  it("keeps any missing device p95 incomplete rather than passing", () => {
    const values = input();
    values.aggregates.roi_latency.by_device_split[1]!.metrics.latency_ms = null;

    const result = evaluateQualificationGates(values);

    expect(result.status).toBe("INCOMPLETE");
    expect(result.gate_results.at(-1)).toMatchObject({
      observed: null,
      result: "not-applicable",
    });
  });
});
