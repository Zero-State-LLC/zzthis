import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { Validator } from "@cfworker/json-schema";
import canonicalize from "canonicalize";

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

const REQUIRED_INPUTS = [
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

const ARGUMENT_NAMES = {
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

export function inspectQualification(
  documents,
  { policyPresent = false } = {},
) {
  const errors = [];
  const hashes = {};

  for (const name of Object.keys(DOCUMENTS)) {
    const value = documents[name];
    if (value === undefined) {
      errors.push(`input_missing:${name}`);
      continue;
    }
    validateSchema(name, value, errors);
    if (
      name !== "adapterResults" &&
      name !== "executionAttestation" &&
      name !== "preRunAttestation"
    ) {
      try {
        hashes[name] = canonicalSha256(value);
      } catch {
        errors.push(`canonical_hash_failed:${name}`);
      }
    }
  }

  for (const name of [
    "preRunAttestation",
    "executionAttestation",
    "adapterResults",
  ]) {
    if (documents[name] !== undefined) {
      try {
        hashes[name] = canonicalSha256(documents[name]);
      } catch {
        errors.push(`canonical_hash_failed:${name}`);
      }
    }
  }

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

  const reasonCodes = [...new Set(errors)];
  if (!policyPresent) reasonCodes.push("protected_verifier_policy_missing");
  reasonCodes.push("sigstore_bundle_verification_not_performed");
  reasonCodes.push("decoder_replay_and_scoring_not_performed");

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
      sigstore_verification: "NOT_PERFORMED",
      decoder_replay: "NOT_PERFORMED",
      scoring_and_receipt: "NOT_PERFORMED",
    },
    hashes,
    reason_codes: reasonCodes,
  };
}

async function readJson(filePath, name) {
  try {
    return JSON.parse(await readFile(filePath, "utf8"));
  } catch {
    throw new Error(`invalid_json:${name}`);
  }
}

function parseArgs(args) {
  const options = {};
  for (let index = 0; index < args.length; index += 1) {
    const key = args[index];
    if (key === "--help" || key === "-h") return { help: true };
    if (!key?.startsWith("--") || index + 1 >= args.length) {
      throw new Error("invalid_arguments");
    }
    const name = Object.keys(ARGUMENT_NAMES).find(
      (inputName) => ARGUMENT_NAMES[inputName] === key.slice(2),
    );
    if (!name && key !== "--output") throw new Error("invalid_arguments");
    const optionName = name ?? "output";
    if (Object.hasOwn(options, optionName))
      throw new Error("duplicate_argument");
    options[optionName] = args[index + 1];
    index += 1;
  }
  for (const name of REQUIRED_INPUTS) {
    if (!options[name]) throw new Error(`argument_missing:${name}`);
  }
  return options;
}

function usage() {
  return [
    "Usage: npm run qual:ocr -- \\",
    ...REQUIRED_INPUTS.map((name) => `  --${ARGUMENT_NAMES[name]} <path>`),
    "  [--output <path>]",
    "",
    "This preflight is evidence validation only. It always returns INCOMPLETE/NO_PROMOTION until the protected Sigstore verifier, decoder replay, scoring, and receipt pipeline are implemented.",
  ].join("\n");
}

async function main() {
  let options;
  try {
    options = parseArgs(process.argv.slice(2));
  } catch (error) {
    process.stderr.write(`${error.message}\n${usage()}\n`);
    process.exitCode = 2;
    return;
  }

  if (options.help) {
    process.stdout.write(`${usage()}\n`);
    return;
  }

  const documents = {};
  const reasonCodes = [];
  for (const name of REQUIRED_INPUTS) {
    if (name === "preRunBundle" || name === "executionBundle") {
      try {
        documents[name] = await readJson(options[name], name);
      } catch {
        reasonCodes.push(`sigstore_bundle_unreadable:${name}`);
      }
      continue;
    }
    try {
      documents[name] = await readJson(options[name], name);
    } catch {
      reasonCodes.push(`invalid_json:${name}`);
    }
  }

  const report = inspectQualification(documents, {
    policyPresent: false,
  });
  report.reason_codes = [...new Set([...reasonCodes, ...report.reason_codes])];

  if (options.output) {
    await writeFile(options.output, `${JSON.stringify(report, null, 2)}\n`, {
      encoding: "utf8",
      mode: 0o600,
    });
  } else {
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  }
  process.exitCode = 2;
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  await main();
}
