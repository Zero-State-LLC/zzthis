import { readdirSync, readFileSync, statSync, existsSync } from "node:fs";
import { join, relative } from "node:path";

const DIST = "dist";
const BASE = "/zzthis/";
const MAX_FILE = 2 * 1024 * 1024;
const MAX_TOTAL = 20 * 1024 * 1024;
const REQUIRED = [
  "index.html",
  "404.html",
  "how-it-works/index.html",
  "applications/index.html",
  "about/index.html",
  "contact/index.html",
  "demo/index.html",
];
// Q1 [MICHAEL 2026-10-02]: the hero H1 keeps its em dash. This is the only
// em dash allowed in rendered copy.
const ALLOWED_EM_DASH = "writable\u2014and smart.";
const FOOTER_NOTICE = "Patent pending";
// "did you mean": a lookup miss must not suggest other codes (issue #12).
const BANNED_PHRASES = [
  "pilot customer",
  "endorsed",
  "adopted by",
  "did you mean",
];
const NSF_FIGURES = ["95%", "99%", "99.9%", "0.1%", "30% fewer"];
const BANNED_APIS = [
  "getUserMedia",
  "fetch(",
  "localStorage",
  "sessionStorage",
  "indexedDB",
  "document.cookie",
  "serviceWorker",
];

const problems = [];
const report = (file, message) => problems.push(`${file}: ${message}`);

function walk(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}

function renderedText(html) {
  return html
    .replace(/<script\b[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&mdash;|&#8212;|&#x2014;/gi, "\u2014");
}

function collectPaths(content) {
  const paths = [];
  for (const m of content.matchAll(/\b(?:href|src)="([^"]*)"/g)) {
    paths.push(m[1]);
  }
  for (const m of content.matchAll(/\bsrcset="([^"]*)"/g)) {
    for (const part of m[1].split(",")) paths.push(part.trim().split(/\s+/)[0]);
  }
  for (const m of content.matchAll(/url\(\s*['"]?([^'")]*)/g)) {
    paths.push(m[1]);
  }
  return paths;
}

function checkRootPaths(file, content) {
  for (const path of collectPaths(content)) {
    if (path.startsWith("/") && !path.startsWith(BASE)) {
      report(file, `root path without base: ${path}`);
    }
  }
}

function checkExternalOrigins(file, content) {
  const resourceSrc =
    /<(?:img|script|source|iframe|video|audio|embed)\b[^>]*\ssrc="(?:https?:)?\/\/[^"]*"/gi;
  const linkHref = /<link\b[^>]*\shref="(?:https?:)?\/\/[^"]*"/gi;
  for (const m of content.matchAll(resourceSrc))
    report(file, `external src: ${m[0]}`);
  for (const m of content.matchAll(linkHref))
    report(file, `external link: ${m[0]}`);
}

function checkText(file, html) {
  const text = renderedText(html);
  const lower = text.toLowerCase();
  if (text.split(ALLOWED_EM_DASH).join(" ").includes("\u2014"))
    report(file, "em dash in rendered text");
  if (!text.includes(FOOTER_NOTICE)) report(file, "missing footer notice");
  for (const phrase of BANNED_PHRASES) {
    if (lower.includes(phrase)) report(file, `banned phrase: ${phrase}`);
  }
  for (const figure of NSF_FIGURES) {
    if (text.includes(figure)) report(file, `NSF figure: ${figure}`);
  }
}

function checkHeadings(file, html) {
  const levels = [...html.matchAll(/<h([1-6])\b/gi)].map((m) => Number(m[1]));
  const h1Count = levels.filter((level) => level === 1).length;
  if (h1Count !== 1) report(file, `expected 1 h1, found ${h1Count}`);
  let previous = 0;
  for (const level of levels) {
    if (level > previous + 1)
      report(file, `heading skips from h${previous} to h${level}`);
    previous = level;
  }
}

function checkApis(file, content) {
  for (const api of BANNED_APIS) {
    if (content.includes(api)) report(file, `banned API: ${api}`);
  }
}

function checkFile(full) {
  const file = relative(DIST, full);
  const size = statSync(full).size;
  if (size > MAX_FILE) report(file, `file exceeds 2 MB (${size} bytes)`);
  const isHtml = file.endsWith(".html");
  const isJs = file.endsWith(".js") || file.endsWith(".mjs");
  const isCss = file.endsWith(".css");
  if (!isHtml && !isJs && !isCss) return size;
  const content = readFileSync(full, "utf8");
  checkRootPaths(file, content);
  if (isHtml || isJs) checkApis(file, content);
  if (isHtml) {
    if (content.includes("/technology")) report(file, "links to /technology");
    checkExternalOrigins(file, content);
    checkText(file, content);
    checkHeadings(file, content);
  }
  return size;
}

function main() {
  if (!existsSync(DIST)) {
    console.error("check-dist: dist/ not found");
    process.exit(1);
  }
  for (const page of REQUIRED) {
    if (!existsSync(join(DIST, page))) report(page, "required file missing");
  }
  if (existsSync(join(DIST, "technology")))
    report("technology", "route must not exist");
  const files = walk(DIST);
  const total = files.reduce((sum, full) => sum + checkFile(full), 0);
  if (total > MAX_TOTAL)
    report("dist", `total size exceeds 20 MB (${total} bytes)`);
  if (problems.length > 0) {
    console.error(`check-dist: ${problems.length} problem(s)`);
    for (const problem of problems) console.error(`  ${problem}`);
    process.exit(1);
  }
  const htmlCount = files.filter((f) => f.endsWith(".html")).length;
  console.log(`check-dist: ok (${htmlCount} html files)`);
}

main();
