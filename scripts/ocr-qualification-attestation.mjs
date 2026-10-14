import { createHash } from "node:crypto";
import canonicalize from "canonicalize";
import { exactSha256 } from "./ocr-qualification-preflight.mjs";

function canonicalBytes(value) {
  const serialized = canonicalize(value);
  if (typeof serialized !== "string") {
    throw new TypeError("attestation_not_jcs_canonicalizable");
  }
  return Buffer.from(serialized, "utf8");
}

function canonicalSha256(value) {
  return createHash("sha256").update(canonicalBytes(value)).digest("hex");
}

function validSha256(value) {
  return typeof value === "string" && /^[a-f0-9]{64}$/.test(value);
}

function validUtc(value) {
  return (
    typeof value === "string" &&
    /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(value) &&
    Number.isFinite(Date.parse(value))
  );
}

function assertExecutionTimeline(runId, startedAtUtc, finishedAtUtc) {
  const runIdValid =
    typeof runId === "string" && /^[1-9]\d*\.([1-9]\d*)$/.test(runId);
  if (
    !runIdValid ||
    !validUtc(startedAtUtc) ||
    !validUtc(finishedAtUtc) ||
    Date.parse(finishedAtUtc) < Date.parse(startedAtUtc)
  ) {
    throw new TypeError("execution_attestation_timeline_invalid");
  }
}

function assertFrozenExecutionInputs(
  attestation,
  candidateBundle,
  preRunAttestation,
) {
  const hashes = [
    attestation.candidate_bundle_sha256,
    attestation.pre_run_attestation_sha256,
    attestation.manifest_sha256,
    attestation.gate_config_sha256,
    attestation.device_matrix_sha256,
    attestation.adapter_results_sha256,
  ];
  if (
    !attestation.candidate_id ||
    hashes.some((hash) => !validSha256(hash)) ||
    preRunAttestation?.candidate_bundle_sha256 !==
      attestation.candidate_bundle_sha256 ||
    preRunAttestation?.candidate_id !== attestation.candidate_id ||
    preRunAttestation?.manifest_sha256 !== attestation.manifest_sha256 ||
    preRunAttestation?.gate_config_sha256 !== attestation.gate_config_sha256 ||
    candidateBundle?.candidate_id !== attestation.candidate_id
  ) {
    throw new TypeError("execution_attestation_frozen_input_mismatch");
  }
}

export function jcsAttestationBytes(attestation) {
  return canonicalBytes(attestation);
}

export function createPreRunAttestation({
  manifest,
  manifestBytes,
  gateConfig,
  gateConfigBytes,
  candidateBundle,
  deviceMatrix,
}) {
  const manifestSha256 = exactSha256(manifestBytes);
  const gateConfigSha256 = exactSha256(gateConfigBytes);
  const candidateBundleSha256 = canonicalSha256(candidateBundle);
  if (
    manifest?.qualification_id !== "ZZ-OCR-QUAL-001" ||
    gateConfig?.qualification_id !== manifest.qualification_id ||
    candidateBundle?.qualification_id !== manifest.qualification_id ||
    gateConfig?.manifest_sha256 !== manifestSha256 ||
    typeof candidateBundle?.candidate_id !== "string" ||
    !candidateBundle.candidate_id ||
    candidateBundle?.device_matrix_sha256 !== canonicalSha256(deviceMatrix) ||
    deviceMatrix?.candidate_id !== candidateBundle.candidate_id
  ) {
    throw new TypeError("pre_run_freeze_inputs_mismatch");
  }
  return {
    schema_version: 1,
    qualification_id: "ZZ-OCR-QUAL-001",
    candidate_id: candidateBundle.candidate_id,
    manifest_sha256: manifestSha256,
    gate_config_sha256: gateConfigSha256,
    candidate_bundle_sha256: candidateBundleSha256,
  };
}

export function createExecutionAttestation({
  candidateBundle,
  preRunAttestation,
  manifestBytes,
  gateConfigBytes,
  deviceMatrix,
  adapterResultsBytes,
  runId,
  startedAtUtc,
  finishedAtUtc,
}) {
  assertExecutionTimeline(runId, startedAtUtc, finishedAtUtc);
  const attestation = {
    schema_version: 1,
    qualification_id: "ZZ-OCR-QUAL-001",
    candidate_id: candidateBundle?.candidate_id,
    candidate_bundle_sha256: canonicalSha256(candidateBundle),
    run_id: runId,
    pre_run_attestation_sha256: canonicalSha256(preRunAttestation),
    manifest_sha256: exactSha256(manifestBytes),
    gate_config_sha256: exactSha256(gateConfigBytes),
    device_matrix_sha256: canonicalSha256(deviceMatrix),
    adapter_results_sha256: exactSha256(adapterResultsBytes),
    started_at_utc: startedAtUtc,
    finished_at_utc: finishedAtUtc,
  };
  assertFrozenExecutionInputs(attestation, candidateBundle, preRunAttestation);
  return attestation;
}
