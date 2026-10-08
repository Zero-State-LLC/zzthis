function addCount(target, key, value) {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new TypeError(`invalid_fiducial_metric_count:${key}`);
  }
  const total = target[key] + value;
  if (!Number.isSafeInteger(total)) {
    throw new TypeError(`invalid_fiducial_metric_count:${key}`);
  }
  target[key] = total;
}

function rateAccumulator() {
  return { numerator: 0, denominator: 0 };
}

function createAccumulator() {
  return {
    sampleIds: new Set(),
    endpoint_precision: rateAccumulator(),
    endpoint_recall: rateAccumulator(),
    false_finder_count: 0,
    false_finder_rate: rateAccumulator(),
    missed_endpoint_count: 0,
    complete_pair_rate: rateAccumulator(),
    pair_accuracy: rateAccumulator(),
    false_pair_count: 0,
    false_pair_rate: rateAccumulator(),
  };
}

function addRate(target, key, metric) {
  if (
    !metric ||
    !Number.isSafeInteger(metric.numerator) ||
    !Number.isSafeInteger(metric.denominator) ||
    metric.numerator < 0 ||
    metric.denominator < 0 ||
    metric.numerator > metric.denominator
  ) {
    throw new TypeError(`invalid_fiducial_rate_metric:${key}`);
  }
  addCount(target[key], "numerator", metric.numerator);
  addCount(target[key], "denominator", metric.denominator);
}

function applyObservation(accumulator, scored) {
  accumulator.sampleIds.add(scored.sample_id);
  addRate(accumulator, "endpoint_precision", scored.endpoint_precision);
  addRate(accumulator, "endpoint_recall", scored.endpoint_recall);
  addRate(accumulator, "false_finder_rate", scored.false_finder_rate);
  addRate(accumulator, "complete_pair_rate", scored.complete_pair_rate);
  addRate(accumulator, "pair_accuracy", scored.pair_accuracy);
  addRate(accumulator, "false_pair_rate", scored.false_pair_rate);
  addCount(accumulator, "false_finder_count", scored.false_finder_count);
  addCount(accumulator, "missed_endpoint_count", scored.missed_endpoint_count);
  addCount(accumulator, "false_pair_count", scored.false_pair_count);
}

function finalize(accumulator) {
  const result = {
    sample_count: accumulator.sampleIds.size,
    endpoint_precision: { ...accumulator.endpoint_precision },
    endpoint_recall: { ...accumulator.endpoint_recall },
    false_finder_count: accumulator.false_finder_count,
    false_finder_rate: { ...accumulator.false_finder_rate },
    missed_endpoint_count: accumulator.missed_endpoint_count,
    complete_pair_rate: { ...accumulator.complete_pair_rate },
    pair_accuracy: { ...accumulator.pair_accuracy },
    false_pair_count: accumulator.false_pair_count,
    false_pair_rate: { ...accumulator.false_pair_rate },
  };
  for (const key of [
    "endpoint_precision",
    "endpoint_recall",
    "false_finder_rate",
    "complete_pair_rate",
    "pair_accuracy",
    "false_pair_rate",
  ]) {
    const metric = result[key];
    metric.rate =
      metric.denominator === 0 ? null : metric.numerator / metric.denominator;
  }
  return result;
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
      throw new TypeError("fiducial_manifest_sample_metadata_invalid");
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

/** Aggregate per-sample fiducial metrics without averaging precomputed rates. */
export function aggregateFiducialScoring(scoredSamples, manifestSamples) {
  if (!Array.isArray(scoredSamples) || !Array.isArray(manifestSamples)) {
    throw new TypeError("fiducial_aggregation_arrays_required");
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
      throw new TypeError("fiducial_scored_observation_metadata_mismatch");
    }
    const observationKey = `${scored.device_matrix_entry_id}\u0000${scored.sample_id}`;
    if (groups.seenObservations.has(observationKey)) {
      throw new TypeError("duplicate_fiducial_device_sample_observation");
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
