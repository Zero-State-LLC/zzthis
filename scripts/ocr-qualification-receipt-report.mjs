import { createHash } from "node:crypto";
import { validateQualificationReceipt } from "./ocr-qualification/receipt-semantics.mjs";

function display(value) {
  if (value === null || value === undefined) return "not measured";
  if (typeof value === "number") return Number(value.toPrecision(6)).toString();
  return String(value)
    .replaceAll("\\", "\\\\")
    .replaceAll("|", "\\|")
    .replaceAll("`", "\\`")
    .replace(/[\r\n]/g, " ");
}

function gateTable(receipt) {
  const gates = receipt.release_gates?.gate_results ?? [];
  return [
    "## Final-split release gates",
    "",
    "| Gate | Observed | Comparator | Threshold | Result |",
    "| --- | ---: | :---: | ---: | :---: |",
    ...gates.map(
      (gate) =>
        `| ${display(gate.gate_id)} | ${display(gate.observed)} | ${display(gate.operator)} | ${display(gate.threshold)} | ${display(gate.result)} |`,
    ),
    "",
  ];
}

function splitTable(receipt) {
  return [
    "## Aggregate metrics by split",
    "",
    "| Split | Samples | Endpoint recall | Pair accuracy | Exact-code accuracy | CER | False Accepts | False-valid decodes | p95 ms |",
    "| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |",
    ...["tuning", "final"].map((split) => {
      const metrics = receipt.metrics_by_split?.[split];
      return `| ${split} | ${display(metrics?.sample_count)} | ${display(metrics?.endpoint_recall?.rate)} | ${display(metrics?.pair_accuracy?.rate)} | ${display(metrics?.exact_code_accuracy?.rate)} | ${display(metrics?.character_error_rate)} | ${display(metrics?.false_accept_count)} | ${display(metrics?.false_valid_decode_count)} | ${display(metrics?.latency_ms?.p95)} |`;
    }),
    "",
  ];
}

function bucketTable(receipt) {
  const observed = new Map(
    (receipt.bucket_metrics ?? [])
      .filter((row) => row.split === "final")
      .map((row) => [row.bucket_id, row.metrics?.sample_count]),
  );
  return [
    "## Final stress-bucket coverage",
    "",
    "| Bucket | Minimum | Observed |",
    "| --- | ---: | ---: |",
    ...(receipt.release_gates?.required_buckets ?? []).map(
      (bucket) =>
        `| ${display(bucket.bucket_id)} | ${display(bucket.minimum_sample_count)} | ${display(observed.get(bucket.bucket_id) ?? 0)} |`,
    ),
    "",
  ];
}

function deviceTable(receipt) {
  return [
    "## Device coverage and latency",
    "",
    "| Matrix entry | OS | Class | Minimum | Observed | Final p95 ms |",
    "| --- | --- | --- | ---: | ---: | ---: |",
    ...(receipt.device_coverage ?? []).map(
      (device) =>
        `| ${display(device.device_matrix_entry_id)} | ${display(device.os_version)} | ${display(device.device_class)} | ${display(device.minimum_sample_count)} | ${display(device.observed_sample_count)} | ${display(device.metrics_by_split?.final?.latency_ms?.p95)} |`,
    ),
    "",
  ];
}

function reviewTable(receipt) {
  const reviews = receipt.reviews ?? {};
  return [
    "## Independent reviews",
    "",
    "| Review | Status |",
    "| --- | --- |",
    ...["dependency_license", "privacy", "security", "qualification"].map(
      (name) => `| ${name} | ${display(reviews[name]?.status)} |`,
    ),
    "",
  ];
}

/**
 * Render the privacy-minimized normative report. The report hash is omitted
 * from its own preimage to avoid a self-referential digest. Per-sample IDs,
 * decoded codes, OCR text, image data, and case-level values are never emitted.
 */
export function renderQualificationReceiptReport(receipt) {
  const falseAcceptCount = receipt.metrics_by_split?.final?.false_accept_count;
  const falseValidCount =
    receipt.metrics_by_split?.final?.false_valid_decode_count;
  const lines = [
    "# ZZ-OCR-QUAL-001 qualification report",
    "",
    `- Disposition: ${display(receipt.disposition)}`,
    `- Qualification: ${display(receipt.qualification_id)}`,
    `- Candidate: ${display(receipt.candidate_id)}`,
    `- Run: ${display(receipt.run_id)}`,
    `- Started (UTC): ${display(receipt.started_at_utc)}`,
    `- Finished (UTC): ${display(receipt.finished_at_utc)}`,
    `- Manifest SHA-256: ${display(receipt.manifest_sha256)}`,
    `- Candidate bundle SHA-256: ${display(receipt.candidate_bundle_sha256)}`,
    `- False Accept cases: ${display(falseAcceptCount)}`,
    `- False-valid cases: ${display(falseValidCount)}`,
    `- Promotion authorized: no (the receipt validator is non-authorizing)`,
    "",
    ...splitTable(receipt),
    ...gateTable(receipt),
    ...bucketTable(receipt),
    ...deviceTable(receipt),
    ...reviewTable(receipt),
    "## Privacy and evidence notes",
    "",
    "- This report summarizes the validated receipt; it is not an independent promotion decision.",
    "- Sample identifiers, expected or observed code values, OCR text, and image data are omitted.",
    "- Case-level dispositions and reviewer evidence remain bound by the receipt and are not copied into this summary.",
    "- The `report_sha256` field is omitted from this report's hash preimage.",
    "",
  ];
  return `${lines.join("\n")}\n`;
}

export function sha256QualificationReceiptReport(markdown) {
  return createHash("sha256").update(markdown, "utf8").digest("hex");
}

/** Build, hash, and validate the report/receipt pair; never authorizes promotion. */
export function buildQualificationReceiptArtifact(receiptDraft, frozenInputs) {
  const markdown = renderQualificationReceiptReport(receiptDraft);
  const reportSha256 = sha256QualificationReceiptReport(markdown);
  const receipt = { ...receiptDraft, report_sha256: reportSha256 };
  const validation = validateQualificationReceipt(receipt, frozenInputs);
  if (
    validation.schemaValid !== true ||
    !["SEMANTIC_CHECKS_PASS", "NO_PROMOTION", "FAIL", "INCOMPLETE"].includes(
      validation.status,
    )
  ) {
    throw new TypeError("qualification_receipt_validation_failed");
  }
  if (
    validation.status === "INCOMPLETE" &&
    receipt.disposition !== "INCOMPLETE"
  ) {
    throw new TypeError(
      "qualification_receipt_incomplete_disposition_required",
    );
  }
  if (
    sha256QualificationReceiptReport(
      renderQualificationReceiptReport(receipt),
    ) !== receipt.report_sha256
  ) {
    throw new TypeError("qualification_receipt_report_hash_mismatch");
  }
  return {
    receipt,
    markdown,
    validation: { ...validation, authorizesPromotion: false },
  };
}
