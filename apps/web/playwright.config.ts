import { defineConfig, devices } from "@playwright/test";

// spec 005 plan.md Tests, Playwright settings. The web server is the one
// local Worker, started fresh, so every run begins from an empty database.
// Chromium only: the Secure __Host-zz_refresh cookie is set over plain
// http://localhost in local runs, and WebKit drops it there.
// ZZ_E2E_CHANNEL=chrome drives an installed Google Chrome instead of the
// bundled Chromium, for a machine that has not run playwright install.
const channel = process.env.ZZ_E2E_CHANNEL;

export default defineConfig({
  testDir: "e2e",
  workers: 1,
  retries: 0,
  reporter: [["list"]],
  timeout: 90_000,
  use: {
    baseURL: "http://localhost:8787",
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        ...(channel === undefined ? {} : { channel }),
      },
    },
  ],
  webServer: {
    command: "npm run dev:api -- --fresh",
    cwd: "../..",
    url: "http://localhost:8787/",
    reuseExistingServer: false,
    timeout: 180_000,
  },
});
