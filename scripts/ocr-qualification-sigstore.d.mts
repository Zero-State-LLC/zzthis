export interface VerifierPolicy {
  schema_version: 1;
  cosign_version: "v3.1.3";
  oidc_issuer: "https://token.actions.githubusercontent.com";
  certificate_identity: string;
  bundle_media_type: "application/vnd.dev.sigstore.bundle.v0.3+json";
  required_tlog_entry_count: 1;
  trust_root: "sigstore-public-good-tuf";
}

export interface SigstoreVerificationResult {
  verified: boolean;
  reason?: string;
  integrated_time_utc?: string;
  attestation_sha256?: string;
}

export function loadVerifierPolicy(): VerifierPolicy;
export function canonicalAttestationBytes(attestation: object): Buffer;
export function verifySigstoreAttestation(options: {
  attestation: object;
  bundleBytes: Uint8Array;
  policy?: VerifierPolicy;
  cosignPath?: string;
  environment?: NodeJS.ProcessEnv;
  run?: (
    executable: string,
    args: string[],
    payloadBytes: Buffer,
    environment: NodeJS.ProcessEnv,
  ) =>
    | { status: number | null; error?: Error; stdout?: string }
    | Promise<{ status: number | null; error?: Error; stdout?: string }>;
}): Promise<SigstoreVerificationResult>;
