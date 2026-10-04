import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const openapi = readFileSync("specs/005-v1-api/openapi.yaml", "utf8");

describe("v1 OpenAPI", () => {
  it("publishes the routes the apps call", () => {
    for (const path of [
      "/v1:",
      "/v1/openapi.json:",
      "/v1/auth/token:",
      "/v1/auth/refresh:",
      "/v1/auth/revoke:",
      "/v1/me:",
      "/v1/codes:",
      "/v1/codes/{id}/reroll:",
      "/v1/me/codes:",
      "/v1/codes/{id}/revoke:",
      "/v1/resolve/{code}:",
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
  });
});
