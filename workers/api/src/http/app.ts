import { Hono, type MiddlewareHandler } from "hono";
import { routePath } from "hono/route";
import { deleteMe, getMe } from "../account/me.ts";
import { listAudit } from "../audit/route.ts";
import { createNonce } from "../auth/nonce.ts";
import { refreshSession, revokeSession } from "../auth/session.ts";
import { exchangeToken } from "../auth/signin.ts";
import { listMyCodes } from "../codes/list.ts";
import { mintCode } from "../codes/mint.ts";
import { rerollCode } from "../codes/reroll.ts";
import { revokeCode } from "../codes/revoke.ts";
import type { Deps } from "../deps.ts";
import { readSettings } from "../env.ts";
import { getDiscovery, getOpenApi } from "../meta/discovery.ts";
import { submitRead } from "../reads/route.ts";
import { addRecordVersion } from "../records/versions.ts";
import { getRecord } from "../records/read.ts";
import { createReport } from "../reports/route.ts";
import { resolveCode } from "../resolve/resolve.ts";
import type { AppContext, AppEnv } from "./context.ts";
import {
  colo,
  errorClass,
  logConfigError,
  rayId,
  workerVersion,
  writeLog,
} from "./log.ts";
import { ApiError, failed, notFound, notReady } from "./respond.ts";

type Handler = (c: AppContext) => Promise<Response>;

// Every path in openapi.yaml, in its order.
export const ROUTES: readonly (readonly [string, string, Handler])[] = [
  ["GET", "/v1", getDiscovery],
  ["GET", "/v1/openapi.json", getOpenApi],
  ["POST", "/v1/auth/nonce", createNonce],
  ["POST", "/v1/auth/token", exchangeToken],
  ["POST", "/v1/auth/refresh", refreshSession],
  ["POST", "/v1/auth/revoke", revokeSession],
  ["GET", "/v1/me", getMe],
  ["DELETE", "/v1/me", deleteMe],
  ["POST", "/v1/codes", mintCode],
  ["POST", "/v1/codes/{id}/reroll", rerollCode],
  ["GET", "/v1/me/codes", listMyCodes],
  ["POST", "/v1/codes/{id}/revoke", revokeCode],
  ["GET", "/v1/resolve/{code}", resolveCode],
  ["GET", "/v1/records/{id}", getRecord],
  ["POST", "/v1/records/{id}/versions", addRecordVersion],
  ["POST", "/v1/reads", submitRead],
  ["POST", "/v1/reports", createReport],
  ["GET", "/v1/audit", listAudit],
];

// Outermost: after every other step, the contract header on every
// response, no-store on all but a cacheable resolve (FR-001, FR-028), and
// the log line (FR-027). The API sends no CORS headers (FR-029).
const finalize: MiddlewareHandler<AppEnv> = async (c, next) => {
  const started = Date.now();
  c.set("limiter", null);
  c.set("cache", null);
  c.set("cacheable", false);
  await next();
  c.res.headers.set("X-ZZ-Contract", "1");
  if (!c.get("cacheable")) c.res.headers.set("Cache-Control", "no-store");
  const template = routePath(c, -1).replace(/:(\w+)/g, "{$1}");
  writeLog({
    method: c.req.method,
    route: template === "/*" ? "unmatched" : template,
    status: c.res.status,
    duration_ms: Date.now() - started,
    cache: c.get("cache"),
    limiter: c.get("limiter"),
    colo: colo(c.req.raw),
    // Unset when the settings check failed before the id was made.
    request_id: (c.get("requestId") as string | undefined) ?? null,
    ray: rayId(c.req.raw),
    version: workerVersion(c.env),
  });
};

// spec 005 Environment: a missing or bad setting fails closed, and the log
// names the setting. Then the request id and the one clock reading.
function settingsCheck(deps: Deps): MiddlewareHandler<AppEnv> {
  return async (c, next) => {
    const ready = await readSettings(c.env);
    if (!ready.ok) {
      logConfigError(ready.problems);
      return notReady().toResponse();
    }
    c.set("settings", ready.settings);
    c.set("deps", deps);
    c.set("requestId", crypto.randomUUID());
    c.set("now", deps.now());
    await next();
  };
}

// FR-001: exactly 1, so a doubled header that arrives as "1, 1" is refused
// too (RFC 9110 section 5.5).
const contractHeader: MiddlewareHandler<AppEnv> = async (c, next) => {
  if (c.req.header("X-ZZ-Contract") !== "1") {
    return new ApiError(400, "contract-version").toResponse();
  }
  await next();
};

export function buildApi(deps: Deps): Hono<AppEnv> {
  const app = new Hono<AppEnv>();
  app.use("/*", finalize, settingsCheck(deps), contractHeader);
  for (const [method, path, handler] of ROUTES) {
    app.on(method, path.replace(/\{(\w+)\}/g, ":$1"), handler);
  }
  app.notFound(() => notFound().toResponse());
  // Error mapping: a decided error becomes its body; anything else is 500
  // failed, logged by name only, since a message can carry request data.
  app.onError((error) => {
    if (error instanceof ApiError) return error.toResponse();
    console.error(
      JSON.stringify({
        event: "unhandled",
        error: error.name,
        class: errorClass(error),
      }),
    );
    return failed().toResponse();
  });
  return app;
}
