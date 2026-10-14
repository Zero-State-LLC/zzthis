import { createHash } from "node:crypto";
import {
  chmod,
  mkdir,
  mkdtemp,
  readFile,
  rm,
  stat,
  writeFile,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  createPreRunAttestation,
  jcsAttestationBytes,
} from "../scripts/ocr-qualification-attestation.mjs";
import { inspectQualification } from "../scripts/ocr-qualification-preflight.mjs";
import { verifySigstoreAttestation } from "../scripts/ocr-qualification-sigstore.mjs";
import { runTrustedQualificationStage } from "../scripts/ocr-qualification-trusted-runner.mjs";

function sha256(value: Uint8Array) {
  return createHash("sha256").update(value).digest("hex");
}

function trustedEnvironment(root: string) {
  return {
    GITHUB_ACTIONS: "true",
    GITHUB_REPOSITORY: "Zero-State-LLC/zzthis",
    GITHUB_EVENT_NAME: "workflow_dispatch",
    GITHUB_REF: "refs/heads/main",
    GITHUB_REF_PROTECTED: "true",
    GITHUB_WORKFLOW_REF:
      "Zero-State-LLC/zzthis/.github/workflows/ocr-qualification.yml@refs/heads/main",
    RUNNER_ENVIRONMENT: "self-hosted",
    RUNNER_OS: "macOS",
    RUNNER_ARCH: "ARM64",
    GITHUB_RUN_ID: "7712",
    GITHUB_RUN_ATTEMPT: "2",
    ZZ_OCR_QUAL_PRIVATE_ROOT: root,
  };
}

async function prepareCandidate(root: string) {
  const candidates = path.join(root, "candidates");
  const candidateDirectory = path.join(candidates, "candidate-7");
  await mkdir(candidates, { mode: 0o700 });
  await mkdir(candidateDirectory, { mode: 0o700 });

  const manifestBytes = Buffer.from(
    JSON.stringify({ qualification_id: "ZZ-OCR-QUAL-001" }),
  );
  const gateConfigBytes = Buffer.from(
    JSON.stringify({
      qualification_id: "ZZ-OCR-QUAL-001",
      manifest_sha256: sha256(manifestBytes),
    }),
  );
  const manifest = JSON.parse(manifestBytes.toString("utf8"));
  const gateConfig = JSON.parse(gateConfigBytes.toString("utf8"));
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
  const adapterResults = {
    qualification_id: "ZZ-OCR-QUAL-001",
    candidate_id: "candidate-7",
    results: [],
  };
  const inputs = {
    "manifest.json": manifestBytes,
    "device-matrix.json": jcsAttestationBytes(deviceMatrix),
    "candidate-bundle.json": jcsAttestationBytes(candidateBundle),
    "gate-config.json": gateConfigBytes,
    "adapter-results.json": Buffer.from(JSON.stringify(adapterResults)),
  };
  for (const [name, bytes] of Object.entries(inputs)) {
    await writeFile(path.join(candidateDirectory, name), bytes, {
      mode: 0o600,
    });
  }
  const preRunAttestation = createPreRunAttestation({
    manifest,
    manifestBytes,
    gateConfig,
    gateConfigBytes,
    candidateBundle,
    deviceMatrix,
  });
  await writeFile(
    path.join(candidateDirectory, "pre-run-attestation.json"),
    jcsAttestationBytes(preRunAttestation),
    { mode: 0o600 },
  );
  await writeFile(
    path.join(candidateDirectory, "pre-run-bundle.sigstore.json"),
    "test-only bundle bytes",
    { mode: 0o600 },
  );
  return { candidateDirectory, preRunAttestation };
}

describe("trusted local OCR qualification runner", () => {
  it("verifies the pre-run freeze before timing the evaluation and signing its evidence hash", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "zz-ocr-runner-"));
    const order: string[] = [];
    try {
      await chmod(root, 0o700);
      await prepareCandidate(root);
      const times = [
        new Date("2026-10-08T10:00:01.000Z"),
        new Date("2026-10-08T10:00:04.125Z"),
      ];
      let timeIndex = 0;
      const result = await runTrustedQualificationStage({
        stage: "evaluate",
        candidateId: "candidate-7",
        environment: trustedEnvironment(root),
        now: () => times[timeIndex++]!,
        verify: (async ({ attestation, bundleBytes }) => {
          order.push("verify-prerun");
          expect((attestation as { candidate_id: string }).candidate_id).toBe(
            "candidate-7",
          );
          expect(bundleBytes.toString()).toBe("test-only bundle bytes");
          return {
            verified: true,
            integrated_time_utc: "2026-10-08T10:00:00.000Z",
          };
        }) as typeof verifySigstoreAttestation,
        inspect: ((documents: object) => {
          order.push("evaluate");
          const input = documents as {
            executionAttestation: { adapter_results_sha256: string };
            adapterResults: unknown;
          };
          expect(input.executionAttestation.adapter_results_sha256).toBe(
            sha256(Buffer.from(JSON.stringify(input.adapterResults))),
          );
          return {
            checks: {
              structural_validation: "PASS",
              decoder_identity: "VERIFIED",
            },
            qualification_scoring: { status: "DIAGNOSTIC_ONLY" },
          } as ReturnType<typeof inspectQualification>;
        }) as typeof inspectQualification,
      });

      expect(order).toEqual(["verify-prerun", "evaluate"]);
      expect(result).toEqual({
        status: "EXECUTION_ATTESTATION_PREPARED",
        runId: "7712.2",
      });
      const attestationPath = path.join(
        root,
        "runs/7712.2/execution-attestation.json",
      );
      const attestation = JSON.parse(await readFile(attestationPath, "utf8"));
      expect(attestation.started_at_utc).toBe("2026-10-08T10:00:01.000Z");
      expect(attestation.finished_at_utc).toBe("2026-10-08T10:00:04.125Z");
      expect((await stat(attestationPath)).mode & 0o777).toBe(0o600);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it("fails closed when frozen inputs are modified after pre-run publication", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "zz-ocr-runner-"));
    try {
      await chmod(root, 0o700);
      const { candidateDirectory } = await prepareCandidate(root);
      await writeFile(path.join(candidateDirectory, "gate-config.json"), "{}", {
        mode: 0o600,
      });
      await expect(
        runTrustedQualificationStage({
          stage: "evaluate",
          candidateId: "candidate-7",
          environment: trustedEnvironment(root),
          verify: (async () => {
            throw new Error("must not verify mismatched inputs");
          }) as typeof verifySigstoreAttestation,
        }),
      ).rejects.toThrow("pre_run_freeze_inputs_mismatch");
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it("does not emit a signed execution payload when evaluation is incomplete", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "zz-ocr-runner-"));
    try {
      await chmod(root, 0o700);
      await prepareCandidate(root);
      await expect(
        runTrustedQualificationStage({
          stage: "evaluate",
          candidateId: "candidate-7",
          environment: trustedEnvironment(root),
          now: () => new Date("2026-10-08T10:00:01.000Z"),
          verify: (async () => ({
            verified: true,
            integrated_time_utc: "2026-10-08T10:00:00.000Z",
          })) as typeof verifySigstoreAttestation,
          inspect: (() => ({
            checks: {
              structural_validation: "INCOMPLETE",
              decoder_identity: "VERIFIED",
            },
            qualification_scoring: null,
          })) as unknown as typeof inspectQualification,
        }),
      ).rejects.toThrow("trusted_final_evaluation_incomplete");
      await expect(stat(path.join(root, "runs/7712.2"))).rejects.toMatchObject({
        code: "ENOENT",
      });
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });
});
