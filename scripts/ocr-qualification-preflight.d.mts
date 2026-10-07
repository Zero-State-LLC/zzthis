export type JsonObject = Record<string, unknown>;

export interface QualificationReport {
  schema_version: 1;
  qualification_id: "ZZ-OCR-QUAL-001";
  candidate_id: string | null;
  status: "INCOMPLETE";
  disposition: "NO_PROMOTION";
  promotion_eligible: false;
  checks: {
    structural_validation: "PASS" | "INCOMPLETE";
    protected_verifier_policy: "PRESENT_UNVERIFIED" | "MISSING";
    sigstore_verification: "NOT_PERFORMED";
    decoder_replay: "NOT_PERFORMED" | "EXECUTED_UNPINNED";
    scoring_and_receipt: "NOT_PERFORMED";
  };
  decoder_replay_summary: {
    candidate_count: number;
    parsed_candidate_count: number;
    checkword_valid_candidate_count: number;
    classification_counts: {
      word: number;
      field: number;
      confirm: number;
      other: number;
    };
    valid_truth_count: number;
  } | null;
  hashes: Record<string, string>;
  reason_codes: string[];
}

export function canonicalSha256(value: unknown): string;
export function exactSha256(bytes: Uint8Array): string;
export function inspectQualification(
  documents: object,
  options?: {
    policyPresent?: boolean;
    rawInputBytes?: Record<string, Uint8Array>;
  },
): QualificationReport;
