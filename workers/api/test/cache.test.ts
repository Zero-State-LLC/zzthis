import { env } from "cloudflare:workers";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cacheKey, PUBLIC_CACHE_CONTROL } from "../src/resolve/cache.ts";
import {
  call,
  count,
  mint,
  mintRequest,
  resolvePath,
  signIn,
} from "./helpers/http.ts";
import { fixture7Codes, repeating } from "./helpers/random.ts";
import { expectMatchesSchema } from "./helpers/schema.ts";
import { makeWorld, type World } from "./helpers/world.ts";

afterEach(() => {
  vi.restoreAllMocks();
});

function resolve(w: World, code: string, token?: string): Promise<Response> {
  return call(
    w,
    "GET",
    resolvePath(code),
    token === undefined ? {} : { token },
  );
}

async function cached(canonical: string): Promise<boolean> {
  return (await caches.default.match(cacheKey(canonical))) !== undefined;
}

describe("edge cache (FR-018, FR-019, tests/edgeCache.test.ts policy)", () => {
  it("keys the canonical form, percent-encoded once, on the internal origin", () => {
    expect(cacheKey("zz-kathy-lost-cat-zz")).toBe(
      "https://cache.zzthis.internal/v1/resolve/zz-kathy-lost-cat-zz",
    );
    expect(cacheKey("zz-@bob-zz")).toBe(
      "https://cache.zzthis.internal/v1/resolve/zz-%40bob-zz",
    );
    expect(PUBLIC_CACHE_CONTROL).toBe(
      "public, max-age=60, stale-while-revalidate=300",
    );
    expect(fixture7Codes()).toHaveLength(30);
  });

  it("stores a signed-out public resolve and answers the next one from the cache before D1", async () => {
    const logs = vi.spyOn(console, "log").mockImplementation(() => {});
    const w = await makeWorld();
    const alice = await signIn(w);
    const code = await mint(w, alice.access);
    const first = await resolve(w, code.canonical);
    const firstBody = await first.text();
    expect(await cached(code.canonical)).toBe(true);
    // The request URL is not the key.
    expect(
      await caches.default.match(
        `https://zz.example.test${resolvePath(code.canonical)}`,
      ),
    ).toBeUndefined();
    const events = await count(w, "SELECT count(*) AS n FROM audit_events");
    // A hit is returned as stored, even after D1 changes behind it.
    await env.ZZ_DB.prepare(
      "UPDATE record_versions SET title = 'changed in D1'",
    ).run();
    const hit = await resolve(w, code.canonical);
    const body = await expectMatchesSchema(hit, "resolveCode", 200);
    expect(JSON.stringify(body)).toBe(firstBody);
    expect(hit.headers.get("Cache-Control")).toBe(PUBLIC_CACHE_CONTROL);
    expect(hit.headers.get("X-ZZ-Contract")).toBe("1");
    // A cache hit writes no audit event.
    expect(await count(w, "SELECT count(*) AS n FROM audit_events")).toBe(
      events,
    );
    const lines = logs.mock.calls.map(
      (args) => JSON.parse(String(args[0])) as Record<string, unknown>,
    );
    const resolves = lines.filter(
      (line) => line.route === "/v1/resolve/{code}",
    );
    expect(resolves.map((line) => line.cache)).toEqual(["miss", "hit"]);
  });

  it("shares one key across every spelling of a word code", async () => {
    const w = await makeWorld({ random: repeating(0, 1) });
    const alice = await signIn(w);
    await mint(w, alice.access);
    await resolve(w, "ZZ COPPER LANTERN SKY ZZ");
    expect(await cached("zz-copper-lantern-sky-zz")).toBe(true);
    await env.ZZ_DB.prepare(
      "UPDATE record_versions SET title = 'changed in D1'",
    ).run();
    const hit = await (
      await resolve(w, "(zz) copper lantern sky (zz)")
    ).json<{ record: { title: string } }>();
    expect(hit.record.title).toBe("Lost cat");
  });

  it("stores only the stored spelling of a handle (FR-019, D-2026-10-05-04)", async () => {
    const w = await makeWorld();
    const acme = await signIn(w, "acme");
    await env.ZZ_DB.prepare(
      "INSERT INTO grants (id, subject_id, scope, role) VALUES ('g', ?, 'enterprise', 'issuer')",
    )
      .bind(acme.accountId)
      .run();
    const code = await (
      await mintRequest(w, acme.access, {
        scope: "enterprise",
        kind: "handle",
        handle: "@bob",
      })
    ).json<{ id: string }>();
    const lookalike = await resolve(w, "zz-@b0b-zz");
    expect((await lookalike.json<{ canonical: string }>()).canonical).toBe(
      "zz-@bob-zz",
    );
    expect(lookalike.headers.get("Cache-Control")).toBe(PUBLIC_CACHE_CONTROL);
    expect(await cached("zz-@b0b-zz")).toBe(false);
    await resolve(w, "zz-@bob-zz");
    expect(await cached("zz-@bob-zz")).toBe(true);
    // So the revoke's purge by the stored form reaches every stored copy.
    await call(w, "POST", `/v1/codes/${code.id}/revoke`, {
      token: acme.access,
    });
    expect(await cached("zz-@bob-zz")).toBe(false);
    expect((await resolve(w, "zz-@b0b-zz")).status).toBe(404);
  });

  it("stores nothing for single-use, expiring, private, signed-in, not-found, and malformed resolves", async () => {
    const w = await makeWorld();
    const alice = await signIn(w);
    await env.ZZ_DB.prepare(
      "INSERT INTO grants (id, subject_id, scope, role) VALUES ('g', ?, 'enterprise', 'issuer')",
    )
      .bind(alice.accountId)
      .run();
    const single = await mint(w, alice.access, { single_use: true });
    const expiring = await mint(w, alice.access, {
      expires_at: new Date(w.clock.ms + 3_600_000).toISOString(),
    });
    const privateCode = await mint(w, alice.access, {
      scope: "enterprise",
      visibility: "private",
    });
    const reusable = await mint(w, alice.access);
    for (const [code, token] of [
      [single.canonical, undefined],
      [expiring.canonical, undefined],
      [privateCode.canonical, alice.access],
      [reusable.canonical, alice.access],
      [reusable.canonical, "unusable"],
    ] as const) {
      const response = await resolve(w, code, token);
      expect(response.status).toBe(200);
      expect(response.headers.get("Cache-Control")).toBe("no-store");
      expect(await cached(code)).toBe(false);
    }
    const unknown = fixture7Codes().find(
      (c) =>
        ![single, expiring, privateCode, reusable].some(
          (m) => m.canonical === c,
        ),
    ) as string;
    expect((await resolve(w, unknown)).status).toBe(404);
    expect(await cached(unknown)).toBe(false);
    expect((await resolve(w, "zz-copper-lantern-maple-zz")).status).toBe(400);
    expect(await cached("zz-copper-lantern-maple-zz")).toBe(false);
  });

  it("skips the cache for any request that carries Authorization", async () => {
    const w = await makeWorld();
    const alice = await signIn(w);
    const code = await mint(w, alice.access);
    await resolve(w, code.canonical);
    await env.ZZ_DB.prepare(
      "UPDATE record_versions SET title = 'fresh from D1'",
    ).run();
    const signedIn = await (
      await resolve(w, code.canonical, alice.access)
    ).json<{ record: { title: string } }>();
    expect(signedIn.record.title).toBe("fresh from D1");
  });
});

describe("purge on record update, revoke, and deletion (T024)", () => {
  it("purges on revoke, so the next resolve is not-found", async () => {
    const w = await makeWorld();
    const alice = await signIn(w);
    const code = await mint(w, alice.access);
    await resolve(w, code.canonical);
    expect(await cached(code.canonical)).toBe(true);
    await call(w, "POST", `/v1/codes/${code.id}/revoke`, {
      token: alice.access,
    });
    expect(await cached(code.canonical)).toBe(false);
    const after = await resolve(w, code.canonical);
    expect(await expectMatchesSchema(after, "resolveCode", 404)).toEqual({
      error: "not-found",
    });
  });

  it("purges on a record update, so the next resolve shows the new version", async () => {
    const w = await makeWorld();
    const alice = await signIn(w);
    const code = await mint(w, alice.access);
    await resolve(w, code.canonical);
    const update = await call(
      w,
      "POST",
      `/v1/records/${code.record_id}/versions`,
      {
        token: alice.access,
        body: { title: "Found cat", body: "Thank you." },
      },
    );
    expect(update.status).toBe(201);
    expect(await cached(code.canonical)).toBe(false);
    const body = await (
      await resolve(w, code.canonical)
    ).json<{ record: { title: string } }>();
    expect(body.record.title).toBe("Found cat");
  });
});
