import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { extractTokens } from "./design-tokens/extract.mjs";
import { renderCss } from "./design-tokens/render-css.mjs";
import { renderKotlin } from "./design-tokens/render-kotlin.mjs";
import { renderSwift } from "./design-tokens/render-swift.mjs";

const root = process.cwd();
const model = extractTokens();
const files = {
  "design/tokens.json": `${JSON.stringify(model, null, 2)}\n`,
  "design/generated/tokens.css": renderCss(model),
  "design/generated/Tokens.swift": renderSwift(model),
  "design/generated/Tokens.kt": renderKotlin(model),
};

for (const [path, text] of Object.entries(files)) {
  const full = join(root, path);
  mkdirSync(dirname(full), { recursive: true });
  writeFileSync(full, text);
  console.log(`wrote ${path}`);
}
