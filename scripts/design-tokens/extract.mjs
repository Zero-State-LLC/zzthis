import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();

export function extractTokens() {
  const css = readFileSync(join(root, "src/styles/tokens.css"), "utf8");
  const decls = declarations(rootBlock(css));
  const color = {};
  const font = {};
  const size = {};
  const spacing = {};
  const radius = {};
  const motion = {};
  const layout = {};
  const z = {};
  const legacy = {};
  const shadowColor = pair(decls["--shadow-color"]);

  for (const [name, raw] of Object.entries(decls)) {
    if (name === "--shadow-color") continue;
    if (raw.includes("var(")) {
      legacy[name] = collapse(raw);
      continue;
    }
    if (name.startsWith("--color-") || name.startsWith("--mask-")) {
      color[name] = pair(raw);
    } else if (name.startsWith("--font-")) {
      font[name] = collapse(raw);
    } else if (name.startsWith("--text-")) {
      size[name] = collapse(raw);
    } else if (name.startsWith("--space-")) {
      spacing[name] = collapse(raw);
    } else if (name.startsWith("--radius-")) {
      radius[name] = collapse(raw);
    } else if (name.startsWith("--ease-") || name.startsWith("--dur-")) {
      motion[name] = collapse(raw);
    } else if (name.startsWith("--z-")) {
      z[name] = collapse(raw);
    } else {
      layout[name] = collapse(raw);
    }
  }

  if (stylesHave("border-radius: 999px")) radius.pill = "999px";

  return {
    source: "src/styles/tokens.css",
    color,
    type: {
      font,
      size,
      weight: fontWeights(),
      lineHeight: lineHeight(),
    },
    spacing,
    radius,
    shadow: {
      color: shadowColor,
      mount: mountShadow(),
    },
    motion,
    layout: {
      ...layout,
      gutterBreakpoints: gutterBreakpoints(css),
    },
    z,
    legacy,
  };
}

function rootBlock(css) {
  const start = css.indexOf(":root {");
  const end = css.indexOf(':root[data-theme="light"]');
  if (start < 0 || end < 0) throw new Error("tokens.css root block not found");
  return css.slice(start, end);
}

function declarations(block) {
  const out = {};
  const re = /--([a-z0-9-]+)\s*:\s*([^;]+);/g;
  for (const match of block.matchAll(re)) {
    out[`--${match[1]}`] = match[2].trim();
  }
  return out;
}

function pair(raw) {
  const split = splitLightDark(raw.trim());
  if (split)
    return { light: collapse(split.light), dark: collapse(split.dark) };
  const value = collapse(raw);
  return { light: value, dark: value };
}

function splitLightDark(value) {
  const match = value.match(/^light-dark\((.*)\)$/s);
  if (!match) return null;
  const inner = match[1];
  let depth = 0;
  for (let i = 0; i < inner.length; i += 1) {
    const ch = inner[i];
    if (ch === "(") depth += 1;
    else if (ch === ")") depth -= 1;
    else if (ch === "," && depth === 0) {
      return {
        light: inner.slice(0, i).trim(),
        dark: inner.slice(i + 1).trim(),
      };
    }
  }
  throw new Error(`Unparsed light-dark(): ${value}`);
}

function collapse(value) {
  return value.replace(/\s+/g, " ").trim();
}

function gutterBreakpoints(css) {
  const out = {};
  const re = /@media \(min-width:\s*([^)]+)\)\s*\{[^}]*--gutter:\s*([^;]+);/g;
  for (const match of css.matchAll(re)) {
    out[match[1].trim()] = match[2].trim();
  }
  return out;
}

function fontWeights() {
  const found = new Set();
  for (const file of styleFiles()) {
    const css = readFileSync(file, "utf8");
    for (const match of css.matchAll(/font-weight:\s*(\d+)/g)) {
      found.add(Number(match[1]));
    }
  }
  return [...found].sort((a, b) => a - b);
}

function lineHeight() {
  const css = readFileSync(join(root, "src/styles/base.css"), "utf8");
  const match = css.match(/line-height:\s*([0-9.]+)/);
  if (!match) throw new Error("body line-height missing");
  return match[1];
}

function mountShadow() {
  const css = readFileSync(join(root, "src/styles/base.css"), "utf8");
  const start = css.indexOf(".mount__shadow {");
  const end = css.indexOf("}", start);
  const block = css.slice(start, end);
  return {
    top: field(block, "top"),
    bottom: field(block, "bottom"),
    left: field(block, "left"),
    right: field(block, "right"),
    blur: blur(block),
    source: "src/styles/base.css",
  };
}

function field(block, name) {
  const match = block.match(new RegExp(`${name}:\\s*([^;]+);`));
  if (!match) throw new Error(`mount shadow missing ${name}`);
  return match[1].trim();
}

function blur(block) {
  const match = block.match(/blur\(([^)]+)\)/);
  if (!match) throw new Error("mount shadow missing blur");
  return match[1].trim();
}

function stylesHave(needle) {
  return styleFiles().some((file) =>
    readFileSync(file, "utf8").includes(needle),
  );
}

function styleFiles() {
  const dir = join(root, "src/styles");
  return readdirSync(dir)
    .filter((name) => name.endsWith(".css"))
    .map((name) => join(dir, name));
}
