import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import {
  cloudflareTest,
  readD1Migrations,
} from "@cloudflare/vitest-pool-workers";
import { defineConfig } from "vitest/config";

// The operator SQL files (spec 005 plan.md, Operator work), by file name.
async function readOps(dir: string): Promise<Record<string, string>> {
  const names = (await readdir(dir)).filter((name) => name.endsWith(".sql"));
  const files = await Promise.all(
    names.map(async (name): Promise<[string, string]> => [
      name,
      await readFile(path.join(dir, name), "utf8"),
    ]),
  );
  return Object.fromEntries(files);
}

// The Workers pool needs Vitest 4 and cannot collect V8 coverage, so this
// workspace uses istanbul (spec 005 plan, Tests). The migrations and the
// operator SQL are read here, in Node, and used inside workerd.
export default defineConfig(async () => {
  const migrations = await readD1Migrations(
    path.join(import.meta.dirname, "migrations"),
  );
  const ops = await readOps(path.join(import.meta.dirname, "ops"));
  return {
    plugins: [
      cloudflareTest({
        wrangler: { configPath: "./wrangler.toml" },
        miniflare: {
          bindings: { TEST_MIGRATIONS: migrations, TEST_OPS_SQL: ops },
        },
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
