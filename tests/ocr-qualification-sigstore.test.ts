import { describe, expect, it, vi } from "vitest";
import {
  canonicalAttestationBytes,
  loadVerifierPolicy,
  verifySigstoreAttestation,
} from "../scripts/ocr-qualification-sigstore.mjs";

const POLICY = loadVerifierPolicy();
const ATTESTATION = {
  schema_version: 1,
  qualification_id: "ZZ-OCR-QUAL-001",
  candidate_id: "candidate-test",
};

const VERSION_OUTPUT = "GitVersion: v3.1.3\nGitCommit: test\n";

function successfulRun(verifyResult = { status: 0 }) {
  return vi.fn(async (_executable, args) =>
    args[0] === "version"
      ? { status: 0, stdout: VERSION_OUTPUT }
      : verifyResult,
  );
}

function bundle(overrides: Record<string, unknown> = {}) {
  return Buffer.from(
    JSON.stringify({
      mediaType: POLICY.bundle_media_type,
      verificationMaterial: {
        tlogEntries: [
          {
            integratedTime: "1791396000",
            inclusionPromise: { signedEntryTimestamp: "verified-by-cosign" },
            inclusionProof: { checkpoint: "verified-by-cosign" },
          },
        ],
      },
      ...overrides,
    }),
  );
}

describe("OCR qualification Sigstore verification", () => {
  it("verifies JCS attestation bytes with the exact protected identity", async () => {
    const observed = vi.fn(async (_executable, args, payload, environment) => {
      if (args[0] === "version") {
        return { status: 0, stdout: VERSION_OUTPUT };
      }
      expect(args).toContain(POLICY.certificate_identity);
      expect(args).toContain(POLICY.oidc_issuer);
      expect(args.at(-1)).toBe("-");
      expect(payload).toEqual(canonicalAttestationBytes(ATTESTATION));
      expect(Object.keys(environment).sort()).toEqual([
        "HOME",
        "PATH",
        "TMPDIR",
      ]);
      expect(environment.HOME).not.toBe("/untrusted/root.pem");
      return { status: 0 };
    });

    const result = await verifySigstoreAttestation({
      attestation: ATTESTATION,
      bundleBytes: bundle(),
      policy: POLICY,
      environment: {
        PATH: "/usr/bin",
        SIGSTORE_ROOT_FILE: "/untrusted/root.pem",
        SIGSTORE_REKOR_PUBLIC_KEY: "/untrusted/rekor.pub",
        SIGSTORE_CT_LOG_PUBLIC_KEY_FILE: "/untrusted/ct.pub",
      },
      run: observed,
    });

    expect(result).toEqual({
      verified: true,
      integrated_time_utc: "2026-10-07T18:00:00.000Z",
      attestation_sha256: expect.any(String),
    });
    expect(observed).toHaveBeenCalledTimes(2);
  });

  it("fails closed when Cosign rejects the signature", async () => {
    const result = await verifySigstoreAttestation({
      attestation: ATTESTATION,
      bundleBytes: bundle(),
      policy: POLICY,
      run: successfulRun({ status: 1 }),
    });

    expect(result).toEqual({
      verified: false,
      reason: "sigstore_signature_verification_failed",
    });
  });

  it("rejects policy drift before invoking Cosign", async () => {
    const run = vi.fn();
    const result = await verifySigstoreAttestation({
      attestation: ATTESTATION,
      bundleBytes: bundle(),
      policy: { ...POLICY, certificate_identity: "https://attacker.invalid" },
      run,
    });

    expect(result.reason).toBe("protected_verifier_policy_invalid");
    expect(run).not.toHaveBeenCalled();
  });

  it.each([
    [
      "legacy bundle",
      bundle({ mediaType: "legacy" }),
      "sigstore_bundle_media_type_mismatch",
    ],
    [
      "multiple transparency entries",
      bundle({
        verificationMaterial: {
          tlogEntries: [
            { integratedTime: "1791396000" },
            { integratedTime: "1791396001" },
          ],
        },
      }),
      "sigstore_tlog_entry_count_invalid",
    ],
    [
      "missing inclusion proof",
      bundle({
        verificationMaterial: {
          tlogEntries: [{ integratedTime: "1791396000" }],
        },
      }),
      "sigstore_tlog_timestamp_or_proof_missing",
    ],
  ])(
    "rejects %s after cryptographic verification",
    async (_name, bytes, reason) => {
      const run = successfulRun();
      const result = await verifySigstoreAttestation({
        attestation: ATTESTATION,
        bundleBytes: bytes as Buffer,
        policy: POLICY,
        run,
      });

      expect(run).toHaveBeenCalledTimes(2);
      expect(result).toEqual({ verified: false, reason });
    },
  );

  it("rejects a Cosign version that does not match the policy", async () => {
    const run = vi.fn(async () => ({
      status: 0,
      stdout: "GitVersion: v3.0.0\n",
    }));
    const result = await verifySigstoreAttestation({
      attestation: ATTESTATION,
      bundleBytes: bundle(),
      policy: POLICY,
      run,
    });

    expect(result).toEqual({
      verified: false,
      reason: "cosign_version_mismatch",
    });
    expect(run).toHaveBeenCalledOnce();
  });
});
