import { byId, say, show } from "../lib/dom.ts";
import { messageFor } from "../lib/errors.ts";
import type { PageEnv } from "../lib/page.ts";
import { loadOwned } from "./owned.ts";

// Edit record (spec 005 Web client, /edit/?id=): fields filled from
// GET /v1/records/{id}, one Save. Success returns to Code detail with
// edit.saved; a failure keeps the text and shows the error.
export async function mountEdit(env: PageEnv): Promise<void> {
  const { doc, api } = env;
  const owned = await loadOwned(env, "edit-signed-out");
  if (owned === null) return;
  const form = byId<HTMLFormElement>(doc, "edit-form");
  const title = byId<HTMLInputElement>(doc, "edit-title");
  const body = byId<HTMLTextAreaElement>(doc, "edit-body");
  const message = byId(doc, "edit-message");
  const save = byId<HTMLButtonElement>(doc, "edit-save");
  title.value = owned.record.title;
  body.value = owned.record.body;
  show(form);
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (title.value.trim() === "") return say(message, "create.title_required");
    save.disabled = true;
    say(message, null);
    try {
      await api.addVersion(owned.code.record_id, title.value, body.value);
      env.go(`/code/?id=${encodeURIComponent(owned.id)}&saved=1`);
    } catch (error) {
      say(message, messageFor(error, "write"));
    } finally {
      save.disabled = false;
    }
  });
}
