// Edge-cache rule for GET /v1/resolve. [DANNY 2026-10-04]
// The Worker applies this with the Workers Cache API.

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

export function cacheKey(canonical: string): string {
  return `/v1/resolve/${encodeURIComponent(canonical)}`;
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

export function rateLimitedResponse(codeExists: boolean): {
  status: 429;
  body: string;
  cacheControl: typeof NO_STORE;
} {
  // Same body whether or not the code exists.
  return {
    status: 429,
    body: codeExists ? RATE_LIMITED_BODY : RATE_LIMITED_BODY,
    cacheControl: NO_STORE,
  };
}

export function readCachedResolve(
  store: ResolveCacheStore,
  canonical: string,
  kind: ResolveCacheClass,
  load: () => string,
): { body: string; cacheControl: string; hit: boolean } {
  const header = cacheControl(kind);
  if (kind !== "public") {
    return { body: load(), cacheControl: header, hit: false };
  }
  const key = cacheKey(canonical);
  const cached = store.match(key);
  if (cached !== undefined) {
    return { body: cached, cacheControl: header, hit: true };
  }
  const body = load();
  store.put(key, body);
  return { body, cacheControl: header, hit: false };
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
