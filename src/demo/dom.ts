import { badgeText, type MockCode, type MockField } from "../content/demo";
import { images, type ImageId } from "../content/images";
import { objectPosition } from "../lib/image";
import { url } from "../lib/url";

interface ElOptions {
  className?: string;
  text?: string;
  attrs?: Readonly<Record<string, string>>;
}

export function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  options: ElOptions = {},
  children: readonly Node[] = [],
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (options.className !== undefined) {
    node.className = options.className;
  }
  if (options.text !== undefined) {
    node.textContent = options.text;
  }
  for (const [name, value] of Object.entries(options.attrs ?? {})) {
    node.setAttribute(name, value);
  }
  node.append(...children);
  return node;
}

export function button(
  label: string,
  onClick: () => void,
  primary = false,
): HTMLButtonElement {
  const node = el("button", {
    className: primary ? "btn btn--primary" : "btn btn--secondary",
    text: label,
    attrs: { type: "button" },
  });
  node.addEventListener("click", onClick);
  return node;
}

export function badge(id: string): HTMLElement {
  return el("p", { className: "demo-badge", text: badgeText, attrs: { id } });
}

export function mount(children: readonly Node[], className = ""): HTMLElement {
  return el("div", { className: `mount ${className}`.trim() }, [
    el("div", { className: "mount__shadow", attrs: { "aria-hidden": "true" } }),
    el("div", { className: "mount__edge" }, [
      el("div", { className: "mount__body demo-mount-body" }, children),
    ]),
  ]);
}

export function stepImage(id: ImageId): HTMLImageElement {
  const meta = images[id];
  const img = el("img", {
    className: "demo-image",
    attrs: {
      src: url(meta.src),
      width: String(meta.width),
      height: String(meta.height),
      alt: meta.alt,
      decoding: "async",
    },
  });
  img.style.objectPosition = objectPosition(meta.focal);
  return img;
}

export function fieldList(fields: readonly MockField[]): HTMLDListElement {
  return el(
    "dl",
    { className: "demo-fields" },
    fields.flatMap((field) => [
      el("dt", { text: field.label }),
      el("dd", { text: field.value }),
    ]),
  );
}

export function recordCard(code: MockCode, heading: "h3" | "h4"): HTMLElement {
  return el("div", { className: "demo-record" }, [
    el("p", { className: "code demo-code", text: code.code }),
    el(heading, { text: code.kind, attrs: { tabindex: "-1" } }),
    fieldList(code.fields),
  ]);
}

export function nextIndex(
  key: string,
  index: number,
  count: number,
): number | null {
  switch (key) {
    case "ArrowLeft":
    case "ArrowUp":
      return (index - 1 + count) % count;
    case "ArrowRight":
    case "ArrowDown":
      return (index + 1) % count;
    case "Home":
      return 0;
    case "End":
      return count - 1;
    default:
      return null;
  }
}
