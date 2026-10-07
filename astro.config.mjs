import { defineConfig } from "astro/config";

export default defineConfig({
  output: "static",
  site: "https://zero-state-llc.github.io",
  // GitHub Pages serves this project below /zzthis/, while Cloudflare Worker
  // previews serve it at the origin root. Set ASTRO_BASE=/ for previews.
  base: process.env.ASTRO_BASE ?? "/zzthis/",
  trailingSlash: "ignore",
  build: {
    format: "directory",
  },
});
