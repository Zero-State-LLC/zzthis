import { serveAsset } from "./assets.ts";
import type { Deps } from "./deps.ts";
import type { WorkerEnv } from "./env.ts";
import { buildApi } from "./http/app.ts";
import { runRetention } from "./retention/cron.ts";

function isApi(pathname: string): boolean {
  return pathname === "/v1" || pathname.startsWith("/v1/");
}

// One Worker serves /v1 and the web client's files on one origin (FR-029).
// With run_worker_first, every request reaches this fetch first.
export function createWorker(deps: Deps) {
  const api = buildApi(deps);
  return {
    fetch(request: Request, env: WorkerEnv, ctx: ExecutionContext) {
      if (isApi(new URL(request.url).pathname)) {
        return api.fetch(request, env, ctx);
      }
      return serveAsset(request, env);
    },
    async scheduled(_controller: ScheduledController, env: WorkerEnv) {
      await runRetention(env, deps);
    },
  } satisfies ExportedHandler<WorkerEnv>;
}
