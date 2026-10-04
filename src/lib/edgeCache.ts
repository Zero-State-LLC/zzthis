// Edge-cache rule for GET /v1/resolve. [DANNY 2026-10-04]
// The Worker applies this with the Workers Cache API.
// Spec 005 FR-018 and FR-019. The key is the canonical form, not the
// caller's URL, so every spelling of a code shares one entry.

export const PUBLIC_CACHE_CONTROL =
  "public, max-age=60, stale-while-revalidate=300";

export const NO_STORE = "no-store";

export const NOT_FOUND_BODY = '{"error":"not-found"}';

export const RATE_LIMITED_BODY = '{"error":"rate-limited"}';

/** Active, reusable, public, and unauthenticated. The only stored class. */
export type ResolveCacheClass =
  | "public"
  | "single-use"
  | "short-expiry"
  | "private"
  | "authenticated"
  | "not-found"
  | "rate-limited";

export type NotFoundCause =
  "unknown" | "expired" | "used" | "revoked" | "private-signed-out";

export type PurgeReason = "record-update" | "revoke" | "expiry";

export interface ResolveCacheStore {
  match(key: string): string | undefined;
  put(key: string, body: string): void;
  delete(key: string): void;
}

export interface LoadedResolve {
  body: string;
  kind: ResolveCacheClass;
}

/** Percent-encode the canonical form once. Not the request URL. */
export function cacheKey(canonical: string): string {
  return `https://cache.zzthis.internal/v1/resolve/${encodeURIComponent(canonical)}`;
}

export function cacheControl(kind: ResolveCacheClass): string {
  return kind === "public" ? PUBLIC_CACHE_CONTROL : NO_STORE;
}

export function notFoundResponse(cause: NotFoundCause): {
  status: 404;
  body: string;
  cacheControl: typeof NO_STORE;
} {
  const body: Record<NotFoundCause, string> = {
    unknown: NOT_FOUND_BODY,
    expired: NOT_FOUND_BODY,
    used: NOT_FOUND_BODY,
    revoked: NOT_FOUND_BODY,
    "private-signed-out": NOT_FOUND_BODY,
  };
  return { status: 404, body: body[cause], cacheControl: NO_STORE };
}

export function rateLimitedResponse(
  codeExists: boolean,
  retryAfter: number,
): {
  status: 429;
  body: string;
  cacheControl: typeof NO_STORE;
  retryAfter: number;
} {
  // Same body and the same Retry-After whether or not the code exists.
  const body = codeExists ? RATE_LIMITED_BODY : RATE_LIMITED_BODY;
  return {
    status: 429,
    body,
    cacheControl: NO_STORE,
    retryAfter,
  };
}

/**
 * Look up the cache before D1 when the caller is signed out.
 * A hit does not call load. Classification happens only on a miss,
 * and only a public unauthenticated miss is stored.
 */
export function readCachedResolve(
  store: ResolveCacheStore,
  canonical: string,
  authenticated: boolean,
  load: () => LoadedResolve,
): { body: string; cacheControl: string; hit: boolean } {
  if (!authenticated) {
    const cached = store.match(cacheKey(canonical));
    if (cached !== undefined) {
      return { body: cached, cacheControl: PUBLIC_CACHE_CONTROL, hit: true };
    }
  }
  const loaded = load();
  const header = authenticated ? NO_STORE : cacheControl(loaded.kind);
  if (!authenticated && loaded.kind === "public") {
    store.put(cacheKey(canonical), loaded.body);
  }
  return { body: loaded.body, cacheControl: header, hit: false };
}

/** Record update, revoke, and expiry each purge that code's cache key. */
export function purgeCachedResolve(
  store: ResolveCacheStore,
  canonical: string,
  reason: PurgeReason,
): PurgeReason {
  store.delete(cacheKey(canonical));
  return reason;
}
