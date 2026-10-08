import { randomUUID } from "node:crypto";
import { open, readFile, rename, unlink } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import {
  renderQualificationMarkdownReport,
  sha256MarkdownReport,
} from "./ocr-qualification-markdown-report.mjs";
import {
  ARGUMENT_NAMES,
  inspectQualification,
  REQUIRED_INPUTS,
} from "./ocr-qualification-preflight.mjs";
import { verifyQualificationBundles } from "./ocr-qualification-sigstore-pair.mjs";

const OUTPUT_ARGUMENTS = {
  "--output": "output",
  "--markdown-report": "markdownReport",
  "--receipt-output": "receiptOutput",
  "--receipt-report": "receiptReport",
};
const OUTPUT_OPTION_NAMES = [
  "output",
  "markdownReport",
  "receiptOutput",
  "receiptReport",
];

export async function writePrivateFile(filePath, content) {
  const destination = path.resolve(filePath);
  const temporary = path.join(
    path.dirname(destination),
    `.${path.basename(destination)}.${randomUUID()}.tmp`,
  );
  let handle;
  try {
    handle = await open(temporary, "wx", 0o600);
    await handle.writeFile(content, { encoding: "utf8" });
    await handle.chmod(0o600);
    await handle.sync();
    await handle.close();
    handle = undefined;
    await rename(temporary, destination);
  } catch (error) {
    if (handle) await handle.close().catch(() => {});
    await unlink(temporary).catch(() => {});
    throw error;
  }
}

export function assertDistinctOutputPaths(options) {
  const paths = new Set();
  for (const name of OUTPUT_OPTION_NAMES) {
    if (!options[name]) continue;
    const destination = path.resolve(options[name]);
    const key =
      process.platform === "darwin" ? destination.toLowerCase() : destination;
    if (paths.has(key)) throw new Error("output_paths_must_be_distinct");
    paths.add(key);
  }
}

export function publicDiagnosticReport(report) {
  const result = { ...report };
  if (report.qualification_scoring) {
    const scoring = report.qualification_scoring;
    result.qualification_scoring = {
      status: scoring.status,
      qualification_id: scoring.qualification_id,
      candidate_id: scoring.candidate_id,
      metric_sets: scoring.metric_sets,
      gate_evaluation: scoring.gate_evaluation,
    };
  }
  const receipt = report.qualification_receipt;
  result.qualification_receipt = receipt
    ? {
        status: receipt.validation.status,
        report_sha256: receipt.receipt.report_sha256,
        detail:
          "Use --receipt-output or --receipt-report for the private artifact.",
      }
    : null;
  return result;
}

async function readJson(filePath, name) {
  try {
    const bytes = await readFile(filePath);
    return { bytes, value: JSON.parse(bytes.toString("utf8")) };
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
    if (!name && !Object.hasOwn(OUTPUT_ARGUMENTS, key)) {
      throw new Error("invalid_arguments");
    }
    const optionName = name ?? OUTPUT_ARGUMENTS[key];
    if (Object.hasOwn(options, optionName))
      throw new Error("duplicate_argument");
    options[optionName] = args[index + 1];
    index += 1;
  }
  for (const name of REQUIRED_INPUTS) {
    if (!options[name]) throw new Error(`argument_missing:${name}`);
  }
  assertDistinctOutputPaths(options);
  return options;
}

function usage() {
  return [
    "Usage: npm run qual:ocr -- \\",
    ...REQUIRED_INPUTS.map((name) => `  --${ARGUMENT_NAMES[name]} <path>`),
    "  [--output <path>] [--markdown-report <path>] [--receipt-output <path>] [--receipt-report <path>]",
    "",
    "This preflight checks Sigstore bundles when Cosign is available and reports diagnostic final-split scores/gates only after structural validation and pinned decoder replay pass. Any generated receipt is explicitly INCOMPLETE and non-authorizing; qualification stays INCOMPLETE/NO_PROMOTION until protected policy, trusted workflow timing, independent review, and private corpus/device evidence are established.",
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
  const rawInputBytes = {};
  const reasonCodes = [];
  for (const name of REQUIRED_INPUTS) {
    if (name === "preRunBundle" || name === "executionBundle") {
      try {
        const input = await readJson(options[name], name);
        documents[name] = input.value;
        rawInputBytes[name] = input.bytes;
      } catch {
        reasonCodes.push(`sigstore_bundle_unreadable:${name}`);
      }
      continue;
    }
    try {
      const input = await readJson(options[name], name);
      documents[name] = input.value;
      rawInputBytes[name] = input.bytes;
    } catch {
      reasonCodes.push(`invalid_json:${name}`);
    }
  }

  const sigstoreVerifications = await verifyQualificationBundles({
    preRunAttestation: documents.preRunAttestation,
    executionAttestation: documents.executionAttestation,
    preRunBundle: rawInputBytes.preRunBundle,
    executionBundle: rawInputBytes.executionBundle,
  });
  const report = inspectQualification(documents, {
    policyPresent: sigstoreVerifications.policyPresent,
    policyError: sigstoreVerifications.policyError,
    sigstoreVerifications,
    rawInputBytes,
  });
  report.reason_codes = [...new Set([...reasonCodes, ...report.reason_codes])];

  if (options.markdownReport) {
    const markdown = renderQualificationMarkdownReport(report);
    await writePrivateFile(options.markdownReport, markdown);
    report.diagnostic_markdown_sha256 = sha256MarkdownReport(markdown);
  }

  if (options.receiptOutput || options.receiptReport) {
    const artifact = report.qualification_receipt;
    if (!artifact) {
      process.stderr.write("qualification_receipt_unavailable\n");
    } else {
      if (options.receiptOutput) {
        await writePrivateFile(
          options.receiptOutput,
          `${JSON.stringify(
            { receipt: artifact.receipt, validation: artifact.validation },
            null,
            2,
          )}\n`,
        );
      }
      if (options.receiptReport) {
        await writePrivateFile(options.receiptReport, artifact.markdown);
      }
    }
  }

  if (options.output) {
    await writePrivateFile(
      options.output,
      `${JSON.stringify(report, null, 2)}\n`,
    );
  } else {
    process.stdout.write(
      `${JSON.stringify(publicDiagnosticReport(report), null, 2)}\n`,
    );
  }
  process.exitCode = 2;
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  await main();
}
