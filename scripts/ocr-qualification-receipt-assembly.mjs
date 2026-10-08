import { buildQualificationReceiptArtifact } from "./ocr-qualification-receipt-report.mjs";

const REVIEW_NOT_SUPPLIED = {
  status: "blocked",
  reviewer: "not-assigned",
  evidence_ref: "urn:zz-ocr-qual-001:review-not-supplied",
};

function hashRef(value) {
  return typeof value === "string" && /^[a-f0-9]{64}$/.test(value)
    ? `urn:sha256:${value}`
    : null;
}

function reviewedCase(item, { expected, observed }) {
  return {
    device_matrix_entry_id: item.device_matrix_entry_id,
    sample_id: item.sample_id,
    pair_id: item.pair_id ?? null,
    expected_codes: expected(item),
    observed_codes: observed(item),
    disposition: "unreviewed",
    reviewer: "not-assigned",
  };
}

function finalBucketCount(metricSets, bucketId) {
  return (
    metricSets.bucket_metrics.find(
      (row) => row.split === "final" && row.bucket_id === bucketId,
    )?.metrics.sample_count ?? 0
  );
}

function releaseGateResult(gate) {
  return {
    gate_id: gate.gate_id,
    split: gate.split,
    observed: gate.observed,
    operator: gate.operator,
    threshold: gate.threshold,
    result: gate.result,
  };
}

/**
 * Assemble a hash-addressed, non-authorizing receipt draft from validated
 * inputs and deterministic scoring. Missing workflow/review proof is explicit;
 * this helper never creates promotion evidence or a PASS disposition.
 */
export function assembleIncompleteQualificationReceipt({
  documents,
  hashes,
  scoring,
  sigstoreVerifications,
  rawInputBytes,
}) {
  const { manifest, candidateBundle, gateConfig, executionAttestation } =
    documents;
  const metricSets = scoring.metric_sets;

  if (
    !metricSets ||
    !metricSets.metrics_by_split?.tuning ||
    !metricSets.metrics_by_split?.final ||
    !Array.isArray(metricSets.device_coverage) ||
    !Array.isArray(metricSets.bucket_metrics) ||
    !Array.isArray(scoring.gate_evaluation?.gate_results) ||
    !Buffer.isBuffer(rawInputBytes?.preRunBundle) ||
    !Buffer.isBuffer(rawInputBytes?.executionBundle) ||
    !hashes.preRunBundle ||
    !hashes.executionBundle
  ) {
    throw new TypeError("qualification_receipt_inputs_incomplete");
  }

  const adapter = candidateBundle.adapter;
  const decoder = candidateBundle.decoder;
  const preRunVerified = sigstoreVerifications?.preRun?.verified === true;
  const preRunIntegratedTime = preRunVerified
    ? sigstoreVerifications.preRun.integrated_time_utc
    : null;
  const trustedFreezeTime =
    typeof preRunIntegratedTime === "string" &&
    Number.isFinite(Date.parse(preRunIntegratedTime))
      ? preRunIntegratedTime
      : null;

  return {
    schema_version: 1,
    qualification_id: manifest.qualification_id,
    candidate_id: candidateBundle.candidate_id,
    run_id: executionAttestation.run_id,
    started_at_utc: executionAttestation.started_at_utc,
    finished_at_utc: executionAttestation.finished_at_utc,
    manifest_sha256: hashes.manifest,
    candidate_bundle_sha256: hashes.candidateBundle,
    pre_run_attestation_sha256: hashes.preRunAttestation,
    pre_run_attestation_ref: hashRef(hashes.preRunAttestation),
    pre_run_sigstore_bundle_sha256: hashes.preRunBundle,
    pre_run_sigstore_bundle_ref: hashRef(hashes.preRunBundle),
    execution_attestation_sha256: hashes.executionAttestation,
    execution_attestation_ref: hashRef(hashes.executionAttestation),
    execution_sigstore_bundle_sha256: hashes.executionBundle,
    execution_sigstore_bundle_ref: hashRef(hashes.executionBundle),
    split_counts: Object.fromEntries(
      ["tuning", "final"].map((split) => [
        split,
        manifest.samples.filter((sample) => sample.split === split).length,
      ]),
    ),
    adapter: {
      ...adapter,
      platform: candidateBundle.platform,
      device_matrix_sha256: hashes.deviceMatrix,
      adapter_results_sha256: hashes.adapterResults,
    },
    device_coverage: metricSets.device_coverage,
    decoder,
    metrics_by_split: metricSets.metrics_by_split,
    bucket_metrics: metricSets.bucket_metrics,
    release_gates: {
      frozen_at_utc: trustedFreezeTime,
      pre_run_attestation_sha256: hashes.preRunAttestation,
      execution_attestation_sha256: hashes.executionAttestation,
      corpus_manifest_sha256: hashes.manifest,
      device_matrix_sha256: hashes.deviceMatrix,
      gate_config_sha256: hashes.gateConfig,
      required_gate_ids: gateConfig.required_gate_ids,
      required_buckets: gateConfig.required_buckets.map((requirement) => ({
        bucket_id: requirement.bucket_id,
        minimum_sample_count: requirement.minimum_sample_count,
        observed_sample_count: finalBucketCount(
          metricSets,
          requirement.bucket_id,
        ),
      })),
      thresholds: gateConfig.thresholds,
      gate_results: scoring.gate_evaluation.gate_results.map(releaseGateResult),
    },
    false_accepts: scoring.false_accepts
      .filter((item) => item.split === "final")
      .map((item) =>
        reviewedCase(item, {
          expected: (entry) => entry.expected_codes,
          observed: (entry) => entry.observed_codes,
        }),
      ),
    false_valid_cases: scoring.false_valid_cases
      .filter((item) => item.split === "final")
      .map((item) =>
        reviewedCase(item, {
          expected: (entry) => [entry.expected_code],
          observed: (entry) =>
            entry.observed_code === null ? [] : [entry.observed_code],
        }),
      ),
    reviews: {
      dependency_license: { ...REVIEW_NOT_SUPPLIED },
      privacy: { ...REVIEW_NOT_SUPPLIED },
      security: { ...REVIEW_NOT_SUPPLIED },
      qualification: { ...REVIEW_NOT_SUPPLIED },
    },
    report_sha256: "0".repeat(64),
    disposition: "INCOMPLETE",
    promoted_engine: null,
    approver: null,
    pull_request: null,
    no_promotion_reason:
      "Protected workflow verification and independent review evidence are not established by this preflight.",
  };
}

export function createIncompleteQualificationReceiptArtifact({
  documents,
  hashes,
  scoring,
  sigstoreVerifications,
  rawInputBytes,
}) {
  if (!scoring.performed) {
    return { receiptArtifact: null, receiptAssemblyError: null };
  }
  try {
    const receiptDraft = assembleIncompleteQualificationReceipt({
      documents,
      hashes,
      scoring: scoring.result,
      sigstoreVerifications,
      rawInputBytes,
    });
    return {
      receiptArtifact: buildQualificationReceiptArtifact(receiptDraft, {
        gateConfig: documents.gateConfig,
        deviceMatrix: documents.deviceMatrix,
      }),
      receiptAssemblyError: null,
    };
  } catch {
    return {
      receiptArtifact: null,
      receiptAssemblyError: "qualification_receipt_assembly_failed",
    };
  }
}
