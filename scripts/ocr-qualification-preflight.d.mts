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
    decoder_replay: "NOT_PERFORMED";
    scoring_and_receipt: "NOT_PERFORMED";
  };
  hashes: Record<string, string>;
  reason_codes: string[];
}

export function canonicalSha256(value: unknown): string;
export function inspectQualification(
  documents: object,
  options?: { policyPresent?: boolean },
): QualificationReport;
