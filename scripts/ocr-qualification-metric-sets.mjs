const NO_CODE_KINDS = new Set(["bare", "no-code"]);
const BAND_NAMES = ["accept", "clarify", "retry", "abstain"];

function rate(numerator, denominator) {
  return {
    numerator,
    denominator,
    rate: denominator === 0 ? null : numerator / denominator,
  };
}

function emptyBandDistribution() {
  return Object.fromEntries(BAND_NAMES.map((band) => [band, rate(0, 0)]));
}

function sum(rows, read) {
  let total = 0;
  for (const row of rows) {
    const value = read(row);
    if (!Number.isSafeInteger(value) || value < 0) {
      throw new TypeError("qualification_metric_count_invalid");
    }
    total += value;
    if (!Number.isSafeInteger(total)) {
      throw new TypeError("qualification_metric_count_overflow");
    }
  }
  return total;
}

function sampleAccuracy(rows, predicate) {
  const groups = new Map();
  for (const row of rows) {
    const metadata = row.metadata;
    if (!predicate(metadata)) continue;
    const validTruths = row.scored.text.observations.filter(
      (observation) => observation.exact_code_correct !== null,
    );
    if (validTruths.length === 0) continue;
    const key = observationKey(row.scored);
    const outcomes = groups.get(key) ?? [];
    outcomes.push(validTruths.every((truth) => truth.exact_code_correct));
    groups.set(key, outcomes);
  }
  const outcomes = [...groups.values()].map((deviceOutcomes) =>
    deviceOutcomes.every(Boolean),
  );
  return rate(outcomes.filter(Boolean).length, outcomes.length);
}

function falseAcceptRows(rows, falseAccepts) {
  const keys = observationKeys(rows);
  return falseAccepts.filter((item) => keys.has(observationKey(item)));
}

function falseValidRows(rows, falseValidCases) {
  const keys = observationKeys(rows);
  return falseValidCases.filter((item) => keys.has(observationKey(item)));
}

function noCodeFalsePositiveRows(rows, noCodeFalsePositives) {
  const keys = observationKeys(rows);
  return noCodeFalsePositives.filter((item) => keys.has(observationKey(item)));
}

function observationKey(item) {
  return `${item.device_matrix_entry_id}\u0000${item.sample_id}`;
}

function observationKeys(rows) {
  return new Set(rows.map(({ scored }) => observationKey(scored)));
}

function notMeasuredReasons(rows, metrics, noCodeFalsePositives) {
  const reasons = [];
  if (metrics.roi_mean_iou === null) reasons.push("roi_mean_iou:no_roi_truth");
  if (metrics.rectification_success_rate.rate === null) {
    reasons.push("rectification_success_rate:missing_measurement");
  }
  if (metrics.character_error_rate === null) {
    reasons.push("character_error_rate:no_truth_payload");
  }
  if (metrics.exact_code_accuracy.rate === null) {
    reasons.push("exact_code_accuracy:no_valid_truth_code");
  }
  if (metrics.part_word_accuracy.rate === null) {
    reasons.push("part_word_accuracy:no_truth_payload");
  }
  if (metrics.false_valid_decode_rate.rate === null) {
    reasons.push("false_valid_decode_rate:no_valid_truth_code");
  }
  if (metrics.wrapped_code_accuracy.rate === null) {
    reasons.push("wrapped_code_accuracy:no_measured_wrapped_sample");
  }
  if (metrics.multi_code_accuracy.rate === null) {
    reasons.push("multi_code_accuracy:no_measured_multi_code_sample");
  }
  if (metrics.no_code_false_positive_rate.rate === null) {
    reasons.push("no_code_false_positive_rate:no_bare_or_no_code_sample");
  }
  if (metrics.band_distribution.accept.denominator === 0) {
    reasons.push("band_distribution:no_completed_runtime_observation");
  }
  if (
    rows.some(
      ({ scored }) =>
        scored.runtime_outcome === "crash" ||
        scored.runtime_outcome === "exception",
    )
  ) {
    reasons.push("band_distribution:runtime_failure_excluded");
  }
  if (metrics.latency_ms.p50 === null || metrics.latency_ms.p95 === null) {
    reasons.push("latency_ms:no_timing_observations");
  }
  if (metrics.package_size_delta_bytes === null) {
    reasons.push("package_size_delta_bytes:no_frozen_baseline_measurement");
  }
  if (metrics.peak_runtime_memory_bytes === null) {
    reasons.push("peak_runtime_memory_bytes:sample_measurement_missing");
  }
  if (rows.some(({ scored }) => scored.runtime_memory_bytes === null)) {
    reasons.push("runtime_memory_measurement_missing_for_some_samples");
  }
  if (
    noCodeFalsePositives.length > 0 &&
    metrics.no_code_false_positive_count === 0
  ) {
    throw new TypeError("no_code_false_positive_projection_mismatch");
  }
  return [...new Set(reasons)].sort();
}

function metricSet(rows, { fiducial, roiLatency, text, bands }, caseMetrics) {
  const sampleCount = rows.length;
  const acceptCount = sum(rows, ({ scored }) =>
    scored.band?.band === "accept" ? 1 : 0,
  );
  const falseAccept = caseMetrics.falseAccepts.length;
  const falseValidCount = text.false_valid_decode_rate.numerator;
  const noCodeDenominator = rows.filter(({ metadata }) =>
    NO_CODE_KINDS.has(metadata.case_kind),
  ).length;
  const noCodeFalsePositiveCount = caseMetrics.noCodeFalsePositives.length;
  const rectificationRate = rate(
    roiLatency.rectification_success_count,
    roiLatency.rectification_denominator ?? 0,
  );
  const validTruths = rows.flatMap(({ scored }) =>
    scored.text.observations.filter(
      (observation) => observation.exact_code_correct !== null,
    ),
  );
  const memoryValues = rows.map(({ scored }) => scored.runtime_memory_bytes);
  const metrics = {
    sample_count: sampleCount,
    endpoint_precision: fiducial.endpoint_precision,
    endpoint_recall: fiducial.endpoint_recall,
    complete_pair_rate: fiducial.complete_pair_rate,
    pair_accuracy: fiducial.pair_accuracy,
    false_finder_count: fiducial.false_finder_count,
    false_finder_rate: fiducial.false_finder_rate,
    missed_endpoint_count: fiducial.missed_endpoint_count,
    false_pair_count: fiducial.false_pair_count,
    false_pair_rate: fiducial.false_pair_rate,
    roi_mean_iou: roiLatency.roi_mean_iou,
    rectification_success_rate: rectificationRate,
    exact_code_accuracy: text.exact_code_accuracy,
    part_word_accuracy: text.part_word_accuracy,
    character_error_rate: text.character_error_rate.rate,
    false_valid_decode_count: falseValidCount,
    false_valid_decode_rate: text.false_valid_decode_rate,
    false_accept_count: falseAccept,
    false_accept_rate: rate(falseAccept, sampleCount),
    no_code_false_positive_count: noCodeFalsePositiveCount,
    no_code_false_positive_rate: rate(
      noCodeFalsePositiveCount,
      noCodeDenominator,
    ),
    wrapped_code_accuracy: caseMetrics.wrappedAccuracy,
    multi_code_accuracy: caseMetrics.multiAccuracy,
    band_distribution: bands?.distribution ?? emptyBandDistribution(),
    latency_ms: roiLatency.latency_ms ?? { p50: null, p95: null },
    package_size_delta_bytes: null,
    peak_runtime_memory_bytes:
      memoryValues.length > 0 && memoryValues.every(Number.isSafeInteger)
        ? Math.max(...memoryValues)
        : null,
    crash_count: sum(rows, ({ scored }) =>
      scored.runtime_outcome === "crash" ? 1 : 0,
    ),
    exception_count: sum(rows, ({ scored }) =>
      scored.runtime_outcome === "exception" ? 1 : 0,
    ),
  };
  if (
    acceptCount > sampleCount ||
    validTruths.length > text.exact_code_accuracy.denominator
  ) {
    throw new TypeError("qualification_metric_denominator_mismatch");
  }
  const reasons = notMeasuredReasons(
    rows,
    metrics,
    caseMetrics.noCodeFalsePositives,
  );
  if (reasons.length > 0) metrics.not_measured_reasons = reasons;
  return metrics;
}

function groupRows(scoreRows, manifestSamples) {
  const metadataBySample = new Map(
    manifestSamples.map((sample) => [sample.sample_id, sample]),
  );
  return scoreRows.map((scored) => {
    const metadata = metadataBySample.get(scored.sample_id);
    if (!metadata || metadata.split !== scored.split) {
      throw new TypeError("qualification_metric_sample_metadata_mismatch");
    }
    return { scored, metadata };
  });
}

function indexMetrics(aggregates, kind) {
  const source = aggregates[kind];
  return {
    byDeviceSplit: new Map(
      source.by_device_split.map((row) => [
        `${row.device_matrix_entry_id}\u0000${row.split}`,
        row.metrics ?? row,
      ]),
    ),
    bySplit: source.by_split,
    bySplitBucket: new Map(
      source.by_split_bucket.map((row) => [
        `${row.split}\u0000${row.bucket_id}`,
        row.metrics,
      ]),
    ),
  };
}

function indexBandMetrics(aggregates) {
  return {
    byDeviceSplit: new Map(
      aggregates.band_distribution.by_device_split.map((row) => [
        `${row.device_matrix_entry_id}\u0000${row.split}`,
        row,
      ]),
    ),
    bySplit: aggregates.band_distribution.by_split,
    bySplitBucket: new Map(
      aggregates.band_distribution.by_split_bucket.map((row) => [
        `${row.split}\u0000${row.bucket_id}`,
        row,
      ]),
    ),
  };
}

function buildCaseMetrics(
  rows,
  falseAccepts,
  falseValidCases,
  noCodeFalsePositives,
) {
  const caseRows = {
    falseAccepts: falseAcceptRows(rows, falseAccepts),
    falseValidCases: falseValidRows(rows, falseValidCases),
    noCodeFalsePositives: noCodeFalsePositiveRows(rows, noCodeFalsePositives),
  };
  return {
    ...caseRows,
    wrappedAccuracy: sampleAccuracy(rows, (sample) =>
      sample.stress_tags.includes("wrapped"),
    ),
    multiAccuracy: sampleAccuracy(
      rows,
      (sample) => sample.case_kind === "multi-code",
    ),
  };
}

/** Project diagnostic observations into the receipt's normative metric-set shape. */
export function buildQualificationMetricSets({
  scoreRows,
  manifestSamples,
  deviceMatrix,
  aggregates,
  falseAccepts,
  falseValidCases,
  noCodeFalsePositives,
}) {
  const rows = groupRows(scoreRows, manifestSamples);
  const fiducial = indexMetrics(aggregates, "fiducial");
  const roiLatency = indexMetrics(aggregates, "roi_latency");
  const text = indexMetrics(aggregates, "text");
  const bands = indexBandMetrics(aggregates);
  const select = (group, split, key, source) => {
    if (group === "split") return source.bySplit[split];
    if (group === "device")
      return source.byDeviceSplit.get(`${key}\u0000${split}`);
    return source.bySplitBucket.get(`${split}\u0000${key}`);
  };
  const build = (group, split, key, metricSources) => {
    const selectedRows = rows.filter(
      ({ scored, metadata }) =>
        scored.split === split &&
        (group === "split" ||
          (group === "device"
            ? scored.device_matrix_entry_id === key
            : metadata.stress_tags.includes(key))),
    );
    if (selectedRows.length === 0) return null;
    return metricSet(
      selectedRows,
      {
        fiducial: select(group, split, key, metricSources.fiducial),
        roiLatency: select(group, split, key, metricSources.roiLatency),
        text: select(group, split, key, metricSources.text),
        bands: select(group, split, key, metricSources.bands),
      },
      buildCaseMetrics(
        selectedRows,
        falseAccepts,
        falseValidCases,
        noCodeFalsePositives,
      ),
    );
  };
  const metricSources = { fiducial, roiLatency, text, bands };
  const metricsBySplit = Object.fromEntries(
    ["tuning", "final"].map((split) => [
      split,
      build("split", split, null, metricSources),
    ]),
  );
  const metricsByDeviceSplit = deviceMatrix.entries.flatMap((entry) =>
    ["tuning", "final"].map((split) => ({
      device_matrix_entry_id: entry.device_matrix_entry_id,
      split,
      metrics: build(
        "device",
        split,
        entry.device_matrix_entry_id,
        metricSources,
      ),
    })),
  );
  const bucketMetrics = [
    ...new Set(manifestSamples.flatMap((sample) => sample.stress_tags)),
  ]
    .sort()
    .flatMap((bucketId) =>
      ["tuning", "final"].map((split) => {
        const metrics = build("bucket", split, bucketId, metricSources);
        return metrics === null
          ? null
          : { split, bucket_id: bucketId, metrics };
      }),
    )
    .filter(Boolean);
  const deviceCoverage = deviceMatrix.entries.map((entry) => ({
    device_matrix_entry_id: entry.device_matrix_entry_id,
    os_version: entry.os_version,
    device_class: entry.device_class,
    minimum_sample_count: entry.minimum_sample_count,
    observed_sample_count: new Set(
      rows
        .filter(
          ({ scored }) =>
            scored.device_matrix_entry_id === entry.device_matrix_entry_id,
        )
        .map(({ scored }) => scored.sample_id),
    ).size,
    metrics_by_split: Object.fromEntries(
      ["tuning", "final"].map((split) => [
        split,
        build("device", split, entry.device_matrix_entry_id, metricSources),
      ]),
    ),
  }));
  return {
    metrics_by_split: metricsBySplit,
    metrics_by_device_split: metricsByDeviceSplit,
    bucket_metrics: bucketMetrics,
    device_coverage: deviceCoverage,
  };
}
