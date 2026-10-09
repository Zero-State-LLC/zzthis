import { describe, expect, it } from "vitest";
import { assertTrustedQualificationInvocation } from "../scripts/ocr-qualification-trusted-context.mjs";

const trustedEnvironment = {
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
  ZZ_OCR_QUAL_PRIVATE_ROOT: "/private/qualification",
};

describe("trusted OCR qualification workflow context", () => {
  it("accepts only the protected main workflow on the dedicated local platform", () => {
    expect(
      assertTrustedQualificationInvocation(trustedEnvironment, {
        stage: "evaluate",
        candidateId: "candidate-7",
      }),
    ).toEqual({
      runId: "7712.2",
      privateRoot: "/private/qualification",
    });
  });

  it.each([
    ["event", "GITHUB_EVENT_NAME", "pull_request"],
    ["branch", "GITHUB_REF", "refs/heads/feature"],
    ["protection", "GITHUB_REF_PROTECTED", "false"],
    ["workflow", "GITHUB_WORKFLOW_REF", "another.yml@refs/heads/main"],
    ["runner group", "RUNNER_ENVIRONMENT", "github-hosted"],
    ["OS", "RUNNER_OS", "Linux"],
    ["architecture", "RUNNER_ARCH", "X64"],
  ])("rejects an untrusted %s", (_name, key, value) => {
    expect(() =>
      assertTrustedQualificationInvocation(
        { ...trustedEnvironment, [key]: value },
        { stage: "evaluate", candidateId: "candidate-7" },
      ),
    ).toThrow(`trusted_workflow_context_invalid:${key}`);
  });

  it("rejects arbitrary stages and path-like candidate identifiers", () => {
    expect(() =>
      assertTrustedQualificationInvocation(trustedEnvironment, {
        stage: "sign-anything",
        candidateId: "candidate-7",
      }),
    ).toThrow("qualification_stage_invalid");
    expect(() =>
      assertTrustedQualificationInvocation(trustedEnvironment, {
        stage: "evaluate",
        candidateId: "../other-candidate",
      }),
    ).toThrow("candidate_id_invalid");
  });
});
