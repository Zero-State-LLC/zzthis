import { env } from "cloudflare:workers";
import { describe, expect, it } from "vitest";
import {
  call,
  count,
  mintRequest,
  signIn,
  type MintedCode,
  type Session,
} from "./helpers/http.ts";
import { expectMatchesSchema } from "./helpers/schema.ts";
import { makeWorld, type World } from "./helpers/world.ts";

async function issuer(w: World, name: string): Promise<Session> {
  const session = await signIn(w, name);
  await env.ZZ_DB.prepare(
    "INSERT INTO grants (id, subject_id, scope, role, expires_at) VALUES (?, ?, 'enterprise', 'issuer', NULL)",
  )
    .bind(crypto.randomUUID(), session.accountId)
    .run();
  return session;
}

function handle(
  w: World,
  token: string,
  value: unknown,
  scope = "enterprise",
): Promise<Response> {
  return mintRequest(w, token, { scope, kind: "handle", handle: value });
}

describe("handle issuance (T011, spec 002 FR-016 and FR-019)", () => {
  it("issues the canonical handle with no check word and no re-rolls", async () => {
    const w = await makeWorld();
    const acme = await issuer(w, "acme");
    const response = await handle(w, acme.access, "@AgentSmith");
    const code = await expectMatchesSchema<MintedCode>(
      response,
      "mintCode",
      201,
    );
    expect(code).toMatchObject({
      canonical: "zz-@agentsmith-zz",
      check_word: null,
      rerolls_remaining: 0,
      scope: "enterprise",
    });
    const row = await env.ZZ_DB.prepare(
      "SELECT kind, list_version, match_key FROM codes WHERE id = ?",
    )
      .bind(code.id)
      .first();
    expect(row).toEqual({
      kind: "handle",
      list_version: null,
      match_key: "@agent5m1th",
    });
  });

  it("canonicalizes the whole code form too, and never substitutes another name", async () => {
    const w = await makeWorld();
    const acme = await issuer(w, "acme");
    const code = await (
      await handle(w, acme.access, "ZZ @Bob ZZ")
    ).json<MintedCode>();
    expect(code.canonical).toBe("zz-@bob-zz");
  });

  it("issues a handle with the issuer off, since no words are drawn", async () => {
    const w = await makeWorld({ settings: { ZZ_MINT_ENABLED: "false" } });
    const acme = await issuer(w, "acme");
    expect((await handle(w, acme.access, "@acme")).status).toBe(201);
  });

  it("issues a free_public handle without a grant while the flag is on", async () => {
    const w = await makeWorld();
    const alice = await signIn(w);
    expect(
      (await handle(w, alice.access, "@alice", "free_public")).status,
    ).toBe(201);
  });

  it("is reroll-cap on re-roll, because a handle has no re-rolls (FR-006)", async () => {
    const w = await makeWorld();
    const acme = await issuer(w, "acme");
    const code = await (
      await handle(w, acme.access, "@acme")
    ).json<MintedCode>();
    const response = await call(w, "POST", `/v1/codes/${code.id}/reroll`, {
      token: acme.access,
    });
    expect(await expectMatchesSchema(response, "rerollCode", 403)).toEqual({
      error: "reroll-cap",
    });
  });
});

describe("a handle request is the bare handle only (FR-032, D-2026-10-05-04)", () => {
  it("refuses a tag or a qualifier part as malformed", async () => {
    const w = await makeWorld();
    const acme = await issuer(w, "acme");
    for (const value of [
      "ai@agentsmith",
      "zz-ai-@agentsmith-zz",
      "@agentsmith neo",
      "zz-@agentsmith-neo-zz",
    ]) {
      const response = await handle(w, acme.access, value);
      expect(await expectMatchesSchema(response, "mintCode", 400)).toEqual({
        error: "malformed",
      });
    }
    expect(await count(w, "SELECT count(*) AS n FROM codes")).toBe(0);
  });

  it("refuses a missing handle, a plain word, and a name the grammar rejects", async () => {
    const w = await makeWorld();
    const acme = await issuer(w, "acme");
    expect(await (await handle(w, acme.access, undefined)).json()).toEqual({
      error: "malformed",
    });
    expect(await (await handle(w, acme.access, "bob")).json()).toEqual({
      error: "malformed",
    });
    const symbol = await handle(w, acme.access, "@a$b");
    expect(await expectMatchesSchema(symbol, "mintCode", 400)).toEqual({
      error: "malformed",
      reason: "reserved-symbol",
    });
  });
});

describe("taken and reserved handles", () => {
  it("is 409 taken for an existing handle or its lookalike, without naming the owner", async () => {
    const w = await makeWorld();
    const acme = await issuer(w, "acme");
    const rival = await issuer(w, "rival");
    expect((await handle(w, acme.access, "@bob")).status).toBe(201);
    const before = await count(w, "SELECT count(*) AS n FROM records");
    for (const value of ["@bob", "@BOB", "@b0b", "zz-@b0b-zz"]) {
      const response = await handle(w, rival.access, value);
      expect(await expectMatchesSchema(response, "mintCode", 409)).toEqual({
        error: "taken",
      });
    }
    expect(await count(w, "SELECT count(*) AS n FROM records")).toBe(before);
  });

  it("is 422 reserved-handle for a reserved name, on the G10 key, and for fewer than 3 characters", async () => {
    // "bad#word" cannot be a handle, so it reserves nothing.
    const w = await makeWorld({
      settings: { ZZ_BLOCKLIST: "badword\nbad#word\n" },
    });
    const acme = await issuer(w, "acme");
    for (const value of [
      "@admin",
      "@adm1n",
      "@ADMIN",
      "@support",
      "@zzthis",
      "@zerostate",
      "@usps",
      "@army",
      "@irs",
      "@badword",
      "@8adw0rd",
      "@ab",
    ]) {
      // Mint and re-roll share 10 per hour, so each attempt is an hour
      // apart, with a fresh access token for the same account.
      w.clock.advance(60 * 60 * 1000);
      const session = await signIn(w, "acme");
      const response = await handle(w, session.access, value);
      expect(await expectMatchesSchema(response, "mintCode", 422)).toEqual({
        error: "reserved-handle",
      });
    }
    expect(await count(w, "SELECT count(*) AS n FROM codes")).toBe(0);
    expect(acme.accountId).toBe((await signIn(w, "acme")).accountId);
    expect(
      (await handle(w, (await signIn(w, "acme")).access, "@abc")).status,
    ).toBe(201);
  });

  it("answers 500 failed, not taken, when the write fails for another reason", async () => {
    const w = await makeWorld();
    const acme = await issuer(w, "acme");
    await env.ZZ_DB.prepare(
      "CREATE TRIGGER audit_down BEFORE INSERT ON audit_events BEGIN SELECT RAISE (ABORT, 'audit down'); END",
    ).run();
    const errors = console.error;
    console.error = () => {};
    const response = await handle(w, acme.access, "@acme");
    console.error = errors;
    expect(await expectMatchesSchema(response, "mintCode", 500)).toEqual({
      error: "failed",
    });
    expect(await count(w, "SELECT count(*) AS n FROM codes")).toBe(0);
  });

  it("treats a name and its handle as one (spec 002 FR-022)", async () => {
    const w = await makeWorld();
    const acme = await issuer(w, "acme");
    const code = await (
      await handle(w, acme.access, "@vitalik.eth")
    ).json<MintedCode>();
    expect(code.canonical).toBe("zz-@vitalik.eth-zz");
    const response = await call(
      w,
      "GET",
      `/v1/resolve/${encodeURIComponent("zz-vitalik.eth-zz")}`,
    );
    const body = await expectMatchesSchema<{ canonical: string }>(
      response,
      "resolveCode",
      200,
    );
    expect(body.canonical).toBe("zz-@vitalik.eth-zz");
  });
});
