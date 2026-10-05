import { t, type StringKey } from "./strings.ts";

export function byId<T extends HTMLElement = HTMLElement>(
  doc: Document,
  id: string,
): T {
  const element = doc.getElementById(id);
  if (element === null) throw new Error(`#${id} is missing`);
  return element as T;
}

export function show(element: HTMLElement, visible = true): void {
  element.hidden = !visible;
}

// One sentence in a message element, or none.
export function say(
  element: HTMLElement,
  key: StringKey | null,
  values?: Readonly<Record<string, string>>,
): void {
  element.textContent = key === null ? "" : t(key, values);
  show(element, key !== null);
}

// The code in mono, with the check word wrapped in place so it can carry
// its own label (design/UX.md Minted code). Text only, never markup.
export function renderCode(
  doc: Document,
  target: HTMLElement,
  canonical: string,
  checkWord: string | null,
  checkLabelId?: string,
): void {
  target.replaceChildren();
  const parts = canonical.split("-");
  parts.forEach((part, index) => {
    if (index > 0) target.append("-");
    const isCheck =
      checkWord !== null && index === parts.length - 2 && part === checkWord;
    if (!isCheck) {
      target.append(part);
      return;
    }
    const check = doc.createElement("span");
    check.className = "check-word";
    check.textContent = part;
    if (checkLabelId !== undefined)
      check.setAttribute("aria-describedby", checkLabelId);
    target.append(check);
  });
}

export function queryParam(
  location: Pick<Location, "search">,
  name: string,
): string | null {
  return new URLSearchParams(location.search).get(name);
}

// An internal path to return to after sign-in, never another origin.
export function returnPath(
  location: Pick<Location, "search">,
  fallback: string,
): string {
  const next = queryParam(location, "next");
  return next !== null && next.startsWith("/") && !next.startsWith("//")
    ? next
    : fallback;
}

// Web Share sends the canonical code as text, never a URL (FR-015). When
// the browser has no share sheet, the button is not offered.
export function canShare(nav: Navigator): boolean {
  return typeof nav.share === "function";
}

export async function share(nav: Navigator, text: string): Promise<void> {
  try {
    await nav.share({ text });
  } catch {
    // The person closed the share sheet; nothing to report.
  }
}
