import { afterEach, describe, expect, it, vi } from "vitest";
import { joinBase, url } from "../src/lib/url";

describe("joinBase", () => {
  it("joins the project base with a relative path", () => {
    expect(joinBase("/zzthis/", "images/panels/b-crate-word-code.webp")).toBe(
      "/zzthis/images/panels/b-crate-word-code.webp",
    );
  });

  it("joins the root base", () => {
    expect(joinBase("/", "demo")).toBe("/demo");
  });

  it("strips leading slashes from the path", () => {
    expect(joinBase("/zzthis/", "/demo")).toBe("/zzthis/demo");
    expect(joinBase("/zzthis/", "///images/a.webp")).toBe(
      "/zzthis/images/a.webp",
    );
  });

  it("adds or collapses the trailing slash on the base", () => {
    expect(joinBase("/zzthis", "about")).toBe("/zzthis/about");
    expect(joinBase("/zzthis//", "about")).toBe("/zzthis/about");
  });

  it("returns the base for an empty path", () => {
    expect(joinBase("/zzthis/", "")).toBe("/zzthis/");
    expect(joinBase("/", "")).toBe("/");
  });

  it("keeps hashes and queries", () => {
    expect(joinBase("/zzthis/", "#field-logistics")).toBe(
      "/zzthis/#field-logistics",
    );
    expect(joinBase("/zzthis/", "demo?flow=b")).toBe("/zzthis/demo?flow=b");
  });
});

describe("url", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("uses BASE_URL", () => {
    vi.stubEnv("BASE_URL", "/zzthis/");
    expect(url("how-it-works")).toBe("/zzthis/how-it-works");
  });
});
