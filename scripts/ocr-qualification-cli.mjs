import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import {
  ARGUMENT_NAMES,
  inspectQualification,
  REQUIRED_INPUTS,
} from "./ocr-qualification-preflight.mjs";

async function readJson(filePath, name) {
  try {
    return JSON.parse(await readFile(filePath, "utf8"));
  } catch {
    throw new Error(`invalid_json:${name}`);
  }
}

function parseArgs(args) {
  const options = {};
  for (let index = 0; index < args.length; index += 1) {
    const key = args[index];
    if (key === "--help" || key === "-h") return { help: true };
    if (!key?.startsWith("--") || index + 1 >= args.length) {
      throw new Error("invalid_arguments");
    }
    const name = Object.keys(ARGUMENT_NAMES).find(
      (inputName) => ARGUMENT_NAMES[inputName] === key.slice(2),
    );
    if (!name && key !== "--output") throw new Error("invalid_arguments");
    const optionName = name ?? "output";
    if (Object.hasOwn(options, optionName))
      throw new Error("duplicate_argument");
    options[optionName] = args[index + 1];
    index += 1;
  }
  for (const name of REQUIRED_INPUTS) {
    if (!options[name]) throw new Error(`argument_missing:${name}`);
  }
  return options;
}

function usage() {
  return [
    "Usage: npm run qual:ocr -- \\",
    ...REQUIRED_INPUTS.map((name) => `  --${ARGUMENT_NAMES[name]} <path>`),
    "  [--output <path>]",
    "",
    "This preflight is evidence validation only. It always returns INCOMPLETE/NO_PROMOTION until pinned decoder identity, Sigstore verification, scoring, and receipt generation are complete.",
  ].join("\n");
}

async function main() {
  let options;
  try {
    options = parseArgs(process.argv.slice(2));
  } catch (error) {
    process.stderr.write(`${error.message}\n${usage()}\n`);
    process.exitCode = 2;
    return;
  }

  if (options.help) {
    process.stdout.write(`${usage()}\n`);
    return;
  }

  const documents = {};
  const reasonCodes = [];
  for (const name of REQUIRED_INPUTS) {
    if (name === "preRunBundle" || name === "executionBundle") {
      try {
        documents[name] = await readJson(options[name], name);
      } catch {
        reasonCodes.push(`sigstore_bundle_unreadable:${name}`);
      }
      continue;
    }
    try {
      documents[name] = await readJson(options[name], name);
    } catch {
      reasonCodes.push(`invalid_json:${name}`);
    }
  }

  const report = inspectQualification(documents, { policyPresent: false });
  report.reason_codes = [...new Set([...reasonCodes, ...report.reason_codes])];

  if (options.output) {
    await writeFile(options.output, `${JSON.stringify(report, null, 2)}\n`, {
      encoding: "utf8",
      mode: 0o600,
    });
  } else {
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  }
  process.exitCode = 2;
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  await main();
}
