export function validateTrustedAttestationTimeline(
  executionAttestation,
  verifications,
) {
  if (
    verifications?.preRun?.verified !== true ||
    verifications?.execution?.verified !== true
  ) {
    return { status: "NOT_PERFORMED", reasonCodes: [] };
  }

  const preRunPublication = Date.parse(
    verifications.preRun.integrated_time_utc ?? "",
  );
  const executionPublication = Date.parse(
    verifications.execution.integrated_time_utc ?? "",
  );
  const startedAt = Date.parse(executionAttestation?.started_at_utc ?? "");
  const finishedAt = Date.parse(executionAttestation?.finished_at_utc ?? "");
  if (
    ![preRunPublication, executionPublication, startedAt, finishedAt].every(
      Number.isFinite,
    )
  ) {
    return {
      status: "FAIL",
      reasonCodes: ["trusted_attestation_timestamp_missing_or_invalid"],
    };
  }

  const errors = [];
  if (startedAt <= preRunPublication) {
    errors.push("execution_started_not_after_prerun_publication");
  }
  if (finishedAt < startedAt) {
    errors.push("execution_finished_before_start");
  }
  if (executionPublication < finishedAt) {
    errors.push("execution_published_before_finish");
  }
  return { status: errors.length === 0 ? "PASS" : "FAIL", reasonCodes: errors };
}
