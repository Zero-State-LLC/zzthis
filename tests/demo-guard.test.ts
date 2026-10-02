import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const roots = ["src/demo", "src/lib"];

const forbidden = [
  "getUserMedia",
  "fetch(",
  "XMLHttpRequest",
  "localStorage",
  "sessionStorage",
  "indexedDB",
  "document.cookie",
  "navigator.mediaDevices",
  "serviceWorker",
];

const files = roots.flatMap((root) =>
  readdirSync(root, { recursive: true, encoding: "utf8" })
    .map((name) => join(root, name))
    .filter((path) => statSync(path).isFile()),
);

describe("demo and lib make no network, camera, or storage calls", () => {
  it("finds source files to check", () => {
    expect(files.length).toBeGreaterThan(3);
  });

  for (const path of files) {
    it(`${path} uses no forbidden API`, () => {
      const text = readFileSync(path, "utf8");
      expect(forbidden.filter((term) => text.includes(term))).toEqual([]);
    });
  }
});
