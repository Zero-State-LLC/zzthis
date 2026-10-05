import { defineConfig } from "astro/config";

// spec 005 plan, Repo layout: static output served by the Worker on the
// same origin, with no inline styles or assets, so every page stays inside
// the spec.md content security policy.
export default defineConfig({
  output: "static",
  build: {
    inlineStylesheets: "never",
  },
  vite: {
    build: {
      assetsInlineLimit: 0,
    },
  },
});
