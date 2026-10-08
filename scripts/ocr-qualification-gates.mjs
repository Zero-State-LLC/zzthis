const GATE_DEFINITIONS = [
  ["false-accept-count", "max_false_accept_count", "lte"],
  ["false-valid-decode-rate", "max_false_valid_decode_rate", "lte"],
  ["endpoint-recall", "min_endpoint_recall", "gte"],
  ["pair-accuracy", "min_pair_accuracy", "gte"],
  ["exact-code-accuracy", "min_exact_code_accuracy", "gte"],
  ["character-error-rate", "max_character_error_rate", "lte"],
  ["rectification-success-rate", "min_rectification_success_rate", "gte"],
  ["p95-latency-ms", "max_p95_latency_ms", "lte"],
];

function gateResult(gateId, thresholdKey, operator, observed, threshold) {
  const passed =
    observed !== null &&
    (operator === "lte" ? observed <= threshold : observed >= threshold);
  return {
    gate_id: gateId,
    split: "final",
    observed,
    operator,
    threshold,
    result: observed === null ? "not-applicable" : passed ? "pass" : "fail",
    threshold_key: thresholdKey,
  };
}

function observedP95ByDevice(roiLatency, deviceMatrix) {
  const finalRows = new Map(
    roiLatency.by_device_split
      .filter((row) => row.split === "final")
      .map((row) => [row.device_matrix_entry_id, row.metrics.latency_ms?.p95]),
  );
  const values = deviceMatrix.entries.map((entry) =>
    finalRows.get(entry.device_matrix_entry_id),
  );
  if (
    values.length === 0 ||
    values.some((value) => !Number.isFinite(value) || value < 0)
  ) {
    return null;
  }
  return Math.max(...values);
}

function validateGateInputs({
  aggregates,
  falseAccepts,
  deviceMatrix,
  gateConfig,
}) {
  if (
    !aggregates?.fiducial?.by_split?.final ||
    !aggregates?.text?.by_split?.final ||
    !aggregates?.roi_latency ||
    !Array.isArray(falseAccepts) ||
    !Array.isArray(deviceMatrix?.entries) ||
    !Array.isArray(gateConfig?.required_gate_ids) ||
    !gateConfig?.thresholds
  ) {
    throw new TypeError("qualification_gate_inputs_invalid");
  }
  const required = GATE_DEFINITIONS.map(([gateId]) => gateId);
  const configured = gateConfig.required_gate_ids;
  if (
    required.length !== configured.length ||
    required.some((gateId, index) => configured[index] !== gateId)
  ) {
    throw new TypeError("qualification_required_gate_ids_invalid");
  }
}

function computeGateResults(
  aggregates,
  falseAccepts,
  deviceMatrix,
  thresholds,
) {
  const finalFiducial = aggregates.fiducial.by_split.final;
  const finalText = aggregates.text.by_split.final;
  const finalRoi = aggregates.roi_latency.by_split.final;
  const observations = new Map([
    [
      "false-accept-count",
      falseAccepts.filter((item) => item.split === "final").length,
    ],
    ["false-valid-decode-rate", finalText.false_valid_decode_rate.rate],
    ["endpoint-recall", finalFiducial.endpoint_recall.rate],
    ["pair-accuracy", finalFiducial.pair_accuracy.rate],
    ["exact-code-accuracy", finalText.exact_code_accuracy.rate],
    ["character-error-rate", finalText.character_error_rate.rate],
    ["rectification-success-rate", finalRoi.rectification_success_rate],
    [
      "p95-latency-ms",
      observedP95ByDevice(aggregates.roi_latency, deviceMatrix),
    ],
  ]);
  return GATE_DEFINITIONS.map(([gateId, thresholdKey, operator]) =>
    gateResult(
      gateId,
      thresholdKey,
      operator,
      observations.get(gateId) ?? null,
      thresholds[thresholdKey],
    ),
  );
}

function gateStatus(gateResults) {
  if (gateResults.some((gate) => gate.result === "not-applicable")) {
    return "INCOMPLETE";
  }
  return gateResults.some((gate) => gate.result === "fail") ? "FAIL" : "PASS";
}

/** Evaluate only final-split protocol gates; this result never authorizes promotion. */
export function evaluateQualificationGates({
  aggregates,
  falseAccepts,
  deviceMatrix,
  gateConfig,
}) {
  validateGateInputs({ aggregates, falseAccepts, deviceMatrix, gateConfig });
  const gateResults = computeGateResults(
    aggregates,
    falseAccepts,
    deviceMatrix,
    gateConfig.thresholds,
  );
  return { status: gateStatus(gateResults), gate_results: gateResults };
}
