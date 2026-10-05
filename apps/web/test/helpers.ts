import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createApi, type Api } from "../src/lib/api.ts";
import type { PageEnv } from "../src/lib/page.ts";

export interface Call {
  readonly method: string;
  readonly url: string;
  readonly headers: Record<string, string>;
  readonly body: unknown;
  readonly init: RequestInit;
}

export type Handler = (call: Call) => Response | Promise<Response>;

export function json(status: number, body?: unknown): Response {
  return new Response(body === undefined ? null : JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

// A scripted /v1: every call is recorded, and the handler answers it.
export function fakeServer(handler: Handler) {
  const calls: Call[] = [];
  const fetch = (async (input: RequestInfo | URL, init: RequestInit = {}) => {
    const call: Call = {
      method: init.method ?? "GET",
      url: String(input),
      headers: { ...(init.headers as Record<string, string>) },
      body: typeof init.body === "string" ? JSON.parse(init.body) : undefined,
      init,
    };
    calls.push(call);
    return handler(call);
  }) as typeof globalThis.fetch;
  return { fetch, calls };
}

export class Clock {
  constructor(public ms = 1_800_000_000_000) {}
  now = () => this.ms;
}

export function token(n: number) {
  return {
    access_token: `access-${n}`,
    token_type: "Bearer",
    expires_in: 900,
    refresh_token: null,
  };
}

// The built page, so the controller drives the markup the Worker serves.
export function loadPage(page: string): void {
  const file = join(import.meta.dirname, "../dist", page, "index.html");
  const html = readFileSync(file, "utf8");
  const body = /<body>([\s\S]*)<\/body>/.exec(html)?.[1] ?? "";
  // The page's module script is the controller under test; it is mounted
  // by the test, not loaded by happy-dom.
  document.head.replaceChildren();
  document.body.innerHTML = body.replace(/<script\b[\s\S]*?<\/script>/g, "");
}

export interface EnvOptions {
  readonly handler: Handler;
  readonly search?: string;
  readonly pathname?: string;
  readonly share?: (data: ShareData) => Promise<void>;
  readonly win?: Record<string, unknown>;
  readonly locks?: LockManager;
}

export function fakeEnv(options: EnvOptions): {
  env: PageEnv;
  api: Api;
  calls: Call[];
  went: string[];
} {
  const server = fakeServer(options.handler);
  const api = createApi({
    fetch: server.fetch,
    locks: options.locks,
    now: new Clock().now,
  });
  const went: string[] = [];
  const nav = (
    options.share === undefined ? {} : { share: options.share }
  ) as Navigator;
  const env: PageEnv = {
    doc: document,
    api,
    location: {
      search: options.search ?? "",
      pathname: options.pathname ?? "/",
    },
    go: (url) => went.push(url),
    nav,
    win: options.win ?? {},
  };
  return { env, api, calls: server.calls, went };
}

// Lets the controllers' awaited calls finish.
export async function settle(): Promise<void> {
  for (let i = 0; i < 10; i += 1)
    await new Promise((resolve) => setTimeout(resolve, 0));
}

export function submit(form: HTMLFormElement): void {
  form.dispatchEvent(new Event("submit", { cancelable: true, bubbles: true }));
}

export function el<T extends HTMLElement = HTMLElement>(id: string): T {
  const element = document.getElementById(id);
  if (element === null) throw new Error(`#${id} is missing`);
  return element as T;
}

export function visibleText(id: string): string | null {
  const element = el(id);
  return element.hidden ? null : (element.textContent ?? "").trim();
}
