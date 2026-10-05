// The web build's dist check (spec 005 plan.md Tests, Web build, and T022).
// Over apps/web/dist/**/*.html it fails on a script without src, a <style>
// element, a style= attribute, an on*= attribute, a data: URI, or a
// provider origin outside /signin/. A page other than /signin/ must not
// load, directly or through an import, a script that names a provider.
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const REQUIRED_PAGES = [
  "index.html",
  "create/index.html",
  "codes/index.html",
  "code/index.html",
  "edit/index.html",
  "signin/index.html",
  "account/index.html",
  "licenses/index.html",
];

const SIGNIN = "signin/index.html";
const PROVIDER_ORIGINS = [
  "accounts.google.com",
  "appleid.cdn-apple.com",
  "appleid.apple.com",
];

function walk(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}

function tags(html) {
  return [...html.matchAll(/<[a-z][^>]*>/gi)].map((match) => match[0]);
}

function textOf(html) {
  return html
    .replace(/<script\b[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ");
}

// The JS files a page loads, with every chunk those import, transitively.
function loadedScripts(dist, html) {
  const seen = new Set();
  const queue = [...html.matchAll(/<script\b[^>]*\bsrc="(\/[^"]+)"/gi)].map(
    (match) => join(dist, match[1]),
  );
  while (queue.length > 0) {
    const file = queue.pop();
    if (seen.has(file) || !existsSync(file)) continue;
    seen.add(file);
    const code = readFileSync(file, "utf8");
    for (const match of code.matchAll(
      /(?:from|import)\s*["'](\.{1,2}\/[^"']+)["']/g,
    )) {
      queue.push(resolve(dirname(file), match[1]));
    }
  }
  return [...seen];
}

function checkPage(dist, page, html, report) {
  for (const tag of tags(html)) {
    if (/^<script\b/i.test(tag) && !/\ssrc=/i.test(tag)) {
      report(page, `script without src: ${tag}`);
    }
    if (/^<style\b/i.test(tag)) report(page, "<style> element");
    if (/\sstyle\s*=/i.test(tag)) report(page, `style= attribute: ${tag}`);
    const handler = /\s(on[a-z]+)\s*=/i.exec(tag);
    if (handler !== null) report(page, `${handler[1]}= attribute: ${tag}`);
  }
  if (/\bdata:/i.test(html)) report(page, "data: URI");
  const text = textOf(html);
  if (text.includes("\u2014")) report(page, "em dash in rendered text");
  if (/\bmock\b/i.test(text)) report(page, "user-facing word mock");
  if (/\bchecksums?\b/i.test(text))
    report(page, 'say "check word", not "checksum"');
  if (page === SIGNIN) return;
  const loaded = loadedScripts(dist, html).map((file) => [
    file,
    readFileSync(file, "utf8"),
  ]);
  for (const origin of PROVIDER_ORIGINS) {
    if (html.includes(origin))
      report(page, `provider origin outside /signin/: ${origin}`);
    for (const [file, code] of loaded) {
      if (code.includes(origin)) {
        report(page, `loads ${relative(dist, file)}, which names ${origin}`);
      }
    }
  }
}

export function checkDist(dist) {
  const problems = [];
  const report = (file, message) => problems.push(`${file}: ${message}`);
  if (!existsSync(dist)) return { problems: [`${dist}: not found`], pages: 0 };
  for (const page of REQUIRED_PAGES) {
    if (!existsSync(join(dist, page))) report(page, "required page missing");
  }
  const pages = walk(dist).filter((file) => file.endsWith(".html"));
  for (const file of pages) {
    checkPage(dist, relative(dist, file), readFileSync(file, "utf8"), report);
  }
  return { problems, pages: pages.length };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const dist = resolve(dirname(fileURLToPath(import.meta.url)), "../dist");
  const { problems, pages } = checkDist(dist);
  if (problems.length > 0) {
    console.error(`check-dist (apps/web): ${problems.length} problem(s)`);
    for (const problem of problems) console.error(`  ${problem}`);
    process.exit(1);
  }
  console.log(`check-dist (apps/web): ok (${pages} html files)`);
}
