import { describe, expect, it } from "vitest";
import {
  NO_STORE,
  PUBLIC_CACHE_CONTROL,
  type NotFoundCause,
  type PurgeReason,
  type ResolveCacheClass,
  type ResolveCacheStore,
  cacheKey,
  notFoundResponse,
  purgeCachedResolve,
  rateLimitedResponse,
  readCachedResolve,
} from "../src/lib/edgeCache";

class MemoryCache implements ResolveCacheStore {
  readonly values = new Map<string, string>();
  puts = 0;

  match(key: string): string | undefined {
    return this.values.get(key);
  }

  put(key: string, body: string): void {
    this.puts += 1;
    this.values.set(key, body);
  }

  delete(key: string): void {
    this.values.delete(key);
  }
}

const CODE = "zz-kathy-lost-cat-zz";
const PUBLIC_BODY = '{"view":"public","canonical":"zz-kathy-lost-cat-zz"}';

describe("edge cache", () => {
  it("keys the canonical form on the internal cache origin", () => {
    expect(cacheKey(CODE)).toBe(
      "https://cache.zzthis.internal/v1/resolve/zz-kathy-lost-cat-zz",
    );
    expect(cacheKey("zz-@bob-zz")).toBe(
      "https://cache.zzthis.internal/v1/resolve/zz-%40bob-zz",
    );
  });

  it("serves a cache hit before load for a signed-out caller", () => {
    const store = new MemoryCache();
    let loads = 0;
    const load = () => {
      loads += 1;
      return { body: PUBLIC_BODY, kind: "public" as const };
    };
    const first = readCachedResolve(store, CODE, false, load);
    const second = readCachedResolve(store, CODE, false, load);
    expect(first).toEqual({
      body: PUBLIC_BODY,
      cacheControl: PUBLIC_CACHE_CONTROL,
      hit: false,
    });
    expect(second).toEqual({
      body: PUBLIC_BODY,
      cacheControl: "public, max-age=60, stale-while-revalidate=300",
      hit: true,
    });
    expect(loads).toBe(1);
    expect(store.puts).toBe(1);
    expect(store.values.has(cacheKey(CODE))).toBe(true);
  });

  it("does not read or write the cache when Authorization is present", () => {
    const store = new MemoryCache();
    readCachedResolve(store, CODE, false, () => ({
      body: PUBLIC_BODY,
      kind: "public",
    }));
    const authed = readCachedResolve(store, CODE, true, () => ({
      body: "loaded-for-the-signed-in-caller",
      kind: "public",
    }));
    expect(authed).toEqual({
      body: "loaded-for-the-signed-in-caller",
      cacheControl: NO_STORE,
      hit: false,
    });
    expect(store.puts).toBe(1);
  });

  it("purges that code's cache key on revoke", () => {
    const store = new MemoryCache();
    readCachedResolve(store, CODE, false, () => ({
      body: PUBLIC_BODY,
      kind: "public",
    }));
    expect(purgeCachedResolve(store, CODE, "revoke")).toBe("revoke");
    let loads = 0;
    const after = readCachedResolve(store, CODE, false, () => {
      loads += 1;
      return { body: PUBLIC_BODY, kind: "public" as const };
    });
    expect(after.hit).toBe(false);
    expect(loads).toBe(1);
  });

  it("purges on record update and expiry as well as revoke", () => {
    const reasons: PurgeReason[] = ["record-update", "revoke", "expiry"];
    for (const reason of reasons) {
      const store = new MemoryCache();
      readCachedResolve(store, "zz-post-maple-river-zz", false, () => ({
        body: PUBLIC_BODY,
        kind: "public",
      }));
      purgeCachedResolve(store, "zz-post-maple-river-zz", reason);
      expect(store.values.size).toBe(0);
    }
  });

  it("sends no-store and stores nothing for each excluded class", () => {
    const excluded: ResolveCacheClass[] = [
      "single-use",
      "short-expiry",
      "private",
      "authenticated",
      "not-found",
      "rate-limited",
    ];
    for (const kind of excluded) {
      const store = new MemoryCache();
      const result = readCachedResolve(store, CODE, false, () => ({
        body: PUBLIC_BODY,
        kind,
      }));
      expect(result.cacheControl).toBe(NO_STORE);
      expect(result.hit).toBe(false);
      expect(result.body).toBe(PUBLIC_BODY);
      expect(store.puts).toBe(0);
      expect(store.values.size).toBe(0);
    }
  });

  it("stores nothing when a signed-in caller loads an excluded class", () => {
    const store = new MemoryCache();
    const result = readCachedResolve(store, CODE, true, () => ({
      body: PUBLIC_BODY,
      kind: "single-use",
    }));
    expect(result.cacheControl).toBe(NO_STORE);
    expect(store.puts).toBe(0);
  });

  it("uses one 404 body and one 429 body, both no-store", () => {
    const causes: NotFoundCause[] = [
      "unknown",
      "expired",
      "used",
      "revoked",
      "private-signed-out",
    ];
    const bodies = causes.map((cause) => notFoundResponse(cause));
    for (const body of bodies) {
      expect(body).toEqual(bodies[0]);
      expect(body.cacheControl).toBe("no-store");
    }
    const live = rateLimitedResponse(true, 30);
    const missing = rateLimitedResponse(false, 30);
    expect(live).toEqual(missing);
    expect(live).toEqual({
      status: 429,
      body: '{"error":"rate-limited"}',
      cacheControl: "no-store",
      retryAfter: 30,
    });
    expect(bodies[0]).toEqual({
      status: 404,
      body: '{"error":"not-found"}',
      cacheControl: "no-store",
    });
  });
});
