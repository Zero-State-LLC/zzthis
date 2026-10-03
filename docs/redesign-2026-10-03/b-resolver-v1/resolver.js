// Sample B · Resolver. The parser and resolver are a straight port of the live
// demo's src/lib/grammar.ts and src/lib/resolver.ts: exact match only, no guesses.
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

// ---- grammar.ts ----
const MIN_WORDS = 2;
const MAX_WORDS = 5;
const WORD = /^[a-z0-9]+$/;

function splitMarkers(text) {
  if (text.startsWith("(zz)")) return { variant: "circled", body: text.slice(4).replace(/\(zz\)$/, "") };
  if (/^zz[-\s]/.test(text)) return { variant: "dash", body: text.slice(3).replace(/[-\s]zz$/, "") };
  return null;
}

function parseCode(input) {
  const text = input.trim().toLowerCase();
  if (text === "") return { ok: false, reason: "empty" };
  const marked = splitMarkers(text);
  if (marked === null) return { ok: false, reason: "no-marker" };
  const words = marked.body.split(/[-\s]+/).filter((w) => w !== "");
  if (words.length < MIN_WORDS || words.length > MAX_WORDS) return { ok: false, reason: "word-count" };
  if (!words.every((w) => WORD.test(w))) return { ok: false, reason: "invalid-word" };
  return { ok: true, words, variant: marked.variant };
}

const formatCode = (words) => `zz-${words.join("-")}-zz`;

// ---- resolver.ts ----
function resolve(input, codes) {
  const parsed = parseCode(input);
  if (!parsed.ok) return { kind: "abstain-malformed", reason: parsed.reason };
  const normalized = formatCode(parsed.words);
  const exact = codes.find((entry) => entry.code === normalized);
  return exact === undefined ? { kind: "abstain-unknown" } : { kind: "resolved", code: exact };
}

// ---- demo.ts mock records ----
const MOCK = [
  {
    code: "zz-copper-lantern-sky-zz",
    kind: "Crate, field supply (mock)",
    fields: [
      ["NSN", "MOCK-0000-00-000-0001"],
      ["Document number", "MOCK-DOC-0001"],
      ["Hand receipt", "MOCK-HR-01"],
      ["Photo", "Attached (mock image)"],
    ],
  },
  {
    code: "zz-river-maple-sky-zz",
    kind: "Parcel (mock)",
    fields: [
      ["Reference", "MOCK-PARCEL-01"],
      ["Status", "Ready for drop-off (mock)"],
    ],
  },
  {
    code: "zz-blue-bike-astoria-zz",
    kind: "Physical thing: bicycle (mock)",
    fields: [["Owner contact", "Withheld: public code, protected record (mock)"]],
  },
  { code: "zz-b2-4-zz", kind: "Duffel group B2, item 4 (mock)", fields: [["Hand receipt", "MOCK-HR-02"]] },
];

const COPY = {
  unknown: "No match. The demo will not guess. Check the words and try again.",
  malformed: "This is not a zz code. Use the form zz-word-word-zz.",
};

// ---- DOM ----
const $ = (sel, root = document) => root.querySelector(sel);
const el = (tag, cls, text) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text !== undefined) n.textContent = text;
  return n;
};

const tokensEl = $("[data-tokens]");
const statusEl = $("[data-status]");
const resultEl = $("[data-result]");
const input = $("[data-input]");
let candidate = "";

function showCandidate(text) {
  candidate = text;
  const parsed = parseCode(text);
  input.setAttribute("aria-invalid", String(!parsed.ok && parsed.reason !== "empty"));
  tokensEl.replaceChildren();
  if (parsed.ok) {
    const open = parsed.variant === "circled" ? "(zz)" : "zz";
    const parts = [[open, "marker"], ...parsed.words.map((w) => [w, "word"]), [open, "marker"]];
    parts.forEach(([t, kind], i) => {
      const li = el("li", kind === "marker" ? "tok tok--mark" : "tok");
      li.style.setProperty("--i", String(i));
      li.append(el("span", "", t), el("small", "", kind));
      tokensEl.append(li);
    });
    const how = parsed.variant === "circled" ? "circled markers" : "dash markers";
    statusEl.textContent = `Parsed: ${how}, ${parsed.words.length} words. Normalized: ${formatCode(parsed.words)}`;
    statusEl.classList.remove("is-bad");
  } else {
    statusEl.textContent = parsed.reason === "empty" ? "Type a zz code." : `${COPY.malformed} (reason: ${parsed.reason})`;
    statusEl.classList.toggle("is-bad", parsed.reason !== "empty");
  }
}

function renderResult() {
  const r = resolve(candidate, MOCK);
  resultEl.replaceChildren();
  if (r.kind === "resolved") {
    const card = el("article", "rec");
    const code = el("p", "rec__code", r.code.code);
    const dl = el("dl");
    for (const [k, v] of r.code.fields) {
      const row = el("div");
      row.append(el("dt", "", k), el("dd", "", v));
      dl.append(row);
    }
    card.append(code, el("p", "rec__kind", r.code.kind), dl, el("p", "rec__foot", "Mock record. No network request was made."));
    resultEl.append(card);
    return code;
  }
  const miss = el("div", "miss");
  if (r.kind === "abstain-unknown") {
    miss.append(el("p", "", COPY.unknown), el("p", "miss__why", "Exact match only. A miss never suggests other codes."));
  } else {
    miss.append(el("p", "", COPY.malformed), el("p", "miss__why", `reason: ${r.reason}`));
  }
  resultEl.append(miss);
  return null;
}

// The parsed token row morphs into the record's code line (same-document View Transition).
function lookUp() {
  if (!document.startViewTransition || reduceMotion) {
    renderResult();
    return;
  }
  tokensEl.style.viewTransitionName = "zz-code";
  const t = document.startViewTransition(() => {
    tokensEl.style.viewTransitionName = "";
    const code = renderResult();
    if (code) code.style.viewTransitionName = "zz-code";
  });
  t.finished.finally(() => {
    const code = $(".rec__code", resultEl);
    if (code) code.style.viewTransitionName = "";
  });
}

$("[data-lookup]").addEventListener("click", lookUp);

// ---- Typing ----
input.addEventListener("input", () => {
  showCandidate(input.value);
  resultEl.replaceChildren();
});
input.addEventListener("keydown", (e) => {
  if (e.key === "Enter") lookUp();
});
for (const chip of document.querySelectorAll("[data-example]")) {
  chip.addEventListener("click", () => {
    input.value = chip.textContent;
    showCandidate(input.value);
    lookUp();
  });
}

// ---- Camera (simulated): dither what the machine looks at, then read. ----
const cam = $("[data-cam]");
const camImg = $("[data-cam-img]");
const canvas = $("[data-dither]");
const readout = $("[data-readout]");
const ROI = { x: 0.19, y: 0.4505, w: 0.53, h: 0.412 };
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];

function cssColor(name) {
  const probe = document.createElement("canvas").getContext("2d");
  probe.fillStyle = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  probe.fillRect(0, 0, 1, 1);
  return probe.getImageData(0, 0, 1, 1).data;
}

function drawDither() {
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  const { naturalWidth: W, naturalHeight: H } = camImg;
  ctx.drawImage(camImg, ROI.x * W, ROI.y * H, ROI.w * W, ROI.h * H, 0, 0, canvas.width, canvas.height);
  try {
    const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const d = img.data;
    const dark = cssColor("--color-dither-dark");
    const light = cssColor("--color-dither-light");
    for (let i = 0; i < d.length; i += 4) {
      const p = i / 4;
      const x = p % canvas.width;
      const y = Math.floor(p / canvas.width);
      const lum = (0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2]) / 255;
      const on = lum * 1.35 - 0.12 > (BAYER[(y % 4) * 4 + (x % 4)] + 0.5) / 16;
      const c = on ? light : dark;
      d[i] = c[0];
      d[i + 1] = c[1];
      d[i + 2] = c[2];
    }
    ctx.putImageData(img, 0, 0);
  } catch {
    // A file:// preview taints the canvas; keep the plain crop.
  }
}

function photograph() {
  cam.classList.remove("is-read");
  readout.hidden = true;
  $(".cam__roi").style.setProperty("--roi-w", `${$(".cam__roi").clientWidth}px`);
  cam.classList.add("is-scanning");
  const done = () => {
    cam.classList.remove("is-scanning");
    drawDither();
    cam.classList.add("is-read");
    readout.hidden = false;
    showCandidate("zz-copper-lantern-sky-zz");
    lookUp();
  };
  setTimeout(done, reduceMotion ? 0 : 950);
}
$("[data-read]").addEventListener("click", photograph);

// ---- Voice (simulated transcript only) ----
$("[data-voice]").addEventListener("click", () => {
  $("[data-heard]").hidden = false;
  showCandidate(formatCode(["copper", "lantern", "sky"]));
  lookUp();
});

// ---- Tabs: arrow keys move between Camera, Typing, Voice ----
const tabs = [...document.querySelectorAll('[role="tab"]')];
function selectTab(tab, focus = true) {
  for (const t of tabs) {
    const on = t === tab;
    t.setAttribute("aria-selected", String(on));
    t.tabIndex = on ? 0 : -1;
    document.getElementById(t.getAttribute("aria-controls")).hidden = !on;
  }
  if (focus) tab.focus();
  resultEl.replaceChildren();
  if (tab.dataset.tab === "typing") showCandidate(input.value);
  if (tab.dataset.tab === "camera") photograph();
  if (tab.dataset.tab === "voice") {
    $("[data-heard]").hidden = true;
    tokensEl.replaceChildren();
    statusEl.textContent = "Waiting for simulated voice input.";
  }
}
tabs.forEach((tab, i) => {
  tab.addEventListener("click", () => selectTab(tab, false));
  tab.addEventListener("keydown", (e) => {
    const step = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
    if (step) selectTab(tabs[(i + step + tabs.length) % tabs.length]);
  });
});

document.addEventListener("themechange", () => {
  if (cam.classList.contains("is-read")) drawDither();
});

// ---- Pill and "/" shortcut: jump to the console in typing mode ----
function focusTyping() {
  selectTab(tabs[1], false);
  $("[data-console]").scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" });
  input.focus({ preventScroll: true });
  input.select();
}
$("[data-pill]").addEventListener("click", focusTyping);
document.addEventListener("keydown", (e) => {
  if (e.key === "/" && !e.target.closest("input, textarea")) {
    e.preventDefault();
    focusTyping();
  }
});

// One orchestrated entrance: the camera reads the hero crate once.
// Arriving from the pill on another page (#lookup) opens typing instead.
if (location.hash === "#lookup") focusTyping();
window.addEventListener("hashchange", () => {
  if (location.hash === "#lookup") focusTyping();
});
if (location.hash !== "#lookup" && camImg.complete) photograph();
else if (location.hash !== "#lookup") camImg.addEventListener("load", photograph, { once: true });
