import { describe, expect, it, vi } from "vitest";
import { verifyQualificationBundles } from "../scripts/ocr-qualification-sigstore-pair.mjs";

const policy = { schema_version: 1 };
const preRunAttestation = { attestation: "pre-run" };
const executionAttestation = { attestation: "execution" };
const preRunBundle = Buffer.from("pre-run-bundle-bytes");
const executionBundle = Buffer.from("execution-bundle-bytes");

describe("qualification attestation bundle verification", () => {
  it("verifies each attestation against its own exact bundle bytes", async () => {
    const verifier = vi.fn(async ({ attestation, bundleBytes }) => ({
      verified: true,
      attestation_sha256: `${attestation.attestation}:${bundleBytes.toString()}`,
    }));

    const result = await verifyQualificationBundles(
      {
        preRunAttestation,
        executionAttestation,
        preRunBundle,
        executionBundle,
      },
      { policyLoader: () => policy, verifier },
    );

    expect(verifier).toHaveBeenCalledTimes(2);
    expect(verifier).toHaveBeenNthCalledWith(1, {
      attestation: preRunAttestation,
      bundleBytes: preRunBundle,
      policy,
    });
    expect(verifier).toHaveBeenNthCalledWith(2, {
      attestation: executionAttestation,
      bundleBytes: executionBundle,
      policy,
    });
    expect(result).toEqual({
      policyPresent: true,
      preRun: {
        verified: true,
        attestation_sha256: "pre-run:pre-run-bundle-bytes",
      },
      execution: {
        verified: true,
        attestation_sha256: "execution:execution-bundle-bytes",
      },
    });
  });

  it("fails closed if the policy cannot be loaded", async () => {
    const verifier = vi.fn(async () => ({ verified: true }));
    const result = await verifyQualificationBundles(
      {
        preRunAttestation,
        executionAttestation,
        preRunBundle,
        executionBundle,
      },
      {
        policyLoader: () => {
          throw new Error("policy unreadable");
        },
        verifier,
      },
    );

    expect(result.policyPresent).toBe(false);
    expect(result.policyError).toBe("protected_verifier_policy_unreadable");
    expect(verifier).not.toHaveBeenCalled();
  });

  it("reports missing bundle bytes rather than treating parsed JSON as signed bytes", async () => {
    const verifier = vi.fn(async () => ({ verified: true }));
    const result = await verifyQualificationBundles(
      {
        preRunAttestation,
        executionAttestation,
        preRunBundle: undefined,
        executionBundle,
      },
      { policyLoader: () => policy, verifier },
    );

    expect(result.preRun).toEqual({
      verified: false,
      reason: "sigstore_bundle_bytes_missing",
    });
    expect(result.execution).toEqual({ verified: true });
    expect(verifier).toHaveBeenCalledOnce();
  });

  it("fails closed when the verifier throws", async () => {
    const result = await verifyQualificationBundles(
      {
        preRunAttestation,
        executionAttestation,
        preRunBundle,
        executionBundle,
      },
      {
        policyLoader: () => policy,
        verifier: async () => {
          throw new Error("unexpected failure");
        },
      },
    );

    expect(result.preRun).toEqual({
      verified: false,
      reason: "sigstore_verification_unavailable",
    });
    expect(result.execution).toEqual({
      verified: false,
      reason: "sigstore_verification_unavailable",
    });
  });
});
