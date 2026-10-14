export function summarizeSigstoreVerifications(verifications) {
  if (!verifications) {
    return {
      status: "NOT_PERFORMED",
      preRun: "NOT_PERFORMED",
      execution: "NOT_PERFORMED",
      preRunIntegratedTime: null,
      executionIntegratedTime: null,
      reasons: ["sigstore_bundle_verification_not_performed"],
    };
  }

  const preRunVerified = verifications.preRun?.verified === true;
  const executionVerified = verifications.execution?.verified === true;
  const reasons = [];
  if (!preRunVerified) {
    reasons.push(
      `sigstore_verification_failed:pre_run:${verifications.preRun?.reason ?? "result_missing"}`,
    );
  }
  if (!executionVerified) {
    reasons.push(
      `sigstore_verification_failed:execution:${verifications.execution?.reason ?? "result_missing"}`,
    );
  }
  reasons.push("protected_verifier_policy_protection_unverified");

  return {
    status:
      preRunVerified && executionVerified
        ? "VERIFIED_UNQUALIFIED"
        : preRunVerified || executionVerified
          ? "PARTIAL"
          : "FAILED",
    preRun: preRunVerified ? "VERIFIED" : "FAILED",
    execution: executionVerified ? "VERIFIED" : "FAILED",
    preRunIntegratedTime: preRunVerified
      ? (verifications.preRun.integrated_time_utc ?? null)
      : null,
    executionIntegratedTime: executionVerified
      ? (verifications.execution.integrated_time_utc ?? null)
      : null,
    reasons,
  };
}
