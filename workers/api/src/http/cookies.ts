import { getCookie } from "hono/cookie";
import type { AppContext } from "./context.ts";

// FR-021: the web client's refresh token lives only in this cookie
// (RFC 6265bis __Host- prefix: Secure, Path=/, no Domain).
export const REFRESH_COOKIE = "__Host-zz_refresh";

const ATTRIBUTES = "HttpOnly; Secure; SameSite=Strict; Path=/";
const THIRTY_DAYS_SECONDS = 2592000;

export function refreshCookie(token: string): string {
  return `${REFRESH_COOKIE}=${token}; ${ATTRIBUTES}; Max-Age=${THIRTY_DAYS_SECONDS}`;
}

export function clearedRefreshCookie(): string {
  return `${REFRESH_COOKIE}=; ${ATTRIBUTES}; Max-Age=0`;
}

export function readRefreshCookie(c: AppContext): string | undefined {
  const value = getCookie(c, REFRESH_COOKIE);
  return value === undefined || value === "" ? undefined : value;
}
