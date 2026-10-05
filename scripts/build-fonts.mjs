// Rebuild design/fonts/*.ttf from the pinned @ibm/plex npm packages (spec 005 T030).
// The packages ship WOFF 1, which wraps the original TrueType tables with zlib,
// so unwrapping gives back the original font. iOS and Android cannot load WOFF.
// Usage: node scripts/build-fonts.mjs [--check]
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { inflateSync } from "node:zlib";
import { join } from "node:path";

const OUT = "design/fonts";
const WEIGHTS = ["Regular", "Medium", "SemiBold", "Bold"];
const FAMILIES = [
  { pkg: "@ibm/plex-sans", file: "IBMPlexSans" },
  { pkg: "@ibm/plex-sans-condensed", file: "IBMPlexSansCondensed" },
  { pkg: "@ibm/plex-mono", file: "IBMPlexMono" },
];

function woffToSfnt(woff) {
  if (woff.toString("latin1", 0, 4) !== "wOFF") {
    throw new Error("not a WOFF 1 file");
  }
  const flavor = woff.readUInt32BE(4);
  const numTables = woff.readUInt16BE(12);
  const tables = [];
  for (let i = 0; i < numTables; i += 1) {
    const at = 44 + i * 20;
    const offset = woff.readUInt32BE(at + 4);
    const compLength = woff.readUInt32BE(at + 8);
    const origLength = woff.readUInt32BE(at + 12);
    const raw = woff.subarray(offset, offset + compLength);
    const data = compLength < origLength ? inflateSync(raw) : raw;
    if (data.length !== origLength) {
      throw new Error("table length mismatch");
    }
    tables.push({
      tag: woff.subarray(at, at + 4),
      checksum: woff.readUInt32BE(at + 16),
      data,
    });
  }
  let maxPow = 1;
  let entrySelector = 0;
  while (maxPow * 2 <= numTables) {
    maxPow *= 2;
    entrySelector += 1;
  }
  const header = Buffer.alloc(12 + numTables * 16);
  header.writeUInt32BE(flavor, 0);
  header.writeUInt16BE(numTables, 4);
  header.writeUInt16BE(maxPow * 16, 6);
  header.writeUInt16BE(entrySelector, 8);
  header.writeUInt16BE(numTables * 16 - maxPow * 16, 10);
  const parts = [header];
  let offset = header.length;
  tables.forEach((table, i) => {
    const at = 12 + i * 16;
    table.tag.copy(header, at);
    header.writeUInt32BE(table.checksum, at + 4);
    header.writeUInt32BE(offset, at + 8);
    header.writeUInt32BE(table.data.length, at + 12);
    const padded = Buffer.alloc((table.data.length + 3) & ~3);
    table.data.copy(padded);
    parts.push(padded);
    offset += padded.length;
  });
  return Buffer.concat(parts);
}

const check = process.argv.includes("--check");
const outputs = new Map();
for (const family of FAMILIES) {
  const dir = join("node_modules", family.pkg, "fonts", "complete", "woff");
  for (const weight of WEIGHTS) {
    const name = `${family.file}-${weight}`;
    outputs.set(
      `${name}.ttf`,
      woffToSfnt(readFileSync(join(dir, `${name}.woff`))),
    );
  }
}
outputs.set(
  "OFL.txt",
  readFileSync(join("node_modules", "@ibm/plex-sans", "LICENSE.txt")),
);

let drift = 0;
if (!check) {
  mkdirSync(OUT, { recursive: true });
}
for (const [file, bytes] of outputs) {
  const path = join(OUT, file);
  if (check) {
    if (!existsSync(path) || !readFileSync(path).equals(bytes)) {
      console.error(`fonts drift: ${path}`);
      drift += 1;
    }
  } else {
    writeFileSync(path, bytes);
  }
}
if (drift > 0) {
  console.error("Run: node scripts/build-fonts.mjs");
  process.exit(1);
}
console.log(
  check
    ? "fonts match the pinned packages"
    : `wrote ${outputs.size} files to ${OUT}`,
);
