import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  canonicalSha256,
  inspectQualification,
  type JsonObject,
} from "../scripts/ocr-qualification-preflight.mjs";

interface SyntheticInputs {
  manifest: JsonObject & { samples: JsonObject[] };
  deviceMatrix: JsonObject;
  candidateBundle: JsonObject;
  gateConfig: JsonObject;
  adapterResults: JsonObject & { results: JsonObject[] };
  preRunAttestation: JsonObject;
  executionAttestation: JsonObject;
}

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const FIXTURES = path.join(ROOT, "specs/004-capture/qualification");

async function fixture<T extends JsonObject = JsonObject>(
  name: string,
): Promise<T> {
  return JSON.parse(await readFile(path.join(FIXTURES, name), "utf8")) as T;
}

async function completeSyntheticInputs(): Promise<SyntheticInputs> {
  const [manifest, deviceMatrix, candidateBundle, gateConfig, adapterResults] =
    await Promise.all([
      fixture<JsonObject & { samples: JsonObject[] }>("fixture-manifest.json"),
      fixture<JsonObject>("fixture-device-matrix.json"),
      fixture<JsonObject>("fixture-candidate-bundle.json"),
      fixture<JsonObject>("fixture-gate-config.json"),
      fixture<JsonObject & { results: JsonObject[] }>(
        "fixture-adapter-results.json",
      ),
    ]);

  (candidateBundle.decoder as JsonObject).wordlist_version = "fixture-7";

  const hashes = {
    manifest: canonicalSha256(manifest),
    deviceMatrix: canonicalSha256(deviceMatrix),
    candidateBundle: canonicalSha256(candidateBundle),
    gateConfig: canonicalSha256(gateConfig),
    adapterResults: canonicalSha256(adapterResults),
  };
  const preRunAttestation = {
    schema_version: 1,
    qualification_id: "ZZ-OCR-QUAL-001",
    candidate_id: "synthetic-fixture-ios-001",
    manifest_sha256: hashes.manifest,
    gate_config_sha256: hashes.gateConfig,
    candidate_bundle_sha256: hashes.candidateBundle,
  };
  const executionAttestation = {
    schema_version: 1,
    qualification_id: "ZZ-OCR-QUAL-001",
    candidate_id: "synthetic-fixture-ios-001",
    candidate_bundle_sha256: hashes.candidateBundle,
    run_id: "synthetic-untrusted-fixture-run",
    pre_run_attestation_sha256: canonicalSha256(preRunAttestation),
    manifest_sha256: hashes.manifest,
    gate_config_sha256: hashes.gateConfig,
    device_matrix_sha256: hashes.deviceMatrix,
    adapter_results_sha256: hashes.adapterResults,
    started_at_utc: "2026-10-07T12:00:00Z",
    finished_at_utc: "2026-10-07T12:01:00Z",
  };
  return {
    manifest,
    deviceMatrix,
    candidateBundle,
    gateConfig,
    adapterResults,
    preRunAttestation,
    executionAttestation,
  };
}

describe("OCR qualification preflight", () => {
  it("binds fixture hashes using RFC 8785 canonical bytes", async () => {
    const matrix = await fixture("fixture-device-matrix.json");
    const bundle = await fixture("fixture-candidate-bundle.json");
    expect(canonicalSha256(matrix)).toBe(bundle.device_matrix_sha256);
  });

  it("validates structural relationships but never promotes without protected verification", async () => {
    const inputs = await completeSyntheticInputs();
    const report = inspectQualification(inputs);

    expect(report.checks.structural_validation).toBe("INCOMPLETE");
    expect(report.status).toBe("INCOMPLETE");
    expect(report.disposition).toBe("NO_PROMOTION");
    expect(report.promotion_eligible).toBe(false);
    expect(report.reason_codes).toContain("protected_verifier_policy_missing");
    expect(report.reason_codes).toContain(
      "sigstore_bundle_verification_not_performed",
    );
    expect(report.reason_codes).toContain("final_bucket_minimum_not_met");
    expect(report.checks.decoder_replay).toBe("EXECUTED_UNPINNED");
    expect(report.reason_codes).toContain("decoder_identity_unverified");
    expect(report.reason_codes).toContain("scoring_and_receipt_not_performed");
    expect(report.decoder_replay_summary).toMatchObject({
      candidate_count: 1,
      parsed_candidate_count: 1,
      checkword_valid_candidate_count: 1,
      valid_truth_count: 1,
    });
  });

  it("replays valid manifest truth through the shared parser and check word", async () => {
    const inputs = await completeSyntheticInputs();
    const report = inspectQualification(inputs);

    expect(report.reason_codes).not.toContain(
      "valid_ground_truth_decoder_mismatch",
    );
    expect(report.reason_codes).not.toContain(
      "valid_ground_truth_checkword_mismatch",
    );
  });

  it("rejects a valid truth entry that disagrees with the shared decoder", async () => {
    const inputs = await completeSyntheticInputs();
    const firstSample = inputs.manifest.samples[0]!;
    const truth = firstSample.ground_truth_codes as JsonObject[];
    truth[0]!.canonical_code = "zz-copper-lantern-zz";

    const report = inspectQualification(inputs);
    expect(report.reason_codes).toContain(
      "valid_ground_truth_decoder_mismatch",
    );
  });

  it("detects corpus samples that leak across tuning and final splits", async () => {
    const inputs = await completeSyntheticInputs();
    const manifest = inputs.manifest;
    manifest.samples[1]!.writer_group = manifest.samples[0]!.writer_group;
    inputs.gateConfig.manifest_sha256 = canonicalSha256(manifest);
    inputs.adapterResults.manifest_sha256 = canonicalSha256(manifest);
    inputs.preRunAttestation.manifest_sha256 = canonicalSha256(manifest);
    inputs.executionAttestation.manifest_sha256 = canonicalSha256(manifest);
    inputs.executionAttestation.pre_run_attestation_sha256 = canonicalSha256(
      inputs.preRunAttestation,
    );

    const report = inspectQualification(inputs);
    expect(report.reason_codes).toContain("writer_split_leakage");
    expect(report.promotion_eligible).toBe(false);
  });

  it("detects missing or duplicate per-device sample results", async () => {
    const inputs = await completeSyntheticInputs();
    const first = inputs.adapterResults.results[0]!;
    inputs.adapterResults.results = [
      first,
      { ...first, elapsed_ms: Number(first.elapsed_ms) + 0.1 },
    ];
    inputs.executionAttestation.adapter_results_sha256 = canonicalSha256(
      inputs.adapterResults,
    );

    const report = inspectQualification(inputs);
    expect(report.reason_codes).toContain("duplicate_adapter_result");
    expect(report.reason_codes).toContain("adapter_result_coverage_missing");
    expect(report.promotion_eligible).toBe(false);
  });

  it("rejects adapter metadata that differs from the sealed candidate bundle", async () => {
    const inputs = await completeSyntheticInputs();
    const adapter = inputs.adapterResults.adapter as JsonObject;
    adapter.engine_version = "unsealed-version";

    const report = inspectQualification(inputs);
    expect(report.reason_codes).toContain(
      "adapter_identity_mismatch:engine_version",
    );
    expect(report.promotion_eligible).toBe(false);
  });
});
