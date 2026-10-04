import { channelsFor, hex } from "./oklch.mjs";

const header = `// Generated from design/tokens.json by scripts/build-design-tokens.mjs.
// Do not edit. Bundle IBM Plex under the family names in ZZType, then pass that FontFamily in.
package llc.zerostate.zzthis.design

import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.TextUnit
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.animation.core.CubicBezierEasing

`;

export function renderKotlin(model) {
  const parts = [
    header.trimEnd(),
    "",
    "object ZZColor {",
    ...colorVals(model.color),
    ...shadowVals(model.shadow.color),
    "}",
    "",
    "object ZZType {",
    ...typeVals(model),
    "}",
    "",
    "object ZZSpace {",
    ...dpVals(model.spacing),
    ...dpVals(fixedLayout(model.layout)),
    "}",
    "",
    "object ZZRadius {",
    ...radiusVals(model.radius),
    "}",
    "",
    "object ZZShadow {",
    ...shadowGeom(model.shadow.mount),
    "}",
    "",
    "object ZZMotion {",
    ...motionVals(model.motion),
    "}",
    "",
  ];
  return `${parts.join("\n")}\n`;
}

function colorVals(colors) {
  const lines = [];
  for (const [name, pair] of Object.entries(colors)) {
    const id = pascal(name);
    if (pair.light === pair.dark) {
      lines.push(`    val ${id} = ${kotlinColor(pair.light)}`);
    } else {
      lines.push(`    val ${id}Light = ${kotlinColor(pair.light)}`);
      lines.push(`    val ${id}Dark = ${kotlinColor(pair.dark)}`);
    }
  }
  return lines;
}

function shadowVals(pair) {
  return [
    `    val ShadowLight = ${kotlinColor(pair.light)}`,
    `    val ShadowDark = ${kotlinColor(pair.dark)}`,
  ];
}

function typeVals(model) {
  const lines = [];
  for (const [name, stack] of Object.entries(model.type.font)) {
    const id = pascal(name);
    lines.push(
      `    const val ${id}Family = ${JSON.stringify(firstFamily(stack))}`,
    );
    lines.push(`    const val ${id}Stack = ${JSON.stringify(stack)}`);
  }
  lines.push(`    val WeightRegular = FontWeight.W${weight(model, 400)}`);
  lines.push(`    val WeightMedium = FontWeight.W${weight(model, 500)}`);
  lines.push(`    val WeightSemibold = FontWeight.W${weight(model, 600)}`);
  lines.push(`    val WeightBold = FontWeight.W${weight(model, 700)}`);
  lines.push(`    const val LineHeight = ${model.type.lineHeight}f`);
  for (const [name, value] of Object.entries(model.type.size)) {
    const id = pascal(name);
    const rem = value.match(/^([0-9.]+)rem$/);
    if (rem) lines.push(`    val ${id} = ${Number(rem[1]) * 16}.sp`);
    else lines.push(`    const val ${id}Css = ${JSON.stringify(value)}`);
  }
  lines.push(
    "    fun body(family: FontFamily, size: TextUnit, weight: FontWeight = WeightRegular) =",
  );
  lines.push(
    "        TextStyle(fontFamily = family, fontSize = size, fontWeight = weight)",
  );
  return lines;
}

function dpVals(values) {
  const lines = [];
  for (const [name, value] of Object.entries(values)) {
    const px = String(value).match(/^([0-9.]+)px$/);
    if (!px) continue;
    lines.push(`    val ${pascal(name)} = ${Number(px[1])}.dp`);
  }
  return lines;
}

function radiusVals(radius) {
  const lines = [];
  for (const [name, value] of Object.entries(radius)) {
    if (name === "pill") {
      lines.push("    val Pill = 999.dp");
      continue;
    }
    const px = String(value).match(/^([0-9.]+)px$/);
    const number = px ? Number(px[1]) : Number(value);
    lines.push(`    val ${pascal(name)} = ${number}.dp`);
  }
  return lines;
}

function shadowGeom(mount) {
  return [
    `    val MountTop = ${pxNumber(mount.top)}.dp`,
    `    val MountBottom = ${pxNumber(mount.bottom)}.dp`,
    `    val MountBlur = ${pxNumber(mount.blur)}.dp`,
    `    const val MountInset = ${percent(mount.left)}f // ${mount.left} in the site CSS`,
  ];
}

function pxNumber(value) {
  const match = String(value).match(/^(-?[0-9.]+)px$/);
  if (!match) throw new Error(`Expected px, got ${value}`);
  return Number(match[1]);
}

function percent(value) {
  const match = String(value).match(/^([0-9.]+)%$/);
  if (!match) throw new Error(`Expected percent, got ${value}`);
  return Number(match[1]) / 100;
}

function motionVals(motion) {
  const lines = [];
  for (const [name, value] of Object.entries(motion)) {
    const id = pascal(name);
    const cubic = value.match(
      /^cubic-bezier\(\s*([0-9.]+)\s*,\s*([0-9.]+)\s*,\s*([0-9.]+)\s*,\s*([0-9.]+)\s*\)$/,
    );
    const ms = value.match(/^([0-9.]+)ms$/);
    if (cubic) {
      lines.push(
        `    val ${id} = CubicBezierEasing(${float(cubic[1])}, ${float(cubic[2])}, ${float(cubic[3])}, ${float(cubic[4])})`,
      );
    } else if (ms) {
      lines.push(`    const val ${id}Ms = ${Number(ms[1])}`);
    }
  }
  return lines;
}

function fixedLayout(layout) {
  const out = {};
  for (const [name, value] of Object.entries(layout)) {
    if (typeof value === "string") out[name] = value;
  }
  return out;
}

function kotlinColor(value) {
  const c = channelsFor(value);
  const comment = `// ${hex(c)} from ${value}`;
  if (c.a === 1) {
    const argb = `0xFF${hex(c).slice(1).toUpperCase()}`;
    return `Color(${argb}) ${comment}`;
  }
  const r = (c.r / 255).toFixed(4);
  const g = (c.g / 255).toFixed(4);
  const b = (c.b / 255).toFixed(4);
  return `Color(red = ${r}f, green = ${g}f, blue = ${b}f, alpha = ${c.a}f) ${comment}`;
}

function weight(model, value) {
  if (!model.type.weight.includes(value)) {
    throw new Error(`font-weight ${value} is not in the stylesheets`);
  }
  return value;
}

function firstFamily(stack) {
  const match = stack.match(/"([^"]+)"/);
  if (!match) throw new Error(`No font family in ${stack}`);
  return match[1];
}

function pascal(name) {
  const bare = name.replace(/^--/, "");
  return bare
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");
}

function float(value) {
  return value.includes(".") ? `${value}f` : `${value}.0f`;
}
