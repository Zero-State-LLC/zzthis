// Runs the spec 003 pipeline on the committed EFF source and writes
// wordlists/proto-v0.txt with its two reports. The run fails unless the
// source SHA-256 matches the pin. Run it with npm run wordlist:build -w
// packages/zz-core, then npm run wordlists:module -w packages/zz-core.
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { runPipeline, VERSION } from "./wordlist-pipeline.ts";

const listDir = join(import.meta.dirname, "..", "wordlists");
const source = readFileSync(
  join(listDir, "source", "eff_large_wordlist.txt"),
  "utf8",
);
const output = runPipeline(source);

writeFileSync(join(listDir, `${VERSION}.txt`), output.list);
writeFileSync(join(listDir, `${VERSION}.report.json`), output.reportJson);
writeFileSync(join(listDir, `${VERSION}.report.md`), output.reportMarkdown);
for (const row of output.report.filters) {
  console.log(
    `${row.step} ${row.name}: ${row.count_in} -> ${row.count_out} (${row.status})`,
  );
}
console.log(`N = ${output.report.final_size}`);
