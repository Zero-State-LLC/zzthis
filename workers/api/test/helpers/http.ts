import { decodeJwt } from "jose";
import { executionContext, type World } from "./world.ts";

export interface CallOptions {
  readonly token?: string;
  readonly body?: unknown;
  readonly raw?: BodyInit;
  readonly contentType?: string;
  readonly headers?: Record<string, string>;
  // null sends no X-ZZ-Contract header.
  readonly contract?: string | null;
  readonly cookie?: string;
  // null sends no CF-Connecting-IP header.
  readonly ip?: string | null;
}

export const TEST_IP = "203.0.113.7";

export function request(
  path: string,
  method: string,
  options: CallOptions = {},
): Request {
  const headers = new Headers(options.headers);
  if (options.contract !== null)
    headers.set("X-ZZ-Contract", options.contract ?? "1");
  if (options.token !== undefined)
    headers.set("Authorization", `Bearer ${options.token}`);
  if (options.cookie !== undefined) headers.set("Cookie", options.cookie);
  if (options.ip !== null)
    headers.set("CF-Connecting-IP", options.ip ?? TEST_IP);
  let body: BodyInit | undefined = options.raw;
  if (options.body !== undefined) {
    body = JSON.stringify(options.body);
    headers.set("Content-Type", "application/json");
  }
  if (options.contentType !== undefined)
    headers.set("Content-Type", options.contentType);
  return new Request(`https://zz.example.test${path}`, {
    method,
    headers,
    body,
  });
}

export function call(
  w: World,
  method: string,
  path: string,
  options: CallOptions = {},
): Promise<Response> {
  return Promise.resolve(
    w.worker.fetch(request(path, method, options), w.env, executionContext()),
  );
}

export async function nonce(w: World): Promise<string> {
  const response = await call(w, "POST", "/v1/auth/nonce");
  const body = await response.json<{ nonce: string }>();
  return body.nonce;
}

export interface Session {
  readonly access: string;
  readonly refresh: string | null;
  readonly cookie: string | null;
  readonly accountId: string;
}

export function cookieValue(response: Response): string | null {
  const header = response.headers.get("Set-Cookie");
  if (header === null) return null;
  return /^__Host-zz_refresh=([^;]*)/.exec(header)?.[1] ?? null;
}

export async function sessionFrom(response: Response): Promise<Session> {
  const body = await response
    .clone()
    .json<{ access_token: string; refresh_token: string | null }>();
  return {
    access: body.access_token,
    refresh: body.refresh_token,
    cookie: cookieValue(response),
    accountId: decodeJwt(body.access_token).sub as string,
  };
}

// Developer sign-in through the FR-020 nonce flow (FR-022).
export async function signIn(
  w: World,
  name = "alice",
  client: "ios" | "android" | "web" = "ios",
): Promise<Session> {
  const response = await call(w, "POST", "/v1/auth/token", {
    body: {
      provider: "dev",
      client,
      id_token: `dev:${name}`,
      nonce: await nonce(w),
    },
  });
  if (response.status !== 200)
    throw new Error(`sign-in failed: ${response.status}`);
  return sessionFrom(response);
}

export interface MintedCode {
  readonly id: string;
  readonly canonical: string;
  readonly check_word: string | null;
  readonly status: string;
  readonly record_id: string;
  readonly scope: string;
  readonly rerolls_remaining: number;
  readonly created_at: string;
}

export function mintBody(
  overrides: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    scope: "free_public",
    kind: "plain",
    record: { title: "Lost cat", body: "Answers to Kathy." },
    ...overrides,
  };
}

export function mintRequest(
  w: World,
  token: string,
  overrides: Record<string, unknown> = {},
): Promise<Response> {
  return call(w, "POST", "/v1/codes", { token, body: mintBody(overrides) });
}

export async function mint(
  w: World,
  token: string,
  overrides: Record<string, unknown> = {},
): Promise<MintedCode> {
  const response = await mintRequest(w, token, overrides);
  if (response.status !== 201)
    throw new Error(`mint failed: ${response.status} ${await response.text()}`);
  return response.json<MintedCode>();
}

export async function count(
  w: World,
  sql: string,
  ...params: unknown[]
): Promise<number> {
  const row = await w.env.ZZ_DB.prepare(sql)
    .bind(...params)
    .first<{ n: number }>();
  return (row as { n: number }).n;
}

export function resolvePath(code: string): string {
  return `/v1/resolve/${encodeURIComponent(code)}`;
}
