import { readFileSync } from "node:fs";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import {
  hasValidFrozenInputs,
  validateFrozenReleaseConfig,
} from "./receipt-frozen-inputs.mjs";

const receiptSchema = JSON.parse(
  readFileSync(
    new URL(
      "../../specs/004-capture/qualification/receipt.schema.json",
      import.meta.url,
    ),
    "utf8",
  ),
);
const schemaValidator = new Ajv2020({ allErrors: true, strict: false });
addFormats(schemaValidator);
const validateReceiptSchema = schemaValidator.compile(receiptSchema);

const REQUIRED_GATE_IDS = [
  "false-accept-count",
  "false-valid-decode-rate",
  "endpoint-recall",
  "pair-accuracy",
  "exact-code-accuracy",
  "character-error-rate",
  "roi-normalization-success-rate",
  "p95-latency-ms",
];

const REQUIRED_BUCKET_IDS = [
  "handwriting",
  "print",
  "low-contrast",
  "glare",
  "blur",
  "motion-blur",
  "perspective",
  "rotation",
  "distance",
  "wrapped",
  "multi-code",
  "partial-fiducial",
  "false-zz",
  "ambiguous-pairing",
  "unequal-fiducial-size",
  "curved-surface",
  "candidate-overflow",
  "running-text",
  "confusable-character",
  "near-word",
  "invalid-reserved-character",
  "no-code",
  "handle",
  "field-code-part",
];

const GATE_DEFINITIONS = {
  "false-accept-count": {
    operator: "lte",
    thresholdName: "max_false_accept_count",
    read: (receipt) => receipt.metrics_by_split?.final?.false_accept_count,
  },
  "false-valid-decode-rate": {
    operator: "lte",
    thresholdName: "max_false_valid_decode_rate",
    read: (receipt) =>
      receipt.metrics_by_split?.final?.false_valid_decode_rate?.rate,
  },
  "endpoint-recall": {
    operator: "gte",
    thresholdName: "min_endpoint_recall",
    read: (receipt) => receipt.metrics_by_split?.final?.endpoint_recall?.rate,
  },
  "pair-accuracy": {
    operator: "gte",
    thresholdName: "min_pair_accuracy",
    read: (receipt) => receipt.metrics_by_split?.final?.pair_accuracy?.rate,
  },
  "exact-code-accuracy": {
    operator: "gte",
    thresholdName: "min_exact_code_accuracy",
    read: (receipt) =>
      receipt.metrics_by_split?.final?.exact_code_accuracy?.rate,
  },
  "character-error-rate": {
    operator: "lte",
    thresholdName: "max_character_error_rate",
    read: (receipt) => receipt.metrics_by_split?.final?.character_error_rate,
  },
  "roi-normalization-success-rate": {
    operator: "gte",
    thresholdName: "min_roi_normalization_success_rate",
    read: (receipt) =>
      receipt.metrics_by_split?.final?.roi_normalization_success_rate?.rate,
  },
  "p95-latency-ms": {
    operator: "lte",
    thresholdName: "max_p95_latency_ms",
    read: (_receipt, _gateConfig, deviceMatrix, coverageById) => {
      const latencies = deviceMatrix.entries.map(
        ({ device_matrix_entry_id }) =>
          coverageById.get(device_matrix_entry_id)?.metrics_by_split?.final
            ?.latency_ms?.p95,
      );
      return latencies.every(Number.isFinite) ? Math.max(...latencies) : null;
    },
  },
};

const isRecord = (value) =>
  value !== null && typeof value === "object" && !Array.isArray(value);

const isFiniteNumber = (value) =>
  typeof value === "number" && Number.isFinite(value);

export function validateQualificationReceipt(
  receipt,
  { gateConfig, deviceMatrix } = {},
) {
  if (!validateReceiptSchema(receipt)) {
    return {
      status: "INCOMPLETE",
      errors: (validateReceiptSchema.errors ?? []).map(
        ({ instancePath, message }) => `${instancePath || "/"} ${message}`,
      ),
      gateFailures: [],
      schemaValid: false,
      authorizesPromotion: false,
    };
  }
  return {
    ...validateReceiptSemantics(receipt, { gateConfig, deviceMatrix }),
    schemaValid: true,
  };
}

function addCaseIssues(cases, name, allowNullPair, errors) {
  const keys = new Set();

  if (!Array.isArray(cases)) {
    errors.push(`${name} must be an array`);
    return;
  }

  for (const [index, item] of cases.entries()) {
    const label = `${name}[${index}]`;
    if (!isRecord(item)) {
      errors.push(`${label} must be an object`);
      continue;
    }

    if (
      typeof item.disposition !== "string" ||
      item.disposition.trim().length === 0 ||
      typeof item.reviewer !== "string" ||
      item.reviewer.trim().length === 0
    ) {
      errors.push(`${label} needs a non-empty disposition and reviewer`);
    }
    if (
      typeof item.device_matrix_entry_id !== "string" ||
      typeof item.sample_id !== "string" ||
      (allowNullPair
        ? item.pair_id !== null && typeof item.pair_id !== "string"
        : typeof item.pair_id !== "string")
    ) {
      errors.push(`${label} has an invalid case key`);
      continue;
    }

    const key = JSON.stringify([
      item.device_matrix_entry_id,
      item.sample_id,
      item.pair_id,
    ]);
    if (keys.has(key)) errors.push(`${label} duplicates a case key`);
    keys.add(key);
  }
}

/**
 * Check receipt cross-field semantics after JSON Schema validation. This does
 * not validate artifact hashes, attestations, corpus/results, or decoder replay.
 * Even a clean result is explicitly non-authorizing; the trusted qualification
 * verifier must complete those checks before it can make a promotion decision.
 */
export function validateReceiptSemantics(
  receipt,
  { gateConfig, deviceMatrix } = {},
) {
  const errors = [];

  if (!isRecord(receipt) || receipt.disposition !== "PASS") {
    return incomplete("semantic gate only accepts a candidate PASS receipt");
  }
  if (!isRecord(gateConfig) || !isRecord(deviceMatrix)) {
    return incomplete("frozen gate config and device matrix are required");
  }
  if (!hasValidFrozenInputs(gateConfig, deviceMatrix)) {
    return incomplete("frozen inputs are incomplete");
  }

  if (
    JSON.stringify(gateConfig.required_gate_ids) !==
    JSON.stringify(REQUIRED_GATE_IDS)
  ) {
    errors.push("frozen gate config does not require the protocol gate set");
  }
  validateFrozenReleaseConfig(receipt, gateConfig, errors);

  const coverageById = validateDeviceCoverage(receipt, deviceMatrix, errors);

  validateBucketCoverage(receipt, gateConfig, errors);

  addCaseIssues(receipt.false_accepts, "false_accepts", true, errors);
  addCaseIssues(receipt.false_valid_cases, "false_valid_cases", false, errors);
  validateCaseCounts(receipt, errors);
  const gateFailures = validateReleaseGates(
    receipt,
    gateConfig,
    deviceMatrix,
    coverageById,
    errors,
  );

  if (errors.length > 0) {
    return {
      status: "INCOMPLETE",
      errors,
      gateFailures,
      authorizesPromotion: false,
    };
  }
  if (gateFailures.length > 0 || receipt.false_accepts.length > 0) {
    return {
      status: "NO_PROMOTION",
      errors: [],
      gateFailures,
      authorizesPromotion: false,
    };
  }
  return {
    status: "SEMANTIC_CHECKS_PASS",
    errors: [],
    gateFailures: [],
    authorizesPromotion: false,
  };
}

function incomplete(message) {
  return {
    status: "INCOMPLETE",
    errors: [message],
    gateFailures: [],
    authorizesPromotion: false,
  };
}

function validateDeviceCoverage(receipt, deviceMatrix, errors) {
  const matrixIds = deviceMatrix.entries.map(
    (entry) => entry.device_matrix_entry_id,
  );
  if (
    matrixIds.some((id) => typeof id !== "string") ||
    new Set(matrixIds).size !== matrixIds.length
  ) {
    errors.push("device matrix entry IDs must be present and unique");
  }

  const coverageById = new Map();
  for (const row of Array.isArray(receipt.device_coverage)
    ? receipt.device_coverage
    : []) {
    if (!isRecord(row) || typeof row.device_matrix_entry_id !== "string") {
      errors.push("device coverage contains a malformed row");
      continue;
    }
    if (coverageById.has(row.device_matrix_entry_id)) {
      errors.push(
        `duplicate device coverage row: ${row.device_matrix_entry_id}`,
      );
    }
    coverageById.set(row.device_matrix_entry_id, row);
  }
  if (coverageById.size !== deviceMatrix.entries.length) {
    errors.push(
      "device coverage must contain exactly one row per matrix entry",
    );
  }
  for (const entry of deviceMatrix.entries) {
    const row = coverageById.get(entry.device_matrix_entry_id);
    if (!row) {
      errors.push(`missing device coverage: ${entry.device_matrix_entry_id}`);
      continue;
    }
    if (
      row.os_version !== entry.os_version ||
      row.device_class !== entry.device_class ||
      row.minimum_sample_count !== entry.minimum_sample_count
    ) {
      errors.push(
        `device coverage identity/minimum mismatch: ${entry.device_matrix_entry_id}`,
      );
    }
    if (
      !Number.isInteger(row.observed_sample_count) ||
      row.observed_sample_count < entry.minimum_sample_count
    ) {
      errors.push(
        `device coverage below minimum: ${entry.device_matrix_entry_id}`,
      );
    }
    if (!isFiniteNumber(row.metrics_by_split?.final?.latency_ms?.p95)) {
      errors.push(
        `missing per-device final p95 latency: ${entry.device_matrix_entry_id}`,
      );
    }
  }
  return coverageById;
}

function validateBucketCoverage(receipt, gateConfig, errors) {
  const requiredBuckets = gateConfig.required_buckets;
  const receiptBuckets = receipt.release_gates?.required_buckets;
  const configBucketIds = requiredBuckets.map((row) => row?.bucket_id);
  if (
    REQUIRED_BUCKET_IDS.some((id) => !configBucketIds.includes(id)) ||
    new Set(configBucketIds).size !== REQUIRED_BUCKET_IDS.length ||
    configBucketIds.length !== REQUIRED_BUCKET_IDS.length
  ) {
    errors.push(
      "frozen gate config does not contain each required stress bucket exactly once",
    );
  }

  const finalBucketMetrics = new Map();
  for (const row of Array.isArray(receipt.bucket_metrics)
    ? receipt.bucket_metrics.filter((item) => item?.split === "final")
    : []) {
    if (finalBucketMetrics.has(row.bucket_id)) {
      errors.push(`duplicate final bucket metric: ${row.bucket_id}`);
    }
    finalBucketMetrics.set(row.bucket_id, row.metrics?.sample_count);
  }

  if (
    !Array.isArray(receiptBuckets) ||
    receiptBuckets.length !== requiredBuckets.length
  ) {
    errors.push("receipt bucket requirements do not match frozen gate config");
    return;
  }
  const receiptBucketById = new Map(
    receiptBuckets.map((row) => [row.bucket_id, row]),
  );
  if (receiptBucketById.size !== receiptBuckets.length) {
    errors.push("receipt bucket requirements contain duplicate IDs");
  }
  for (const requirement of requiredBuckets) {
    const row = receiptBucketById.get(requirement.bucket_id);
    const observed = finalBucketMetrics.get(requirement.bucket_id);
    if (
      !row ||
      row.minimum_sample_count !== requirement.minimum_sample_count ||
      row.observed_sample_count !== observed
    ) {
      errors.push(`receipt bucket count mismatch: ${requirement.bucket_id}`);
    }
    if (
      !Number.isInteger(observed) ||
      observed < requirement.minimum_sample_count
    ) {
      errors.push(`final bucket below minimum: ${requirement.bucket_id}`);
    }
  }
}

function validateCaseCounts(receipt, errors) {
  const finalMetrics = receipt.metrics_by_split?.final;
  if (!isRecord(finalMetrics)) {
    errors.push("final aggregate metrics are required");
    return;
  }
  if (finalMetrics.false_accept_count !== receipt.false_accepts?.length) {
    errors.push("false-accept cases do not reconcile to final count");
  }
  if (
    finalMetrics.false_valid_decode_count !== receipt.false_valid_cases?.length
  ) {
    errors.push("false-valid cases do not reconcile to final count");
  }
}

function validateReleaseGates(
  receipt,
  gateConfig,
  deviceMatrix,
  coverageById,
  errors,
) {
  const gateFailures = [];
  const results = Array.isArray(receipt.release_gates?.gate_results)
    ? receipt.release_gates.gate_results
    : [];
  const resultById = new Map();
  for (const gate of results) {
    if (!isRecord(gate) || typeof gate.gate_id !== "string") {
      errors.push("release gate result is malformed");
      continue;
    }
    if (resultById.has(gate.gate_id)) {
      errors.push(`duplicate release gate: ${gate.gate_id}`);
    }
    resultById.set(gate.gate_id, gate);
  }
  if (resultById.size !== REQUIRED_GATE_IDS.length) {
    errors.push(
      "release gate results must contain each required gate exactly once",
    );
  }

  for (const gateId of REQUIRED_GATE_IDS) {
    const gate = resultById.get(gateId);
    if (!gate) {
      errors.push(`missing release gate: ${gateId}`);
      continue;
    }
    const definition = GATE_DEFINITIONS[gateId];
    const threshold = gateConfig.thresholds[definition.thresholdName];
    const observed = definition.read(
      receipt,
      gateConfig,
      deviceMatrix,
      coverageById,
    );
    if (
      !isFiniteNumber(threshold) ||
      gate.split !== "final" ||
      gate.operator !== definition.operator ||
      gate.threshold !== threshold ||
      !isFiniteNumber(observed) ||
      gate.observed !== observed
    ) {
      errors.push(
        `release gate does not reconcile to frozen inputs and final metrics: ${gateId}`,
      );
      continue;
    }
    const passes =
      definition.operator === "lte"
        ? observed <= threshold
        : observed >= threshold;
    if (gate.result !== (passes ? "pass" : "fail")) {
      errors.push(
        `release gate result is inconsistent with its recomputed comparison: ${gateId}`,
      );
    } else if (!passes) {
      gateFailures.push(gateId);
    }
  }
  return gateFailures;
}
