import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

export function assertNonAuthorizingReport(report) {
  if (
    report?.status !== "INCOMPLETE" ||
    report?.disposition !== "NO_PROMOTION" ||
    report?.promotion_eligible !== false ||
    report?.qualification_scoring?.status !== "DIAGNOSTIC_ONLY" ||
    report?.qualification_receipt?.validation?.authorizesPromotion !== false
  ) {
    throw new Error("qualification_report_not_fail_closed");
  }
  return "INCOMPLETE_NO_PROMOTION";
}

async function main() {
  const [reportPath] = process.argv.slice(2);
  if (!reportPath) {
    process.stderr.write("qualification_report_path_required\n");
    process.exitCode = 1;
    return;
  }
  try {
    const report = JSON.parse(await readFile(reportPath, "utf8"));
    process.stdout.write(`${assertNonAuthorizingReport(report)}\n`);
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  }
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  await main();
}
