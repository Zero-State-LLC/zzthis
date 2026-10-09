import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  createExecutionAttestation,
  createPreRunAttestation,
  jcsAttestationBytes,
} from "../scripts/ocr-qualification-attestation.mjs";

function sha256(value: Uint8Array | string) {
  return createHash("sha256").update(value).digest("hex");
}

function makeInputs() {
  const manifestBytes = Buffer.from('{"qualification_id":"ZZ-OCR-QUAL-001"}');
  const gateConfigBytes = Buffer.from('{"gate":"frozen"}');
  const manifest = { qualification_id: "ZZ-OCR-QUAL-001" };
  const deviceMatrix = {
    qualification_id: "ZZ-OCR-QUAL-001",
    candidate_id: "candidate-7",
    entries: [],
  };
  const candidateBundle = {
    qualification_id: "ZZ-OCR-QUAL-001",
    candidate_id: "candidate-7",
    device_matrix_sha256: sha256(jcsAttestationBytes(deviceMatrix)),
  };
  const gateConfig = {
    qualification_id: "ZZ-OCR-QUAL-001",
    manifest_sha256: sha256(manifestBytes),
  };
  const preRunAttestation = createPreRunAttestation({
    manifest,
    manifestBytes,
    gateConfig,
    gateConfigBytes,
    candidateBundle,
    deviceMatrix,
  });
  return {
    manifestBytes,
    gateConfigBytes,
    deviceMatrix,
    candidateBundle,
    preRunAttestation,
    adapterResultsBytes: Buffer.from('{"results":[]}'),
  };
}

describe("trusted OCR qualification attestations", () => {
  it("freezes exact manifest/config bytes and JCS candidate and matrix identities", () => {
    const inputs = makeInputs();
    const attestation = inputs.preRunAttestation;

    expect(attestation).toMatchObject({
      schema_version: 1,
      qualification_id: "ZZ-OCR-QUAL-001",
      candidate_id: "candidate-7",
      manifest_sha256: sha256(inputs.manifestBytes),
      gate_config_sha256: sha256(inputs.gateConfigBytes),
      candidate_bundle_sha256: sha256(
        jcsAttestationBytes(inputs.candidateBundle),
      ),
    });
    expect(jcsAttestationBytes(attestation).toString("utf8")).not.toContain(
      " ",
    );
  });

  it("binds all frozen documents, adapter evidence, and runner-captured times", () => {
    const inputs = makeInputs();
    const attestation = createExecutionAttestation({
      ...inputs,
      runId: "7712.2",
      startedAtUtc: "2026-10-08T10:00:00.000Z",
      finishedAtUtc: "2026-10-08T10:00:03.125Z",
    });

    expect(attestation).toMatchObject({
      candidate_id: "candidate-7",
      run_id: "7712.2",
      pre_run_attestation_sha256: sha256(
        jcsAttestationBytes(inputs.preRunAttestation),
      ),
      manifest_sha256: sha256(inputs.manifestBytes),
      gate_config_sha256: sha256(inputs.gateConfigBytes),
      device_matrix_sha256: sha256(jcsAttestationBytes(inputs.deviceMatrix)),
      adapter_results_sha256: sha256(inputs.adapterResultsBytes),
      started_at_utc: "2026-10-08T10:00:00.000Z",
      finished_at_utc: "2026-10-08T10:00:03.125Z",
    });
  });

  it.each([
    ["run id", { runId: "caller-run-id" }],
    ["caller timestamp", { startedAtUtc: "yesterday" }],
    ["reversed time", { finishedAtUtc: "2026-10-08T09:59:59.000Z" }],
  ])("rejects an invalid %s", (_name, override) => {
    const inputs = makeInputs();
    expect(() =>
      createExecutionAttestation({
        ...inputs,
        runId: "7712.2",
        startedAtUtc: "2026-10-08T10:00:00.000Z",
        finishedAtUtc: "2026-10-08T10:00:03.125Z",
        ...override,
      }),
    ).toThrow();
  });

  it("rejects mutation of frozen manifest or candidate identity", () => {
    const inputs = makeInputs();
    expect(() =>
      createExecutionAttestation({
        ...inputs,
        manifestBytes: Buffer.from("different manifest"),
        runId: "7712.2",
        startedAtUtc: "2026-10-08T10:00:00.000Z",
        finishedAtUtc: "2026-10-08T10:00:03.125Z",
      }),
    ).toThrow("execution_attestation_frozen_input_mismatch");
  });
});
