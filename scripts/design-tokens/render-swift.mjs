import { channelsFor, hex } from "./oklch.mjs";

const header = `// Generated from design/tokens.json by scripts/build-design-tokens.mjs.
// Do not edit. Register the IBM Plex families before using ZZFont.
import SwiftUI

`;

export function renderSwift(model) {
  const parts = [
    header.trimEnd(),
    "",
    "public enum ZZColor {",
    ...colorFns(model.color),
    ...shadowFns(model.shadow.color),
    "}",
    "",
    "public struct ZZCubic: Sendable {",
    "    public let p1x: Double",
    "    public let p1y: Double",
    "    public let p2x: Double",
    "    public let p2y: Double",
    "}",
    "",
    "public enum ZZFont {",
    ...fontFns(model.type.font),
    "}",
    "",
    "public enum ZZTextSize {",
    ...sizeFns(model.type.size),
    "}",
    "",
    "public enum ZZSpace {",
    ...pxFns(model.spacing),
    ...pxFns(fixedLayout(model.layout)),
    "}",
    "",
    "public enum ZZRadius {",
    ...radiusFns(model.radius),
    "}",
    "",
    "public enum ZZShadow {",
    ...shadowGeom(model.shadow.mount),
    "}",
    "",
    "public enum ZZMotion {",
    ...motionFns(model.motion),
    "}",
    "",
  ];
  return `${parts.join("\n")}\n`;
}

function colorFns(colors) {
  const lines = [];
  for (const [name, pair] of Object.entries(colors)) {
    const id = ident(name);
    if (pair.light === pair.dark) {
      lines.push(`    public static let ${id} = ${swiftColor(pair.light)}`);
    } else {
      lines.push(
        `    public static let ${id}Light = ${swiftColor(pair.light)}`,
      );
      lines.push(`    public static let ${id}Dark = ${swiftColor(pair.dark)}`);
      lines.push(
        `    public static func ${id}(_ scheme: ColorScheme) -> Color { scheme == .dark ? ${id}Dark : ${id}Light }`,
      );
    }
  }
  return lines;
}

function shadowFns(pair) {
  return [
    `    public static let shadowLight = ${swiftColor(pair.light)}`,
    `    public static let shadowDark = ${swiftColor(pair.dark)}`,
    "    public static func shadow(_ scheme: ColorScheme) -> Color { scheme == .dark ? shadowDark : shadowLight }",
  ];
}

function fontFns(fonts) {
  const lines = [];
  for (const [name, stack] of Object.entries(fonts)) {
    const family = firstFamily(stack);
    const id = ident(name);
    lines.push(`    public static let ${id}Name = ${JSON.stringify(family)}`);
    lines.push(
      `    public static func ${id}(_ size: CGFloat, weight: Font.Weight = .regular) -> Font {`,
    );
    lines.push(`        Font.custom(${id}Name, size: size).weight(weight)`);
    lines.push("    }");
  }
  return lines;
}

function sizeFns(sizes) {
  const lines = [
    `    /// 1rem is 16px. The site does not set a root font size.`,
  ];
  for (const [name, value] of Object.entries(sizes)) {
    const id = ident(name);
    const rem = value.match(/^([0-9.]+)rem$/);
    if (rem) {
      lines.push(
        `    public static let ${id}: CGFloat = ${Number(rem[1]) * 16}`,
      );
    } else {
      lines.push(`    public static let ${id}CSS = ${JSON.stringify(value)}`);
    }
  }
  return lines;
}

function pxFns(values) {
  const lines = [];
  for (const [name, value] of Object.entries(values)) {
    const px = String(value).match(/^([0-9.]+)px$/);
    if (!px) continue;
    lines.push(
      `    public static let ${ident(name)}: CGFloat = ${Number(px[1])}`,
    );
  }
  return lines;
}

function radiusFns(radius) {
  const lines = [];
  for (const [name, value] of Object.entries(radius)) {
    if (name === "pill") {
      lines.push("    public static let pill: CGFloat = 999");
      continue;
    }
    const px = value.match(/^([0-9.]+)px$/);
    const number = px ? Number(px[1]) : Number(value);
    lines.push(`    public static let ${ident(name)}: CGFloat = ${number}`);
  }
  return lines;
}

function shadowGeom(mount) {
  return [
    `    public static let mountTop: CGFloat = ${pxNumber(mount.top)}`,
    `    public static let mountBottom: CGFloat = ${pxNumber(mount.bottom)}`,
    `    public static let mountBlur: CGFloat = ${pxNumber(mount.blur)}`,
    `    /// Horizontal inset of the mount shadow. The site CSS uses ${mount.left}.`,
    `    public static let mountInset: Double = ${percent(mount.left)}`,
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

function motionFns(motion) {
  const lines = [];
  for (const [name, value] of Object.entries(motion)) {
    const id = ident(name);
    const cubic = value.match(
      /^cubic-bezier\(\s*([0-9.]+)\s*,\s*([0-9.]+)\s*,\s*([0-9.]+)\s*,\s*([0-9.]+)\s*\)$/,
    );
    const ms = value.match(/^([0-9.]+)ms$/);
    if (cubic) {
      lines.push(
        `    public static let ${id} = ZZCubic(p1x: ${cubic[1]}, p1y: ${cubic[2]}, p2x: ${cubic[3]}, p2y: ${cubic[4]})`,
      );
    } else if (ms) {
      lines.push(
        `    public static let ${id}: TimeInterval = ${Number(ms[1]) / 1000}`,
      );
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

function swiftColor(value) {
  const c = channelsFor(value);
  const r = (c.r / 255).toFixed(6);
  const g = (c.g / 255).toFixed(6);
  const b = (c.b / 255).toFixed(6);
  const a = c.a === 1 ? "1" : String(c.a);
  return `Color(.sRGB, red: ${r}, green: ${g}, blue: ${b}, opacity: ${a}) // ${hex(c)} from ${value}`;
}

function firstFamily(stack) {
  const match = stack.match(/"([^"]+)"/);
  if (!match) throw new Error(`No font family in ${stack}`);
  return match[1];
}

function ident(name) {
  const bare = name
    .replace(/^--/, "")
    .replace(/-([a-z0-9])/g, (_, ch) => ch.toUpperCase());
  return bare.replace(/[^A-Za-z0-9]/g, "");
}
