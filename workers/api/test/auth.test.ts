import { env } from "cloudflare:workers";
import { decodeJwt, decodeProtectedHeader } from "jose";
import { afterEach, describe, expect, it, vi } from "vitest";
import { hmacTag, sha256Hex } from "../src/lib/crypto.ts";
import { call, count, nonce, signIn } from "./helpers/http.ts";
import { expectMatchesSchema } from "./helpers/schema.ts";
import { makeWorld, testDataKeys, type World } from "./helpers/world.ts";

afterEach(() => {
  vi.restoreAllMocks();
});

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

describe("POST /v1/auth/nonce (FR-020)", () => {
  it("returns a nonce that works for 10 minutes and stores only its hash", async () => {
    const w = await makeWorld();
    const response = await call(w, "POST", "/v1/auth/nonce");
    const body = await expectMatchesSchema<{
      nonce: string;
      expires_in: number;
    }>(response, "createNonce", 200);
    expect(body.expires_in).toBe(600);
    expect(body.nonce).toMatch(/^[A-Za-z0-9_-]{43}$/);
    const row = await env.ZZ_DB.prepare("SELECT * FROM auth_nonces").first<
      Record<string, string>
    >();
    expect(row?.nonce_hash).toBe(await sha256Hex(body.nonce));
    expect(JSON.stringify(row)).not.toContain(body.nonce);
  });
});

describe("nonce audit events (FR-020, D-2026-10-05-04)", () => {
  interface Row {
    actor_id: string | null;
    action: string;
    target_type: string;
    target_id: string;
    result: string;
  }

  async function nonceEvents(): Promise<Row[]> {
    const rows = await env.ZZ_DB.prepare(
      "SELECT actor_id, action, target_type, target_id, result FROM audit_events WHERE action = 'auth.nonce' ORDER BY created_at, rowid",
    ).all<Row>();
    return rows.results;
  }

  function token(w: World, n: string): Promise<Response> {
    return call(w, "POST", "/v1/auth/token", {
      body: { provider: "dev", client: "ios", id_token: "dev:alice", nonce: n },
    });
  }

  it("writes an ok event for a consumed nonce and a denied event for each failed consume", async () => {
    const w = await makeWorld();
    const used = await nonce(w);
    expect((await token(w, used)).status).toBe(200);
    expect((await token(w, used)).status).toBe(401);
    expect((await token(w, "never-issued")).status).toBe(401);
    const old = await nonce(w);
    w.clock.advance(10 * 60 * 1000);
    expect((await token(w, old)).status).toBe(401);
    const keys = await testDataKeys();
    const target = (n: string) => hmacTag(keys, "nonce", n);
    expect(await nonceEvents()).toEqual([
      {
        actor_id: null,
        action: "auth.nonce",
        target_type: "nonce",
        target_id: await target(used),
        result: "ok",
      },
      {
        actor_id: null,
        action: "auth.nonce",
        target_type: "nonce",
        target_id: await target(used),
        result: "denied",
      },
      {
        actor_id: null,
        action: "auth.nonce",
        target_type: "nonce",
        target_id: await target("never-issued"),
        result: "denied",
      },
      {
        actor_id: null,
        action: "auth.nonce",
        target_type: "nonce",
        target_id: await target(old),
        result: "denied",
      },
    ]);
  });

  it("never stores the nonce, or its stored hash, in the audit log", async () => {
    const w = await makeWorld();
    const n = await nonce(w);
    await token(w, n);
    await token(w, n);
    const log = JSON.stringify(
      (await env.ZZ_DB.prepare("SELECT * FROM audit_events").all()).results,
    );
    expect(log).not.toContain(n);
    expect(log).not.toContain(await sha256Hex(n));
  });

  it("writes the consume event with the nonce's state change, or neither", async () => {
    const w = await makeWorld();
    const n = await nonce(w);
    await env.ZZ_DB.prepare(
      "CREATE TRIGGER audit_down BEFORE INSERT ON audit_events BEGIN SELECT RAISE (ABORT, 'audit down'); END",
    ).run();
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect((await token(w, n)).status).toBe(500);
    await env.ZZ_DB.prepare("DROP TRIGGER audit_down").run();
    // The nonce was not consumed, so it still works once.
    expect((await token(w, n)).status).toBe(200);
  });
});

describe("developer sign-in (FR-022)", () => {
  it("signs in an iOS client with the refresh token in the body", async () => {
    const w = await makeWorld();
    const response = await exchange(w, {
      provider: "dev",
      client: "ios",
      id_token: "dev:alice",
      nonce: await nonce(w),
    });
    const body = await expectMatchesSchema<Record<string, unknown>>(
      response,
      "exchangeToken",
      200,
    );
    expect(body.token_type).toBe("Bearer");
    expect(body.expires_in).toBe(900);
    expect(typeof body.refresh_token).toBe("string");
    expect(response.headers.get("Set-Cookie")).toBeNull();
    const token = body.access_token as string;
    expect(decodeProtectedHeader(token).alg).toBe("HS256");
    const claims = decodeJwt(token);
    expect(claims.iss).toBe("zzthis");
    expect((claims.exp as number) - (claims.iat as number)).toBe(900);
    const account = await env.ZZ_DB.prepare(
      "SELECT * FROM accounts WHERE id = ?",
    )
      .bind(claims.sub)
      .first();
    expect(account).not.toBeNull();
  });

  it("gives the web client the refresh token only as the __Host- cookie", async () => {
    const w = await makeWorld();
    const response = await exchange(w, {
      provider: "dev",
      client: "web",
      id_token: "dev:alice",
      nonce: await nonce(w),
    });
    const body = await expectMatchesSchema<Record<string, unknown>>(
      response,
      "exchangeToken",
      200,
    );
    expect(body.refresh_token).toBeNull();
    const cookie = response.headers.get("Set-Cookie") as string;
    expect(cookie).toMatch(
      /^__Host-zz_refresh=[A-Za-z0-9_-]{43}; HttpOnly; Secure; SameSite=Strict; Path=\/; Max-Age=2592000$/,
    );
  });

  it("finds the same account for the same name, and stores no email or name", async () => {
    const w = await makeWorld();
    const first = await signIn(w, "alice");
    const again = await signIn(w, "alice", "android");
    const bob = await signIn(w, "bob");
    expect(again.accountId).toBe(first.accountId);
    expect(bob.accountId).not.toBe(first.accountId);
    expect(await count(w, "SELECT count(*) AS n FROM accounts")).toBe(2);
    const identity = await env.ZZ_DB.prepare(
      "SELECT * FROM identities WHERE account_id = ?",
    )
      .bind(first.accountId)
      .first<Record<string, unknown>>();
    expect(identity?.provider).toBe("dev");
    expect(identity?.provider_subject).toBe("alice");
    expect(identity?.apple_refresh_token_enc).toBeNull();
  });

  it("refuses an unknown, a reused, or an expired nonce", async () => {
    const w = await makeWorld();
    await unauthorizedExchange(w, {
      provider: "dev",
      client: "ios",
      id_token: "dev:alice",
      nonce: "never-issued",
    });
    const used = await nonce(w);
    expect(
      (
        await exchange(w, {
          provider: "dev",
          client: "ios",
          id_token: "dev:alice",
          nonce: used,
        })
      ).status,
    ).toBe(200);
    await unauthorizedExchange(w, {
      provider: "dev",
      client: "ios",
      id_token: "dev:alice",
      nonce: used,
    });
    const old = await nonce(w);
    w.clock.advance(10 * 60 * 1000);
    await unauthorizedExchange(w, {
      provider: "dev",
      client: "ios",
      id_token: "dev:alice",
      nonce: old,
    });
  });

  it("consumes the nonce even when the token check fails", async () => {
    const w = await makeWorld();
    const n = await nonce(w);
    await unauthorizedExchange(w, {
      provider: "dev",
      client: "ios",
      id_token: "dev:Alice",
      nonce: n,
    });
    await unauthorizedExchange(w, {
      provider: "dev",
      client: "ios",
      id_token: "dev:alice",
      nonce: n,
    });
  });

  it("refuses names outside a to z, 0 to 9, and hyphen, 1 to 40 long", async () => {
    const w = await makeWorld();
    for (const idToken of [
      "dev:",
      "dev:Alice",
      "dev:a_b",
      `dev:${"a".repeat(41)}`,
      "alice",
      "dev:alice ",
    ]) {
      await unauthorizedExchange(w, {
        provider: "dev",
        client: "ios",
        id_token: idToken,
        nonce: await nonce(w),
      });
    }
    expect(
      (
        await exchange(w, {
          provider: "dev",
          client: "ios",
          id_token: `dev:${"a".repeat(40)}`,
          nonce: await nonce(w),
        })
      ).status,
    ).toBe(200);
  });

  it("is 401 when ZZ_DEV_AUTH is off", async () => {
    const w = await makeWorld({ settings: { ZZ_DEV_AUTH: "false" } });
    await unauthorizedExchange(w, {
      provider: "dev",
      client: "ios",
      id_token: "dev:alice",
      nonce: await nonce(w),
    });
  });

  it("signs a racing first sign-in for one subject in to one account", async () => {
    const w = await makeWorld();
    const db = w.env.ZZ_DB;
    let raced = false;
    // The first batch finds that another sign-in for alice just won.
    const racing = new Proxy(db, {
      get(target, property) {
        if (property === "batch") {
          return async (statements: D1PreparedStatement[]) => {
            if (!raced) {
              raced = true;
              await signIn({ ...w, env: { ...w.env, ZZ_DB: db } }, "alice");
            }
            return target.batch(statements);
          };
        }
        const value = Reflect.get(target, property, target) as unknown;
        return typeof value === "function" ? value.bind(target) : value;
      },
    });
    const n = await nonce(w);
    const response = await call(
      { ...w, env: { ...w.env, ZZ_DB: racing } },
      "POST",
      "/v1/auth/token",
      {
        body: {
          provider: "dev",
          client: "ios",
          id_token: "dev:alice",
          nonce: n,
        },
      },
    );
    expect(response.status).toBe(200);
    expect(await count(w, "SELECT count(*) AS n FROM accounts")).toBe(1);
    expect(await count(w, "SELECT count(*) AS n FROM identities")).toBe(1);
  });
});

describe("request body (FR-020, TokenRequest)", () => {
  it("refuses a redirect_uri and any other field the contract does not list", async () => {
    const w = await makeWorld();
    const response = await exchange(w, {
      provider: "dev",
      client: "web",
      id_token: "dev:alice",
      nonce: await nonce(w),
      redirect_uri: "https://evil.example/",
    });
    expect(await expectMatchesSchema(response, "exchangeToken", 400)).toEqual({
      error: "malformed",
    });
  });

  it("refuses a body that is not the contract's JSON", async () => {
    const w = await makeWorld();
    const cases: Parameters<typeof call>[3][] = [
      { body: { provider: "dev", client: "ios", id_token: "dev:alice" } },
      {
        body: { provider: "github", client: "ios", id_token: "x", nonce: "n" },
      },
      {
        body: { provider: "dev", client: "windows", id_token: "x", nonce: "n" },
      },
      { raw: "{not json", contentType: "application/json" },
      { raw: JSON.stringify({ provider: "dev" }), contentType: "text/plain" },
      { raw: JSON.stringify({ provider: "dev" }) },
      {
        raw: "{}",
        contentType: "application/json",
        headers: { "Content-Length": String(300 * 1024) },
      },
      {
        raw: `{"a":"${"x".repeat(300 * 1024)}"}`,
        contentType: "application/json; charset=utf-8",
      },
    ];
    for (const options of cases) {
      const response = await call(w, "POST", "/v1/auth/token", options);
      expect(await expectMatchesSchema(response, "exchangeToken", 400)).toEqual(
        { error: "malformed" },
      );
    }
  });
});
