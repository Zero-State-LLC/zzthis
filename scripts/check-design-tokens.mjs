import { readFileSync } from "node:fs";
import { join } from "node:path";
import { extractTokens } from "./design-tokens/extract.mjs";
import { renderCss } from "./design-tokens/render-css.mjs";
import { renderKotlin } from "./design-tokens/render-kotlin.mjs";
import { renderSwift } from "./design-tokens/render-swift.mjs";

const root = process.cwd();
const model = extractTokens();
const expected = {
  "design/tokens.json": `${JSON.stringify(model, null, 2)}\n`,
  "design/generated/tokens.css": renderCss(model),
  "design/generated/Tokens.swift": renderSwift(model),
  "design/generated/Tokens.kt": renderKotlin(model),
};

let failed = false;
for (const [path, text] of Object.entries(expected)) {
  const full = join(root, path);
  const current = readFileSync(full, "utf8");
  if (current !== text) {
    failed = true;
    console.error(`design token drift: ${path}`);
  }
}

if (failed) {
  console.error("Run npm run design:build and commit design/.");
  process.exit(1);
}

console.log("design tokens match the site stylesheets");
