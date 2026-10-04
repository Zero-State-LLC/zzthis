import { consoleCopy, parsedStatus } from "../content/console";
import { b4Line, flowBCopy } from "../content/demo";
import { mockCodes, type MockCode } from "../content/demo";
import { formatCode } from "../lib/grammar";
import {
  lookupCode,
  readCandidate,
  type CandidateRead,
} from "../lib/consoleLookup";

const ROI = { x: 0.19, y: 0.4505, w: 0.53, h: 0.412 };
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
const HERO_CODE = "zz-copper-lantern-sky-zz";

interface View {
  input: HTMLInputElement;
  tokensEl: HTMLOListElement;
  statusEl: HTMLElement;
  resultEl: HTMLElement;
  candidate: string;
}

interface TransitionHandle {
  finished: Promise<void>;
}

type TransitionDocument = Document & {
  startViewTransition?: (update: () => void) => TransitionHandle;
};

function prefersReducedMotion(): boolean {
  return matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function el(tag: string, className: string, text?: string): HTMLElement {
  const node = document.createElement(tag);
  if (className !== "") node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function channel(data: Uint8ClampedArray, index: number): number {
  return data[index] ?? 0;
}

function bayerAt(x: number, y: number): number {
  return BAYER[(y % 4) * 4 + (x % 4)] ?? 0;
}

function cssChannels(name: string): Uint8ClampedArray {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  if (!context) return new Uint8ClampedArray([0, 0, 0, 255]);
  const color = getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
  context.fillStyle = color;
  context.fillRect(0, 0, 1, 1);
  return context.getImageData(0, 0, 1, 1).data;
}

function ditherPixels(
  data: Uint8ClampedArray,
  width: number,
  dark: Uint8ClampedArray,
  light: Uint8ClampedArray,
): void {
  for (let index = 0; index < data.length; index += 4) {
    const pixel = index / 4;
    const x = pixel % width;
    const y = Math.floor(pixel / width);
    const lum =
      (0.2126 * channel(data, index) +
        0.7152 * channel(data, index + 1) +
        0.0722 * channel(data, index + 2)) /
      255;
    const on = lum * 1.35 - 0.12 > (bayerAt(x, y) + 0.5) / 16;
    const ink = on ? light : dark;
    data[index] = channel(ink, 0);
    data[index + 1] = channel(ink, 1);
    data[index + 2] = channel(ink, 2);
  }
}

function drawDither(image: HTMLImageElement, canvas: HTMLCanvasElement): void {
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context || image.naturalWidth === 0) return;
  const width = image.naturalWidth;
  const height = image.naturalHeight;
  context.drawImage(
    image,
    ROI.x * width,
    ROI.y * height,
    ROI.w * width,
    ROI.h * height,
    0,
    0,
    canvas.width,
    canvas.height,
  );
  try {
    const frame = context.getImageData(0, 0, canvas.width, canvas.height);
    ditherPixels(
      frame.data,
      canvas.width,
      cssChannels("--color-dither-dark"),
      cssChannels("--color-dither-light"),
    );
    context.putImageData(frame, 0, 0);
  } catch {
    // A tainted canvas keeps the plain crop.
  }
}

function paintTokens(view: View, words: readonly string[], open: string): void {
  const parts: readonly (readonly [string, string])[] = [
    [open, consoleCopy.tokenMarker],
    ...words.map((word): readonly [string, string] => [
      word,
      consoleCopy.tokenWord,
    ]),
    [open, consoleCopy.tokenMarker],
  ];
  parts.forEach(([text, kind], index) => {
    const item = el(
      "li",
      kind === consoleCopy.tokenMarker ? "tok tok--mark" : "tok",
    );
    item.style.setProperty("--i", String(index));
    item.append(el("span", "", text), el("small", "", kind));
    view.tokensEl.append(item);
  });
}

function statusFor(read: CandidateRead): string {
  if (read.kind === "parsed") {
    const how =
      read.variant === "circled"
        ? consoleCopy.circledMarkers
        : consoleCopy.dashMarkers;
    return parsedStatus(how, read.words.length, read.normalized);
  }
  if (read.kind === "coming-later") return consoleCopy.comingLater;
  if (read.kind === "empty") return consoleCopy.empty;
  return b4Line(read.reason);
}

function showCandidate(view: View, text: string): void {
  view.candidate = text;
  const read = readCandidate(text);
  view.input.setAttribute("aria-invalid", String(read.kind === "malformed"));
  view.tokensEl.replaceChildren();
  view.statusEl.textContent = statusFor(read);
  view.statusEl.classList.toggle("is-bad", read.kind === "malformed");
  if (read.kind === "parsed") {
    paintTokens(view, read.words, read.variant === "circled" ? "(zz)" : "zz");
    return;
  }
  if (read.kind === "coming-later") {
    view.resultEl.replaceChildren(el("p", "", consoleCopy.comingLater));
  }
}

function paintRecord(view: View, code: MockCode): HTMLElement {
  const card = el("article", "rec");
  const codeLine = el("p", "rec__code", code.code);
  const list = el("dl", "");
  for (const field of code.fields) {
    const row = el("div", "");
    row.append(el("dt", "", field.label), el("dd", "", field.value));
    list.append(row);
  }
  card.append(
    codeLine,
    el("p", "rec__kind", code.kind),
    list,
    el("p", "rec__foot", consoleCopy.recordFoot),
  );
  view.resultEl.append(card);
  return codeLine;
}

function renderResult(view: View): HTMLElement | null {
  const result = lookupCode(view.candidate, mockCodes);
  view.resultEl.replaceChildren();
  if (result.kind === "coming-later") {
    view.resultEl.append(el("p", "", consoleCopy.comingLater));
    return null;
  }
  if (result.kind === "resolved") return paintRecord(view, result.code);
  const miss = el("div", "miss");
  if (result.kind === "abstain-unknown") {
    miss.append(
      el("p", "", consoleCopy.miss),
      el("p", "miss__why", consoleCopy.missNote),
    );
  } else if (result.kind === "abstain-bare") {
    miss.append(el("p", "", flowBCopy.bare));
  } else {
    miss.append(el("p", "", b4Line(result.reason)));
  }
  view.resultEl.append(miss);
  return null;
}

function beginTransition(update: () => void): TransitionHandle | undefined {
  const start = (document as TransitionDocument).startViewTransition;
  if (prefersReducedMotion() || typeof start !== "function") return undefined;
  return start.call(document, update);
}

function canTransition(): boolean {
  const start = (document as TransitionDocument).startViewTransition;
  return !prefersReducedMotion() && typeof start === "function";
}

function lookUp(view: View): void {
  if (!canTransition()) {
    renderResult(view);
    return;
  }
  view.tokensEl.style.viewTransitionName = "zz-code";
  const transition = beginTransition(() => {
    view.tokensEl.style.viewTransitionName = "";
    const code = renderResult(view);
    if (code) code.style.viewTransitionName = "zz-code";
  });
  void transition?.finished.finally(() => {
    const code = view.resultEl.querySelector(".rec__code");
    if (code instanceof HTMLElement) code.style.viewTransitionName = "";
  });
}

function queryButton(
  root: ParentNode,
  selector: string,
): HTMLButtonElement | null {
  const node = root.querySelector(selector);
  return node instanceof HTMLButtonElement ? node : null;
}

function bindTyping(root: ParentNode, view: View): void {
  view.input.addEventListener("input", () => {
    showCandidate(view, view.input.value);
    if (readCandidate(view.input.value).kind !== "coming-later") {
      view.resultEl.replaceChildren();
    }
  });
  view.input.addEventListener("keydown", (event) => {
    if (event.key === "Enter") lookUp(view);
  });
  for (const chip of root.querySelectorAll("[data-example]")) {
    chip.addEventListener("click", () => {
      view.input.value = chip.textContent ?? "";
      showCandidate(view, view.input.value);
      lookUp(view);
    });
  }
}

function bindCamera(
  root: ParentNode,
  view: View,
  image: HTMLImageElement,
  canvas: HTMLCanvasElement,
): () => void {
  const cam = root.querySelector("[data-cam]");
  const readout = root.querySelector("[data-readout]");
  const read = queryButton(root, "[data-read]");
  if (
    !(cam instanceof HTMLElement) ||
    !(readout instanceof HTMLElement) ||
    !read
  ) {
    return () => undefined;
  }
  const photograph = (): void => {
    cam.classList.remove("is-read");
    readout.hidden = true;
    const roi = cam.querySelector(".cam__roi");
    if (roi instanceof HTMLElement) {
      roi.style.setProperty("--roi-w", `${roi.clientWidth}px`);
    }
    cam.classList.add("is-scanning");
    window.setTimeout(
      () => {
        cam.classList.remove("is-scanning");
        drawDither(image, canvas);
        cam.classList.add("is-read");
        readout.hidden = false;
        showCandidate(view, HERO_CODE);
        lookUp(view);
      },
      prefersReducedMotion() ? 0 : 950,
    );
  };
  read.addEventListener("click", photograph);
  document.addEventListener("themechange", () => {
    if (cam.classList.contains("is-read")) drawDither(image, canvas);
  });
  return photograph;
}

function bindVoice(root: ParentNode, view: View): void {
  const voice = queryButton(root, "[data-voice]");
  const heard = root.querySelector("[data-heard]");
  if (!voice || !(heard instanceof HTMLElement)) return;
  voice.addEventListener("click", () => {
    heard.hidden = false;
    showCandidate(view, formatCode(["copper", "lantern", "sky"]));
    lookUp(view);
  });
}

function applyTab(
  tab: HTMLButtonElement,
  view: View,
  heard: HTMLElement | null,
  photograph: () => void,
): void {
  const name = tab.dataset.tab;
  if (name === "typing") showCandidate(view, view.input.value);
  if (name === "camera") photograph();
  if (name === "voice") {
    if (heard) heard.hidden = true;
    view.tokensEl.replaceChildren();
    view.statusEl.textContent = consoleCopy.voiceWaiting;
    view.statusEl.classList.remove("is-bad");
  }
}

function selectTab(
  tabs: readonly HTMLButtonElement[],
  tab: HTMLButtonElement,
  focus: boolean,
  view: View,
  heard: HTMLElement | null,
  photograph: () => void,
): void {
  for (const item of tabs) {
    const on = item === tab;
    item.setAttribute("aria-selected", String(on));
    item.tabIndex = on ? 0 : -1;
    const panelId = item.getAttribute("aria-controls");
    const panel = panelId ? document.getElementById(panelId) : null;
    if (panel) panel.hidden = !on;
  }
  if (focus) tab.focus();
  view.resultEl.replaceChildren();
  applyTab(tab, view, heard, photograph);
}

function bindTabs(
  root: ParentNode,
  view: View,
  photograph: () => void,
): HTMLButtonElement[] {
  const tabs = [...root.querySelectorAll('[role="tab"]')].filter(
    (node): node is HTMLButtonElement => node instanceof HTMLButtonElement,
  );
  const heardNode = root.querySelector("[data-heard]");
  const heard = heardNode instanceof HTMLElement ? heardNode : null;
  tabs.forEach((tab, index) => {
    tab.addEventListener("click", () => {
      selectTab(tabs, tab, false, view, heard, photograph);
    });
    tab.addEventListener("keydown", (event) => {
      const step =
        event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
      if (step === 0) return;
      const next = tabs[(index + step + tabs.length) % tabs.length];
      if (next) selectTab(tabs, next, true, view, heard, photograph);
    });
  });
  return tabs;
}

function focusTyping(
  consoleEl: HTMLElement,
  tabs: readonly HTMLButtonElement[],
  view: View,
  photograph: () => void,
): void {
  const typing = tabs.find((tab) => tab.dataset.tab === "typing");
  const heardNode = consoleEl.querySelector("[data-heard]");
  const heard = heardNode instanceof HTMLElement ? heardNode : null;
  if (!typing) return;
  selectTab(tabs, typing, false, view, heard, photograph);
  consoleEl.scrollIntoView({
    behavior: prefersReducedMotion() ? "auto" : "smooth",
    block: "center",
  });
  view.input.focus({ preventScroll: true });
  view.input.select();
}

function bindShortcut(
  consoleEl: HTMLElement,
  tabs: readonly HTMLButtonElement[],
  view: View,
  photograph: () => void,
): void {
  const open = (): void => focusTyping(consoleEl, tabs, view, photograph);
  const pill = document.querySelector("[data-pill]");
  if (pill) pill.addEventListener("click", open);
  document.addEventListener("keydown", (event) => {
    if (event.key !== "/" || !event.altKey || event.ctrlKey || event.metaKey) {
      return;
    }
    const target = event.target;
    if (
      target instanceof Element &&
      target.closest("input, textarea, select, [contenteditable]")
    ) {
      return;
    }
    event.preventDefault();
    open();
  });
  window.addEventListener("hashchange", () => {
    if (location.hash === "#lookup") open();
  });
}

function startCamera(image: HTMLImageElement, photograph: () => void): void {
  if (location.hash === "#lookup") return;
  if (image.complete) photograph();
  else image.addEventListener("load", photograph, { once: true });
}

export function mountConsole(root: ParentNode = document): void {
  const consoleEl = root.querySelector("[data-console]");
  const input = root.querySelector("[data-input]");
  const tokensEl = root.querySelector("[data-tokens]");
  const statusEl = root.querySelector("[data-status]");
  const resultEl = root.querySelector("[data-result]");
  const lookup = queryButton(root, "[data-lookup]");
  const image = root.querySelector("[data-cam-img]");
  const canvas = root.querySelector("[data-dither]");
  if (
    !(consoleEl instanceof HTMLElement) ||
    consoleEl.dataset.mounted === "true" ||
    !(input instanceof HTMLInputElement) ||
    !(tokensEl instanceof HTMLOListElement) ||
    !(statusEl instanceof HTMLElement) ||
    !(resultEl instanceof HTMLElement) ||
    !lookup ||
    !(image instanceof HTMLImageElement) ||
    !(canvas instanceof HTMLCanvasElement)
  ) {
    return;
  }
  consoleEl.dataset.mounted = "true";
  const view: View = {
    input,
    tokensEl,
    statusEl,
    resultEl,
    candidate: "",
  };
  bindTyping(consoleEl, view);
  lookup.addEventListener("click", () => lookUp(view));
  const photograph = bindCamera(consoleEl, view, image, canvas);
  bindVoice(consoleEl, view);
  const tabs = bindTabs(consoleEl, view, photograph);
  bindShortcut(consoleEl, tabs, view, photograph);
  if (location.hash === "#lookup") {
    focusTyping(consoleEl, tabs, view, photograph);
    return;
  }
  startCamera(image, photograph);
}
