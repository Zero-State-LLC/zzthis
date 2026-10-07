export function levenshteinDistance(left: string, right: string): number;

export interface GroundTruthPayload {
  pair_id: string;
  literal_payload: string;
  canonical_code: string | null;
  kind: "valid" | "partial" | "invalid";
}

export interface OrderedTextCandidate {
  candidate_id: string;
  pair_id: string | null;
  raw_text: string;
}

export function scorePayloadObservations(
  manifestSample: {
    sample_id: string;
    ground_truth_codes: GroundTruthPayload[];
  },
  adapterResult: {
    sample_id: string;
    split: "tuning" | "final";
    device_matrix_entry_id: string;
    candidates: OrderedTextCandidate[];
  },
  pairScoring: {
    correct_pairs: Array<{
      truth_pair_id: string;
      predicted_pair_id: string;
    }>;
  },
  wordlistVersion: string,
): {
  sample_id: string;
  device_matrix_entry_id: string;
  split: "tuning" | "final";
  observations: Array<{
    pair_id: string;
    candidate_count: number;
    top1_candidate_id: string | null;
    exact_code_correct: boolean | null;
    character_edit_distance: number;
    reference_code_point_count: number;
    false_valid_decode: boolean | null;
  }>;
  exact_code_accuracy: {
    numerator: number;
    denominator: number;
    rate: number | null;
  };
  character_error_rate: {
    edit_distance: number;
    reference_code_point_count: number;
    rate: number | null;
  };
  false_valid_decode_rate: {
    numerator: number;
    denominator: number;
    rate: number | null;
  };
  false_valid_cases: Array<{
    device_matrix_entry_id: string;
    sample_id: string;
    pair_id: string;
    expected_code: string;
    observed_code: string;
  }>;
};
