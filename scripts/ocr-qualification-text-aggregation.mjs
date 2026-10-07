function addCount(target, key, value) {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new TypeError(`invalid_metric_count:${key}`);
  }
  target[key] += value;
}

function createAccumulator() {
  return {
    sampleIds: new Set(),
    observation_count: 0,
    exact_code_accuracy: { numerator: 0, denominator: 0, rate: null },
    character_error_rate: {
      edit_distance: 0,
      reference_code_point_count: 0,
      rate: null,
    },
    false_valid_decode_rate: { numerator: 0, denominator: 0, rate: null },
  };
}

function applyObservation(accumulator, scored) {
  accumulator.sampleIds.add(scored.sample_id);
  accumulator.observation_count += 1;
  for (const metricName of ["exact_code_accuracy", "false_valid_decode_rate"]) {
    const metric = scored[metricName];
    if (
      !metric ||
      !Number.isSafeInteger(metric.numerator) ||
      !Number.isSafeInteger(metric.denominator) ||
      metric.numerator < 0 ||
      metric.denominator < 0 ||
      metric.numerator > metric.denominator
    ) {
      throw new TypeError(`invalid_rate_metric:${metricName}`);
    }
    addCount(accumulator[metricName], "numerator", metric.numerator);
    addCount(accumulator[metricName], "denominator", metric.denominator);
  }

  const cer = scored.character_error_rate;
  if (
    !cer ||
    !Number.isSafeInteger(cer.edit_distance) ||
    !Number.isSafeInteger(cer.reference_code_point_count) ||
    cer.edit_distance < 0 ||
    cer.reference_code_point_count < 0
  ) {
    throw new TypeError("invalid_character_error_metric");
  }
  addCount(
    accumulator.character_error_rate,
    "edit_distance",
    cer.edit_distance,
  );
  addCount(
    accumulator.character_error_rate,
    "reference_code_point_count",
    cer.reference_code_point_count,
  );
}

function finalize(accumulator) {
  const result = {
    sample_count: accumulator.sampleIds.size,
    observation_count: accumulator.observation_count,
    exact_code_accuracy: { ...accumulator.exact_code_accuracy },
    character_error_rate: { ...accumulator.character_error_rate },
    false_valid_decode_rate: { ...accumulator.false_valid_decode_rate },
  };
  for (const metricName of ["exact_code_accuracy", "false_valid_decode_rate"]) {
    const metric = result[metricName];
    metric.rate =
      metric.denominator === 0 ? null : metric.numerator / metric.denominator;
  }
  const cer = result.character_error_rate;
  cer.rate =
    cer.reference_code_point_count === 0
      ? null
      : cer.edit_distance / cer.reference_code_point_count;
  return result;
}

function sortedGroupRows(groups, keyNames) {
  return [...groups.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, accumulator]) => ({
      ...Object.fromEntries(
        keyNames.map((name, index) => [name, key.split("\u0000")[index]]),
      ),
      metrics: finalize(accumulator),
    }));
}

/**
 * Aggregate top-1 text observations without averaging pre-computed rates.
 * Overall split and bucket rates sum their numerators and denominators;
 * device-split rows remain separately visible.
 */
export function aggregateTextScoring(scoredSamples, manifestSamples) {
  if (!Array.isArray(scoredSamples) || !Array.isArray(manifestSamples)) {
    throw new TypeError("text_aggregation_arrays_required");
  }
  const metadataBySample = new Map();
  for (const sample of manifestSamples) {
    if (
      !sample ||
      typeof sample.sample_id !== "string" ||
      !["tuning", "final"].includes(sample.split) ||
      !Array.isArray(sample.stress_tags) ||
      sample.stress_tags.some((tag) => typeof tag !== "string") ||
      metadataBySample.has(sample.sample_id)
    ) {
      throw new TypeError("manifest_sample_metadata_invalid");
    }
    metadataBySample.set(sample.sample_id, sample);
  }

  const bySplit = new Map();
  const byDeviceSplit = new Map();
  const bySplitBucket = new Map();
  const seenObservations = new Set();
  for (const scored of scoredSamples) {
    const metadata = metadataBySample.get(scored?.sample_id);
    if (
      !metadata ||
      !["tuning", "final"].includes(scored.split) ||
      metadata.split !== scored.split ||
      typeof scored.device_matrix_entry_id !== "string" ||
      scored.device_matrix_entry_id.length === 0
    ) {
      throw new TypeError("scored_observation_metadata_mismatch");
    }
    const observationKey = `${scored.device_matrix_entry_id}\u0000${scored.sample_id}`;
    if (seenObservations.has(observationKey)) {
      throw new TypeError("duplicate_device_sample_observation");
    }
    seenObservations.add(observationKey);

    const splitAccumulator = bySplit.get(scored.split) ?? createAccumulator();
    applyObservation(splitAccumulator, scored);
    bySplit.set(scored.split, splitAccumulator);

    const deviceKey = `${scored.device_matrix_entry_id}\u0000${scored.split}`;
    const deviceAccumulator =
      byDeviceSplit.get(deviceKey) ?? createAccumulator();
    applyObservation(deviceAccumulator, scored);
    byDeviceSplit.set(deviceKey, deviceAccumulator);

    for (const bucket of new Set(metadata.stress_tags)) {
      const bucketKey = `${scored.split}\u0000${bucket}`;
      const bucketAccumulator =
        bySplitBucket.get(bucketKey) ?? createAccumulator();
      applyObservation(bucketAccumulator, scored);
      bySplitBucket.set(bucketKey, bucketAccumulator);
    }
  }

  return {
    by_split: Object.fromEntries(
      [...bySplit.entries()]
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([split, accumulator]) => [split, finalize(accumulator)]),
    ),
    by_device_split: sortedGroupRows(byDeviceSplit, [
      "device_matrix_entry_id",
      "split",
    ]),
    by_split_bucket: sortedGroupRows(bySplitBucket, ["split", "bucket_id"]),
  };
}
