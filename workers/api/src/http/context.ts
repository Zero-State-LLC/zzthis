import type { Context } from "hono";
import type { Deps } from "../deps.ts";
import type { Settings, WorkerEnv } from "../env.ts";

export type CacheStatus = "hit" | "miss";

export interface AppEnv {
  Bindings: WorkerEnv;
  Variables: {
    settings: Settings;
    deps: Deps;
    // A fresh id per request. Guarded writes use it as write_id (FR-031).
    requestId: string;
    // One clock reading per request, so every row a call writes agrees.
    now: number;
    // The OpenAPI path template, for the log line (FR-027).
    route: string;
    limiter: string | null;
    cache: CacheStatus | null;
    // Only a cacheable resolve keeps its public Cache-Control (FR-028).
    cacheable: boolean;
  };
}

export type AppContext = Context<AppEnv>;
