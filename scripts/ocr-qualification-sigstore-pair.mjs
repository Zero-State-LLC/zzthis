import {
  loadVerifierPolicy,
  verifySigstoreAttestation,
} from "./ocr-qualification-sigstore.mjs";

async function verifyOne({ attestation, bundleBytes, policy, verifier }) {
  if (!attestation) {
    return { verified: false, reason: "sigstore_attestation_missing" };
  }
  if (!(bundleBytes instanceof Uint8Array)) {
    return { verified: false, reason: "sigstore_bundle_bytes_missing" };
  }
  try {
    return await verifier({ attestation, bundleBytes, policy });
  } catch {
    return { verified: false, reason: "sigstore_verification_unavailable" };
  }
}

export async function verifyQualificationBundles(
  { preRunAttestation, executionAttestation, preRunBundle, executionBundle },
  {
    policyLoader = loadVerifierPolicy,
    verifier = verifySigstoreAttestation,
  } = {},
) {
  let policy;
  try {
    policy = policyLoader();
  } catch {
    return {
      policyPresent: false,
      policyError: "protected_verifier_policy_unreadable",
      preRun: {
        verified: false,
        reason: "protected_verifier_policy_unreadable",
      },
      execution: {
        verified: false,
        reason: "protected_verifier_policy_unreadable",
      },
    };
  }

  const [preRun, execution] = await Promise.all([
    verifyOne({
      attestation: preRunAttestation,
      bundleBytes: preRunBundle,
      policy,
      verifier,
    }),
    verifyOne({
      attestation: executionAttestation,
      bundleBytes: executionBundle,
      policy,
      verifier,
    }),
  ]);

  return { policyPresent: true, preRun, execution };
}
