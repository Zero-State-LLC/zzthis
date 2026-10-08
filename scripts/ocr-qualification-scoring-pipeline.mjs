import {
  isWordlistVersion,
  loadWordlist,
} from "../packages/zz-core/src/index.ts";
import { aggregateFiducialScoring } from "./ocr-qualification-fiducial-aggregation.mjs";
import { scoreFiducialObservation } from "./ocr-qualification-fiducial-scoring.mjs";
import { aggregateRoiLatencyScoring } from "./ocr-qualification-roi-latency-aggregation.mjs";
import { scoreRoiAndLatency } from "./ocr-qualification-roi-latency.mjs";
import { scoreSampleBand } from "./ocr-qualification-decoder-replay.mjs";
import { aggregateTextScoring } from "./ocr-qualification-text-aggregation.mjs";
import { scorePayloadObservations } from "./ocr-qualification-text-scoring.mjs";
import { evaluateQualificationGates } from "./ocr-qualification-gates.mjs";
import { buildQualificationMetricSets } from "./ocr-qualification-metric-sets.mjs";

const BANDS = ["accept", "clarify", "retry", "abstain"];

/**
 * Recompute per-observation capture and OCR metrics from manifest truth and
 * adapter evidence. This is a deterministic scoring layer only: it neither
 * creates a qualification receipt nor authorizes candidate promotion.
 */
export function scoreQualificationObservations({
  manifest,
  deviceMatrix,
  candidateBundle,
  gateConfig,
  adapterResults,
}) {
  validateInputs({
    manifest,
    deviceMatrix,
    candidateBundle,
    gateConfig,
    adapterResults,
  });
  for (const split of ["tuning", "final"]) {
    const sampleCount = manifest.samples.filter(
      (sample) => sample.split === split,
    ).length;
    if (sampleCount < gateConfig.minimum_samples_by_split[split]) {
      throw new TypeError(`split_minimum_not_met:${split}`);
    }
  }

  const wordlistVersion = candidateBundle.decoder.wordlist_version;
  if (!isWordlistVersion(wordlistVersion)) {
    throw new RangeError("decoder_wordlist_version_unavailable");
  }
  const wordlist = loadWordlist(wordlistVersion);
  const samplesById = uniqueIndex(
    manifest.samples,
    "sample_id",
    "duplicate_manifest_sample",
  );
  const entriesById = uniqueIndex(
    deviceMatrix.entries,
    "device_matrix_entry_id",
    "duplicate_device_matrix_entry",
  );
  const expectedObservationCount =
    manifest.samples.length * deviceMatrix.entries.length;
  const observed = new Set();
  const fiducialScores = [];
  const roiScores = [];
  const textScores = [];
  const scoreRows = [];
  const falseAccepts = [];
  const falseValidCases = [];
  const noCodeFalsePositives = [];
  const bandConstraintViolations = [];

  for (const row of adapterResults.results) {
    const sample = samplesById.get(row.sample_id);
    const entry = entriesById.get(row.device_matrix_entry_id);
    if (!sample) throw new TypeError("adapter_result_unknown_sample");
    if (!entry) throw new TypeError("adapter_result_unknown_device");
    if (sample.split !== row.split) {
      throw new TypeError("adapter_result_split_mismatch");
    }
    if (
      entry.os_version !== row.os_version ||
      entry.device_class !== row.device_class
    ) {
      throw new TypeError("adapter_result_device_mismatch");
    }

    const observationKey = `${row.device_matrix_entry_id}\u0000${row.sample_id}`;
    if (observed.has(observationKey)) {
      throw new TypeError("duplicate_adapter_result_observation");
    }
    observed.add(observationKey);

    const scored = scoreAdapterObservation(
      sample,
      row,
      wordlistVersion,
      wordlist,
      gateConfig,
    );
    scoreRows.push(scored.scoredRow);
    fiducialScores.push({ ...scored.fiducial, ...scoringIdentity(row) });
    textScores.push(scored.text);
    roiScores.push({
      ...scored.roiLatency,
      ...scoringIdentity(row),
      elapsed_ms: [row.elapsed_ms],
    });
    falseAccepts.push(...scored.falseAccepts);
    noCodeFalsePositives.push(...scored.noCodeFalsePositives);
    bandConstraintViolations.push(...scored.bandConstraintViolations);
    falseValidCases.push(...scored.falseValidCases);
  }

  if (observed.size !== expectedObservationCount) {
    throw new TypeError("adapter_result_coverage_incomplete");
  }

  const aggregates = {
    fiducial: aggregateFiducialScoring(fiducialScores, manifest.samples),
    roi_latency: aggregateRoiLatencyScoring(roiScores, manifest.samples),
    text: aggregateTextScoring(textScores, manifest.samples),
    band_distribution: aggregateBands(scoreRows, manifest.samples),
  };
  const gateEvaluation = evaluateQualificationGates({
    aggregates,
    falseAccepts,
    deviceMatrix,
    gateConfig,
  });
  const metricSets = buildQualificationMetricSets({
    scoreRows,
    manifestSamples: manifest.samples,
    deviceMatrix,
    aggregates,
    falseAccepts,
    falseValidCases,
    noCodeFalsePositives,
  });

  return {
    qualification_id: manifest.qualification_id,
    candidate_id: candidateBundle.candidate_id,
    receipt_ready: false,
    promotion_eligible: false,
    scored_observations: scoreRows,
    aggregates,
    metric_sets: metricSets,
    gate_evaluation: gateEvaluation,
    false_accepts: falseAccepts,
    false_valid_cases: falseValidCases,
    no_code_false_positives: noCodeFalsePositives,
    band_constraint_violations: bandConstraintViolations,
  };
}

function scoreAdapterObservation(
  sample,
  row,
  wordlistVersion,
  wordlist,
  gateConfig,
) {
  validateRuntimeOutcome(row);
  const fiducial = scoreFiducialObservation(
    row.fiducials,
    sample.fiducials,
    gateConfig.thresholds.fiducial_iou_threshold,
  );
  const text = scorePayloadObservations(
    sample,
    row,
    { correct_pairs: fiducial.correct_pairs },
    wordlistVersion,
  );
  const roiLatency = scoreRoiAndLatency({
    roiTruth: sample.roi_truth,
    rois: row.rois,
    elapsedMs: [row.elapsed_ms],
  });
  const band =
    row.runtime_outcome === "completed"
      ? scoreSampleBand(row, wordlist, gateConfig)
      : null;
  return {
    fiducial,
    text,
    roiLatency,
    scoredRow: {
      sample_id: row.sample_id,
      device_matrix_entry_id: row.device_matrix_entry_id,
      split: row.split,
      runtime_outcome: row.runtime_outcome,
      runtime_memory_bytes: row.runtime_memory_bytes,
      fiducial,
      text,
      roi_latency: roiLatency,
      band: band ? { band: band.band, reason: band.reason } : null,
    },
    falseAccepts: scoreFalseAccept(sample, row, band),
    noCodeFalsePositives: scoreNoCodeFalsePositive(sample, row, band),
    bandConstraintViolations: scoreBandConstraint(sample, row, band),
    falseValidCases: text.false_valid_cases.map((item) => ({
      ...item,
      split: row.split,
    })),
  };
}

function validateRuntimeOutcome(row) {
  if (
    !["completed", "crash", "exception"].includes(row.runtime_outcome) ||
    (row.runtime_memory_bytes !== null &&
      (!Number.isSafeInteger(row.runtime_memory_bytes) ||
        row.runtime_memory_bytes < 0))
  ) {
    throw new TypeError("adapter_runtime_measurement_invalid");
  }
  if (
    row.runtime_outcome !== "completed" &&
    (row.fiducials.length > 0 ||
      row.rois.length > 0 ||
      row.candidates.length > 0)
  ) {
    throw new TypeError(
      "failed_adapter_observation_contains_recognition_output",
    );
  }
}

function scoreFalseAccept(sample, row, band) {
  const validTruthCodes = sample.ground_truth_codes
    .filter((truth) => truth.kind === "valid")
    .map((truth) => truth.canonical_code);
  if (
    band === null ||
    band.band !== "accept" ||
    validTruthCodes.includes(band.observedCode)
  ) {
    return [];
  }
  return [
    {
      sample_id: row.sample_id,
      device_matrix_entry_id: row.device_matrix_entry_id,
      split: row.split,
      pair_id: row.candidates[0]?.pair_id ?? null,
      expected_codes: validTruthCodes,
      observed_codes: band.observedCode === null ? [] : [band.observedCode],
    },
  ];
}

function scoreNoCodeFalsePositive(sample, row, band) {
  if (
    band === null ||
    (sample.case_kind !== "bare" && sample.case_kind !== "no-code") ||
    band.band !== "accept"
  ) {
    return [];
  }
  return [
    {
      sample_id: row.sample_id,
      device_matrix_entry_id: row.device_matrix_entry_id,
      split: row.split,
    },
  ];
}

function scoreBandConstraint(sample, row, band) {
  if (
    band === null ||
    !Array.isArray(sample.expected_band_constraints) ||
    sample.expected_band_constraints.length === 0 ||
    sample.expected_band_constraints.includes(band.band)
  ) {
    return [];
  }
  return [
    {
      sample_id: row.sample_id,
      device_matrix_entry_id: row.device_matrix_entry_id,
      expected_bands: sample.expected_band_constraints,
      observed_band: band.band,
    },
  ];
}

function validateInputs({
  manifest,
  deviceMatrix,
  candidateBundle,
  gateConfig,
  adapterResults,
}) {
  if (
    !Array.isArray(manifest?.samples) ||
    !Array.isArray(deviceMatrix?.entries) ||
    !Array.isArray(adapterResults?.results) ||
    !candidateBundle?.decoder ||
    !gateConfig?.thresholds ||
    !gateConfig.minimum_samples_by_split ||
    !Number.isSafeInteger(gateConfig.minimum_samples_by_split.tuning) ||
    !Number.isSafeInteger(gateConfig.minimum_samples_by_split.final) ||
    !Number.isFinite(gateConfig.thresholds.fiducial_iou_threshold) ||
    gateConfig.thresholds.fiducial_iou_threshold <= 0 ||
    gateConfig.thresholds.fiducial_iou_threshold > 1
  ) {
    throw new TypeError("qualification_scoring_inputs_invalid");
  }
}

function uniqueIndex(items, key, error) {
  const result = new Map();
  for (const item of items) {
    const value = item?.[key];
    if (typeof value !== "string" || value.length === 0 || result.has(value)) {
      throw new TypeError(error);
    }
    result.set(value, item);
  }
  return result;
}

function scoringIdentity(row) {
  return {
    sample_id: row.sample_id,
    device_matrix_entry_id: row.device_matrix_entry_id,
    split: row.split,
  };
}

function aggregateBands(scoreRows, manifestSamples) {
  const metadataBySample = new Map(
    manifestSamples.map((sample) => [sample.sample_id, sample]),
  );
  const groups = {
    by_split: new Map(),
    by_device_split: new Map(),
    by_split_bucket: new Map(),
  };
  for (const row of scoreRows) {
    if (row.band === null) continue;
    addBand(groups.by_split, row.split, row.sample_id, row.band.band);
    addBand(
      groups.by_device_split,
      `${row.device_matrix_entry_id}\u0000${row.split}`,
      row.sample_id,
      row.band.band,
    );
    for (const bucket of new Set(
      metadataBySample.get(row.sample_id).stress_tags,
    )) {
      addBand(
        groups.by_split_bucket,
        `${row.split}\u0000${bucket}`,
        row.sample_id,
        row.band.band,
      );
    }
  }
  return {
    by_split: Object.fromEntries(
      [...groups.by_split.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, counts]) => [key, finalizeBands(counts)]),
    ),
    by_device_split: sortedBandRows(groups.by_device_split, [
      "device_matrix_entry_id",
      "split",
    ]),
    by_split_bucket: sortedBandRows(groups.by_split_bucket, [
      "split",
      "bucket_id",
    ]),
  };
}

function addBand(groups, key, sampleId, band) {
  const counts = groups.get(key) ?? {
    sampleIds: new Set(),
    observation_count: 0,
    counts: Object.fromEntries(BANDS.map((item) => [item, 0])),
  };
  counts.sampleIds.add(sampleId);
  counts.observation_count += 1;
  counts.counts[band] += 1;
  groups.set(key, counts);
}

function finalizeBands({ sampleIds, observation_count, counts }) {
  return {
    sample_count: sampleIds.size,
    observation_count,
    distribution: Object.fromEntries(
      BANDS.map((band) => [
        band,
        {
          numerator: counts[band],
          denominator: observation_count,
          rate:
            observation_count === 0 ? null : counts[band] / observation_count,
        },
      ]),
    ),
  };
}

function sortedBandRows(groups, keyNames) {
  return [...groups.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, counts]) => ({
      ...Object.fromEntries(
        keyNames.map((name, index) => [name, key.split("\u0000")[index]]),
      ),
      ...finalizeBands(counts),
    }));
}
