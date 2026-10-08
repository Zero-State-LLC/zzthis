export interface QualificationGateResult {
  gate_id: string;
  split: "final";
  observed: number | null;
  operator: "lte" | "gte";
  threshold: number;
  result: "pass" | "fail" | "not-applicable";
  threshold_key: string;
}

interface RateMetric {
  rate: number | null;
}

export interface QualificationGateInput {
  aggregates: {
    fiducial: {
      by_split: Record<
        string,
        { endpoint_recall: RateMetric; pair_accuracy: RateMetric }
      >;
    };
    text: {
      by_split: Record<
        string,
        {
          false_valid_decode_rate: RateMetric;
          exact_code_accuracy: RateMetric;
          character_error_rate: RateMetric;
        }
      >;
    };
    roi_latency: {
      by_split: Record<string, { rectification_success_rate: number | null }>;
      by_device_split: Array<{
        device_matrix_entry_id: string;
        split: string;
        metrics: { latency_ms: { p50: number; p95: number } | null };
      }>;
    };
  };
  falseAccepts: Array<{ split: string }>;
  deviceMatrix: { entries: Array<{ device_matrix_entry_id: string }> };
  gateConfig: {
    required_gate_ids: string[];
    thresholds: Record<string, number>;
  };
}

export function evaluateQualificationGates(input: QualificationGateInput): {
  status: "PASS" | "FAIL" | "INCOMPLETE";
  gate_results: QualificationGateResult[];
};
