import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { describe, expect, it } from "vitest";
import { checkDist, REQUIRED_PAGES } from "../scripts/check-dist.mjs";

const PAGE =
  '<!DOCTYPE html><html lang="en"><head><title>Scan</title></head><body><main><p>Type a zz code.</p></main><script type="module" src="/_astro/page.js"></script></body></html>';

// A dist folder with every required page, then the given files over it.
function dist(files: Record<string, string>): string {
  const root = mkdtempSync(join(tmpdir(), "zz-web-dist-"));
  const all: Record<string, string> = {
    "_astro/page.js": 'import"./shared.js";',
    "_astro/shared.js": "export{};",
  };
  for (const page of REQUIRED_PAGES) all[page] = PAGE;
  for (const [file, content] of Object.entries({ ...all, ...files })) {
    mkdirSync(dirname(join(root, file)), { recursive: true });
    writeFileSync(join(root, file), content);
  }
  return root;
}

function problems(files: Record<string, string>): string[] {
  return checkDist(dist(files)).problems;
}

describe("the apps/web dist check (plan.md Tests, Web build)", () => {
  it("passes a clean build", () => {
    expect(checkDist(dist({}))).toEqual({
      problems: [],
      pages: REQUIRED_PAGES.length,
    });
  });

  it("fails on each refused construct", () => {
    const cases: [string, string][] = [
      ["<script>alert(1)</script>", "script without src"],
      ["<style>p{}</style>", "<style> element"],
      ['<p style="color:red">x</p>', "style= attribute"],
      ['<button onclick="go()">x</button>', "onclick= attribute"],
      ['<img src="data:image/png;base64,AAAA" alt="">', "data: URI"],
      ["<p>a \u2014 b</p>", "em dash"],
      ["<p>a mock record</p>", "mock"],
      ["<p>the checksum word</p>", "check word"],
      [
        '<a href="https://accounts.google.com/x">x</a>',
        "provider origin outside /signin/",
      ],
    ];
    for (const [html, problem] of cases) {
      const found = problems({
        "index.html": PAGE.replace("<main>", `<main>${html}`),
      });
      expect(found.join("\n"), html).toContain(problem);
    }
  });

  it("allows a provider origin on /signin/ only, also through imported chunks", () => {
    const named = 'const s="https://accounts.google.com/gsi/client";';
    expect(
      problems({
        "signin/index.html": PAGE.replace(
          "/_astro/page.js",
          "/_astro/signin.js",
        ),
        "_astro/signin.js": named,
      }),
    ).toEqual([]);
    const leaked = problems({ "_astro/shared.js": named });
    expect(
      leaked.some((p) => p.startsWith("index.html: loads _astro/shared.js")),
    ).toBe(true);
  });

  it("names a missing page and a missing build", () => {
    const root = dist({});
    writeFileSync(join(root, "edit/index.html"), PAGE);
    expect(checkDist(join(root, "nothing-here")).problems).toEqual([
      `${join(root, "nothing-here")}: not found`,
    ]);
    const partial = mkdtempSync(join(tmpdir(), "zz-web-dist-"));
    writeFileSync(join(partial, "index.html"), PAGE);
    expect(checkDist(partial).problems).toContain(
      "create/index.html: required page missing",
    );
  });
});
