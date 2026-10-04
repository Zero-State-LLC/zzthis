import { describe, expect, it } from "vitest";
import {
  NO_STORE,
  PUBLIC_CACHE_CONTROL,
  type NotFoundCause,
  type PurgeReason,
  type ResolveCacheClass,
  type ResolveCacheStore,
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

const PUBLIC_BODY = '{"view":"public","canonical":"zz-kathy-lost-cat-zz"}';

describe("edge cache", () => {
  it("serves a cache hit for an active reusable public resolve", () => {
    const store = new MemoryCache();
    let loads = 0;
    const load = () => {
      loads += 1;
      return PUBLIC_BODY;
    };
    const first = readCachedResolve(
      store,
      "zz-kathy-lost-cat-zz",
      "public",
      load,
    );
    const second = readCachedResolve(
      store,
      "zz-kathy-lost-cat-zz",
      "public",
      load,
    );
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
  });

  it("purges that code's cache key on revoke", () => {
    const store = new MemoryCache();
    readCachedResolve(
      store,
      "zz-kathy-lost-cat-zz",
      "public",
      () => PUBLIC_BODY,
    );
    expect(purgeCachedResolve(store, "zz-kathy-lost-cat-zz", "revoke")).toBe(
      "revoke",
    );
    let loads = 0;
    const after = readCachedResolve(
      store,
      "zz-kathy-lost-cat-zz",
      "public",
      () => {
        loads += 1;
        return PUBLIC_BODY;
      },
    );
    expect(after.hit).toBe(false);
    expect(loads).toBe(1);
  });

  it("purges on record update and expiry as well as revoke", () => {
    const reasons: PurgeReason[] = ["record-update", "revoke", "expiry"];
    for (const reason of reasons) {
      const store = new MemoryCache();
      readCachedResolve(
        store,
        "zz-post-maple-river-zz",
        "public",
        () => PUBLIC_BODY,
      );
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
      const result = readCachedResolve(
        store,
        "zz-kathy-lost-cat-zz",
        kind,
        () => PUBLIC_BODY,
      );
      expect(result.cacheControl).toBe(NO_STORE);
      expect(result.hit).toBe(false);
      expect(store.puts).toBe(0);
      expect(store.values.size).toBe(0);
    }
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
    const live = rateLimitedResponse(true);
    const missing = rateLimitedResponse(false);
    expect(live).toEqual(missing);
    expect(live).toEqual({
      status: 429,
      body: '{"error":"rate-limited"}',
      cacheControl: "no-store",
    });
    expect(bodies[0]).toEqual({
      status: 404,
      body: '{"error":"not-found"}',
      cacheControl: "no-store",
    });
  });
});
