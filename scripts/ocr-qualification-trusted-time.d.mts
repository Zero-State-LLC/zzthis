export function validateTrustedAttestationTimeline(
  executionAttestation: object | undefined,
  verifications?: {
    preRun?: {
      verified: boolean;
      integrated_time_utc?: string;
    };
    execution?: {
      verified: boolean;
      integrated_time_utc?: string;
    };
  },
): string[];
