import type { SigstoreVerificationResult } from "./ocr-qualification-sigstore.mjs";

export interface QualificationBundleVerifications {
  policyPresent: boolean;
  policyError?: string;
  preRun: SigstoreVerificationResult;
  execution: SigstoreVerificationResult;
}

export function verifyQualificationBundles(
  inputs: {
    preRunAttestation?: object;
    executionAttestation?: object;
    preRunBundle?: Uint8Array;
    executionBundle?: Uint8Array;
  },
  dependencies?: {
    policyLoader?: () => object;
    verifier?: (options: {
      attestation: object;
      bundleBytes: Uint8Array;
      policy: object;
    }) => Promise<SigstoreVerificationResult>;
  },
): Promise<QualificationBundleVerifications>;
