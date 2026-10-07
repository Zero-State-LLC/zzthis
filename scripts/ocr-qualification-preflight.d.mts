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
    sigstore_verification:
      "NOT_PERFORMED" | "FAILED" | "PARTIAL" | "VERIFIED_UNQUALIFIED";
    sigstore_attestations: {
      pre_run: "NOT_PERFORMED" | "VERIFIED" | "FAILED";
      execution: "NOT_PERFORMED" | "VERIFIED" | "FAILED";
    };
    decoder_replay: "NOT_PERFORMED" | "EXECUTED_UNPINNED" | "EXECUTED_PINNED";
    decoder_identity: "VERIFIED" | "MISMATCH" | "UNAVAILABLE";
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
    band_counts: {
      tuning: Record<"accept" | "clarify" | "retry" | "abstain", number>;
      final: Record<"accept" | "clarify" | "retry" | "abstain", number>;
    };
    valid_truth_count: number;
  } | null;
  hashes: Record<string, string>;
  reason_codes: string[];
}

export function canonicalSha256(value: unknown): string;
export function exactSha256(bytes: Uint8Array): string;
export interface DecoderIdentity {
  available: boolean;
  reason?: string;
  commit?: string;
  clean?: boolean;
  wordlist_sha256?: string;
  checkword_sha256?: string;
  vectors_sha256?: string;
  band_mapping_sha256?: string;
}
export function readDecoderIdentity(): DecoderIdentity;
export function verifyDecoderIdentity(
  candidateDecoder: JsonObject | undefined,
  runtimeIdentity: DecoderIdentity,
): { verified: boolean; reasons: string[] };
export function inspectQualification(
  documents: object,
  options?: {
    policyPresent?: boolean;
    policyError?: string;
    sigstoreVerifications?: {
      preRun?: { verified: boolean; reason?: string };
      execution?: { verified: boolean; reason?: string };
    };
    rawInputBytes?: Record<string, Uint8Array>;
    decoderIdentity?: DecoderIdentity;
  },
): QualificationReport;
