import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("design tokens", () => {
  it("matches the site stylesheets and the generated files", () => {
    execFileSync("node", ["scripts/check-design-tokens.mjs"], {
      stdio: "pipe",
    });
  });

  it("keeps the accent and the spacing scale from tokens.css", () => {
    const tokens = JSON.parse(readFileSync("design/tokens.json", "utf8")) as {
      color: Record<string, { light: string }>;
      spacing: Record<string, string>;
      type: { font: Record<string, string> };
    };
    expect(tokens.color["--color-accent"]?.light).toBe("oklch(65.9% 0.215 38)");
    expect(tokens.spacing["--space-3xs"]).toBe("4px");
    expect(tokens.spacing["--space-2xl"]).toBe("110px");
    expect(tokens.type.font["--font-body"]).toContain("IBM Plex Sans");
  });
});
