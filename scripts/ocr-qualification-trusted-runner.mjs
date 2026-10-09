import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  createExecutionAttestation,
  createPreRunAttestation,
  jcsAttestationBytes,
} from "./ocr-qualification-attestation.mjs";
import { inspectQualification } from "./ocr-qualification-preflight.mjs";
import {
  createPrivateRunDirectory,
  parsePrivateJson,
  readPrivateFile,
  resolvePrivateCandidateDirectory,
  writePrivateFile,
} from "./ocr-qualification-private-files.mjs";
import {
  loadVerifierPolicy,
  verifySigstoreAttestation,
} from "./ocr-qualification-sigstore.mjs";
import { assertTrustedQualificationInvocation } from "./ocr-qualification-trusted-context.mjs";

const INPUT_FILES = {
  manifest: "manifest.json",
  deviceMatrix: "device-matrix.json",
  candidateBundle: "candidate-bundle.json",
  gateConfig: "gate-config.json",
  adapterResults: "adapter-results.json",
  preRunAttestation: "pre-run-attestation.json",
  preRunBundle: "pre-run-bundle.sigstore.json",
};

async function readDocuments(
  candidateDirectory,
  { includePreRunEvidence = false, includeAdapterResults = false } = {},
) {
  const bytes = {};
  const documents = {};
  const names = ["manifest", "deviceMatrix", "candidateBundle", "gateConfig"];
  if (includeAdapterResults) names.push("adapterResults");
  for (const name of names) {
    if (name === "preRunAttestation" || name === "preRunBundle") continue;
    bytes[name] = await readPrivateFile(candidateDirectory, INPUT_FILES[name]);
    documents[name] = await parsePrivateJson(bytes[name], name);
  }
  if (includePreRunEvidence) {
    bytes.preRunAttestation = await readPrivateFile(
      candidateDirectory,
      INPUT_FILES.preRunAttestation,
    );
    bytes.preRunBundle = await readPrivateFile(
      candidateDirectory,
      INPUT_FILES.preRunBundle,
    );
    documents.preRunAttestation = await parsePrivateJson(
      bytes.preRunAttestation,
      "preRunAttestation",
    );
  }
  return { bytes, documents };
}

function assertCandidateMatchesPath(documents, candidateId) {
  if (documents.candidateBundle?.candidate_id !== candidateId) {
    throw new Error("candidate_id_path_mismatch");
  }
}

function verifyPreRunBindings({ documents, bytes }) {
  const expected = createPreRunAttestation({
    manifest: documents.manifest,
    manifestBytes: bytes.manifest,
    gateConfig: documents.gateConfig,
    gateConfigBytes: bytes.gateConfig,
    candidateBundle: documents.candidateBundle,
    deviceMatrix: documents.deviceMatrix,
  });
  if (
    !bytes.preRunAttestation ||
    !bytes.preRunBundle ||
    !documents.preRunAttestation ||
    !jcsAttestationBytes(documents.preRunAttestation).equals(
      jcsAttestationBytes(expected),
    )
  ) {
    throw new Error("pre_run_attestation_frozen_input_mismatch");
  }
}

async function verifyPreRun({ documents, bytes, verify }) {
  verifyPreRunBindings({ documents, bytes });
  const verification = await verify({
    attestation: documents.preRunAttestation,
    bundleBytes: bytes.preRunBundle,
    policy: loadVerifierPolicy(),
  });
  if (
    verification?.verified !== true ||
    !Number.isFinite(Date.parse(verification.integrated_time_utc ?? ""))
  ) {
    throw new Error("pre_run_attestation_verification_failed");
  }
  return verification;
}

function makeProvisionalExecutionAttestation({ documents, bytes, runId, now }) {
  return createExecutionAttestation({
    candidateBundle: documents.candidateBundle,
    preRunAttestation: documents.preRunAttestation,
    manifestBytes: bytes.manifest,
    gateConfigBytes: bytes.gateConfig,
    deviceMatrix: documents.deviceMatrix,
    adapterResultsBytes: bytes.adapterResults,
    runId,
    startedAtUtc: now,
    finishedAtUtc: now,
  });
}

export async function runTrustedQualificationStage({
  stage,
  candidateId,
  environment = process.env,
  now = () => new Date(),
  verify = verifySigstoreAttestation,
  inspect = inspectQualification,
}) {
  const context = assertTrustedQualificationInvocation(environment, {
    stage,
    candidateId,
  });
  const candidateDirectory = await resolvePrivateCandidateDirectory(
    context.privateRoot,
    candidateId,
  );
  const { bytes, documents } = await readDocuments(candidateDirectory, {
    includePreRunEvidence: stage !== "freeze",
    includeAdapterResults: stage === "evaluate",
  });
  assertCandidateMatchesPath(documents, candidateId);

  if (stage === "freeze") {
    const attestation = createPreRunAttestation({
      manifest: documents.manifest,
      manifestBytes: bytes.manifest,
      gateConfig: documents.gateConfig,
      gateConfigBytes: bytes.gateConfig,
      candidateBundle: documents.candidateBundle,
      deviceMatrix: documents.deviceMatrix,
    });
    const destination = path.join(
      candidateDirectory,
      INPUT_FILES.preRunAttestation,
    );
    await writePrivateFile(destination, jcsAttestationBytes(attestation), {
      exclusive: true,
    });
    return { status: "PRE_RUN_ATTESTATION_PREPARED" };
  }

  const preRunVerification = await verifyPreRun({
    documents,
    bytes,
    verify,
  });
  if (stage === "verify-freeze") {
    return { status: "PRE_RUN_ATTESTATION_VERIFIED" };
  }

  const startedAtUtc = now().toISOString();
  if (
    Date.parse(startedAtUtc) <=
    Date.parse(preRunVerification.integrated_time_utc)
  ) {
    throw new Error("runner_clock_precedes_prerun_publication");
  }
  const runId = context.runId;
  const provisional = makeProvisionalExecutionAttestation({
    documents,
    bytes,
    runId,
    now: startedAtUtc,
  });
  const rawInputBytes = {
    manifest: bytes.manifest,
    deviceMatrix: bytes.deviceMatrix,
    candidateBundle: Buffer.from(
      jcsAttestationBytes(documents.candidateBundle),
    ),
    gateConfig: bytes.gateConfig,
    adapterResults: bytes.adapterResults,
    preRunAttestation: bytes.preRunAttestation,
    preRunBundle: bytes.preRunBundle,
  };
  const provisionalReport = inspect(
    {
      ...documents,
      executionAttestation: provisional,
    },
    {
      policyPresent: true,
      sigstoreVerifications: {
        preRun: preRunVerification,
        execution: {
          verified: false,
          reason: "execution_signature_not_yet_created",
        },
      },
      rawInputBytes,
    },
  );
  const finishedAtUtc = now().toISOString();
  if (
    Date.parse(finishedAtUtc) < Date.parse(startedAtUtc) ||
    provisionalReport?.checks?.structural_validation !== "PASS" ||
    provisionalReport?.checks?.decoder_identity !== "VERIFIED" ||
    provisionalReport?.qualification_scoring?.status !== "DIAGNOSTIC_ONLY"
  ) {
    throw new Error("trusted_final_evaluation_incomplete");
  }

  const executionAttestation = createExecutionAttestation({
    candidateBundle: documents.candidateBundle,
    preRunAttestation: documents.preRunAttestation,
    manifestBytes: bytes.manifest,
    gateConfigBytes: bytes.gateConfig,
    deviceMatrix: documents.deviceMatrix,
    adapterResultsBytes: bytes.adapterResults,
    runId,
    startedAtUtc,
    finishedAtUtc,
  });
  const runDirectory = await createPrivateRunDirectory(
    context.privateRoot,
    runId,
  );
  await writePrivateFile(
    path.join(runDirectory, "execution-attestation.json"),
    jcsAttestationBytes(executionAttestation),
    { exclusive: true },
  );
  return {
    status: "EXECUTION_ATTESTATION_PREPARED",
    runId,
  };
}

async function main() {
  const [stage, candidateId] = process.argv.slice(2);
  try {
    const result = await runTrustedQualificationStage({ stage, candidateId });
    process.stdout.write(`${result.status}\n`);
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  }
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  await main();
}
