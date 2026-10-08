import {
  chmod,
  mkdtemp,
  readFile,
  rm,
  stat,
  writeFile,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { assembleIncompleteQualificationReceipt } from "../scripts/ocr-qualification-receipt-assembly.mjs";
import {
  assertDistinctOutputPaths,
  publicDiagnosticReport,
  writePrivateFile,
} from "../scripts/ocr-qualification-cli.mjs";

describe("incomplete OCR qualification receipt assembly", () => {
  it("atomically replaces an existing output with restrictive permissions", async () => {
    const directory = await mkdtemp(
      path.join(os.tmpdir(), "zzthis-ocr-private-"),
    );
    const filePath = path.join(directory, "receipt.json");
    try {
      await writeFile(filePath, "old public contents");
      await chmod(filePath, 0o644);

      await writePrivateFile(filePath, "private receipt");

      expect(await readFile(filePath, "utf8")).toBe("private receipt");
      expect((await stat(filePath)).mode & 0o777).toBe(0o600);
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });

  it("rejects output paths that would overwrite one another", () => {
    expect(() =>
      assertDistinctOutputPaths({
        output: "./qualification.json",
        receiptOutput: path.resolve("qualification.json"),
      }),
    ).toThrow("output_paths_must_be_distinct");
  });

  it("keeps per-sample OCR and receipt details out of stdout diagnostics", () => {
    const report = publicDiagnosticReport({
      qualification_scoring: {
        status: "DIAGNOSTIC_ONLY",
        qualification_id: "qualification-1",
        candidate_id: "candidate-1",
        metric_sets: { metrics_by_split: { final: { sample_count: 1 } } },
        gate_evaluation: { status: "INCOMPLETE" },
        scored_observations: [
          { sample_id: "private-sample", text: "secret-code" },
        ],
        false_accepts: [{ observed_codes: ["secret-code"] }],
      },
      qualification_receipt: {
        validation: { status: "INCOMPLETE" },
        receipt: {
          report_sha256: "a".repeat(64),
          false_accepts: [
            { sample_id: "private-sample", observed_codes: ["secret-code"] },
          ],
        },
      },
    });

    const serialized = JSON.stringify(report);
    expect(serialized).not.toContain("private-sample");
    expect(serialized).not.toContain("secret-code");
    expect(report.qualification_receipt).toEqual({
      status: "INCOMPLETE",
      report_sha256: "a".repeat(64),
      detail:
        "Use --receipt-output or --receipt-report for the private artifact.",
    });
  });

  it("binds the scoring output to content hashes without implying approval", () => {
    const hashes = {
      manifest: "a".repeat(64),
      candidateBundle: "b".repeat(64),
      preRunAttestation: "c".repeat(64),
      preRunBundle: "d".repeat(64),
      executionAttestation: "e".repeat(64),
      executionBundle: "f".repeat(64),
      deviceMatrix: "1".repeat(64),
      adapterResults: "2".repeat(64),
      gateConfig: "3".repeat(64),
    };
    const documents = {
      manifest: {
        qualification_id: "ZZ-OCR-QUAL-001",
        samples: [{ split: "tuning" }, { split: "final" }],
      },
      deviceMatrix: {},
      candidateBundle: {
        candidate_id: "candidate-1",
        platform: "ios",
        adapter: { commit: "4".repeat(40), engine_id: "fixture-engine" },
        decoder: { commit: "5".repeat(40), wordlist_sha256: "6".repeat(64) },
      },
      gateConfig: {
        required_gate_ids: ["false-accept-count"],
        required_buckets: [{ bucket_id: "print", minimum_sample_count: 1 }],
        thresholds: { max_false_accept_count: 0 },
      },
      preRunAttestation: {},
      executionAttestation: {
        run_id: "run-1",
        started_at_utc: "2026-10-07T12:00:00Z",
        finished_at_utc: "2026-10-07T12:01:00Z",
      },
    };
    const scoring = {
      metric_sets: {
        metrics_by_split: {
          tuning: { sample_count: 1 },
          final: { sample_count: 1 },
        },
        device_coverage: [],
        bucket_metrics: [
          { split: "final", bucket_id: "print", metrics: { sample_count: 1 } },
        ],
      },
      gate_evaluation: {
        gate_results: [
          {
            gate_id: "false-accept-count",
            split: "final",
            observed: 0,
            operator: "lte",
            threshold: 0,
            result: "pass",
          },
        ],
      },
      false_accepts: [],
      false_valid_cases: [],
    };
    const receipt = assembleIncompleteQualificationReceipt({
      documents,
      hashes,
      scoring,
      sigstoreVerifications: { preRun: { verified: false } },
      rawInputBytes: {
        preRunBundle: Buffer.from("pre-run"),
        executionBundle: Buffer.from("execution"),
      },
    });

    expect(receipt.disposition).toBe("INCOMPLETE");
    expect(receipt.promoted_engine).toBeNull();
    expect(receipt.approver).toBeNull();
    expect(receipt.pull_request).toBeNull();
    expect(receipt.release_gates.frozen_at_utc).toBeNull();
    expect(receipt.pre_run_sigstore_bundle_ref).toBe(
      `urn:sha256:${hashes.preRunBundle}`,
    );
    expect(receipt.execution_sigstore_bundle_ref).toBe(
      `urn:sha256:${hashes.executionBundle}`,
    );
    expect(
      receipt.release_gates.required_buckets[0].observed_sample_count,
    ).toBe(1);
    expect(receipt.reviews.security.status).toBe("blocked");
    expect(receipt.no_promotion_reason).toContain(
      "Protected workflow verification",
    );
  });
});
