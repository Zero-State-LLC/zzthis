import { byId, say, show } from "../lib/dom.ts";
import { messageFor } from "../lib/errors.ts";
import type { PageEnv } from "../lib/page.ts";
import { t } from "../lib/strings.ts";

// Account (spec 005 Web client, /account/): the provider, Sign out, and
// Delete account after the Delete confirm pattern. Signing out and
// deleting clear the in-memory token; the server clears the cookie.
export async function mountAccount(env: PageEnv): Promise<void> {
  const { doc, api } = env;
  const status = byId(doc, "status");
  const dialog = byId<HTMLDialogElement>(doc, "delete-dialog");
  say(status, "common.loading");
  try {
    if ((await api.ensureSession()) === null) {
      say(status, null);
      return show(byId(doc, "account-signed-out"));
    }
    const me = await api.me();
    say(status, null);
    // An account has one provider; {provider} is the first entry's name.
    const provider = me.providers[0];
    if (provider !== undefined) {
      say(byId(doc, "signed-in-with"), "account.signed_in_with", {
        provider: t(`provider.${provider}`),
      });
    }
  } catch (error) {
    return say(status, messageFor(error, "read"));
  }
  show(byId(doc, "account"));
  byId(doc, "sign-out").addEventListener("click", async () => {
    try {
      await api.signOut();
      env.go("/");
    } catch (error) {
      // Signing out saves nothing, so a failure is not "Nothing was saved".
      say(status, messageFor(error, "read"));
    }
  });
  byId(doc, "delete-open").addEventListener("click", () => dialog.showModal());
  byId(doc, "delete-cancel").addEventListener("click", () => dialog.close());
  byId(doc, "delete-confirm").addEventListener("click", async () => {
    dialog.close();
    try {
      await api.deleteMe();
      env.go("/");
    } catch (error) {
      say(status, messageFor(error, "delete"));
    }
  });
}
