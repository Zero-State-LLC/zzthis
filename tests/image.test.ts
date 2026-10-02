import { describe, expect, it } from "vitest";
import { objectPosition } from "../src/lib/image";

describe("objectPosition", () => {
  it("maps a 0 to 1 focal point to CSS percentages, x first", () => {
    expect(objectPosition({ x: 0.5, y: 0.25 })).toBe("50% 25%");
  });

  it("handles the corners", () => {
    expect(objectPosition({ x: 0, y: 1 })).toBe("0% 100%");
  });
});
