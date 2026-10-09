import { validateCandidateId } from "./ocr-qualification-private-files.mjs";

const EXPECTED = {
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
};

export function assertTrustedQualificationInvocation(
  environment,
  { stage, candidateId },
) {
  if (!new Set(["freeze", "verify-freeze", "evaluate"]).has(stage)) {
    throw new Error("qualification_stage_invalid");
  }
  validateCandidateId(candidateId);
  for (const [name, expected] of Object.entries(EXPECTED)) {
    if (environment[name] !== expected) {
      throw new Error(`trusted_workflow_context_invalid:${name}`);
    }
  }
  if (
    !/^[1-9]\d*$/.test(environment.GITHUB_RUN_ID ?? "") ||
    !/^[1-9]\d*$/.test(environment.GITHUB_RUN_ATTEMPT ?? "")
  ) {
    throw new Error("trusted_workflow_run_identity_invalid");
  }
  if (typeof environment.ZZ_OCR_QUAL_PRIVATE_ROOT !== "string") {
    throw new Error("private_root_not_configured");
  }
  return {
    runId: `${environment.GITHUB_RUN_ID}.${environment.GITHUB_RUN_ATTEMPT}`,
    privateRoot: environment.ZZ_OCR_QUAL_PRIVATE_ROOT,
  };
}
