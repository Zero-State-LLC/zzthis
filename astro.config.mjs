import { defineConfig } from "astro/config";

export default defineConfig({
  output: "static",
  site: "https://zero-state-llc.github.io",
  base: "/zzthis/",
  trailingSlash: "ignore",
  build: {
    format: "directory",
  },
});
