import { defineConfig } from "astro/config";

export default defineConfig({
  output: "static",
  site: "https://zero-state-llc.github.io",
  // GitHub Pages serves the site below /zzthis/, while the isolated
  // Cloudflare staging Worker serves the same artifact at its origin root.
  // The staging workflow sets ASTRO_BASE=/ before build so emitted asset URLs
  // cannot point at a non-existent /zzthis/ prefix on workers.dev.
  base: process.env.ASTRO_BASE ?? "/zzthis/",
  trailingSlash: "ignore",
  build: {
    format: "directory",
  },
});
