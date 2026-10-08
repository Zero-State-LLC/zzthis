const RATE_KEYS = [
  "endpoint_precision",
  "endpoint_recall",
  "false_finder_rate",
  "complete_pair_rate",
  "pair_accuracy",
  "false_pair_rate",
];
const COUNT_KEYS = [
  "false_finder_count",
  "missed_endpoint_count",
  "false_pair_count",
];

function addSafe(target, key, value) {
  if (
    !Number.isSafeInteger(value) ||
    value < 0 ||
    !Number.isSafeInteger(target[key] + value)
  ) {
    throw new TypeError(`invalid_fiducial_metric_count:${key}`);
  }
  target[key] += value;
}

function createAccumulator() {
  return {
    sampleIds: new Set(),
    ...Object.fromEntries(
      RATE_KEYS.map((key) => [key, { numerator: 0, denominator: 0 }]),
    ),
    ...Object.fromEntries(COUNT_KEYS.map((key) => [key, 0])),
  };
}

function addObservation(accumulator, row) {
  accumulator.sampleIds.add(row.sample_id);
  for (const key of RATE_KEYS) {
    const metric = row[key];
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
    addSafe(accumulator[key], "numerator", metric.numerator);
    addSafe(accumulator[key], "denominator", metric.denominator);
  }
  for (const key of COUNT_KEYS) addSafe(accumulator, key, row[key]);
  if (
    row.endpoint_precision.numerator !== row.endpoint_recall.numerator ||
    row.false_finder_count !== row.false_finder_rate.numerator ||
    row.false_finder_rate.denominator !== row.endpoint_precision.denominator ||
    row.missed_endpoint_count !==
      row.endpoint_recall.denominator - row.endpoint_recall.numerator ||
    row.false_pair_count !== row.false_pair_rate.numerator ||
    row.false_pair_rate.denominator !== row.pair_accuracy.denominator ||
    row.false_pair_count !==
      row.pair_accuracy.denominator - row.pair_accuracy.numerator
  )
    throw new TypeError("fiducial_observation_count_mismatch");
}

function finalize(accumulator) {
  const result = { sample_count: accumulator.sampleIds.size };
  for (const key of RATE_KEYS) {
    const { numerator, denominator } = accumulator[key];
    result[key] = {
      numerator,
      denominator,
      rate: denominator === 0 ? null : numerator / denominator,
    };
  }
  for (const key of COUNT_KEYS) result[key] = accumulator[key];
  return result;
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

/** Sum fiducial numerators/denominators by split, device/split, and bucket/split. */
export function aggregateFiducialScoring(scoredRows, manifestSamples) {
  if (!Array.isArray(scoredRows) || !Array.isArray(manifestSamples))
    throw new TypeError("fiducial_aggregation_arrays_required");
  const metadata = new Map();
  for (const sample of manifestSamples) {
    if (
      !sample ||
      typeof sample.sample_id !== "string" ||
      !["tuning", "final"].includes(sample.split) ||
      !Array.isArray(sample.stress_tags) ||
      metadata.has(sample.sample_id)
    ) {
      throw new TypeError("fiducial_manifest_sample_metadata_invalid");
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
      throw new TypeError("fiducial_scored_observation_metadata_mismatch");
    }
    const key = `${row.device_matrix_entry_id}\u0000${row.sample_id}`;
    if (seen.has(key))
      throw new TypeError("duplicate_fiducial_device_sample_observation");
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
