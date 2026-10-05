import { env } from "cloudflare:workers";
import { decodeJwt, SignJWT } from "jose";
import { describe, expect, it } from "vitest";
import { fromBase64url, toBase64url, utf8 } from "../src/lib/encoding.ts";
import {
  call,
  count,
  sessionFrom,
  signIn,
  type Session,
} from "./helpers/http.ts";
import { expectMatchesSchema } from "./helpers/schema.ts";
import { makeWorld, testSecrets, type World } from "./helpers/world.ts";

const CLEARED =
  "__Host-zz_refresh=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0";

function refresh(
  w: World,
  session: { refresh?: string | null; cookie?: string | null },
): Promise<Response> {
  return call(w, "POST", "/v1/auth/refresh", {
    body: session.refresh ? { refresh_token: session.refresh } : {},
    ...(session.cookie
      ? { cookie: `__Host-zz_refresh=${session.cookie}` }
      : {}),
  });
}

async function me(w: World, token: string): Promise<number> {
  return (await call(w, "GET", "/v1/me", { token })).status;
}

describe("POST /v1/auth/refresh (FR-021, T006)", () => {
  it("rotates: a new pair, and the old refresh token no longer works", async () => {
    const w = await makeWorld();
    const first = await signIn(w);
    const response = await refresh(w, first);
    const body = await expectMatchesSchema<Record<string, unknown>>(
      response,
      "refreshToken",
      200,
    );
    expect(body.expires_in).toBe(900);
    const next = await sessionFrom(response);
    expect(next.refresh).not.toBe(first.refresh);
    expect(next.accountId).toBe(first.accountId);
    expect(await me(w, next.access)).toBe(200);
    const old = await env.ZZ_DB.prepare(
      "SELECT revoked_at, replaced_by FROM refresh_tokens WHERE replaced_by IS NOT NULL",
    ).first<{ revoked_at: string; replaced_by: string }>();
    expect(old?.revoked_at).not.toBeNull();
    expect((await refresh(w, next)).status).toBe(200);
  });

  it("revokes the whole family when a rotated token comes back, with no grace window", async () => {
    const w = await makeWorld();
    const first = await signIn(w);
    const next = await sessionFrom(await refresh(w, first));
    const reuse = await refresh(w, first);
    expect(await expectMatchesSchema(reuse, "refreshToken", 401)).toEqual({
      error: "unauthorized",
    });
    // The token the rotation just issued is revoked with its family.
    expect((await refresh(w, next)).status).toBe(401);
    expect(
      await count(
        w,
        "SELECT count(*) AS n FROM refresh_tokens WHERE revoked_at IS NULL",
      ),
    ).toBe(0);
    const denied = await count(
      w,
      "SELECT count(*) AS n FROM audit_events WHERE action = 'auth.refresh' AND result = 'denied'",
    );
    expect(denied).toBeGreaterThanOrEqual(1);
  });

  it("gives two simultaneous refreshes with one token one 200, then revokes the family", async () => {
    const w = await makeWorld();
    const first = await signIn(w);
    const results = await Promise.all([refresh(w, first), refresh(w, first)]);
    const statuses = results.map((r) => r.status).sort();
    expect(statuses).toEqual([200, 401]);
    const winner = results.find((r) => r.status === 200) as Response;
    const next = await sessionFrom(winner);
    expect((await refresh(w, next)).status).toBe(401);
  });

  it("keeps other sign-ins of the account working after one family is revoked", async () => {
    const w = await makeWorld();
    const phone = await signIn(w, "alice", "ios");
    const tablet = await signIn(w, "alice", "android");
    await refresh(w, phone);
    expect((await refresh(w, phone)).status).toBe(401);
    expect((await refresh(w, tablet)).status).toBe(200);
  });

  it("refuses an unknown, a missing, an empty, and an expired refresh token", async () => {
    const w = await makeWorld();
    const session = await signIn(w);
    expect((await refresh(w, { refresh: "never-issued" })).status).toBe(401);
    expect((await refresh(w, {})).status).toBe(401);
    expect(
      (
        await call(w, "POST", "/v1/auth/refresh", {
          body: { refresh_token: "" },
        })
      ).status,
    ).toBe(401);
    expect(
      (
        await call(w, "POST", "/v1/auth/refresh", {
          body: { refresh_token: null },
        })
      ).status,
    ).toBe(401);
    w.clock.advance(30 * 24 * 60 * 60 * 1000);
    const expired = await refresh(w, session);
    expect(await expectMatchesSchema(expired, "refreshToken", 401)).toEqual({
      error: "unauthorized",
    });
  });

  it("refuses a body with a field the contract does not list", async () => {
    const w = await makeWorld();
    const session = await signIn(w);
    const response = await call(w, "POST", "/v1/auth/refresh", {
      body: { refresh_token: session.refresh, client: "ios" },
    });
    expect(await expectMatchesSchema(response, "refreshToken", 400)).toEqual({
      error: "malformed",
    });
  });

  it("rotates the web session in the cookie and clears it on a 401", async () => {
    const w = await makeWorld();
    const web = await signIn(w, "alice", "web");
    expect(web.refresh).toBeNull();
    const response = await refresh(w, { cookie: web.cookie });
    const body = await expectMatchesSchema<Record<string, unknown>>(
      response,
      "refreshToken",
      200,
    );
    expect(body.refresh_token).toBeNull();
    const next = await sessionFrom(response);
    expect(next.cookie).not.toBeNull();
    expect(next.cookie).not.toBe(web.cookie);
    const reuse = await refresh(w, { cookie: web.cookie });
    expect(reuse.status).toBe(401);
    expect(reuse.headers.get("Set-Cookie")).toBe(CLEARED);
    const unknown = await refresh(w, { cookie: "never-issued" });
    expect(unknown.headers.get("Set-Cookie")).toBe(CLEARED);
  });

  it("does not set a cookie for the native clients, even on a 401", async () => {
    const w = await makeWorld();
    const response = await refresh(w, { refresh: "never-issued" });
    expect(response.status).toBe(401);
    expect(response.headers.get("Set-Cookie")).toBeNull();
  });

  it("writes an ok audit event for each rotation", async () => {
    const w = await makeWorld();
    const session = await signIn(w);
    await refresh(w, session);
    expect(
      await count(
        w,
        "SELECT count(*) AS n FROM audit_events WHERE action = 'auth.refresh' AND result = 'ok' AND actor_id = ?",
        session.accountId,
      ),
    ).toBe(1);
  });
});

describe("POST /v1/auth/revoke (FR-021)", () => {
  it("revokes a native refresh token", async () => {
    const w = await makeWorld();
    const session = await signIn(w);
    const response = await call(w, "POST", "/v1/auth/revoke", {
      body: { refresh_token: session.refresh },
    });
    await expectMatchesSchema(response, "revokeToken", 204);
    expect(response.headers.get("Set-Cookie")).toBeNull();
    expect((await refresh(w, session)).status).toBe(401);
    const again = await call(w, "POST", "/v1/auth/revoke", {
      body: { refresh_token: session.refresh },
    });
    expect(await expectMatchesSchema(again, "revokeToken", 401)).toEqual({
      error: "unauthorized",
    });
  });

  it("revokes the web cookie and clears it with Max-Age 0", async () => {
    const w = await makeWorld();
    const web = await signIn(w, "alice", "web");
    const response = await call(w, "POST", "/v1/auth/revoke", {
      body: {},
      cookie: `__Host-zz_refresh=${web.cookie}`,
    });
    await expectMatchesSchema(response, "revokeToken", 204);
    expect(response.headers.get("Set-Cookie")).toBe(CLEARED);
    expect((await refresh(w, { cookie: web.cookie })).status).toBe(401);
  });

  it("refuses a missing or unknown token", async () => {
    const w = await makeWorld();
    expect(
      (await call(w, "POST", "/v1/auth/revoke", { body: {} })).status,
    ).toBe(401);
    const unknown = await call(w, "POST", "/v1/auth/revoke", {
      body: {},
      cookie: "__Host-zz_refresh=never-issued",
    });
    expect(unknown.status).toBe(401);
    expect(unknown.headers.get("Set-Cookie")).toBe(CLEARED);
  });
});

describe("access tokens (FR-021, RFC 8725)", () => {
  async function forged(
    header: Record<string, unknown>,
    claims: Record<string, unknown>,
    sign?: (data: Uint8Array) => Promise<Uint8Array>,
  ): Promise<string> {
    const encode = (value: unknown) => toBase64url(utf8(JSON.stringify(value)));
    const input = `${encode(header)}.${encode(claims)}`;
    const signature =
      sign === undefined ? "" : toBase64url(await sign(utf8(input)));
    return `${input}.${signature}`;
  }

  async function secret(): Promise<Uint8Array> {
    return fromBase64url((await testSecrets()).tokenSecret) as Uint8Array;
  }

  it("accepts exactly the server's HS256 token, for 900 seconds", async () => {
    const w = await makeWorld();
    const session = await signIn(w);
    expect(await me(w, session.access)).toBe(200);
    w.clock.advance(899 * 1000);
    expect(await me(w, session.access)).toBe(200);
    w.clock.advance(2 * 1000);
    expect(await me(w, session.access)).toBe(401);
  });

  it("refuses alg none and every other alg before checking the signature", async () => {
    const w = await makeWorld();
    const session = await signIn(w);
    const claims = decodeJwt(session.access);
    const key = await secret();
    const hs512 = await new SignJWT(claims)
      .setProtectedHeader({ alg: "HS512" })
      .sign(key);
    const tokens = [
      await forged({ alg: "none", typ: "JWT" }, claims),
      await forged({ alg: "NONE" }, claims),
      hs512,
      await forged({ typ: "JWT" }, claims),
      "not-a-token",
      `${session.access.slice(0, -2)}xx`,
    ];
    for (const token of tokens) {
      const response = await call(w, "GET", "/v1/me", { token });
      expect(await expectMatchesSchema(response, "getMe", 401)).toEqual({
        error: "unauthorized",
      });
    }
  });

  it("refuses a token from another issuer, or without sub, exp, or iat", async () => {
    const w = await makeWorld();
    const session = await signIn(w);
    const key = await secret();
    const now = Math.floor(w.clock.ms / 1000);
    const build = (claims: Record<string, unknown>) =>
      new SignJWT(claims).setProtectedHeader({ alg: "HS256" }).sign(key);
    const tokens = [
      await build({
        iss: "someone-else",
        sub: session.accountId,
        iat: now,
        exp: now + 900,
      }),
      await build({ iss: "zzthis", iat: now, exp: now + 900 }),
      await build({ iss: "zzthis", sub: session.accountId, iat: now }),
      await build({ iss: "zzthis", sub: session.accountId, exp: now + 900 }),
      await build({
        iss: "zzthis",
        sub: "no-such-account",
        iat: now,
        exp: now + 900,
      }),
    ];
    for (const token of tokens) expect(await me(w, token)).toBe(401);
    expect(
      await me(
        w,
        await build({
          iss: "zzthis",
          sub: session.accountId,
          iat: now,
          exp: now + 900,
        }),
      ),
    ).toBe(200);
  });

  it("refuses an Authorization header that is not a bearer token", async () => {
    const w = await makeWorld();
    const session: Session = await signIn(w);
    for (const value of [
      `Basic ${session.access}`,
      session.access,
      "Bearer",
      `Bearer ${session.access} extra`,
    ]) {
      const response = await call(w, "GET", "/v1/me", {
        headers: { Authorization: value },
      });
      expect(response.status).toBe(401);
    }
    const lower = await call(w, "GET", "/v1/me", {
      headers: { Authorization: `bearer ${session.access}` },
    });
    expect(lower.status).toBe(200);
  });
});
