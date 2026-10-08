import { describe, expect, it } from "vitest";
import {
  renderQualificationMarkdownReport,
  sha256MarkdownReport,
} from "../scripts/ocr-qualification-markdown-report.mjs";

describe("OCR qualification diagnostic Markdown report", () => {
  it("renders aggregates and gates without sample-level OCR evidence", () => {
    const inspection = {
      candidate_id: "candidate-fixture",
      status: "INCOMPLETE",
      disposition: "NO_PROMOTION",
      promotion_eligible: false,
      checks: {
        decoder_replay: "EXECUTED_PINNED",
        sigstore_verification: "FAILED",
      },
      reason_codes: ["protected_verifier_policy_missing"],
      qualification_scoring: {
        metric_sets: {
          metrics_by_split: {
            tuning: null,
            final: {
              sample_count: 2,
              endpoint_recall: { numerator: 4, denominator: 4, rate: 1 },
              pair_accuracy: { numerator: 2, denominator: 2, rate: 1 },
              exact_code_accuracy: { numerator: 1, denominator: 2, rate: 0.5 },
              false_valid_decode_rate: {
                numerator: 1,
                denominator: 2,
                rate: 0.5,
              },
              false_accept_rate: { numerator: 0, denominator: 2, rate: 0 },
              rectification_success_rate: {
                numerator: 1,
                denominator: 2,
                rate: 0.5,
              },
              character_error_rate: 0.25,
              latency_ms: { p50: 20, p95: 40 },
              crash_count: 1,
              exception_count: 0,
              package_size_delta_bytes: null,
              not_measured_reasons: [
                "package_size_delta_bytes:no_frozen_baseline_measurement",
              ],
            },
          },
          bucket_metrics: [
            {
              split: "final",
              bucket_id: "handwriting",
              metrics: { sample_count: 2 },
            },
          ],
        },
        gate_evaluation: {
          status: "INCOMPLETE",
          gate_results: [
            {
              gate_id: "false-accept-count",
              observed: 0,
              operator: "lte",
              threshold: 0,
              result: "pass",
            },
          ],
        },
        false_accepts: [
          {
            sample_id: "private-sample-id",
            expected_codes: ["zz-private-expected-code-zz"],
          },
        ],
        scored_observations: [{ text: "private raw OCR transcript" }],
      },
    };

    const markdown = renderQualificationMarkdownReport(inspection);

    expect(markdown).toContain("Diagnostic only");
    expect(markdown).toContain("Exact-code accuracy");
    expect(markdown).toContain("False Accept count");
    expect(markdown).toContain("handwriting");
    expect(markdown).toContain(
      "package_size_delta_bytes:no_frozen_baseline_measurement",
    );
    expect(markdown).not.toContain("private-sample-id");
    expect(markdown).not.toContain("zz-private-expected-code-zz");
    expect(markdown).not.toContain("private raw OCR transcript");
  });

  it("produces a deterministic SHA-256 for the exact Markdown bytes", () => {
    const markdown = renderQualificationMarkdownReport({
      status: "INCOMPLETE",
      disposition: "NO_PROMOTION",
      promotion_eligible: false,
      checks: {},
      reason_codes: ["missing"],
    });

    expect(sha256MarkdownReport(markdown)).toMatch(/^[a-f0-9]{64}$/);
    expect(sha256MarkdownReport(markdown)).toBe(sha256MarkdownReport(markdown));
  });
});
