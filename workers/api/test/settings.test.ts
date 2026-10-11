import { afterEach, describe, expect, it, vi } from "vitest";
import { readSettings } from "../src/env.ts";
import { toBase64, toBase64url } from "../src/lib/encoding.ts";
import { call, nonce } from "./helpers/http.ts";
import { expectMatchesSchema } from "./helpers/schema.ts";
import {
  appleSettings,
  googleSettings,
  makeEnv,
  makeWorld,
  type Settings,
} from "./helpers/world.ts";

const ALWAYS = [
  "ZZ_ENV",
  "ZZ_CONTRACT",
  "ZZ_WORDLIST_VERSION",
  "ZZ_TOKEN_SECRET",
  "ZZ_DATA_KEY",
  "ZZ_RECORD_SIGNING_KEY",
  "ZZ_RECORD_SIGNING_KEY_ID",
  "ZZ_DB",
  "ZZ_PHOTOS",
  "ZZ_LIMITER",
  "ASSETS",
];

const PRODUCTION: Settings = {
  ZZ_ENV: "production",
  ZZ_DEV_AUTH: "false",
  ZZ_WORDLIST_VERSION: "proto-v0",
  ZZ_BLOCKLIST: "badword\n",
};

afterEach(() => {
  vi.restoreAllMocks();
});

// Every request fails closed with 503 not-ready, and the log names the
// setting, never its value.
async function expectNotReady(
  settings: Settings,
  named: string[],
): Promise<void> {
  const errors = vi.spyOn(console, "error").mockImplementation(() => {});
  const w = await makeWorld({ settings });
  const response = await call(w, "GET", "/v1");
  const body = await expectMatchesSchema(response, "getDiscovery", 503);
  expect(body).toEqual({ error: "not-ready" });
  expect(response.headers.get("X-ZZ-Contract")).toBe("1");
  const logged = errors.mock.calls.map((args) => JSON.parse(String(args[0])));
  expect(logged).toContainEqual({
    event: "config-error",
    settings: expect.arrayContaining(named),
  });
  for (const name of named) {
    const value = settings[name];
    if (typeof value === "string" && value.length > 3) {
      expect(JSON.stringify(logged)).not.toContain(value);
    }
  }
  errors.mockRestore();
}

describe("settings check (spec 005 Environment, T003)", () => {
  for (const name of ALWAYS) {
    it(`fails closed when ${name} is missing`, async () => {
      await expectNotReady({ [name]: undefined }, [name]);
    });
  }

  for (const name of ALWAYS.filter(
    (n) =>
      n.startsWith("ZZ_") && !["ZZ_DB", "ZZ_PHOTOS", "ZZ_LIMITER"].includes(n),
  )) {
    it(`fails closed when ${name} is empty`, async () => {
      await expectNotReady({ [name]: "" }, [name]);
    });
  }

  it("fails closed on values it cannot read", async () => {
    await expectNotReady({ ZZ_ENV: "prod" }, ["ZZ_ENV"]);
    await expectNotReady({ ZZ_CONTRACT: "2" }, ["ZZ_CONTRACT"]);
    await expectNotReady({ ZZ_WORDLIST_VERSION: "proto-v9" }, [
      "ZZ_WORDLIST_VERSION",
    ]);
    await expectNotReady({ ZZ_FREE_PUBLIC: "yes" }, ["ZZ_FREE_PUBLIC"]);
    await expectNotReady({ ZZ_MINT_ENABLED: "TRUE" }, ["ZZ_MINT_ENABLED"]);
    await expectNotReady({ ZZ_PHOTO_READS: "1" }, ["ZZ_PHOTO_READS"]);
    await expectNotReady({ ZZ_DEV_AUTH: "on" }, ["ZZ_DEV_AUTH"]);
  });

  it("checks the secret encodings", async () => {
    await expectNotReady({ ZZ_TOKEN_SECRET: "not base64url!" }, [
      "ZZ_TOKEN_SECRET",
    ]);
    await expectNotReady(
      {
        ZZ_TOKEN_SECRET: toBase64url(
          crypto.getRandomValues(new Uint8Array(31)),
        ),
      },
      ["ZZ_TOKEN_SECRET"],
    );
    await expectNotReady(
      { ZZ_DATA_KEY: toBase64url(crypto.getRandomValues(new Uint8Array(33))) },
      ["ZZ_DATA_KEY"],
    );
    await expectNotReady({ ZZ_DATA_KEY: "a" }, ["ZZ_DATA_KEY"]);
    // RM-021: optional, but a set ZZ_DATA_KEY_PREVIOUS must be a key.
    await expectNotReady(
      {
        ZZ_DATA_KEY_PREVIOUS: toBase64url(
          crypto.getRandomValues(new Uint8Array(16)),
        ),
      },
      ["ZZ_DATA_KEY_PREVIOUS"],
    );
    await expectNotReady({ ZZ_DATA_KEY_PREVIOUS: "@@@" }, [
      "ZZ_DATA_KEY_PREVIOUS",
    ]);
    await expectNotReady({ ZZ_RECORD_SIGNING_KEY: "@@@" }, [
      "ZZ_RECORD_SIGNING_KEY",
    ]);
    await expectNotReady(
      {
        ZZ_RECORD_SIGNING_KEY: toBase64(
          crypto.getRandomValues(new Uint8Array(48)),
        ),
      },
      ["ZZ_RECORD_SIGNING_KEY"],
    );
  });

  it("accepts a token secret longer than 32 bytes", async () => {
    const w = await makeWorld({
      settings: {
        ZZ_TOKEN_SECRET: toBase64url(
          crypto.getRandomValues(new Uint8Array(64)),
        ),
      },
    });
    expect((await call(w, "GET", "/v1")).status).toBe(200);
  });

  it("fails closed on a partly set Apple group, naming each missing name", async () => {
    const apple = await appleSettings();
    await expectNotReady(
      { ...apple, APPLE_KEY_ID: undefined, APPLE_SERVICES_ID: "" },
      ["APPLE_KEY_ID", "APPLE_SERVICES_ID"],
    );
  });

  it("fails closed on an Apple key or return URL it cannot use", async () => {
    const apple = await appleSettings();
    await expectNotReady({ ...apple, APPLE_PRIVATE_KEY: "not a pem" }, [
      "APPLE_PRIVATE_KEY",
    ]);
    await expectNotReady(
      { ...apple, APPLE_WEB_REDIRECT_URI: "http://zz.example.test/signin/" },
      ["APPLE_WEB_REDIRECT_URI"],
    );
    await expectNotReady({ ...apple, APPLE_WEB_REDIRECT_URI: "not a url" }, [
      "APPLE_WEB_REDIRECT_URI",
    ]);
  });

  it("fails closed on a Google group with no client id", async () => {
    await expectNotReady({ GOOGLE_CLIENT_IDS: " , " }, ["GOOGLE_CLIENT_IDS"]);
  });

  it("needs a non-empty ZZ_BLOCKLIST in production only", async () => {
    await expectNotReady({ ...PRODUCTION, ZZ_BLOCKLIST: undefined }, [
      "ZZ_BLOCKLIST",
    ]);
    await expectNotReady({ ...PRODUCTION, ZZ_BLOCKLIST: "" }, ["ZZ_BLOCKLIST"]);
    await expectNotReady({ ...PRODUCTION, ZZ_BLOCKLIST: "\n  \n" }, [
      "ZZ_BLOCKLIST",
    ]);
    const local = await makeWorld({ settings: { ZZ_BLOCKLIST: undefined } });
    expect((await call(local, "GET", "/v1")).status).toBe(200);
  });

  it("refuses fixture-7 in production", async () => {
    await expectNotReady({ ...PRODUCTION, ZZ_WORDLIST_VERSION: "fixture-7" }, [
      "ZZ_WORDLIST_VERSION",
    ]);
  });

  it("refuses developer sign-in in production (FR-022)", async () => {
    await expectNotReady({ ...PRODUCTION, ZZ_DEV_AUTH: "true" }, [
      "ZZ_DEV_AUTH",
    ]);
  });

  it("starts in production with proto-v0, a blocklist, and no dev sign-in", async () => {
    const w = await makeWorld({
      settings: { ...PRODUCTION, ...googleSettings },
    });
    const body = await expectMatchesSchema<Record<string, unknown>>(
      await call(w, "GET", "/v1"),
      "getDiscovery",
      200,
    );
    expect(body.wordlist_version).toBe("proto-v0");
    expect(body.auth_providers).toEqual(["google"]);
  });

  it("fails closed on every request, the web client's files included", async () => {
    const errors = vi.spyOn(console, "error").mockImplementation(() => {});
    const w = await makeWorld({ settings: { ZZ_TOKEN_SECRET: undefined } });
    const page = await call(w, "GET", "/", { contract: null });
    expect(page.status).toBe(503);
    expect(await page.json()).toEqual({ error: "not-ready" });
    expect(page.headers.get("Cache-Control")).toBe("no-store");
    expect(errors).toHaveBeenCalled();
    // The settings check runs before the contract check.
    expect((await call(w, "GET", "/v1", { contract: null })).status).toBe(503);
  });

  it("checks one env object once", async () => {
    const env = await makeEnv();
    expect(await readSettings(env)).toBe(await readSettings(env));
  });
});

describe("providers with no groups set", () => {
  it("lists only dev, and an apple or google token gets 401", async () => {
    const w = await makeWorld();
    const discovery = await (
      await call(w, "GET", "/v1")
    ).json<{ auth_providers: string[] }>();
    expect(discovery.auth_providers).toEqual(["dev"]);
    for (const provider of ["apple", "google"]) {
      const n = await nonce(w);
      const issuer = provider === "apple" ? w.apple : w.google;
      const idToken = await issuer.idToken({
        sub: "someone",
        aud: "anything",
        nonce: n,
      });
      const response = await call(w, "POST", "/v1/auth/token", {
        body: { provider, client: "ios", id_token: idToken, nonce: n },
      });
      expect(await expectMatchesSchema(response, "exchangeToken", 401)).toEqual(
        {
          error: "unauthorized",
        },
      );
    }
  });

  it("lists every configured provider", async () => {
    const w = await makeWorld({
      settings: { ...(await appleSettings()), ...googleSettings },
    });
    const discovery = await (
      await call(w, "GET", "/v1")
    ).json<{ auth_providers: string[] }>();
    expect(discovery.auth_providers).toEqual(["apple", "google", "dev"]);
  });
});
