const header = `/* Generated from design/tokens.json by scripts/build-design-tokens.mjs. Do not edit. */
`;

export function renderCss(model) {
  const lines = [header.trimEnd(), ":root {", "  color-scheme: dark light;"];
  pushPairs(lines, model.color);
  pushValues(lines, model.type.font);
  pushValues(lines, model.type.size);
  pushValues(lines, model.spacing);
  pushValues(lines, model.radius, (name) => name.startsWith("--"));
  pushPairs(lines, { "--shadow-color": model.shadow.color });
  pushValues(lines, model.motion);
  pushValues(lines, model.layout, (name) => name.startsWith("--"));
  pushValues(lines, model.z);
  pushValues(lines, model.legacy);
  lines.push("}");
  for (const [query, gutter] of Object.entries(
    model.layout.gutterBreakpoints,
  )) {
    lines.push("");
    lines.push(`@media (min-width: ${query}) {`);
    lines.push("  :root {");
    lines.push(`    --gutter: ${gutter};`);
    lines.push("  }");
    lines.push("}");
  }
  lines.push("");
  return `${lines.join("\n")}\n`;
}

function pushPairs(lines, groups) {
  for (const [name, pair] of Object.entries(groups)) {
    lines.push(`  ${name}: ${cssPair(pair)};`);
  }
}

function pushValues(lines, groups, keep = () => true) {
  for (const [name, value] of Object.entries(groups)) {
    if (typeof value === "string" && keep(name))
      lines.push(`  ${name}: ${value};`);
  }
}

function cssPair(pair) {
  if (pair.light === pair.dark) return pair.light;
  return `light-dark(${pair.light}, ${pair.dark})`;
}
