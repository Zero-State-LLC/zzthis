import { readSettings, type WorkerEnv } from "./env.ts";
import { colo, logConfigError, writeLog } from "./http/log.ts";
import { json } from "./http/respond.ts";

// spec 005 Security headers: one mechanism sends them. Every request that
// is not /v1 goes to the assets binding, and the Worker adds the headers to
// a copy of that response. There is no _headers file and no meta CSP.
export const DEFAULT_CSP =
  "default-src 'self'; img-src 'self' data:; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'";

// unsafe-inline styles only here, because Apple's button injects them.
export const SIGNIN_CSP =
  "default-src 'self'; script-src 'self' https://accounts.google.com/gsi/client https://appleid.cdn-apple.com; frame-src https://accounts.google.com/gsi/; connect-src 'self' https://accounts.google.com/gsi/; style-src 'self' 'unsafe-inline' https://accounts.google.com/gsi/style; font-src 'self' data:; img-src 'self' data:; object-src 'none'; base-uri 'self'; frame-ancestors 'none'";

const SIGNIN_PATHS = new Set(["/signin/", "/signin/index.html"]);

export function securityHeaders(pathname: string): Record<string, string> {
  if (!SIGNIN_PATHS.has(pathname)) {
    return { "Content-Security-Policy": DEFAULT_CSP };
  }
  return {
    "Content-Security-Policy": SIGNIN_CSP,
    // Never same-origin, which breaks the provider popups.
    "Cross-Origin-Opener-Policy": "same-origin-allow-popups",
    "Referrer-Policy": "strict-origin-when-cross-origin",
  };
}

export async function serveAsset(
  request: Request,
  env: WorkerEnv,
): Promise<Response> {
  const started = Date.now();
  const pathname = new URL(request.url).pathname;
  const ready = await readSettings(env);
  let response: Response;
  if (ready.ok) {
    const asset = await env.ASSETS.fetch(request);
    response = new Response(asset.body, asset);
  } else {
    // Fail closed on every request, the web client's files included.
    logConfigError(ready.problems);
    response = json(
      503,
      { error: "not-ready" },
      { "Cache-Control": "no-store" },
    );
  }
  for (const [name, value] of Object.entries(securityHeaders(pathname))) {
    response.headers.set(name, value);
  }
  writeLog({
    method: request.method,
    route: "assets",
    status: response.status,
    duration_ms: Date.now() - started,
    cache: null,
    limiter: null,
    colo: colo(request),
  });
  return response;
}
