import { randomUUID } from "node:crypto";
import { constants } from "node:fs";
import {
  lstat,
  link,
  mkdir,
  open,
  realpath,
  rename,
  unlink,
} from "node:fs/promises";
import path from "node:path";

function assertPrivateMode(mode, name) {
  if ((mode & 0o077) !== 0)
    throw new Error(`private_permissions_invalid:${name}`);
}

export function validateCandidateId(candidateId) {
  if (
    typeof candidateId !== "string" ||
    !/^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/.test(candidateId) ||
    candidateId === "." ||
    candidateId === ".."
  ) {
    throw new Error("candidate_id_invalid");
  }
  return candidateId;
}

export async function resolvePrivateCandidateDirectory(rootPath, candidateId) {
  validateCandidateId(candidateId);
  if (typeof rootPath !== "string" || !path.isAbsolute(rootPath)) {
    throw new Error("private_root_must_be_absolute");
  }
  const suppliedRootStat = await lstat(rootPath);
  if (!suppliedRootStat.isDirectory() || suppliedRootStat.isSymbolicLink()) {
    throw new Error("private_root_invalid");
  }
  assertPrivateMode(suppliedRootStat.mode, "root");
  const root = await realpath(rootPath);
  const rootStat = await lstat(root);
  if (!rootStat.isDirectory() || rootStat.isSymbolicLink()) {
    throw new Error("private_root_invalid");
  }
  assertPrivateMode(rootStat.mode, "root");

  const candidatesDirectory = path.join(root, "candidates");
  const candidatesStat = await lstat(candidatesDirectory);
  if (!candidatesStat.isDirectory() || candidatesStat.isSymbolicLink()) {
    throw new Error("private_candidates_directory_invalid");
  }
  assertPrivateMode(candidatesStat.mode, "candidates");

  const candidateDirectory = path.join(candidatesDirectory, candidateId);
  const candidateStat = await lstat(candidateDirectory);
  if (!candidateStat.isDirectory() || candidateStat.isSymbolicLink()) {
    throw new Error("private_candidate_directory_invalid");
  }
  assertPrivateMode(candidateStat.mode, "candidate");
  const resolvedCandidate = await realpath(candidateDirectory);
  if (
    path.dirname(resolvedCandidate) !== candidatesDirectory ||
    path.basename(resolvedCandidate) !== candidateId
  ) {
    throw new Error("private_candidate_path_escape");
  }
  return resolvedCandidate;
}

export async function readPrivateFile(directory, filename) {
  if (
    path.basename(filename) !== filename ||
    filename.startsWith(".") ||
    filename.includes("/") ||
    filename.includes("\\")
  ) {
    throw new Error("private_filename_invalid");
  }
  const filePath = path.join(directory, filename);
  const flags = constants.O_RDONLY | (constants.O_NOFOLLOW ?? 0);
  const handle = await open(filePath, flags);
  try {
    const stat = await handle.stat();
    if (!stat.isFile()) throw new Error(`private_file_invalid:${filename}`);
    assertPrivateMode(stat.mode, filename);
    if (stat.size > 256 * 1024 * 1024) {
      throw new Error(`private_file_too_large:${filename}`);
    }
    return await handle.readFile();
  } finally {
    await handle.close();
  }
}

export async function parsePrivateJson(bytes, name) {
  try {
    return JSON.parse(bytes.toString("utf8"));
  } catch {
    throw new Error(`private_json_invalid:${name}`);
  }
}

export async function createPrivateRunDirectory(rootPath, runId) {
  if (typeof runId !== "string" || !/^[1-9]\d*\.[1-9]\d*$/.test(runId)) {
    throw new Error("run_id_invalid");
  }
  const root = await realpath(rootPath);
  const runs = path.join(root, "runs");
  try {
    await mkdir(runs, { mode: 0o700 });
  } catch (error) {
    if (error.code !== "EEXIST") throw error;
  }
  const runsStat = await lstat(runs);
  if (!runsStat.isDirectory() || runsStat.isSymbolicLink()) {
    throw new Error("private_runs_directory_invalid");
  }
  assertPrivateMode(runsStat.mode, "runs");
  const runDirectory = path.join(runs, runId);
  await mkdir(runDirectory, { mode: 0o700 });
  const runStat = await lstat(runDirectory);
  if (!runStat.isDirectory() || runStat.isSymbolicLink()) {
    throw new Error("private_run_directory_invalid");
  }
  assertPrivateMode(runStat.mode, "run");
  return runDirectory;
}

export async function writePrivateFile(
  filePath,
  content,
  { exclusive = false } = {},
) {
  const destination = path.resolve(filePath);
  const temporary = path.join(
    path.dirname(destination),
    `.${path.basename(destination)}.${randomUUID()}.tmp`,
  );
  let handle;
  try {
    handle = await open(temporary, "wx", 0o600);
    await handle.writeFile(content);
    await handle.chmod(0o600);
    await handle.sync();
    await handle.close();
    handle = undefined;
    if (exclusive) {
      await link(temporary, destination);
      await unlink(temporary);
    } else {
      await rename(temporary, destination);
    }
  } catch (error) {
    if (handle) await handle.close().catch(() => {});
    await unlink(temporary).catch(() => {});
    throw error;
  }
}
