import { defineConfig } from "astro/config";

export default defineConfig({
  output: "static",
  site: "https://zero-state-llc.github.io",
  // GitHub Pages uses /zzthis/; isolated Worker previews/staging use the
  // origin root. Set ASTRO_BASE=/ before the Worker build.
  base: process.env.ASTRO_BASE ?? "/zzthis/",
  trailingSlash: "ignore",
  build: {
    format: "directory",
  },
});
