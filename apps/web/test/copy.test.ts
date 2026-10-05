// @vitest-environment happy-dom
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import copy from "../../../design/copy.json";
import { REQUIRED_PAGES } from "../scripts/check-dist.mjs";

const SENTENCES = new Set(Object.values(copy.strings).map((s) => s.text));

// Every text a built page shows, apart from the license texts on
// /licenses/ (NOTICE and OFL.txt are shown as they are).
function texts(page: string): string[] {
  const html = readFileSync(join(import.meta.dirname, "../dist", page), "utf8");
  const doc = new DOMParser().parseFromString(html, "text/html");
  for (const pre of doc.querySelectorAll("pre.license, script")) pre.remove();
  const out: string[] = [doc.title];
  const walker = doc.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT);
  for (let node = walker.nextNode(); node !== null; node = walker.nextNode()) {
    const text = (node.textContent ?? "").trim();
    if (text !== "") out.push(text);
  }
  for (const element of doc.querySelectorAll("[placeholder], [alt]")) {
    for (const name of ["placeholder", "alt"]) {
      const value = element.getAttribute(name);
      if (value !== null && value !== "") out.push(value);
    }
  }
  return out;
}

describe("strings on the built pages (T021, FR-014)", () => {
  for (const page of REQUIRED_PAGES) {
    it(`${page} shows only design/copy.json sentences`, () => {
      const shown = texts(page);
      expect(shown.length).toBeGreaterThan(0);
      for (const text of shown) expect(SENTENCES, text).toContain(text);
    });
  }

  it("never shows the demo badge, because the web has no scripted demo data", () => {
    for (const page of REQUIRED_PAGES) {
      expect(texts(page)).not.toContain(copy.strings["common.demo_badge"].text);
    }
  });
});
