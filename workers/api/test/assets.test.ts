import { afterEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_CSP, SIGNIN_CSP } from "../src/assets.ts";
import worker, { Limiter } from "../src/index.ts";
import {
  APPLE_KEYS_URL,
  GOOGLE_KEYS_URL,
  productionDeps,
} from "../src/deps.ts";
import { call, mint, request, resolvePath, signIn } from "./helpers/http.ts";
import { executionContext, makeWorld } from "./helpers/world.ts";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("security headers on the web client's files (spec 005 Security headers)", () => {
  it("sends the exact default policy on every page but /signin/", async () => {
    const w = await makeWorld();
    for (const path of [
      "/",
      "/codes/",
      "/code/?id=abc",
      "/licenses/",
      "/_astro/site.css",
    ]) {
      const response = await call(w, "GET", path, { contract: null });
      expect(response.status).toBe(200);
      expect(response.headers.get("Content-Security-Policy")).toBe(
        "default-src 'self'; img-src 'self' data:; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'",
      );
      expect(response.headers.get("Cross-Origin-Opener-Policy")).toBeNull();
      expect(response.headers.get("Referrer-Policy")).toBeNull();
      // The asset passes through unchanged otherwise.
      expect(await response.text()).toContain("<!doctype html>");
      expect(response.headers.get("Content-Type")).toBe(
        "text/html; charset=utf-8",
      );
    }
    expect(DEFAULT_CSP).toBe(
      (await call(w, "GET", "/", { contract: null })).headers.get(
        "Content-Security-Policy",
      ),
    );
  });

  it("sends the exact sign-in policy, COOP, and Referrer-Policy on /signin/", async () => {
    const w = await makeWorld();
    for (const path of ["/signin/", "/signin/index.html"]) {
      const response = await call(w, "GET", path, { contract: null });
      expect(response.headers.get("Content-Security-Policy")).toBe(
        "default-src 'self'; script-src 'self' https://accounts.google.com/gsi/client https://appleid.cdn-apple.com; frame-src https://accounts.google.com/gsi/; connect-src 'self' https://accounts.google.com/gsi/; style-src 'self' 'unsafe-inline' https://accounts.google.com/gsi/style; font-src 'self' data:; img-src 'self' data:; object-src 'none'; base-uri 'self'; frame-ancestors 'none'",
      );
      expect(response.headers.get("Cross-Origin-Opener-Policy")).toBe(
        "same-origin-allow-popups",
      );
      expect(response.headers.get("Referrer-Policy")).toBe(
        "strict-origin-when-cross-origin",
      );
    }
    expect(SIGNIN_CSP).toContain("'unsafe-inline'");
    expect(DEFAULT_CSP).not.toContain("'unsafe-inline'");
  });

  it("sends the API's headers, not the page headers, on /v1", async () => {
    const w = await makeWorld();
    const response = await call(w, "GET", "/v1");
    expect(response.headers.get("Content-Security-Policy")).toBeNull();
    expect(response.headers.get("X-ZZ-Contract")).toBe("1");
    // /v1x is not the API.
    expect(
      (await call(w, "GET", "/v1x", { contract: null })).headers.get(
        "Content-Security-Policy",
      ),
    ).toBe(DEFAULT_CSP);
  });
});

describe("log lines (FR-027)", () => {
  it("hold the method, route template, status, duration, cache, limiter rule, and data center only", async () => {
    const logs = vi.spyOn(console, "log").mockImplementation(() => {});
    const w = await makeWorld();
    const alice = await signIn(w);
    const code = await mint(w, alice.access);
    const withColo = request(resolvePath(code.canonical), "GET");
    const cf = { colo: "SJC" } as unknown as IncomingRequestCfProperties;
    await w.worker.fetch(
      new Request(withColo, { cf }),
      w.env,
      executionContext(),
    );
    await call(w, "GET", "/v1/nothing-here");
    await call(w, "GET", "/", { contract: null });
    const lines = logs.mock.calls.map(
      (args) => JSON.parse(String(args[0])) as Record<string, unknown>,
    );
    for (const line of lines) {
      expect(Object.keys(line).sort()).toEqual([
        "cache",
        "colo",
        "duration_ms",
        "limiter",
        "method",
        "route",
        "status",
      ]);
    }
    expect(lines.map((line) => line.route)).toEqual([
      "/v1/auth/nonce",
      "/v1/auth/token",
      "/v1/codes",
      "/v1/resolve/{code}",
      "unmatched",
      "assets",
    ]);
    expect(lines[3]).toMatchObject({
      status: 200,
      cache: "miss",
      limiter: "resolve:ip",
      colo: "SJC",
    });
    const text = JSON.stringify(lines);
    for (const secret of [
      code.canonical,
      alice.access,
      alice.refresh as string,
      "203.0.113.7",
      "Lost cat",
    ]) {
      expect(text).not.toContain(secret);
    }
  });

  it("logs an unexpected error by name only", async () => {
    const errors = vi.spyOn(console, "error").mockImplementation(() => {});
    const w = await makeWorld();
    const alice = await signIn(w);
    // A D1 handle whose batches fail with a message that holds request data.
    const db = w.env.ZZ_DB;
    const failing = new Proxy(db, {
      get(target, property) {
        if (property === "batch") {
          return () => Promise.reject(new Error("D1 down: secret detail"));
        }
        const value = Reflect.get(target, property, target) as unknown;
        return typeof value === "function" ? value.bind(target) : value;
      },
    });
    const broken = { ...w, env: { ...w.env, ZZ_DB: failing } };
    const response = await call(broken, "POST", "/v1/codes", {
      token: alice.access,
      body: { scope: "free_public", record: { title: "t", body: "" } },
    });
    expect(response.status).toBe(500);
    const logged = errors.mock.calls.map((args) => String(args[0]));
    expect(logged).toContain('{"event":"unhandled","error":"Error"}');
    expect(logged.join("\n")).not.toContain("secret detail");
  });
});

describe("the module the runtime loads", () => {
  it("exports the Worker and the Limiter class", () => {
    expect(typeof worker.fetch).toBe("function");
    expect(typeof worker.scheduled).toBe("function");
    expect(typeof Limiter).toBe("function");
  });

  it("uses the published key sets and no photo reader in production", () => {
    const deps = productionDeps();
    expect(APPLE_KEYS_URL).toBe("https://appleid.apple.com/auth/keys");
    expect(GOOGLE_KEYS_URL).toBe("https://www.googleapis.com/oauth2/v3/certs");
    expect(deps.photoReader).toBeNull();
    expect(Math.abs(deps.now() - Date.now())).toBeLessThan(1000);
    expect(deps.random()).toBeGreaterThanOrEqual(0);
    expect(typeof deps.fetch).toBe("function");
  });
});
