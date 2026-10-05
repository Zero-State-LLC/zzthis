#!/usr/bin/env node
// npm run dev:api (spec 005 plan, Local run). The script handles every flag
// itself and passes none to wrangler. In order it:
//   1. builds apps/web into the [assets] directory, when apps/web exists;
//   2. with --fresh, deletes workers/api/.wrangler/state;
//   3. writes a git-ignored workers/api/.dev.vars if it is missing, from
//      .dev.vars.example plus secrets generated on this machine;
//   4. applies the D1 migrations to the local database;
//   5. runs wrangler dev on port 8787 with local D1, R2, and Durable Objects.
import { spawn, spawnSync } from "node:child_process";
import { existsSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const workerDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const repoRoot = path.resolve(workerDir, "../..");
const PORT = "8787";

const flags = process.argv.slice(2);
for (const flag of flags) {
  if (flag !== "--fresh") {
    console.error(
      `dev:api: unknown option ${flag}. The only option is --fresh.`,
    );
    process.exit(2);
  }
}

const env = { ...process.env, WRANGLER_SEND_METRICS: "false" };

function run(command, args, cwd, extraEnv = {}) {
  const result = spawnSync(command, args, {
    cwd,
    env: { ...env, ...extraEnv },
    stdio: "inherit",
  });
  if (result.status !== 0) {
    console.error(`dev:api: ${command} ${args.join(" ")} failed`);
    process.exit(result.status ?? 1);
  }
}

function base64url(bytes) {
  return Buffer.from(bytes).toString("base64url");
}

// ZZ_TOKEN_SECRET and ZZ_DATA_KEY are base64url of 32 random bytes, and
// ZZ_RECORD_SIGNING_KEY is base64 of an Ed25519 PKCS8 DER key (spec 005
// Environment). They live only in the git-ignored .dev.vars.
async function localSecrets() {
  const pair = await crypto.subtle.generateKey({ name: "Ed25519" }, true, [
    "sign",
    "verify",
  ]);
  const pkcs8 = await crypto.subtle.exportKey("pkcs8", pair.privateKey);
  return {
    ZZ_TOKEN_SECRET: base64url(crypto.getRandomValues(new Uint8Array(32))),
    ZZ_DATA_KEY: base64url(crypto.getRandomValues(new Uint8Array(32))),
    ZZ_RECORD_SIGNING_KEY: Buffer.from(pkcs8).toString("base64"),
  };
}

async function writeDevVars() {
  const target = path.join(workerDir, ".dev.vars");
  if (existsSync(target)) return;
  const secrets = await localSecrets();
  const example = readFileSync(
    path.join(workerDir, ".dev.vars.example"),
    "utf8",
  );
  const lines = example.split("\n").map((line) => {
    const name = line.split("=")[0];
    return Object.hasOwn(secrets, name) ? `${name}=${secrets[name]}` : line;
  });
  writeFileSync(target, lines.join("\n"), { mode: 0o600 });
  console.log("dev:api: wrote workers/api/.dev.vars with new local secrets");
}

if (existsSync(path.join(repoRoot, "apps/web/package.json"))) {
  run("npm", ["run", "build", "-w", "apps/web"], repoRoot);
}
if (flags.includes("--fresh")) {
  rmSync(path.join(workerDir, ".wrangler/state"), {
    recursive: true,
    force: true,
  });
  console.log("dev:api: deleted workers/api/.wrangler/state");
}
await writeDevVars();
// The local database only, so wrangler's "continue?" prompt is skipped.
run(
  "npx",
  ["wrangler", "d1", "migrations", "apply", "ZZ_DB", "--local"],
  workerDir,
  {
    CI: "true",
  },
);

const dev = spawn("npx", ["wrangler", "dev", "--port", PORT], {
  cwd: workerDir,
  env,
  stdio: "inherit",
});
for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => dev.kill(signal));
}
dev.on("exit", (code, signal) =>
  process.exit(code ?? (signal === null ? 0 : 1)),
);
