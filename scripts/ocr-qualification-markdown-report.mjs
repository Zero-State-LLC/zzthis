import { createHash } from "node:crypto";

const GATE_LABELS = {
  "false-accept-count": "False Accept count",
  "false-valid-decode-rate": "False-valid decode rate",
  "endpoint-recall": "Endpoint recall",
  "pair-accuracy": "Pair accuracy",
  "exact-code-accuracy": "Exact-code accuracy",
  "character-error-rate": "Character error rate",
  "rectification-success-rate": "Rectification success rate",
  "p95-latency-ms": "p95 latency (ms)",
};

function display(value) {
  if (value === null || value === undefined) return "not measured";
  if (typeof value === "number") return Number(value.toPrecision(6)).toString();
  return String(value);
}

function metricRow(label, metric) {
  return `| ${label} | ${display(metric?.numerator)} / ${display(metric?.denominator)} | ${display(metric?.rate)} |`;
}

function metricTable(metrics) {
  const rows = [
    "| Metric | Numerator / denominator | Value |",
    "| --- | ---: | ---: |",
    metricRow("Endpoint recall", metrics.endpoint_recall),
    metricRow("Pair accuracy", metrics.pair_accuracy),
    metricRow("Exact-code accuracy", metrics.exact_code_accuracy),
    metricRow("False-valid decode rate", metrics.false_valid_decode_rate),
    metricRow("False Accept rate", metrics.false_accept_rate),
    metricRow("Rectification success", metrics.rectification_success_rate),
    `| Character error rate | — | ${display(metrics.character_error_rate)} |`,
    `| Latency p50 / p95 (ms) | — | ${display(metrics.latency_ms?.p50)} / ${display(metrics.latency_ms?.p95)} |`,
    `| Crash / exception count | — | ${display(metrics.crash_count)} / ${display(metrics.exception_count)} |`,
    `| Package-size delta (bytes) | — | ${display(metrics.package_size_delta_bytes)} |`,
  ];
  return rows.join("\n");
}

/** Render a privacy-minimized diagnostic summary; never emits per-sample OCR evidence. */
export function renderQualificationMarkdownReport(inspection) {
  const lines = [
    "# ZZ-OCR-QUAL-001 diagnostic report",
    "",
    "> Diagnostic only. This report is not a normative qualification receipt and cannot authorize camera Accept or engine promotion.",
    "",
    `- Candidate: ${display(inspection?.candidate_id)}`,
    `- Status: ${display(inspection?.status)}`,
    `- Disposition: ${display(inspection?.disposition)}`,
    `- Promotion eligible: ${inspection?.promotion_eligible === true ? "yes" : "no"}`,
    `- Decoder replay: ${display(inspection?.checks?.decoder_replay)}`,
    `- Signature verification: ${display(inspection?.checks?.sigstore_verification)}`,
    "",
  ];

  const scoring = inspection?.qualification_scoring;
  lines.push(
    ...(scoring?.metric_sets
      ? scoringReportLines(scoring, inspection)
      : incompleteReportLines(inspection)),
  );
  return `${lines.join("\n")}\n`;
}

function incompleteReportLines(inspection) {
  const reasons = Array.isArray(inspection?.reason_codes)
    ? inspection.reason_codes
    : [];
  return [
    "Scoring was not performed because required validation evidence was unavailable.",
    "",
    "## Incomplete evidence",
    "",
    ...reasons.map((reason) => `- ${reason}`),
    "",
  ];
}

function scoringReportLines(scoring, inspection) {
  return [
    ...aggregateSplitLines(scoring.metric_sets),
    ...releaseGateLines(scoring.gate_evaluation),
    ...finalBucketLines(scoring.metric_sets.bucket_metrics),
    ...runtimePrivacyLines(inspection),
  ];
}

function aggregateSplitLines(metricSets) {
  const lines = ["## Aggregate metrics by split", ""];
  for (const split of ["tuning", "final"]) {
    lines.push(
      ...splitMetricLines(split, metricSets.metrics_by_split?.[split]),
    );
  }
  return lines;
}

function splitMetricLines(split, metrics) {
  if (!metrics) return [`### ${split}`, "", "No observations.", ""];
  const lines = [
    `### ${split}`,
    "",
    `Samples: ${display(metrics.sample_count)}`,
    "",
    metricTable(metrics),
    "",
  ];
  if (metrics.not_measured_reasons?.length) {
    lines.push(
      "Not measured:",
      ...metrics.not_measured_reasons.map((reason) => `- ${reason}`),
      "",
    );
  }
  return lines;
}

function releaseGateLines(gateEvaluation) {
  const gates = gateEvaluation?.gate_results ?? [];
  return [
    "## Final-split release gates",
    "",
    "| Gate | Observed | Comparator | Threshold | Result |",
    "| --- | ---: | :---: | ---: | :---: |",
    ...gates.map(
      (gate) =>
        `| ${GATE_LABELS[gate.gate_id] ?? "Unknown gate"} | ${display(gate.observed)} | ${display(gate.operator)} | ${display(gate.threshold)} | ${display(gate.result)} |`,
    ),
    "",
  ];
}

function finalBucketLines(bucketMetrics = []) {
  const finalBuckets = bucketMetrics
    .filter((row) => row.split === "final")
    .sort((left, right) => left.bucket_id.localeCompare(right.bucket_id));
  return [
    "## Final stress-bucket coverage",
    "",
    "| Bucket | Samples |",
    "| --- | ---: |",
    ...finalBuckets.map(
      (row) => `| ${row.bucket_id} | ${display(row.metrics.sample_count)} |`,
    ),
    "",
  ];
}

function runtimePrivacyLines(inspection) {
  return [
    "## Runtime and privacy notes",
    "",
    "- Only aggregate scoring data is included; sample identifiers, decoded codes, and OCR text are omitted.",
    "- Runtime failures are counted separately and are not assigned a decision band.",
    "- Missing measurements remain explicit; they are not inferred from unrelated data.",
    `- Diagnostic reason codes: ${display(inspection.reason_codes?.length ?? 0)}`,
    "",
  ];
}

export function sha256MarkdownReport(markdown) {
  return createHash("sha256").update(markdown, "utf8").digest("hex");
}
