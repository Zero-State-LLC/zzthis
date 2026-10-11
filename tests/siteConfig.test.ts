import { afterEach, describe, expect, it, vi } from "vitest";

// Issue #6: the site is served from the root of https://zzthis.com. The
// staging Worker builds with ASTRO_BASE=/, and ASTRO_BASE still overrides.
async function loadConfig() {
  vi.resetModules();
  const mod = await import("../astro.config.mjs");
  return mod.default;
}

describe("astro.config.mjs", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("serves https://zzthis.com from the root by default", async () => {
    vi.stubEnv("ASTRO_BASE", undefined);
    const config = await loadConfig();
    expect(config.site).toBe("https://zzthis.com");
    expect(config.base).toBe("/");
  });

  it("keeps the ASTRO_BASE override", async () => {
    vi.stubEnv("ASTRO_BASE", "/preview/");
    const config = await loadConfig();
    expect(config.base).toBe("/preview/");
  });
});
