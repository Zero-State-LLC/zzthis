function addCount(target, key, value) {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new TypeError(`invalid_roi_metric_count:${key}`);
  }
  const total = target[key] + value;
  if (!Number.isSafeInteger(total)) {
    throw new TypeError(`invalid_roi_metric_count:${key}`);
  }
  target[key] = total;
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

function validateScore(scored) {
  if (
    !Number.isSafeInteger(scored.roi_truth_count) ||
    scored.roi_truth_count < 0 ||
    !Number.isSafeInteger(scored.rectification_success_count) ||
    scored.rectification_success_count < 0 ||
    scored.rectification_success_count > scored.roi_truth_count ||
    !Array.isArray(scored.elapsed_ms) ||
    scored.elapsed_ms.some((value) => !Number.isFinite(value) || value < 0) ||
    (scored.roi_truth_count > 0 &&
      (!Number.isFinite(scored.roi_mean_iou) ||
        scored.roi_mean_iou < 0 ||
        scored.roi_mean_iou > 1)) ||
    (scored.roi_truth_count === 0 && scored.roi_mean_iou !== null) ||
    (scored.rectification_denominator !== null &&
      (scored.rectification_denominator !== scored.roi_truth_count ||
        scored.rectification_success_count > scored.rectification_denominator))
  ) {
    throw new TypeError("roi_scored_observation_metrics_invalid");
  }
}

function applyObservation(accumulator, scored) {
  validateScore(scored);
  accumulator.sampleIds.add(scored.sample_id);
  addCount(accumulator, "roi_truth_count", scored.roi_truth_count);
  accumulator.roi_iou_sum +=
    (scored.roi_mean_iou ?? 0) * scored.roi_truth_count;
  if (!Number.isFinite(accumulator.roi_iou_sum)) {
    throw new TypeError("invalid_roi_metric_sum:roi_iou_sum");
  }
  addCount(
    accumulator,
    "rectification_success_count",
    scored.rectification_success_count,
  );
  if (scored.rectification_denominator === null) {
    accumulator.rectification_measured = false;
  } else {
    addCount(
      accumulator,
      "rectification_denominator",
      scored.rectification_denominator,
    );
  }
  accumulator.elapsed_ms.push(...scored.elapsed_ms);
}

function indexManifestSamples(samples) {
  const byId = new Map();
  for (const sample of samples) {
    if (
      !sample ||
      typeof sample.sample_id !== "string" ||
      !["tuning", "final"].includes(sample.split) ||
      !Array.isArray(sample.stress_tags) ||
      sample.stress_tags.some((tag) => typeof tag !== "string") ||
      byId.has(sample.sample_id)
    ) {
      throw new TypeError("roi_manifest_sample_metadata_invalid");
    }
    byId.set(sample.sample_id, sample);
  }
  return byId;
}

function addToGroup(groups, key, scored) {
  const accumulator = groups.get(key) ?? createAccumulator();
  applyObservation(accumulator, scored);
  groups.set(key, accumulator);
}

function percentileNearestRank(sorted, percentile) {
  return sorted[Math.max(0, Math.ceil(percentile * sorted.length) - 1)];
}

function finalize(accumulator) {
  const sortedLatency = [...accumulator.elapsed_ms].sort(
    (left, right) => left - right,
  );
  const latency =
    sortedLatency.length === 0
      ? null
      : {
          p50:
            sortedLatency.length % 2 === 1
              ? sortedLatency[Math.floor(sortedLatency.length / 2)]
              : (sortedLatency[sortedLatency.length / 2 - 1] +
                  sortedLatency[sortedLatency.length / 2]) /
                2,
          p95: percentileNearestRank(sortedLatency, 0.95),
        };
  const rectificationMeasured =
    accumulator.rectification_measured &&
    accumulator.rectification_denominator > 0;
  return {
    sample_count: accumulator.sampleIds.size,
    roi_truth_count: accumulator.roi_truth_count,
    roi_mean_iou:
      accumulator.roi_truth_count === 0
        ? null
        : accumulator.roi_iou_sum / accumulator.roi_truth_count,
    rectification_success_count: accumulator.rectification_success_count,
    rectification_denominator: rectificationMeasured
      ? accumulator.rectification_denominator
      : null,
    rectification_success_rate: rectificationMeasured
      ? accumulator.rectification_success_count /
        accumulator.rectification_denominator
      : null,
    latency_sample_count: sortedLatency.length,
    latency_ms: latency,
  };
}

function sortedRows(groups, keyNames) {
  return [...groups.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, accumulator]) => ({
      ...Object.fromEntries(
        keyNames.map((name, index) => [name, key.split("\u0000")[index]]),
      ),
      metrics: finalize(accumulator),
    }));
}

/** Aggregate ROI, rectification, and latency metrics by split, device, and bucket. */
export function aggregateRoiLatencyScoring(scoredSamples, manifestSamples) {
  if (!Array.isArray(scoredSamples) || !Array.isArray(manifestSamples)) {
    throw new TypeError("roi_aggregation_arrays_required");
  }
  const metadataBySample = indexManifestSamples(manifestSamples);
  const groups = {
    bySplit: new Map(),
    byDeviceSplit: new Map(),
    bySplitBucket: new Map(),
    seenObservations: new Set(),
  };
  for (const scored of scoredSamples) {
    const metadata = metadataBySample.get(scored?.sample_id);
    if (
      !metadata ||
      metadata.split !== scored.split ||
      typeof scored.device_matrix_entry_id !== "string" ||
      scored.device_matrix_entry_id.length === 0
    ) {
      throw new TypeError("roi_scored_observation_metadata_mismatch");
    }
    const observationKey = `${scored.device_matrix_entry_id}\u0000${scored.sample_id}`;
    if (groups.seenObservations.has(observationKey)) {
      throw new TypeError("duplicate_roi_device_sample_observation");
    }
    groups.seenObservations.add(observationKey);
    addToGroup(groups.bySplit, scored.split, scored);
    addToGroup(
      groups.byDeviceSplit,
      `${scored.device_matrix_entry_id}\u0000${scored.split}`,
      scored,
    );
    for (const bucketId of new Set(metadata.stress_tags)) {
      addToGroup(
        groups.bySplitBucket,
        `${scored.split}\u0000${bucketId}`,
        scored,
      );
    }
  }

  return {
    by_split: Object.fromEntries(
      [...groups.bySplit.entries()]
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([split, accumulator]) => [split, finalize(accumulator)]),
    ),
    by_device_split: sortedRows(groups.byDeviceSplit, [
      "device_matrix_entry_id",
      "split",
    ]),
    by_split_bucket: sortedRows(groups.bySplitBucket, ["split", "bucket_id"]),
  };
}
