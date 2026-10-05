import { describe, expect, it } from "vitest";
import { scanText } from "../src/scanner.ts";

// Cases beyond vectors.json for branches the rows do not reach.
describe("scanText", () => {
  it("sets a trailing colon aside from a bare zz", () => {
    expect(scanText("zz: copper")).toEqual([{ kind: "bare" }]);
  });

  it("treats every Unicode space as a space", () => {
    expect(scanText("zz\u00a0copper\u2003sky\u00a0zz")).toEqual([
      { kind: "code", canonical: "zz-copper-sky-zz", codeKind: "plain" },
    ]);
  });

  it("treats every White_Space character as a space, and U+FEFF as text", () => {
    expect(scanText("zz\u000bcopper\u000csky\u0085lantern\u2028zz")).toEqual([
      {
        kind: "code",
        canonical: "zz-copper-sky-lantern-zz",
        codeKind: "plain",
      },
    ]);
    expect(scanText("zz copper\ufeffsky zz")).toEqual([
      {
        kind: "invalid",
        reason: "invalid-character",
        text: "zz copper\ufeffsky zz",
      },
    ]);
  });

  it("reads a zz@ token that ends a clause as partial", () => {
    expect(scanText("see zz@bob.")).toEqual([
      { kind: "partial", text: "zz@bob" },
    ]);
  });

  it("does not pair across a clause end between the markers", () => {
    expect(scanText("zz copper. sky zz")).toEqual([
      { kind: "partial", text: "zz copper" },
      { kind: "bare" },
    ]);
  });

  it("does not pair a zz@ token that holds nothing", () => {
    expect(scanText("sky-zz@ zz-copper")).toEqual([
      { kind: "bare" },
      { kind: "partial", text: "zz-copper" },
    ]);
  });

  it("keeps a run of separators between tokens", () => {
    expect(scanText("zz -- copper  sky zz")).toEqual([
      { kind: "code", canonical: "zz-copper-sky-zz", codeKind: "plain" },
    ]);
  });

  it("reads a closing-only fragment back to the clause start", () => {
    expect(scanText("Box. copper-sky-zz")).toEqual([
      { kind: "partial", text: "copper-sky-zz" },
    ]);
  });

  it("reads a closing-only fragment back to the previous marker", () => {
    expect(scanText("zz. copper-sky-zz")).toEqual([
      { kind: "bare" },
      { kind: "partial", text: "copper-sky-zz" },
    ]);
  });
});
