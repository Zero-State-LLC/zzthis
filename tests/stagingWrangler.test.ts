import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

// D-2026-10-13-06 (RM-013): staging mints free_public, the only scope the
// web client mints, and answers only on its Access-protected host.
const staging = readFileSync(
  new URL("../workers/api/wrangler.staging.toml", import.meta.url),
  "utf8",
);
const production = readFileSync(
  new URL("../workers/api/wrangler.production.toml", import.meta.url),
  "utf8",
);

function vars(config: string): Record<string, string | undefined> {
  return Object.fromEntries(
    [...config.matchAll(/^([A-Z0-9_]+) = "([^"]*)"$/gm)].map((match) => [
      match[1],
      match[2],
    ]),
  );
}

describe("wrangler.staging.toml", () => {
  it("names only staging resources", () => {
    expect(staging).toContain('name = "zzthis-api-staging"');
    expect(staging).toContain('database_name = "zzthis-staging"');
    expect(staging).toContain('bucket_name = "zzthis-photos-staging"');
    expect(staging).not.toContain('database_name = "zzthis"');
    expect(staging).not.toContain('bucket_name = "zzthis-photos"');
    expect(vars(staging).ZZ_ENV).toBe("staging");
  });

  it("turns free_public on and the workers.dev and preview URLs off", () => {
    expect(vars(staging).ZZ_FREE_PUBLIC).toBe("true");
    expect(staging).toMatch(/^workers_dev = false$/m);
    expect(staging).toMatch(/^preview_urls = false$/m);
    expect(staging).not.toMatch(/^workers_dev = true$/m);
    expect(staging).not.toMatch(/^preview_urls = true$/m);
  });

  it("leaves production's free_public off and its workers.dev URL off", () => {
    expect(vars(production).ZZ_FREE_PUBLIC).toBe("false");
    expect(production).toMatch(/^workers_dev = false$/m);
    expect(production).toMatch(/^preview_urls = false$/m);
  });
});
