// @vitest-environment happy-dom
import { describe, expect, it, vi } from "vitest";
import { t } from "../src/lib/strings.ts";
import { mountAccount } from "../src/scripts/account.ts";
import {
  APPLE_SCRIPT,
  GOOGLE_SCRIPT,
  loadScript,
  mountSignIn,
} from "../src/scripts/signin.ts";
import {
  el,
  fakeEnv,
  json,
  loadPage,
  settle,
  token,
  visibleText,
  type Handler,
} from "./helpers.ts";

const discovery = (providers: string[]) => ({
  contract: "1",
  free_public: true,
  auth_providers: providers,
  scopes: [],
  wordlist_version: "fixture-7",
  photo_reads: false,
});

function server(
  providers: string[],
  token_: () => Response = () => json(200, token(1)),
): Handler {
  return (call) => {
    if (call.url === "/v1") return json(200, discovery(providers));
    if (call.url === "/v1/auth/nonce")
      return json(200, { nonce: "server-nonce", expires_in: 600 });
    if (call.url === "/v1/auth/token") return token_();
    return json(500);
  };
}

// The local build has no provider settings, so a test adds the containers a
// release build would render.
function configure(google: string, services: string, redirect: string): void {
  const providers = el("providers");
  providers.dataset.googleClientId = google;
  providers.dataset.appleServicesId = services;
  providers.dataset.appleRedirectUri = redirect;
  providers.insertAdjacentHTML(
    "afterbegin",
    '<div id="appleid-signin" hidden></div><div id="signin-google" hidden></div>',
  );
}

describe("Sign in (/signin/)", () => {
  it("shows only developer sign-in in a local build, and returns to the page that asked", async () => {
    loadPage("signin");
    const world = fakeEnv({
      handler: server(["dev"]),
      search: "?next=/create/",
    });
    await mountSignIn(world.env);
    expect(el("signin-dev").hidden).toBe(false);
    expect(document.getElementById("signin-google")).toBeNull();
    el("signin-dev").click();
    await settle();
    expect(world.calls.find((c) => c.url === "/v1/auth/token")?.body).toEqual({
      provider: "dev",
      client: "web",
      id_token: "dev:web",
      nonce: "server-nonce",
    });
    expect(world.went).toEqual(["/create/"]);
  });

  it("shows signin.failed and stays on the page when sign-in fails", async () => {
    loadPage("signin");
    const world = fakeEnv({
      handler: server(["dev"], () => json(401, { error: "unauthorized" })),
    });
    await mountSignIn(world.env);
    el("signin-dev").click();
    await settle();
    expect(visibleText("status")).toBe("Sign-in did not finish. Try again.");
    expect(world.went).toEqual([]);
  });

  it("shows no developer button when discovery does not list dev, and reports a discovery failure", async () => {
    loadPage("signin");
    await mountSignIn(fakeEnv({ handler: server([]) }).env);
    expect(el("signin-dev").hidden).toBe(true);
    loadPage("signin");
    await mountSignIn(
      fakeEnv({ handler: () => json(503, { error: "not-ready" }) }).env,
    );
    expect(visibleText("status")).toBe(t("error.unavailable"));
  });

  it("treats missing provider settings as unset", async () => {
    loadPage("signin");
    const providers = el("providers");
    for (const name of [
      "data-google-client-id",
      "data-apple-services-id",
      "data-apple-redirect-uri",
    ]) {
      providers.removeAttribute(name);
    }
    await mountSignIn(
      fakeEnv({ handler: server(["google", "apple", "dev"]) }).env,
    );
    expect(document.querySelectorAll("script")).toHaveLength(0);
    expect(el("signin-dev").hidden).toBe(false);
  });

  it("draws Google's button with the server nonce and exchanges its credential", async () => {
    loadPage("signin");
    configure("web-client-id", "", "");
    const initialize = vi.fn();
    const renderButton = vi.fn();
    const world = fakeEnv({
      handler: server(["google", "dev"]),
      win: { google: { accounts: { id: { initialize, renderButton } } } },
    });
    await mountSignIn(world.env);
    await settle();
    expect(
      document.querySelector(`script[src="${GOOGLE_SCRIPT}"]`),
    ).not.toBeNull();
    expect(el("signin-google").hidden).toBe(false);
    expect(el("appleid-signin").hidden).toBe(true);
    expect(renderButton).toHaveBeenCalledWith(
      el("signin-google"),
      expect.objectContaining({ type: "standard" }),
    );
    const config = initialize.mock.calls[0]?.[0] as {
      client_id: string;
      nonce: string;
      callback: (r: { credential: string }) => void;
    };
    expect(config).toMatchObject({
      client_id: "web-client-id",
      nonce: "server-nonce",
    });
    config.callback({ credential: "google-id-token" });
    await settle();
    expect(world.calls.find((c) => c.url === "/v1/auth/token")?.body).toEqual({
      provider: "google",
      client: "web",
      id_token: "google-id-token",
      nonce: "server-nonce",
    });
    expect(world.went).toEqual(["/codes/"]);
  });

  it("does not load a provider that discovery does not list", async () => {
    loadPage("signin");
    configure(
      "web-client-id",
      "services.id",
      "https://zz.example.test/signin/",
    );
    const world = fakeEnv({ handler: server(["dev"]) });
    await mountSignIn(world.env);
    expect(document.querySelectorAll("script")).toHaveLength(0);
    expect(el("signin-google").hidden).toBe(true);
  });

  it("starts Sign in with Apple in popup mode with the hashed nonce and exchanges its code", async () => {
    loadPage("signin");
    configure("", "services.id", "https://zz.example.test/signin/");
    const init = vi.fn();
    const world = fakeEnv({
      handler: server(["apple"]),
      win: { AppleID: { auth: { init } } },
    });
    await mountSignIn(world.env);
    await settle();
    expect(
      document.querySelector(`script[src="${APPLE_SCRIPT}"]`),
    ).not.toBeNull();
    expect(el("appleid-signin").hidden).toBe(false);
    const hash = [
      ...new Uint8Array(
        await crypto.subtle.digest(
          "SHA-256",
          new TextEncoder().encode("server-nonce"),
        ),
      ),
    ]
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    expect(init).toHaveBeenCalledWith({
      clientId: "services.id",
      scope: "",
      redirectURI: "https://zz.example.test/signin/",
      nonce: hash,
      usePopup: true,
    });
    document.dispatchEvent(
      new CustomEvent("AppleIDSignInOnSuccess", {
        detail: {
          authorization: { id_token: "apple-id-token", code: "apple-code" },
        },
      }),
    );
    await settle();
    expect(world.calls.find((c) => c.url === "/v1/auth/token")?.body).toEqual({
      provider: "apple",
      client: "web",
      id_token: "apple-id-token",
      nonce: "server-nonce",
      authorization_code: "apple-code",
    });
    document.dispatchEvent(
      new CustomEvent("AppleIDSignInOnFailure", {
        detail: { error: "popup_closed_by_user" },
      }),
    );
    expect(visibleText("status")).toBe(t("signin.failed"));
  });

  it("shows signin.failed when a provider script does not load", async () => {
    loadPage("signin");
    configure("web-client-id", "", "");
    const append = vi
      .spyOn(document.head, "append")
      .mockImplementation((node) => {
        (node as HTMLScriptElement).dispatchEvent(new Event("error"));
      });
    await mountSignIn(fakeEnv({ handler: server(["google"]) }).env);
    await settle();
    expect(visibleText("status")).toBe(t("signin.failed"));
    append.mockRestore();
    await expect(loadScript(document, "/ok.js")).resolves.toBeUndefined();
  });
});

describe("Account (/account/)", () => {
  async function mount(handler: Handler) {
    loadPage("account");
    const world = fakeEnv({ handler });
    const dialog = el<HTMLDialogElement>("delete-dialog");
    dialog.showModal = vi.fn();
    dialog.close = vi.fn();
    await mountAccount(world.env);
    return { ...world, dialog };
  }

  function session(extra: Handler, providers = ["dev"]): Handler {
    return (call) => {
      if (call.url === "/v1/auth/refresh") return json(200, token(1));
      if (call.url === "/v1/me" && call.method === "GET")
        return json(200, { id: "acct", providers, created_at: "x" });
      return extra(call);
    };
  }

  it("shows the provider, and the licenses link for everyone", async () => {
    await mount(session(() => json(500)));
    expect(visibleText("signed-in-with")).toBe("Signed in with Developer");
    expect(el("account").hidden).toBe(false);
    expect(document.querySelector('a[href="/licenses/"]')?.textContent).toBe(
      "Open-source licenses",
    );
    await mount(session(() => json(500), []));
    expect(el("signed-in-with").hidden).toBe(true);
  });

  it("signs out with the cookie and goes home", async () => {
    const world = await mount(session(() => json(204)));
    el("sign-out").click();
    await settle();
    expect(world.calls.at(-1)).toMatchObject({
      method: "POST",
      url: "/v1/auth/revoke",
      body: {},
    });
    expect(world.went).toEqual(["/"]);
  });

  it("deletes the account only after the confirm, and says when it did not", async () => {
    const world = await mount(session(() => json(204)));
    el("delete-open").click();
    expect(world.dialog.showModal).toHaveBeenCalled();
    el("delete-cancel").click();
    expect(world.calls.some((c) => c.method === "DELETE")).toBe(false);
    el("delete-confirm").click();
    await settle();
    expect(world.calls.at(-1)).toMatchObject({
      method: "DELETE",
      url: "/v1/me",
    });
    expect(world.went).toEqual(["/"]);
    const failing = await mount(session(() => json(500, { error: "failed" })));
    el("delete-confirm").click();
    await settle();
    expect(visibleText("status")).toBe(
      "Your account was not deleted. Try again.",
    );
    expect(failing.went).toEqual([]);
    el("sign-out").click();
    await settle();
    expect(visibleText("status")).toBe(t("error.unavailable"));
  });

  it("asks a signed-out person to sign in, and reports a failure", async () => {
    await mount(() => json(401, { error: "unauthorized" }));
    expect(el("account-signed-out").hidden).toBe(false);
    expect(el("account").hidden).toBe(true);
    await mount((call) =>
      call.url === "/v1/auth/refresh"
        ? json(200, token(1))
        : json(429, { error: "rate-limited" }),
    );
    expect(visibleText("status")).toBe("Wait a moment, then try again.");
  });
});
