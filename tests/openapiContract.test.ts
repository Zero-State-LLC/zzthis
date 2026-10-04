import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const openapi = readFileSync("specs/005-v1-api/openapi.yaml", "utf8");

describe("v1 OpenAPI", () => {
  it("publishes the routes the apps call", () => {
    for (const path of [
      "/v1:",
      "/v1/openapi.json:",
      "/v1/auth/nonce:",
      "/v1/auth/token:",
      "/v1/auth/refresh:",
      "/v1/auth/revoke:",
      "/v1/me:",
      "/v1/codes:",
      "/v1/codes/{id}/reroll:",
      "/v1/me/codes:",
      "/v1/codes/{id}/revoke:",
      "/v1/resolve/{code}:",
      "/v1/records/{id}:",
      "/v1/records/{id}/versions:",
      "/v1/reads:",
      "/v1/reports:",
      "/v1/audit:",
    ]) {
      expect(openapi).toContain(path);
    }
    expect(openapi).toContain("X-ZZ-Contract");
    expect(openapi).toContain("rerolls_remaining");
    expect(openapi).toContain("reroll-cap");
    expect(openapi).toContain("Retry-After");
    expect(openapi).toContain("public, max-age=60, stale-while-revalidate=300");
    expect(openapi).toContain("no-store");
    expect(openapi).toContain(
      "https://cache.zzthis.internal/v1/resolve/{canonical}",
    );
    expect(openapi).toContain("enum: [900]");
    expect(openapi).toContain("__Host-zz_refresh");
    expect(openapi).toContain("NotFoundError");
    expect(openapi).toContain("RateLimitedError");
    expect(openapi).toContain("additionalProperties: false");
    expect(openapi).toContain("maxLength: 8388608");
    expect(openapi).not.toContain("this request as the cache key");
  });
});
