import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import canonicalize from "canonicalize";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const POLICY_PATH = path.join(
  ROOT,
  ".github/ocr-qualification-verifier-policy.json",
);

export function loadVerifierPolicy() {
  return JSON.parse(readFileSync(POLICY_PATH, "utf8"));
}

export function canonicalAttestationBytes(attestation) {
  const canonical = canonicalize(attestation);
  if (typeof canonical !== "string") {
    throw new Error("attestation_not_jcs_canonicalizable");
  }
  return Buffer.from(canonical, "utf8");
}

function validatePolicy(policy) {
  return (
    policy?.schema_version === 1 &&
    policy?.cosign_version === "v3.1.3" &&
    policy?.oidc_issuer === "https://token.actions.githubusercontent.com" &&
    policy?.certificate_identity ===
      "https://github.com/Zero-State-LLC/zzthis/.github/workflows/ocr-qualification.yml@refs/heads/main" &&
    policy?.bundle_media_type ===
      "application/vnd.dev.sigstore.bundle.v0.3+json" &&
    policy?.required_tlog_entry_count === 1 &&
    policy?.trust_root === "sigstore-public-good-tuf"
  );
}

function sanitizedEnvironment(environment, tempDirectory) {
  return {
    PATH: environment.PATH ?? "/usr/bin:/bin",
    HOME: path.join(tempDirectory, "home"),
    TMPDIR: tempDirectory,
  };
}

function verifyBundleStructure(bundleBytes, policy) {
  let bundle;
  try {
    bundle = JSON.parse(bundleBytes.toString("utf8"));
  } catch {
    return { valid: false, reason: "sigstore_bundle_invalid_json" };
  }
  if (bundle.mediaType !== policy.bundle_media_type) {
    return { valid: false, reason: "sigstore_bundle_media_type_mismatch" };
  }
  const entries = bundle.verificationMaterial?.tlogEntries;
  if (
    !Array.isArray(entries) ||
    entries.length !== policy.required_tlog_entry_count
  ) {
    return { valid: false, reason: "sigstore_tlog_entry_count_invalid" };
  }
  const entry = entries[0];
  const integratedTime = entry?.integratedTime;
  if (
    typeof integratedTime !== "string" ||
    !/^[0-9]+$/.test(integratedTime) ||
    !entry?.inclusionPromise?.signedEntryTimestamp ||
    !entry?.inclusionProof
  ) {
    return { valid: false, reason: "sigstore_tlog_timestamp_or_proof_missing" };
  }
  const seconds = Number(integratedTime);
  if (!Number.isSafeInteger(seconds) || seconds < 1) {
    return { valid: false, reason: "sigstore_tlog_timestamp_invalid" };
  }
  const date = new Date(seconds * 1000);
  if (!Number.isFinite(date.getTime())) {
    return { valid: false, reason: "sigstore_tlog_timestamp_invalid" };
  }
  return { valid: true, integratedTime: date.toISOString() };
}

function runCosign(executable, args, payloadBytes, environment) {
  return spawnSync(executable, args, {
    input: payloadBytes,
    env: environment,
    encoding: "utf8",
    maxBuffer: 1024 * 1024,
    shell: false,
    stdio: ["pipe", "pipe", "ignore"],
  });
}

export async function verifySigstoreAttestation({
  attestation,
  bundleBytes,
  policy,
  cosignPath = "cosign",
  environment = process.env,
  run = runCosign,
}) {
  if (policy === undefined) {
    try {
      policy = loadVerifierPolicy();
    } catch {
      return {
        verified: false,
        reason: "protected_verifier_policy_unreadable",
      };
    }
  }
  if (!validatePolicy(policy)) {
    return { verified: false, reason: "protected_verifier_policy_invalid" };
  }
  if (!(bundleBytes instanceof Uint8Array)) {
    return { verified: false, reason: "sigstore_bundle_bytes_missing" };
  }

  let payloadBytes;
  try {
    payloadBytes = canonicalAttestationBytes(attestation);
  } catch {
    return { verified: false, reason: "attestation_not_jcs_canonicalizable" };
  }

  let tempDirectory;
  try {
    tempDirectory = await mkdtemp(path.join(tmpdir(), "zz-ocr-sigstore-"));
  } catch {
    return { verified: false, reason: "sigstore_temp_storage_unavailable" };
  }
  const bundlePath = path.join(tempDirectory, "attestation.sigstore.json");
  try {
    await mkdir(path.join(tempDirectory, "home"), { mode: 0o700 });
    await writeFile(bundlePath, bundleBytes, { mode: 0o600, flag: "wx" });
    const environmentForCosign = sanitizedEnvironment(
      environment,
      tempDirectory,
    );
    let versionResult;
    try {
      versionResult = await run(
        cosignPath,
        ["version"],
        Buffer.alloc(0),
        environmentForCosign,
      );
    } catch {
      return { verified: false, reason: "cosign_verifier_unavailable" };
    }
    if (
      versionResult?.status !== 0 ||
      !/(?:^|\n)GitVersion:\s*v3\.1\.3(?:\n|$)/.test(
        String(versionResult.stdout ?? ""),
      )
    ) {
      return { verified: false, reason: "cosign_version_mismatch" };
    }
    const args = [
      "verify-blob",
      "--bundle",
      bundlePath,
      "--certificate-identity",
      policy.certificate_identity,
      "--certificate-oidc-issuer",
      policy.oidc_issuer,
      "-",
    ];
    let result;
    try {
      result = await run(cosignPath, args, payloadBytes, environmentForCosign);
    } catch {
      return { verified: false, reason: "cosign_verifier_unavailable" };
    }
    if (result?.error || result?.status !== 0) {
      return {
        verified: false,
        reason: "sigstore_signature_verification_failed",
      };
    }

    const bundle = verifyBundleStructure(bundleBytes, policy);
    if (!bundle.valid) return { verified: false, reason: bundle.reason };
    return {
      verified: true,
      integrated_time_utc: bundle.integratedTime,
      attestation_sha256: createHash("sha256")
        .update(payloadBytes)
        .digest("hex"),
    };
  } finally {
    await rm(tempDirectory, { recursive: true, force: true });
  }
}
