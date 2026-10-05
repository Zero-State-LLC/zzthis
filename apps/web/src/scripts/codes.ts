import type { OwnedCode } from "../lib/api.ts";
import { byId, say, show } from "../lib/dom.ts";
import { messageFor } from "../lib/errors.ts";
import type { PageEnv } from "../lib/page.ts";
import { t, type StringKey } from "../lib/strings.ts";

export function statusKey(status: OwnedCode["status"]): StringKey {
  return `codes.status_${status}`;
}

// One row: the code in mono, the record title, and a status word when the
// code is not active (design/UX.md My codes).
function row(doc: Document, code: OwnedCode): HTMLLIElement {
  const item = doc.createElement("li");
  const link = doc.createElement("a");
  link.href = `/code/?id=${encodeURIComponent(code.id)}`;
  const canonical = doc.createElement("span");
  canonical.className = "code";
  canonical.textContent = code.canonical;
  const title = doc.createElement("span");
  title.className = "row-title";
  title.textContent = code.title;
  link.append(canonical, title);
  if (code.status !== "active") {
    const state = doc.createElement("span");
    state.className = "row-status";
    state.textContent = t(statusKey(code.status));
    link.append(state);
  }
  item.append(link);
  return item;
}

// My codes (spec 005 Web client, /codes/). Codes retired by a re-roll are
// not listed by the server.
export async function mountCodes(env: PageEnv): Promise<void> {
  const { doc, api } = env;
  const status = byId(doc, "status");
  say(status, "common.loading");
  try {
    if ((await api.ensureSession()) === null) {
      say(status, null);
      return show(byId(doc, "codes-signed-out"));
    }
    const codes = await api.allCodes();
    say(status, null);
    if (codes.length === 0) return show(byId(doc, "codes-empty"));
    const list = byId(doc, "codes-list");
    list.replaceChildren(...codes.map((code) => row(doc, code)));
    show(list);
  } catch (error) {
    say(status, messageFor(error, "read"));
  }
}
