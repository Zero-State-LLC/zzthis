import { ApiFailure, type Code } from "../lib/api.ts";
import { byId, canShare, renderCode, say, share, show } from "../lib/dom.ts";
import { messageFor } from "../lib/errors.ts";
import type { PageEnv } from "../lib/page.ts";

// The minted code (design/UX.md Minted code). Re-roll shows while
// rerolls_remaining is above 0; at the cap the button goes and
// minted.reroll_cap shows. The web has no camera, so no Write check.
function mountMinted(env: PageEnv, first: Code): void {
  const { doc, api } = env;
  const codeElement = byId(doc, "minted-code");
  const reroll = byId<HTMLButtonElement>(doc, "reroll");
  const cap = byId(doc, "reroll-cap");
  const message = byId(doc, "minted-message");
  const shareButton = byId<HTMLButtonElement>(doc, "minted-share");
  let code = first;

  function render(next: Code): void {
    code = next;
    renderCode(
      doc,
      codeElement,
      next.canonical,
      next.check_word,
      "check-word-label",
    );
    show(reroll, next.rerolls_remaining > 0);
    show(cap, next.rerolls_remaining === 0);
    show(shareButton, canShare(env.nav));
  }

  reroll.addEventListener("click", async () => {
    reroll.disabled = true;
    say(message, null);
    try {
      render(await api.reroll(code.id));
    } catch (error) {
      // These words stay: the current code remains on screen.
      if (error instanceof ApiFailure && error.code === "reroll-cap") {
        show(reroll, false);
        show(cap);
      } else {
        say(message, messageFor(error, "create"));
      }
    } finally {
      reroll.disabled = false;
    }
  });
  shareButton.addEventListener(
    "click",
    () => void share(env.nav, code.canonical),
  );
  render(first);
  show(byId(doc, "minted"));
}

// Create (spec 005 Web client, /create/): the server chooses the words.
export async function mountCreate(env: PageEnv): Promise<void> {
  const { doc, api } = env;
  const status = byId(doc, "status");
  const form = byId<HTMLFormElement>(doc, "create-form");
  const title = byId<HTMLInputElement>(doc, "create-title");
  const body = byId<HTMLTextAreaElement>(doc, "create-body");
  const message = byId(doc, "create-message");
  const submit = byId<HTMLButtonElement>(doc, "create-submit");
  say(status, "common.loading");
  try {
    if ((await api.ensureSession()) === null) {
      say(status, null);
      return show(byId(doc, "create-signed-out"));
    }
    const discovery = await api.discovery();
    say(status, null);
    // The client never invents a code while free_public is off.
    if (!discovery.free_public) return show(byId(doc, "create-unavailable"));
  } catch (error) {
    return say(status, messageFor(error, "create"));
  }
  show(form);
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    // A title of only spaces is not sent (FR-007).
    if (title.value.trim() === "") return say(message, "create.title_required");
    submit.disabled = true;
    say(message, null);
    try {
      const code = await api.mint(title.value, body.value);
      show(form, false);
      mountMinted(env, code);
    } catch (error) {
      // The fields keep what the person typed.
      say(message, messageFor(error, "create"));
    } finally {
      submit.disabled = false;
    }
  });
}
