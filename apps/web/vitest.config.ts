import { defineConfig } from "vitest/config";

// Page logic tests run on the root Vitest with v8 coverage (spec 005 plan,
// Tests). The pages and their tests land in spec 005 Group H.
export default defineConfig({
  test: {
    environment: "node",
    include: ["test/**/*.test.ts"],
    passWithNoTests: true,
    coverage: {
      provider: "v8",
      include: ["src/**/*.ts"],
      thresholds: {
        lines: 100,
        branches: 100,
        functions: 100,
        statements: 100,
      },
    },
  },
});
