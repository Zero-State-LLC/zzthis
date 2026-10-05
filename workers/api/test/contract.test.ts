import { describe, expect, it } from "vitest";
import openapi from "../src/generated/openapi.json";
import { call } from "./helpers/http.ts";
import { contractOperations, expectMatchesSchema } from "./helpers/schema.ts";
import { makeWorld } from "./helpers/world.ts";

// A concrete path for each template in openapi.yaml.
function concrete(path: string): string {
  return path
    .replace("{id}", "some-id")
    .replace("{code}", "zz-copper-lantern-sky-zz");
}

describe("contract header (FR-001, T002)", () => {
  const operations = contractOperations();

  it("covers every path and method in openapi.yaml", () => {
    expect(operations).toHaveLength(18);
  });

  for (const { method, path, operationId } of operations) {
    for (const [label, value] of [
      ["missing", null],
      ["2", "2"],
      ["doubled as 1, 1", "1, 1"],
      ["empty", ""],
    ] as const) {
      it(`${method} ${path} with ${label} is 400 contract-version`, async () => {
        const w = await makeWorld();
        const response = await call(w, method, concrete(path), {
          contract: value,
        });
        const body = await expectMatchesSchema(response, operationId, 400);
        expect(body).toEqual({ error: "contract-version" });
        expect(response.headers.get("X-ZZ-Contract")).toBe("1");
        expect(response.headers.get("Cache-Control")).toBe("no-store");
      });
    }
  }

  it("sends no CORS headers, even to a preflight", async () => {
    const w = await makeWorld();
    const response = await call(w, "OPTIONS", "/v1/codes", {
      contract: null,
      headers: {
        Origin: "https://evil.example",
        "Access-Control-Request-Method": "POST",
      },
    });
    expect(response.status).toBe(400);
    for (const name of response.headers.keys()) {
      expect(name.startsWith("access-control-")).toBe(false);
    }
  });

  it("answers an unknown /v1 path with the not-found body, the header, and no-store", async () => {
    const w = await makeWorld();
    const response = await call(w, "GET", "/v1/nothing-here");
    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: "not-found" });
    expect(response.headers.get("X-ZZ-Contract")).toBe("1");
    expect(response.headers.get("Cache-Control")).toBe("no-store");
  });
});

describe("GET /v1 (T002)", () => {
  it("lists the local deployment: dev only, free_public on, fixture-7, no photo reads", async () => {
    const w = await makeWorld();
    const response = await call(w, "GET", "/v1");
    const body = await expectMatchesSchema(response, "getDiscovery", 200);
    expect(body).toEqual({
      contract: "1",
      free_public: true,
      auth_providers: ["dev"],
      scopes: ["enterprise", "logistics", "free_public"],
      wordlist_version: "fixture-7",
      photo_reads: false,
    });
    expect(response.headers.get("Cache-Control")).toBe("no-store");
  });

  it("leaves free_public out of scopes while the flag is off (FR-005)", async () => {
    const w = await makeWorld({
      settings: { ZZ_FREE_PUBLIC: "false", ZZ_DEV_AUTH: undefined },
    });
    const body = await expectMatchesSchema<Record<string, unknown>>(
      await call(w, "GET", "/v1"),
      "getDiscovery",
      200,
    );
    expect(body.free_public).toBe(false);
    expect(body.scopes).toEqual(["enterprise", "logistics"]);
    expect(body.auth_providers).toEqual([]);
  });

  it("reports photo_reads only with the flag and a reader port (FR-033)", async () => {
    const reader = {
      read: async () => ({
        canonical: null,
        band: "abstain" as const,
        reason: null,
      }),
    };
    const flagOnly = await makeWorld({ settings: { ZZ_PHOTO_READS: "true" } });
    const both = await makeWorld({
      settings: { ZZ_PHOTO_READS: "true" },
      photoReader: reader,
    });
    const readerOnly = await makeWorld({ photoReader: reader });
    for (const [w, expected] of [
      [flagOnly, false],
      [both, true],
      [readerOnly, false],
    ] as const) {
      const body = await (
        await call(w, "GET", "/v1")
      ).json<{ photo_reads: boolean }>();
      expect(body.photo_reads).toBe(expected);
    }
  });
});

describe("GET /v1/openapi.json (FR-002)", () => {
  it("returns this contract as JSON", async () => {
    const w = await makeWorld();
    const response = await call(w, "GET", "/v1/openapi.json");
    const body = await expectMatchesSchema(response, "getOpenApi", 200);
    expect(body).toEqual(openapi);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
  });
});
