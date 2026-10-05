import { defineConfig } from "vitest/config";

// Page logic tests run on the root Vitest with v8 coverage (spec 005 plan,
// Tests). The page tests load the built pages from dist/, so the markup
// they drive is the markup the Worker serves; the test script builds first.
export default defineConfig({
  test: {
    environment: "node",
    include: ["test/**/*.test.ts"],
    // happy-dom never fetches a script or a stylesheet in these tests, so
    // the provider scripts on /signin/ load as a stub.
    environmentOptions: {
      happyDOM: {
        settings: {
          disableJavaScriptFileLoading: true,
          disableCSSFileLoading: true,
          handleDisabledFileLoadingAsSuccess: true,
        },
      },
    },
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
