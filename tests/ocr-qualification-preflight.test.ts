import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  canonicalSha256,
  exactSha256,
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
  rawInputBytes: Record<string, Buffer>;
}

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const FIXTURES = path.join(ROOT, "specs/004-capture/qualification");

function jsonBytes(value: unknown): Buffer {
  return Buffer.from(`${JSON.stringify(value)}\n`);
}

function inspect(inputs: SyntheticInputs) {
  return inspectQualification(inputs, { rawInputBytes: inputs.rawInputBytes });
}

function rebindManifest(inputs: SyntheticInputs): void {
  const manifestHash = exactSha256(jsonBytes(inputs.manifest));
  inputs.rawInputBytes.manifest = jsonBytes(inputs.manifest);
  inputs.gateConfig.manifest_sha256 = manifestHash;
  inputs.adapterResults.manifest_sha256 = manifestHash;
  inputs.preRunAttestation.manifest_sha256 = manifestHash;
  inputs.executionAttestation.manifest_sha256 = manifestHash;

  inputs.rawInputBytes.gateConfig = jsonBytes(inputs.gateConfig);
  inputs.rawInputBytes.adapterResults = jsonBytes(inputs.adapterResults);
  inputs.preRunAttestation.gate_config_sha256 = exactSha256(
    inputs.rawInputBytes.gateConfig,
  );
  inputs.executionAttestation.gate_config_sha256 = exactSha256(
    inputs.rawInputBytes.gateConfig,
  );
  inputs.executionAttestation.adapter_results_sha256 = exactSha256(
    inputs.rawInputBytes.adapterResults,
  );
  inputs.executionAttestation.pre_run_attestation_sha256 = canonicalSha256(
    inputs.preRunAttestation,
  );
}

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

  const rawInputBytes: Record<string, Buffer> = {
    manifest: jsonBytes(manifest),
    gateConfig: Buffer.alloc(0),
    adapterResults: Buffer.alloc(0),
  };
  const hashes: Record<string, string> = {
    manifest: exactSha256(rawInputBytes.manifest!),
    deviceMatrix: canonicalSha256(deviceMatrix),
    candidateBundle: canonicalSha256(candidateBundle),
  };
  gateConfig.manifest_sha256 = hashes.manifest;
  adapterResults.manifest_sha256 = hashes.manifest;
  adapterResults.candidate_bundle_sha256 = hashes.candidateBundle;
  rawInputBytes.gateConfig = jsonBytes(gateConfig);
  rawInputBytes.adapterResults = jsonBytes(adapterResults);
  hashes.gateConfig = exactSha256(rawInputBytes.gateConfig);
  hashes.adapterResults = exactSha256(rawInputBytes.adapterResults);
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
    rawInputBytes,
  };
}

describe("OCR qualification preflight", () => {
  it("uses exact-byte hashes for raw inputs and JCS only for pinned objects", () => {
    const compact = Buffer.from('{"sample":1}', "utf8");
    const spaced = Buffer.from('{\n  "sample": 1\n}', "utf8");

    expect(canonicalSha256(JSON.parse(compact.toString("utf8")))).toBe(
      canonicalSha256(JSON.parse(spaced.toString("utf8"))),
    );
    expect(exactSha256(compact)).not.toBe(exactSha256(spaced));
  });

  it("binds manifest, gate config, and adapter results to their raw bytes", async () => {
    const inputs = await completeSyntheticInputs();
    const report = inspect(inputs);

    expect(report.hashes.manifest).toBe(
      exactSha256(inputs.rawInputBytes.manifest!),
    );
    expect(report.hashes.gateConfig).toBe(
      exactSha256(inputs.rawInputBytes.gateConfig!),
    );
    expect(report.hashes.adapterResults).toBe(
      exactSha256(inputs.rawInputBytes.adapterResults!),
    );
    expect(report.hashes.candidateBundle).toBe(
      canonicalSha256(inputs.candidateBundle),
    );
    expect(report.hashes.deviceMatrix).toBe(
      canonicalSha256(inputs.deviceMatrix),
    );
  });

  it("binds fixture hashes using RFC 8785 canonical bytes", async () => {
    const matrix = await fixture("fixture-device-matrix.json");
    const bundle = await fixture("fixture-candidate-bundle.json");
    expect(canonicalSha256(matrix)).toBe(bundle.device_matrix_sha256);
  });

  it("validates structural relationships but never promotes without protected verification", async () => {
    const inputs = await completeSyntheticInputs();
    const report = inspect(inputs);

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
    const report = inspect(inputs);

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

    const report = inspect(inputs);
    expect(report.reason_codes).toContain(
      "valid_ground_truth_decoder_mismatch",
    );
  });

  it("detects corpus samples that leak across tuning and final splits", async () => {
    const inputs = await completeSyntheticInputs();
    const manifest = inputs.manifest;
    manifest.samples[1]!.writer_group = manifest.samples[0]!.writer_group;
    rebindManifest(inputs);

    const report = inspect(inputs);
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
    inputs.rawInputBytes.adapterResults = jsonBytes(inputs.adapterResults);
    inputs.executionAttestation.adapter_results_sha256 = exactSha256(
      inputs.rawInputBytes.adapterResults,
    );

    const report = inspect(inputs);
    expect(report.reason_codes).toContain("duplicate_adapter_result");
    expect(report.reason_codes).toContain("adapter_result_coverage_missing");
    expect(report.promotion_eligible).toBe(false);
  });

  it("rejects adapter metadata that differs from the sealed candidate bundle", async () => {
    const inputs = await completeSyntheticInputs();
    const adapter = inputs.adapterResults.adapter as JsonObject;
    adapter.engine_version = "unsealed-version";

    const report = inspect(inputs);
    expect(report.reason_codes).toContain(
      "adapter_identity_mismatch:engine_version",
    );
    expect(report.promotion_eligible).toBe(false);
  });
});
