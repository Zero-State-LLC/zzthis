const isRecord = (value) =>
  value !== null && typeof value === "object" && !Array.isArray(value);

export function hasValidFrozenInputs(gateConfig, deviceMatrix) {
  return (
    Array.isArray(deviceMatrix.entries) &&
    deviceMatrix.entries.length > 0 &&
    deviceMatrix.entries.every(
      (entry) =>
        isRecord(entry) &&
        typeof entry.device_matrix_entry_id === "string" &&
        typeof entry.os_version === "string" &&
        typeof entry.device_class === "string" &&
        Number.isInteger(entry.minimum_sample_count) &&
        entry.minimum_sample_count >= 0,
    ) &&
    Array.isArray(gateConfig.required_gate_ids) &&
    gateConfig.required_gate_ids.every((id) => typeof id === "string") &&
    Array.isArray(gateConfig.required_buckets) &&
    gateConfig.required_buckets.every(
      (bucket) =>
        isRecord(bucket) &&
        typeof bucket.bucket_id === "string" &&
        Number.isInteger(bucket.minimum_sample_count) &&
        bucket.minimum_sample_count >= 0,
    ) &&
    isRecord(gateConfig.thresholds)
  );
}

export function validateFrozenReleaseConfig(receipt, gateConfig, errors) {
  if (
    JSON.stringify(receipt.release_gates?.required_gate_ids) !==
    JSON.stringify(gateConfig.required_gate_ids)
  ) {
    errors.push("receipt gate IDs do not match frozen gate config");
  }
  if (
    !isRecord(receipt.release_gates?.thresholds) ||
    Object.entries(gateConfig.thresholds).some(
      ([key, value]) => receipt.release_gates.thresholds[key] !== value,
    )
  ) {
    errors.push("receipt thresholds do not match frozen gate config");
  }
}
