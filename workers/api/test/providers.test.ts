import { env } from "cloudflare:workers";
import { jwtVerify } from "jose";
import { afterEach, describe, expect, it, vi } from "vitest";
import { sha256Hex } from "../src/lib/crypto.ts";
import { call, count, nonce, sessionFrom } from "./helpers/http.ts";
import { expectMatchesSchema } from "./helpers/schema.ts";
import {
  APPLE_BUNDLE_ID,
  APPLE_REDIRECT,
  APPLE_SERVICES_ID,
  appleSettings,
  GOOGLE_IOS_ID,
  GOOGLE_WEB_ID,
  googleSettings,
  makeWorld,
  testSecrets,
  type World,
} from "./helpers/world.ts";

afterEach(() => {
  vi.restoreAllMocks();
});

async function providersWorld(): Promise<World> {
  return makeWorld({
    settings: { ...(await appleSettings()), ...googleSettings },
  });
}

function exchange(w: World, body: Record<string, unknown>): Promise<Response> {
  return call(w, "POST", "/v1/auth/token", { body });
}

async function unauthorizedExchange(
  w: World,
  body: Record<string, unknown>,
): Promise<void> {
  const response = await exchange(w, body);
  expect(await expectMatchesSchema(response, "exchangeToken", 401)).toEqual({
    error: "unauthorized",
  });
}

describe("Sign in with Apple (FR-020, T005)", () => {
  async function appleSignIn(
    w: World,
    client: "ios" | "web" | "android",
    aud: string,
    extra: Record<string, unknown> = {},
  ): Promise<Response> {
    const n = await nonce(w);
    const idToken = await w.apple.idToken({
      sub: "apple-user-1",
      aud,
      nonce: await sha256Hex(n),
    });
    return exchange(w, {
      provider: "apple",
      client,
      id_token: idToken,
      nonce: n,
      ...extra,
    });
  }

  async function secretClaims(
    secret: string,
  ): Promise<Record<string, unknown>> {
    const { payload, protectedHeader } = await jwtVerify(
      secret,
      (await testSecrets()).applePublicKey,
      {
        algorithms: ["ES256"],
      },
    );
    return { ...payload, kid: protectedHeader.kid };
  }

  it("exchanges an iOS code with the bundle id and no redirect_uri", async () => {
    const w = await providersWorld();
    const response = await appleSignIn(w, "ios", APPLE_BUNDLE_ID, {
      authorization_code: "code-ios",
    });
    await expectMatchesSchema(response, "exchangeToken", 200);
    expect(w.appleStub.calls).toHaveLength(1);
    const call0 = w.appleStub.calls[0];
    expect(call0?.url).toBe("https://appleid.apple.com/auth/token");
    expect(call0?.form.get("client_id")).toBe(APPLE_BUNDLE_ID);
    expect(call0?.form.get("grant_type")).toBe("authorization_code");
    expect(call0?.form.get("code")).toBe("code-ios");
    expect(call0?.form.has("redirect_uri")).toBe(false);
    const claims = await secretClaims(
      call0?.form.get("client_secret") as string,
    );
    expect(claims).toMatchObject({
      iss: "TEAM123456",
      aud: "https://appleid.apple.com",
      sub: APPLE_BUNDLE_ID,
      kid: "KEY1234567",
    });
    expect((claims.exp as number) - (claims.iat as number)).toBeLessThanOrEqual(
      15552000,
    );
    const identity = await env.ZZ_DB.prepare("SELECT * FROM identities").first<
      Record<string, string>
    >();
    expect(identity?.provider).toBe("apple");
    expect(identity?.apple_client_id).toBe(APPLE_BUNDLE_ID);
    expect(identity?.apple_refresh_token_enc).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it("exchanges a web code with the Services ID and the one redirect URI", async () => {
    const w = await providersWorld();
    const response = await appleSignIn(w, "web", APPLE_SERVICES_ID, {
      authorization_code: "code-web",
    });
    const body = await expectMatchesSchema<Record<string, unknown>>(
      response,
      "exchangeToken",
      200,
    );
    expect(body.refresh_token).toBeNull();
    const call0 = w.appleStub.calls[0];
    expect(call0?.form.get("client_id")).toBe(APPLE_SERVICES_ID);
    expect(call0?.form.get("redirect_uri")).toBe(APPLE_REDIRECT);
    expect(
      (await secretClaims(call0?.form.get("client_secret") as string)).sub,
    ).toBe(APPLE_SERVICES_ID);
    const identity = await env.ZZ_DB.prepare(
      "SELECT apple_client_id FROM identities",
    ).first<{ apple_client_id: string }>();
    expect(identity?.apple_client_id).toBe(APPLE_SERVICES_ID);
  });

  it("replaces the stored token and its client id together on a later sign-in", async () => {
    const w = await providersWorld();
    await appleSignIn(w, "ios", APPLE_BUNDLE_ID, {
      authorization_code: "first",
    });
    const before = await env.ZZ_DB.prepare(
      "SELECT apple_refresh_token_enc AS t FROM identities",
    ).first<{ t: string }>();
    await appleSignIn(w, "web", APPLE_SERVICES_ID, {
      authorization_code: "second",
    });
    const after = await env.ZZ_DB.prepare(
      "SELECT apple_refresh_token_enc AS t, apple_client_id AS c FROM identities",
    ).first<{ t: string; c: string }>();
    expect(after?.c).toBe(APPLE_SERVICES_ID);
    expect(after?.t).not.toBe(before?.t);
    expect(await count(w, "SELECT count(*) AS n FROM accounts")).toBe(1);
  });

  it("still signs in when the code exchange fails, and logs the failure", async () => {
    const logs = vi.spyOn(console, "log").mockImplementation(() => {});
    const w = await providersWorld();
    const failures: (() => Response | Promise<Response>)[] = [
      () => new Response("down", { status: 500 }),
      () => Response.json({ access_token: "only" }),
      () => new Response("not json", { status: 200 }),
      () => Promise.reject(new Error("network")),
    ];
    for (const failure of failures) {
      w.appleStub.token = failure;
      const response = await appleSignIn(w, "ios", APPLE_BUNDLE_ID, {
        authorization_code: "authz-value-7f3a",
      });
      expect(response.status).toBe(200);
    }
    const identity = await env.ZZ_DB.prepare(
      "SELECT apple_refresh_token_enc AS t FROM identities",
    ).first<{ t: string | null }>();
    expect(identity?.t).toBeNull();
    const lines = logs.mock.calls.map((args) => String(args[0]));
    expect(
      lines.filter((line) => line.includes('"apple-code-exchange"')),
    ).toHaveLength(4);
    expect(lines.join("\n")).not.toContain("authz-value-7f3a");
  });

  it("makes no exchange without an authorization code", async () => {
    const w = await providersWorld();
    expect((await appleSignIn(w, "ios", APPLE_BUNDLE_ID)).status).toBe(200);
    expect(
      (
        await appleSignIn(w, "ios", APPLE_BUNDLE_ID, {
          authorization_code: null,
        })
      ).status,
    ).toBe(200);
    expect(w.appleStub.calls).toHaveLength(0);
  });

  it("refuses a wrong audience, a wrong issuer, an expired token, a raw nonce, and a foreign key", async () => {
    const w = await providersWorld();
    const now = Math.floor(Date.now() / 1000);
    const tokens = async (n: string) => [
      // The web audience from the iOS client, and the reverse.
      {
        client: "ios",
        id_token: await w.apple.idToken({
          sub: "u",
          aud: APPLE_SERVICES_ID,
          nonce: await sha256Hex(n),
        }),
      },
      {
        client: "web",
        id_token: await w.apple.idToken({
          sub: "u",
          aud: APPLE_BUNDLE_ID,
          nonce: await sha256Hex(n),
        }),
      },
      {
        client: "android",
        id_token: await w.apple.idToken({
          sub: "u",
          aud: APPLE_BUNDLE_ID,
          nonce: await sha256Hex(n),
        }),
      },
      {
        client: "ios",
        id_token: await w.apple.idToken({
          sub: "u",
          aud: [APPLE_BUNDLE_ID, "other"],
          nonce: await sha256Hex(n),
        }),
      },
      {
        client: "ios",
        id_token: await w.apple.idToken({
          sub: "u",
          aud: APPLE_BUNDLE_ID,
          nonce: await sha256Hex(n),
          iss: "https://evil.example",
        }),
      },
      {
        client: "ios",
        id_token: await w.apple.idToken({
          sub: "u",
          aud: APPLE_BUNDLE_ID,
          nonce: await sha256Hex(n),
          iat: now - 1200,
          exp: now - 600,
        }),
      },
      {
        client: "ios",
        id_token: await w.apple.idToken({
          sub: "u",
          aud: APPLE_BUNDLE_ID,
          nonce: n,
        }),
      },
      {
        client: "ios",
        id_token: await w.apple.idToken({ sub: "u", aud: APPLE_BUNDLE_ID }),
      },
      {
        client: "ios",
        id_token: await w.apple.foreignToken({
          sub: "u",
          aud: APPLE_BUNDLE_ID,
          nonce: await sha256Hex(n),
        }),
      },
      { client: "ios", id_token: "not.a.jwt" },
    ];
    const first = await nonce(w);
    const cases = await tokens(first);
    for (const [index, item] of cases.entries()) {
      const n = index === 0 ? first : await nonce(w);
      const fresh = index === 0 ? item : (await tokens(n))[index];
      await unauthorizedExchange(w, { provider: "apple", nonce: n, ...fresh });
    }
    expect(await count(w, "SELECT count(*) AS n FROM accounts")).toBe(0);
  });
});

describe("Google sign-in (FR-020, T005)", () => {
  async function googleToken(
    w: World,
    n: string,
    claims: Record<string, unknown> = {},
  ): Promise<string> {
    return w.google.idToken({
      sub: "google-user-1",
      aud: GOOGLE_WEB_ID,
      nonce: n,
      ...claims,
    });
  }

  it("accepts both issuer spellings", async () => {
    const w = await providersWorld();
    for (const iss of ["https://accounts.google.com", "accounts.google.com"]) {
      const n = await nonce(w);
      const response = await exchange(w, {
        provider: "google",
        client: "android",
        id_token: await googleToken(w, n, { iss }),
        nonce: n,
      });
      await expectMatchesSchema(response, "exchangeToken", 200);
    }
    expect(await count(w, "SELECT count(*) AS n FROM accounts")).toBe(1);
    expect(w.appleStub.calls).toHaveLength(0);
  });

  it("accepts each listed client id as the audience", async () => {
    const w = await providersWorld();
    for (const aud of [GOOGLE_WEB_ID, GOOGLE_IOS_ID]) {
      const n = await nonce(w);
      const response = await exchange(w, {
        provider: "google",
        client: "ios",
        id_token: await googleToken(w, n, { aud }),
        nonce: n,
      });
      expect(response.status).toBe(200);
    }
  });

  it("refuses a wrong issuer, a wrong audience, an expired token, and a wrong nonce", async () => {
    const w = await providersWorld();
    const now = Math.floor(Date.now() / 1000);
    const variants: Record<string, unknown>[] = [
      { iss: "https://accounts.google.com.evil.example" },
      { aud: "someone-else.apps.example.test" },
      { iat: now - 1200, exp: now - 60 },
      { nonce: "a-different-nonce" },
    ];
    for (const variant of variants) {
      const n = await nonce(w);
      await unauthorizedExchange(w, {
        provider: "google",
        client: "web",
        id_token: await googleToken(w, n, variant),
        nonce: n,
      });
    }
  });

  it("refuses a reused nonce", async () => {
    const w = await providersWorld();
    const n = await nonce(w);
    const idToken = await googleToken(w, n);
    expect(
      (
        await exchange(w, {
          provider: "google",
          client: "web",
          id_token: idToken,
          nonce: n,
        })
      ).status,
    ).toBe(200);
    await unauthorizedExchange(w, {
      provider: "google",
      client: "web",
      id_token: idToken,
      nonce: n,
    });
  });

  it("signs the web client in with the cookie", async () => {
    const w = await providersWorld();
    const n = await nonce(w);
    const response = await exchange(w, {
      provider: "google",
      client: "web",
      id_token: await googleToken(w, n),
      nonce: n,
    });
    const session = await sessionFrom(response);
    expect(session.refresh).toBeNull();
    expect(session.cookie).not.toBeNull();
  });
});
