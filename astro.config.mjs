import { defineConfig } from "astro/config";

export default defineConfig({
  output: "static",
  site: "https://zzthis.com",
  // The site is served from the root of https://zzthis.com (GitHub Pages
  // custom domain, issue #6), so the default base is "/". The isolated
  // Cloudflare staging Worker also serves the artifact at its origin root and
  // still sets ASTRO_BASE=/ before build. ASTRO_BASE can point a build at a
  // subpath (for example ASTRO_BASE=/zzthis/ for the old project-site path).
  base: process.env.ASTRO_BASE ?? "/",
  trailingSlash: "ignore",
  build: {
    format: "directory",
  },
});
