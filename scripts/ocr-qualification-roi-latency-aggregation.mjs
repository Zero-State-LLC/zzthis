function addSafe(target, key, value) {
  if (
    !Number.isSafeInteger(value) ||
    value < 0 ||
    !Number.isSafeInteger(target[key] + value)
  ) {
    throw new TypeError(`invalid_roi_metric_count:${key}`);
  }
  target[key] += value;
}

function createAccumulator() {
  return {
    sampleIds: new Set(),
    roi_truth_count: 0,
    roi_iou_sum: 0,
    rectification_success_count: 0,
    rectification_denominator: 0,
    rectification_measured: true,
    elapsed_ms: [],
  };
}

function addObservation(accumulator, row) {
  if (
    !Number.isSafeInteger(row.roi_truth_count) ||
    row.roi_truth_count < 0 ||
    !Number.isSafeInteger(row.rectification_success_count) ||
    row.rectification_success_count < 0 ||
    row.rectification_success_count > row.roi_truth_count ||
    !Array.isArray(row.elapsed_ms) ||
    row.elapsed_ms.some((value) => !Number.isFinite(value) || value < 0) ||
    (row.roi_truth_count > 0 &&
      (!Number.isFinite(row.roi_mean_iou) ||
        row.roi_mean_iou < 0 ||
        row.roi_mean_iou > 1)) ||
    (row.roi_truth_count === 0 && row.roi_mean_iou !== null) ||
    (row.rectification_denominator !== null &&
      (row.rectification_denominator !== row.roi_truth_count ||
        row.rectification_success_count > row.rectification_denominator))
  )
    throw new TypeError("roi_scored_observation_metrics_invalid");
  accumulator.sampleIds.add(row.sample_id);
  addSafe(accumulator, "roi_truth_count", row.roi_truth_count);
  accumulator.roi_iou_sum += (row.roi_mean_iou ?? 0) * row.roi_truth_count;
  if (!Number.isFinite(accumulator.roi_iou_sum))
    throw new TypeError("invalid_roi_metric_sum:roi_iou_sum");
  addSafe(
    accumulator,
    "rectification_success_count",
    row.rectification_success_count,
  );
  if (row.rectification_denominator === null)
    accumulator.rectification_measured = false;
  else
    addSafe(
      accumulator,
      "rectification_denominator",
      row.rectification_denominator,
    );
  accumulator.elapsed_ms.push(...row.elapsed_ms);
}

function percentileNearestRank(sorted, percentile) {
  return sorted[Math.max(0, Math.ceil(percentile * sorted.length) - 1)];
}

function finalize(accumulator) {
  const sorted = [...accumulator.elapsed_ms].sort((a, b) => a - b);
  const denominator =
    accumulator.rectification_measured &&
    accumulator.rectification_denominator > 0
      ? accumulator.rectification_denominator
      : null;
  return {
    sample_count: accumulator.sampleIds.size,
    roi_truth_count: accumulator.roi_truth_count,
    roi_mean_iou:
      accumulator.roi_truth_count === 0
        ? null
        : accumulator.roi_iou_sum / accumulator.roi_truth_count,
    rectification_success_count: accumulator.rectification_success_count,
    rectification_denominator: denominator,
    rectification_success_rate:
      denominator === null
        ? null
        : accumulator.rectification_success_count / denominator,
    latency_sample_count: sorted.length,
    latency_ms:
      sorted.length === 0
        ? null
        : {
            p50:
              sorted.length % 2 === 1
                ? sorted[Math.floor(sorted.length / 2)]
                : (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) /
                  2,
            p95: percentileNearestRank(sorted, 0.95),
          },
  };
}

function sortedRows(groups, names) {
  return [...groups.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => ({
      ...Object.fromEntries(
        names.map((name, index) => [name, key.split("\u0000")[index]]),
      ),
      metrics: finalize(value),
    }));
}

/** Aggregate weighted ROI, rectification, and recomputed latency distributions. */
export function aggregateRoiLatencyScoring(scoredRows, manifestSamples) {
  if (!Array.isArray(scoredRows) || !Array.isArray(manifestSamples))
    throw new TypeError("roi_aggregation_arrays_required");
  const metadata = new Map();
  for (const sample of manifestSamples) {
    if (
      !sample ||
      typeof sample.sample_id !== "string" ||
      !["tuning", "final"].includes(sample.split) ||
      !Array.isArray(sample.stress_tags) ||
      metadata.has(sample.sample_id)
    ) {
      throw new TypeError("roi_manifest_sample_metadata_invalid");
    }
    metadata.set(sample.sample_id, sample);
  }
  const bySplit = new Map();
  const byDeviceSplit = new Map();
  const bySplitBucket = new Map();
  const seen = new Set();
  const add = (groups, key, row) => {
    const accumulator = groups.get(key) ?? createAccumulator();
    addObservation(accumulator, row);
    groups.set(key, accumulator);
  };
  for (const row of scoredRows) {
    const sample = metadata.get(row?.sample_id);
    if (
      !sample ||
      sample.split !== row.split ||
      typeof row.device_matrix_entry_id !== "string" ||
      !row.device_matrix_entry_id
    ) {
      throw new TypeError("roi_scored_observation_metadata_mismatch");
    }
    const key = `${row.device_matrix_entry_id}\u0000${row.sample_id}`;
    if (seen.has(key))
      throw new TypeError("duplicate_roi_device_sample_observation");
    seen.add(key);
    add(bySplit, row.split, row);
    add(byDeviceSplit, `${row.device_matrix_entry_id}\u0000${row.split}`, row);
    for (const bucket of new Set(sample.stress_tags))
      add(bySplitBucket, `${row.split}\u0000${bucket}`, row);
  }
  return {
    by_split: Object.fromEntries(
      [...bySplit.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, value]) => [key, finalize(value)]),
    ),
    by_device_split: sortedRows(byDeviceSplit, [
      "device_matrix_entry_id",
      "split",
    ]),
    by_split_bucket: sortedRows(bySplitBucket, ["split", "bucket_id"]),
  };
}
