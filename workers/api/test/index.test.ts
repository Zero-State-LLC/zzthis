import { describe, expect, it } from "vitest";
import worker from "../src/index.ts";

// Runs inside workerd through the Workers pool, so later route tests start
// from a toolchain that is known to work.
describe("worker placeholder", () => {
  it("answers 404 until the routes land", () => {
    expect(worker.fetch().status).toBe(404);
  });
});
