import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { Validator } from "@cfworker/json-schema";
import canonicalize from "canonicalize";
import {
  readDecoderIdentity,
  verifyDecoderIdentity,
} from "./ocr-decoder-identity.mjs";
import {
  buildQualificationReasonCodes,
  runDecoderReplay,
  runScoring,
  scoringAndReceiptStatus,
} from "./ocr-qualification-preflight-stages.mjs";
import { createIncompleteQualificationReceiptArtifact } from "./ocr-qualification-receipt-assembly.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const QUALIFICATION_DIR = path.join(ROOT, "specs/004-capture/qualification");
const DOCUMENTS = {
  manifest: "manifest.schema.json",
  deviceMatrix: "device-matrix.schema.json",
  adapterResults: "adapter-result.schema.json",
  candidateBundle: "candidate-bundle.schema.json",
  gateConfig: "gate-config.schema.json",
  preRunAttestation: "pre-run-attestation.schema.json",
  executionAttestation: "execution-attestation.schema.json",
};

export const REQUIRED_INPUTS = [
  "manifest",
  "deviceMatrix",
  "candidateBundle",
  "gateConfig",
  "preRunAttestation",
  "preRunBundle",
  "executionAttestation",
  "executionBundle",
  "adapterResults",
];

export const ARGUMENT_NAMES = {
  manifest: "manifest",
  deviceMatrix: "device-matrix",
  candidateBundle: "candidate-bundle",
  gateConfig: "gate-config",
  preRunAttestation: "pre-run-attestation",
  preRunBundle: "pre-run-bundle",
  executionAttestation: "execution-attestation",
  executionBundle: "execution-bundle",
  adapterResults: "adapter-results",
};

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

export function canonicalSha256(value) {
  const canonical = canonicalize(value);
  if (typeof canonical !== "string") {
    throw new Error("input_not_jcs_canonicalizable");
  }
  return sha256(Buffer.from(canonical, "utf8"));
}

export function exactSha256(bytes) {
  return sha256(bytes);
}

export { readDecoderIdentity, verifyDecoderIdentity };

function validateSchema(name, value, errors) {
  const schemaPath = path.join(QUALIFICATION_DIR, DOCUMENTS[name]);
  const schema = JSON.parse(requireText(schemaPath));
  const validator = new Validator(schema, "2020-12", false);
  const result = validator.validate(value);
  if (!result.valid) errors.push(`schema_invalid:${name}`);
}

function requireText(filePath) {
  return schemaTextCache.get(filePath);
}

const schemaTextCache = new Map();
for (const schemaName of Object.values(DOCUMENTS)) {
  const schemaPath = path.join(QUALIFICATION_DIR, schemaName);
  schemaTextCache.set(schemaPath, await readFile(schemaPath, "utf8"));
}

function compare(actual, expected, reason, errors) {
  if (actual !== expected) errors.push(reason);
}

function checkCoverage(manifest, matrix, gateConfig, adapterResults, errors) {
  const samples = manifest.samples;
  const resultRows = adapterResults.results;
  const samplesById = new Map();
  const resultByPair = new Map();
  const writerSplits = new Map();

  for (const sample of samples) {
    if (samplesById.has(sample.sample_id))
      errors.push("duplicate_manifest_sample");
    samplesById.set(sample.sample_id, sample);
    const splits = writerSplits.get(sample.writer_group) ?? new Set();
    splits.add(sample.split);
    writerSplits.set(sample.writer_group, splits);
  }

  for (const splits of writerSplits.values()) {
    if (splits.size > 1) errors.push("writer_split_leakage");
  }

  for (const row of resultRows) {
    const sample = samplesById.get(row.sample_id);
    if (!sample) {
      errors.push("adapter_result_unknown_sample");
      continue;
    }

    const key = `${row.device_matrix_entry_id}\u0000${row.sample_id}`;
    if (resultByPair.has(key)) errors.push("duplicate_adapter_result");
    resultByPair.set(key, row);
    compare(row.split, sample.split, "adapter_result_split_mismatch", errors);
    compare(
      row.input_image_sha256,
      sample.asset_sha256,
      "adapter_result_asset_hash_mismatch",
      errors,
    );
  }

  for (const entry of matrix.entries) {
    let entryCount = 0;
    for (const sample of samples) {
      const key = `${entry.device_matrix_entry_id}\u0000${sample.sample_id}`;
      const row = resultByPair.get(key);
      if (!row) {
        errors.push("adapter_result_coverage_missing");
        continue;
      }
      entryCount += 1;
      compare(row.os_version, entry.os_version, "device_os_mismatch", errors);
      compare(
        row.device_class,
        entry.device_class,
        "device_class_mismatch",
        errors,
      );
    }
    if (entryCount < entry.minimum_sample_count) {
      errors.push("device_matrix_minimum_not_met");
    }
  }

  if (resultByPair.size !== matrix.entries.length * samples.length) {
    errors.push("adapter_result_coverage_extra");
  }

  const countsBySplit = { tuning: 0, final: 0 };
  for (const sample of samples) countsBySplit[sample.split] += 1;
  for (const split of ["tuning", "final"]) {
    if (countsBySplit[split] < gateConfig.minimum_samples_by_split[split]) {
      errors.push(`split_minimum_not_met:${split}`);
    }
  }

  for (const requirement of gateConfig.required_buckets) {
    const observed = samples.filter(
      (sample) =>
        sample.split === "final" &&
        sample.stress_tags.includes(requirement.bucket_id),
    ).length;
    if (observed < requirement.minimum_sample_count) {
      errors.push("final_bucket_minimum_not_met");
    }
  }
}

function validateRelationships(documents, hashes, errors) {
  const {
    manifest,
    deviceMatrix,
    candidateBundle,
    gateConfig,
    preRunAttestation,
    executionAttestation,
    adapterResults,
  } = documents;

  compare(
    candidateBundle.device_matrix_sha256,
    hashes.deviceMatrix,
    "candidate_device_matrix_hash_mismatch",
    errors,
  );
  compare(
    deviceMatrix.platform,
    candidateBundle.platform,
    "candidate_platform_mismatch:device_matrix",
    errors,
  );
  compare(
    adapterResults.adapter.platform,
    candidateBundle.platform,
    "candidate_platform_mismatch:adapter_results",
    errors,
  );
  compare(
    adapterResults.adapter.device_matrix_sha256,
    hashes.deviceMatrix,
    "adapter_device_matrix_hash_mismatch",
    errors,
  );
  compare(
    gateConfig.manifest_sha256,
    hashes.manifest,
    "gate_manifest_hash_mismatch",
    errors,
  );
  if (
    gateConfig.thresholds.retry_below_confidence >=
    gateConfig.thresholds.accept_min_confidence
  ) {
    errors.push("decision_band_thresholds_invalid");
  }

  for (const [name, document] of Object.entries({
    deviceMatrix,
    candidateBundle,
    gateConfig,
    preRunAttestation,
    executionAttestation,
    adapterResults,
  })) {
    compare(
      document.qualification_id,
      manifest.qualification_id,
      `qualification_id_mismatch:${name}`,
      errors,
    );
  }

  compare(
    deviceMatrix.candidate_id,
    candidateBundle.candidate_id,
    "candidate_id_mismatch:device_matrix",
    errors,
  );
  compare(
    adapterResults.candidate_id,
    candidateBundle.candidate_id,
    "candidate_id_mismatch:adapter_results",
    errors,
  );
  compare(
    preRunAttestation.candidate_id,
    candidateBundle.candidate_id,
    "candidate_id_mismatch:pre_run_attestation",
    errors,
  );
  compare(
    executionAttestation.candidate_id,
    candidateBundle.candidate_id,
    "candidate_id_mismatch:execution_attestation",
    errors,
  );

  compare(
    adapterResults.manifest_sha256,
    hashes.manifest,
    "adapter_manifest_hash_mismatch",
    errors,
  );
  compare(
    adapterResults.candidate_bundle_sha256,
    hashes.candidateBundle,
    "adapter_candidate_bundle_hash_mismatch",
    errors,
  );
  for (const key of [
    "commit",
    "artifact_sha256",
    "engine_id",
    "engine_version",
    "config_sha256",
    "preprocessing_sha256",
    "confidence_mapping_sha256",
  ]) {
    compare(
      adapterResults.adapter[key],
      candidateBundle.adapter[key],
      `adapter_identity_mismatch:${key}`,
      errors,
    );
  }

  for (const [key, expected] of [
    ["manifest_sha256", hashes.manifest],
    ["gate_config_sha256", hashes.gateConfig],
    ["candidate_bundle_sha256", hashes.candidateBundle],
  ]) {
    compare(
      preRunAttestation[key],
      expected,
      `pre_run_${key}_mismatch`,
      errors,
    );
  }

  for (const [key, expected] of [
    ["candidate_bundle_sha256", hashes.candidateBundle],
    ["pre_run_attestation_sha256", hashes.preRunAttestation],
    ["manifest_sha256", hashes.manifest],
    ["gate_config_sha256", hashes.gateConfig],
    ["device_matrix_sha256", hashes.deviceMatrix],
    ["adapter_results_sha256", hashes.adapterResults],
  ]) {
    compare(
      executionAttestation[key],
      expected,
      `execution_${key}_mismatch`,
      errors,
    );
  }
}

function collectSchemasAndHashes(documents, rawInputBytes) {
  const errors = [];
  const schemaErrors = [];
  const hashes = {};

  for (const name of Object.keys(DOCUMENTS)) {
    const value = documents[name];
    if (value === undefined) {
      errors.push(`input_missing:${name}`);
      continue;
    }
    validateSchema(name, value, schemaErrors);
    if (name === "deviceMatrix" || name === "candidateBundle") {
      try {
        hashes[name] = canonicalSha256(value);
      } catch {
        errors.push(`canonical_hash_failed:${name}`);
      }
    } else if (name === "manifest" || name === "gateConfig") {
      const bytes = rawInputBytes[name];
      if (bytes === undefined) {
        errors.push(`exact_bytes_missing:${name}`);
      } else {
        hashes[name] = exactSha256(bytes);
      }
    }
  }
  errors.push(...schemaErrors);

  for (const name of ["preRunAttestation", "executionAttestation"]) {
    if (documents[name] !== undefined) {
      try {
        hashes[name] = canonicalSha256(documents[name]);
      } catch {
        errors.push(`canonical_hash_failed:${name}`);
      }
    }
  }

  if (documents.adapterResults !== undefined) {
    const bytes = rawInputBytes.adapterResults;
    if (bytes === undefined) {
      errors.push("exact_bytes_missing:adapterResults");
    } else {
      hashes.adapterResults = exactSha256(bytes);
    }
  }

  for (const name of ["preRunBundle", "executionBundle"]) {
    const bytes = rawInputBytes[name];
    if (bytes !== undefined) hashes[name] = exactSha256(bytes);
  }

  return { errors, schemaErrors, hashes };
}

export function inspectQualification(
  documents,
  {
    policyPresent = false,
    policyError,
    sigstoreVerifications,
    rawInputBytes = {},
    decoderIdentity = readDecoderIdentity(),
  } = {},
) {
  const { errors, schemaErrors, hashes } = collectSchemasAndHashes(
    documents,
    rawInputBytes,
  );

  if (errors.length === 0) {
    validateRelationships(documents, hashes, errors);
    checkCoverage(
      documents.manifest,
      documents.deviceMatrix,
      documents.gateConfig,
      documents.adapterResults,
      errors,
    );
  }

  const decoderReplay = runDecoderReplay(documents, schemaErrors);
  if (decoderReplay.performed) errors.push(...decoderReplay.errors);
  const decoderIdentityCheck = verifyDecoderIdentity(
    documents.candidateBundle?.decoder,
    decoderIdentity,
  );
  if (!decoderIdentityCheck.verified) {
    errors.push(...decoderIdentityCheck.reasons);
  }
  const scoring = runScoring(
    documents,
    errors,
    decoderReplay,
    decoderIdentityCheck,
  );
  const { receiptArtifact, receiptAssemblyError } =
    createIncompleteQualificationReceiptArtifact({
      documents,
      hashes,
      scoring,
      sigstoreVerifications,
      rawInputBytes,
    });

  const { reasonCodes, sigstoreSummary, trustedTimeValidation } =
    buildQualificationReasonCodes({
      errors,
      policyPresent,
      policyError,
      sigstoreVerifications,
      executionAttestation: documents.executionAttestation,
      decoderReplay,
      decoderIdentityCheck,
      scoring,
      receiptArtifact,
      receiptAssemblyError,
    });

  return {
    schema_version: 1,
    qualification_id: "ZZ-OCR-QUAL-001",
    candidate_id: documents.candidateBundle?.candidate_id ?? null,
    status: "INCOMPLETE",
    disposition: "NO_PROMOTION",
    promotion_eligible: false,
    checks: {
      structural_validation: errors.length === 0 ? "PASS" : "INCOMPLETE",
      protected_verifier_policy: policyPresent
        ? "PRESENT_UNVERIFIED"
        : "MISSING",
      sigstore_verification: sigstoreSummary.status,
      sigstore_attestations: {
        pre_run: sigstoreSummary.preRun,
        execution: sigstoreSummary.execution,
      },
      sigstore_integrated_time_utc: {
        pre_run: sigstoreSummary.preRunIntegratedTime,
        execution: sigstoreSummary.executionIntegratedTime,
      },
      trusted_attestation_timeline: trustedTimeValidation.status,
      decoder_replay: !decoderReplay.performed
        ? "NOT_PERFORMED"
        : decoderIdentityCheck.verified
          ? "EXECUTED_PINNED"
          : "EXECUTED_UNPINNED",
      decoder_identity: !decoderIdentity.available
        ? "UNAVAILABLE"
        : decoderIdentityCheck.verified
          ? "VERIFIED"
          : "MISMATCH",
      scoring_and_receipt: scoringAndReceiptStatus(scoring, receiptArtifact),
    },
    decoder_replay_summary: decoderReplay.summary ?? null,
    qualification_scoring: scoring.performed
      ? { status: "DIAGNOSTIC_ONLY", ...scoring.result }
      : null,
    qualification_receipt: receiptArtifact,
    hashes,
    reason_codes: reasonCodes,
  };
}
