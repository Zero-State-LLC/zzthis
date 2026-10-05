import path from "node:path";
import {
  cloudflareTest,
  readD1Migrations,
} from "@cloudflare/vitest-pool-workers";
import { defineConfig } from "vitest/config";

// The Workers pool needs Vitest 4 and cannot collect V8 coverage, so this
// workspace uses istanbul (spec 005 plan, Tests). The migrations are read
// here, in Node, and applied inside workerd before each test.
export default defineConfig(async () => {
  const migrations = await readD1Migrations(
    path.join(import.meta.dirname, "migrations"),
  );
  return {
    plugins: [
      cloudflareTest({
        wrangler: { configPath: "./wrangler.toml" },
        miniflare: { bindings: { TEST_MIGRATIONS: migrations } },
      }),
    ],
    test: {
      include: ["test/**/*.test.ts"],
      setupFiles: ["./test/setup.ts"],
      coverage: {
        provider: "istanbul",
        include: ["src/**/*.ts"],
        exclude: ["src/generated/**"],
        thresholds: {
          lines: 100,
          branches: 100,
          functions: 100,
          statements: 100,
        },
      },
    },
  };
});
