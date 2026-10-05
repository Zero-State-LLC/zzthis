import { env } from "cloudflare:workers";
import { describe, expect, it } from "vitest";
import { call, count, mint, signIn } from "./helpers/http.ts";
import { fixture7Codes } from "./helpers/random.ts";
import { expectMatchesSchema } from "./helpers/schema.ts";
import { makeWorld, type World } from "./helpers/world.ts";

function report(
  w: World,
  body: unknown,
  options: { token?: string; ip?: string } = {},
): Promise<Response> {
  return call(w, "POST", "/v1/reports", { body, ...options });
}

describe("POST /v1/reports (FR-017, T016)", () => {
  it("accepts a report about a live code and about an unknown code with the same answer", async () => {
    const w = await makeWorld();
    const alice = await signIn(w);
    const code = await mint(w, alice.access);
    const unknown = fixture7Codes().find((c) => c !== code.canonical) as string;
    const live = await report(w, {
      canonical: code.canonical.toUpperCase().replace(/-/g, " "),
      reason: "spam",
      note: "Line one\nline two\u0007",
    });
    const missing = await report(w, { canonical: unknown, reason: "other" });
    const a = await expectMatchesSchema<{ id: string }>(
      live,
      "createReport",
      202,
    );
    const b = await expectMatchesSchema<{ id: string }>(
      missing,
      "createReport",
      202,
    );
    expect(Object.keys(a)).toEqual(Object.keys(b));
    expect([...live.headers.entries()]).toEqual([...missing.headers.entries()]);
    const rows = await env.ZZ_DB.prepare(
      "SELECT * FROM reports ORDER BY rowid",
    ).all<Record<string, unknown>>();
    expect(rows.results).toMatchObject([
      {
        id: a.id,
        canonical: code.canonical,
        code_id: code.id,
        reason: "spam",
        note: "Line one\nline two",
        closed_at: null,
      },
      {
        id: b.id,
        canonical: unknown,
        code_id: null,
        reason: "other",
        note: "",
      },
    ]);
    expect(
      await count(
        w,
        "SELECT count(*) AS n FROM audit_events WHERE action = 'report.create' AND result = 'ok'",
      ),
    ).toBe(2);
  });

  it("refuses a body that does not parse, a canonical the grammar refuses, and a long note", async () => {
    const w = await makeWorld();
    for (const body of [
      { reason: "spam" },
      { canonical: "zz-copper-lantern-sky-zz", reason: "rude" },
      {
        canonical: "zz-copper-lantern-sky-zz",
        reason: "spam",
        note: "x".repeat(501),
      },
    ]) {
      expect(
        await expectMatchesSchema(await report(w, body), "createReport", 400),
      ).toEqual({ error: "malformed" });
    }
    const grammar = await report(w, { canonical: "zz-copper", reason: "spam" });
    expect(await expectMatchesSchema(grammar, "createReport", 400)).toEqual({
      error: "malformed",
      reason: "no-closing-marker",
    });
    expect(
      (
        await report(w, {
          canonical: "zz-copper-lantern-sky-zz",
          reason: "spam",
          note: "\u{1F431}".repeat(500),
        })
      ).status,
    ).toBe(202);
    expect(await count(w, "SELECT count(*) AS n FROM reports")).toBe(1);
  });

  it("names a signed-in reporter in the audit event and never answers 401", async () => {
    const w = await makeWorld();
    const alice = await signIn(w);
    expect(
      (
        await report(
          w,
          { canonical: "zz-copper-lantern-sky-zz", reason: "harassment" },
          { token: alice.access },
        )
      ).status,
    ).toBe(202);
    expect(
      (
        await report(
          w,
          { canonical: "zz-copper-lantern-sky-zz", reason: "personal-data" },
          { token: "unusable" },
        )
      ).status,
    ).toBe(202);
    const actors = await env.ZZ_DB.prepare(
      "SELECT actor_id FROM audit_events WHERE action = 'report.create' ORDER BY rowid",
    ).all<{ actor_id: string | null }>();
    expect(actors.results.map((r) => r.actor_id)).toEqual([
      alice.accountId,
      null,
    ]);
  });

  it("counts reports against the IP only, signed in or not (FR-011, D-2026-10-05-04)", async () => {
    const w = await makeWorld();
    const alice = await signIn(w);
    const bob = await signIn(w, "bob");
    const body = { canonical: "zz-copper-lantern-sky-zz", reason: "spam" };
    for (let i = 0; i < 10; i += 1) {
      const token = i % 2 === 0 ? alice.access : undefined;
      expect(
        (await report(w, body, token === undefined ? {} : { token })).status,
      ).toBe(202);
    }
    // Another account from the same IP shares the IP's count.
    const limited = await report(w, body, { token: bob.access });
    expect(await expectMatchesSchema(limited, "createReport", 429)).toEqual({
      error: "rate-limited",
    });
    expect(
      (await report(w, body, { token: bob.access, ip: "198.51.100.9" })).status,
    ).toBe(202);
  });
});
