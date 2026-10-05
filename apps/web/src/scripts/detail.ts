import {
  byId,
  canShare,
  queryParam,
  renderCode,
  say,
  share,
  show,
} from "../lib/dom.ts";
import { messageFor } from "../lib/errors.ts";
import type { PageEnv } from "../lib/page.ts";
import { t } from "../lib/strings.ts";
import { statusKey } from "./codes.ts";
import { loadOwned } from "./owned.ts";

// Code detail (spec 005 Web client, /code/?id=): the code, the title, the
// body as plain text, and Share, Edit, and Revoke. Revoke shows only while
// the code is active; a revoked code shows detail.revoked_note and no Edit.
export async function mountDetail(env: PageEnv): Promise<void> {
  const { doc, api } = env;
  const owned = await loadOwned(env, "detail-signed-out");
  if (owned === null) return;
  const { id, code, record } = owned;
  const state = byId(doc, "detail-state");
  const edit = byId<HTMLAnchorElement>(doc, "detail-edit");
  const revoke = byId<HTMLButtonElement>(doc, "detail-revoke");
  const dialog = byId<HTMLDialogElement>(doc, "revoke-dialog");
  const shareButton = byId<HTMLButtonElement>(doc, "detail-share");

  function showStatus(status: typeof code.status): void {
    state.textContent = t(statusKey(status));
    show(state, status !== "active");
    show(edit, status !== "revoked");
    show(revoke, status === "active");
    show(byId(doc, "detail-revoked"), status === "revoked");
  }

  renderCode(doc, byId(doc, "detail-code"), code.canonical, code.check_word);
  byId(doc, "detail-title").textContent = record.title;
  byId(doc, "detail-body").textContent = record.body;
  edit.href = `/edit/?id=${encodeURIComponent(id)}`;
  show(byId(doc, "detail-saved"), queryParam(env.location, "saved") === "1");
  show(shareButton, canShare(env.nav));
  showStatus(code.status);
  show(byId(doc, "detail"));

  shareButton.addEventListener(
    "click",
    () => void share(env.nav, code.canonical),
  );
  revoke.addEventListener("click", () => dialog.showModal());
  byId(doc, "revoke-cancel").addEventListener("click", () => dialog.close());
  byId(doc, "revoke-confirm").addEventListener("click", async () => {
    dialog.close();
    try {
      await api.revoke(id);
      say(byId(doc, "status"), null);
      showStatus("revoked");
    } catch (error) {
      say(byId(doc, "status"), messageFor(error, "write"));
    }
  });
}
