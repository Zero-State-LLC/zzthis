import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const config = readFileSync(
  new URL("../workers/api/wrangler.production.toml", import.meta.url),
  "utf8",
);

const vars = Object.fromEntries(
  [...config.matchAll(/^([A-Z0-9_]+) = "([^"]*)"$/gm)].map((match) => [
    match[1],
    match[2],
  ]),
);

describe("wrangler.production.toml", () => {
  it("names the production worker and refuses staging resources", () => {
    expect(config).toContain('name = "zzthis-api"');
    expect(config).toContain('database_name = "zzthis"');
    expect(config).toContain('bucket_name = "zzthis-photos"');
    expect(config).toContain('pattern = "zz.zer0state.com"');
    expect(config).not.toMatch(/staging/i);
    expect(vars.ZZ_WORDLIST_VERSION).not.toBe("fixture-7");
  });

  it("keeps production flags fail-closed and invocation logs off", () => {
    expect(vars.ZZ_ENV).toBe("production");
    expect(vars.ZZ_DEV_AUTH).toBe("false");
    expect(vars.ZZ_PHOTO_READS).toBe("false");
    expect(vars.ZZ_FREE_PUBLIC).toBe("false");
    expect(vars.ZZ_MINT_ENABLED).toBe("false");
    expect(vars.ZZ_WORDLIST_VERSION).toBe("proto-v0");
    expect(config).toMatch(/^workers_dev = false$/m);
    expect(config).toMatch(/^preview_urls = false$/m);
    expect(config).toContain("invocation_logs = false");
    expect(config).not.toContain("invocation_logs = true");
    for (const secret of [
      "ZZ_TOKEN_SECRET",
      "ZZ_DATA_KEY",
      "ZZ_RECORD_SIGNING_KEY",
      "APPLE_PRIVATE_KEY",
      "CLOUDFLARE_API_TOKEN",
    ]) {
      expect(config).not.toMatch(new RegExp(`^${secret} =`, "m"));
    }
  });

  it("leaves resource ids unassigned until the operator creates them", () => {
    expect(config).toContain(
      'database_id = "00000000-0000-0000-0000-000000000000"',
    );
  });
});
