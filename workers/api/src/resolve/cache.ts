// FR-018 and FR-019 on the Workers Cache API. The policy is the one
// tests/edgeCache.test.ts states (spec 005 T025).

export const PUBLIC_CACHE_CONTROL =
  "public, max-age=60, stale-while-revalidate=300";

// The canonical form, percent-encoded once, on the internal cache origin.
// Not the caller's URL, so every spelling of a code shares one key.
export function cacheKey(canonical: string): string {
  return `https://cache.zzthis.internal/v1/resolve/${encodeURIComponent(canonical)}`;
}

export async function cachedResolve(
  canonical: string,
): Promise<Response | null> {
  const hit = await caches.default.match(cacheKey(canonical));
  // A hit is returned as stored. The copy has headers this Worker can set.
  return hit === undefined ? null : new Response(hit.body, hit);
}

export async function storeResolve(
  canonical: string,
  response: Response,
): Promise<void> {
  await caches.default.put(cacheKey(canonical), response.clone());
}

// Record update, revoke, and account deletion purge that code's key.
// cache.delete clears only this data center, so other data centers keep
// their copy until max-age ends (FR-019 c).
export async function purgeResolve(canonical: string): Promise<void> {
  await caches.default.delete(cacheKey(canonical));
}
