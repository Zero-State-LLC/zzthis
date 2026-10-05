import { DEV_SUBJECT } from "../lib/api.ts";
import { byId, returnPath, say, show } from "../lib/dom.ts";
import { messageFor } from "../lib/errors.ts";
import type { PageEnv } from "../lib/page.ts";

// The provider scripts the /signin/ policy allows (spec 005 Security
// headers). They load on this page only, and only when configured.
export const GOOGLE_SCRIPT = "https://accounts.google.com/gsi/client";
export const APPLE_SCRIPT =
  "https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js";

interface GoogleIdentity {
  accounts: {
    id: {
      initialize(config: {
        client_id: string;
        nonce: string;
        callback: (response: { credential: string }) => void;
      }): void;
      renderButton(parent: HTMLElement, options: Record<string, string>): void;
    };
  };
}

interface AppleIdentity {
  auth: {
    init(config: {
      clientId: string;
      scope: string;
      redirectURI: string;
      nonce: string;
      usePopup: boolean;
    }): void;
  };
}

interface AppleSuccess {
  authorization: { id_token: string; code: string };
}

type Finish = (signIn: () => Promise<void>) => Promise<void>;

export function loadScript(doc: Document, src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const script = doc.createElement("script");
    script.src = src;
    script.async = true;
    script.addEventListener("load", () => resolve());
    script.addEventListener("error", () =>
      reject(new Error(`${src} did not load`)),
    );
    doc.head.append(script);
  });
}

async function sha256Hex(text: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(text),
  );
  return [...new Uint8Array(digest)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// Google Identity Services draws its own button and passes the nonce in
// the ID token (spec 005 Sign-in by platform).
async function mountGoogle(
  env: PageEnv,
  clientId: string,
  finish: Finish,
): Promise<void> {
  const container = byId(env.doc, "signin-google");
  show(container);
  await loadScript(env.doc, GOOGLE_SCRIPT);
  const nonce = await env.api.nonce();
  const google = env.win.google as GoogleIdentity;
  google.accounts.id.initialize({
    client_id: clientId,
    nonce,
    callback: (response) =>
      void finish(() => env.api.signIn("google", response.credential, nonce)),
  });
  google.accounts.id.renderButton(container, {
    type: "standard",
    theme: "outline",
    size: "large",
  });
}

// Sign in with Apple JS in popup mode draws its own button. Apple carries
// the hex SHA-256 of the server nonce; the server checks both.
async function mountApple(
  env: PageEnv,
  servicesId: string,
  redirectUri: string,
  finish: Finish,
): Promise<void> {
  show(byId(env.doc, "appleid-signin"));
  await loadScript(env.doc, APPLE_SCRIPT);
  const nonce = await env.api.nonce();
  (env.win.AppleID as AppleIdentity).auth.init({
    clientId: servicesId,
    scope: "",
    redirectURI: redirectUri,
    nonce: await sha256Hex(nonce),
    usePopup: true,
  });
  env.doc.addEventListener("AppleIDSignInOnSuccess", (event) => {
    const { authorization } = (event as CustomEvent<AppleSuccess>).detail;
    void finish(() =>
      env.api.signIn(
        "apple",
        authorization.id_token,
        nonce,
        authorization.code,
      ),
    );
  });
  env.doc.addEventListener("AppleIDSignInOnFailure", () => {
    say(byId(env.doc, "status"), "signin.failed");
  });
}

// Sign in (spec 005 Web client, /signin/). A provider button shows only
// when GET /v1 lists that provider and its build setting is set, so a
// local build shows only signin.dev.
export async function mountSignIn(env: PageEnv): Promise<void> {
  const { doc, api } = env;
  const status = byId(doc, "status");
  const settings = byId(doc, "providers").dataset;
  const next = returnPath(env.location, "/codes/");
  const finish: Finish = async (signIn) => {
    try {
      await signIn();
      env.go(next);
    } catch {
      // No half session: nothing is kept from a failed sign-in.
      say(status, "signin.failed");
    }
  };
  say(status, "common.loading");
  let listed: readonly string[];
  try {
    listed = (await api.discovery()).auth_providers;
    say(status, null);
  } catch (error) {
    return say(status, messageFor(error, "read"));
  }
  const failed = () => say(status, "signin.failed");
  const google = settings.googleClientId ?? "";
  const services = settings.appleServicesId ?? "";
  const redirect = settings.appleRedirectUri ?? "";
  if (listed.includes("google") && google !== "") {
    void mountGoogle(env, google, finish).catch(failed);
  }
  if (listed.includes("apple") && services !== "" && redirect !== "") {
    void mountApple(env, services, redirect, finish).catch(failed);
  }
  if (listed.includes("dev")) {
    const dev = byId<HTMLButtonElement>(doc, "signin-dev");
    show(dev);
    dev.addEventListener(
      "click",
      () =>
        void finish(async () =>
          api.signIn("dev", DEV_SUBJECT, await api.nonce()),
        ),
    );
  }
}
