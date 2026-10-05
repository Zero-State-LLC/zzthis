import type { D1Migration } from "cloudflare:test";

declare global {
  namespace Cloudflare {
    interface Env {
      TEST_MIGRATIONS: D1Migration[];
      // workers/api/ops/*.sql, by file name (vitest.config.ts).
      TEST_OPS_SQL: Record<string, string>;
    }
  }
}

export {};
