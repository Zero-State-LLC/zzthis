import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DECODER_FILES = {
  wordlist_sha256: "packages/zz-core/src/generated/wordlists.ts",
  checkword_sha256: "packages/zz-core/src/checkword.ts",
  vectors_sha256: "specs/003-wordlist-checkword/vectors.json",
  band_mapping_sha256:
    "specs/004-capture/qualification/decision-band-mapping.json",
};

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

export function readDecoderIdentity() {
  let commit;
  let clean;
  try {
    commit = execFileSync("git", ["rev-parse", "HEAD"], {
      cwd: ROOT,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
    clean =
      execFileSync("git", ["status", "--porcelain", "--untracked-files=all"], {
        cwd: ROOT,
        encoding: "utf8",
        stdio: ["ignore", "pipe", "ignore"],
      }).trim().length === 0;
  } catch {
    return { available: false, reason: "decoder_git_identity_unavailable" };
  }

  const hashes = {};
  try {
    for (const [field, relativePath] of Object.entries(DECODER_FILES)) {
      hashes[field] = sha256(readFileSync(path.join(ROOT, relativePath)));
    }
  } catch {
    return { available: false, reason: "decoder_component_unreadable" };
  }
  return { available: true, commit, clean, ...hashes };
}

export function verifyDecoderIdentity(candidateDecoder, runtimeIdentity) {
  if (!runtimeIdentity?.available) {
    return {
      verified: false,
      reasons: [runtimeIdentity?.reason ?? "decoder_identity_unavailable"],
    };
  }
  const reasons = [];
  if (!runtimeIdentity.clean) reasons.push("decoder_checkout_dirty");
  if (candidateDecoder?.commit !== runtimeIdentity.commit) {
    reasons.push("decoder_commit_mismatch");
  }
  for (const field of Object.keys(DECODER_FILES)) {
    if (candidateDecoder?.[field] !== runtimeIdentity[field]) {
      reasons.push(`decoder_hash_mismatch:${field}`);
    }
  }
  return { verified: reasons.length === 0, reasons };
}
