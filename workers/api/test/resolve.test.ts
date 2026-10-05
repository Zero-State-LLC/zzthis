import { env } from "cloudflare:workers";
import { describe, expect, it } from "vitest";
import { hmacTag } from "../src/lib/crypto.ts";
import {
  call,
  count,
  mint,
  resolvePath,
  signIn,
  type Session,
} from "./helpers/http.ts";
import { fixture7Codes, repeating } from "./helpers/random.ts";
import { expectMatchesSchema } from "./helpers/schema.ts";
import { makeWorld, testDataKeys, type World } from "./helpers/world.ts";

const PUBLIC = "public, max-age=60, stale-while-revalidate=300";

function resolve(w: World, code: string, token?: string): Promise<Response> {
  return call(
    w,
    "GET",
    resolvePath(code),
    token === undefined ? {} : { token },
  );
}

async function grant(
  accountId: string,
  scope: string,
  role: string,
  expiresAt: string | null = null,
) {
  await env.ZZ_DB.prepare(
    "INSERT INTO grants (id, subject_id, scope, role, expires_at) VALUES (?, ?, ?, ?, ?)",
  )
    .bind(crypto.randomUUID(), accountId, scope, role, expiresAt)
    .run();
}

async function enterprise(w: World, name: string): Promise<Session> {
  const session = await signIn(w, name);
  await grant(session.accountId, "enterprise", "issuer");
  return session;
}

// An issuable fixture-7 code that this database has never stored.
async function unknownCode(): Promise<string> {
  const rows = await env.ZZ_DB.prepare("SELECT canonical FROM codes").all<{
    canonical: string;
  }>();
  const taken = new Set(rows.results.map((row) => row.canonical));
  return fixture7Codes().find((code) => !taken.has(code)) as string;
}

function headersOf(response: Response): Record<string, string> {
  return Object.fromEntries(response.headers.entries());
}

describe("GET /v1/resolve/{code} (spec 005 Resolve, T012)", () => {
  it("returns a public record to a signed-out caller with the public Cache-Control", async () => {
    const w = await makeWorld();
    const alice = await signIn(w);
    const code = await mint(w, alice.access, {
      record: { title: "Lost cat", body: "Answers to Kathy." },
    });
    const response = await resolve(w, code.canonical);
    const body = await expectMatchesSchema<Record<string, unknown>>(
      response,
      "resolveCode",
      200,
    );
    expect(body).toEqual({
      view: "public",
      canonical: code.canonical,
      record: {
        title: "Lost cat",
        body: "Answers to Kathy.",
        updated_at: code.created_at,
      },
      share: { text: code.canonical, url: null },
    });
    expect(response.headers.get("Cache-Control")).toBe(PUBLIC);
    const row = await env.ZZ_DB.prepare(
      "SELECT first_resolved_at FROM codes WHERE id = ?",
    )
      .bind(code.id)
      .first<{ first_resolved_at: string }>();
    expect(row?.first_resolved_at).toBe(new Date(w.clock.ms).toISOString());
    expect(
      await count(
        w,
        "SELECT count(*) AS n FROM audit_events WHERE action = 'code.resolve' AND target_id = ? AND result = 'ok'",
        code.id,
      ),
    ).toBe(1);
  });

  it("resolves every spelling of a code to the same record", async () => {
    const w = await makeWorld({ random: repeating(0, 1) });
    const alice = await signIn(w);
    const code = await mint(w, alice.access);
    expect(code.canonical).toBe("zz-copper-lantern-sky-zz");
    // A signed-in caller skips the cache, so each spelling reaches D1.
    for (const spelling of [
      "ZZ COPPER LANTERN SKY ZZ",
      "(zz) copper lantern sky (zz)",
      "zz copper–lantern sky-zz",
    ]) {
      const body = await (
        await resolve(w, spelling, alice.access)
      ).json<{ canonical: string }>();
      expect(body.canonical).toBe("zz-copper-lantern-sky-zz");
    }
  });

  it("keeps the first-resolve mark from the first resolve", async () => {
    const w = await makeWorld();
    const alice = await signIn(w);
    const code = await mint(w, alice.access);
    const first = new Date(w.clock.ms).toISOString();
    await resolve(w, code.canonical, alice.access);
    w.clock.advance(5000);
    await resolve(w, code.canonical, alice.access);
    const row = await env.ZZ_DB.prepare(
      "SELECT first_resolved_at FROM codes WHERE id = ?",
    )
      .bind(code.id)
      .first<{ first_resolved_at: string }>();
    expect(row?.first_resolved_at).toBe(first);
  });

  it("answers a grammar failure with malformed and the parser reason, writing no audit event", async () => {
    const w = await makeWorld();
    for (const [code, reason] of [
      ["zz-copper-lantern-sky", "no-closing-marker"],
      ["hello", "no-marker"],
      ["zz-zz", "no-content"],
      ["zz-a#b-zz", "reserved-symbol"],
    ]) {
      const response = await resolve(w, code as string);
      expect(await expectMatchesSchema(response, "resolveCode", 400)).toEqual({
        error: "malformed",
        reason,
      });
      expect(response.headers.get("Cache-Control")).toBe("no-store");
    }
    expect(await count(w, "SELECT count(*) AS n FROM audit_events")).toBe(0);
  });

  it("answers a bare mark with unsupported (step 3)", async () => {
    const w = await makeWorld();
    for (const code of ["zz", "(zz)", "ZZ"]) {
      const response = await resolve(w, code);
      expect(await expectMatchesSchema(response, "resolveCode", 422)).toEqual({
        error: "unsupported",
        reason: "bare-mark-needs-context",
      });
    }
  });

  it("checks the check word before any lookup (step 4)", async () => {
    const w = await makeWorld();
    for (const [code, reason] of [
      ["zz-copper-lantern-maple-zz", "check-mismatch"],
      ["zz-copper-lantern-zz", "wrong-length"],
      ["zz-copper-lantern-sky-maple-zz", "wrong-length"],
    ]) {
      const response = await resolve(w, code as string);
      expect(await expectMatchesSchema(response, "resolveCode", 400)).toEqual({
        error: "malformed",
        reason,
      });
    }
    // A part that is not on the list carries no check word: it is looked up.
    const field = await resolve(w, "zz-b2-smith-1-zz");
    expect(await expectMatchesSchema(field, "resolveCode", 404)).toEqual({
      error: "not-found",
    });
  });

  it("gives one not-found body, status, and headers for unknown, revoked, used, expired, deleted, and a signed-out private read (FR-009)", async () => {
    const w = await makeWorld();
    const alice = await enterprise(w, "alice");
    const revoked = await mint(w, alice.access);
    await call(w, "POST", `/v1/codes/${revoked.id}/revoke`, {
      token: alice.access,
    });
    const used = await mint(w, alice.access, { single_use: true });
    await resolve(w, used.canonical);
    const expired = await mint(w, alice.access, {
      expires_at: new Date(w.clock.ms + 1000).toISOString(),
    });
    const privateCode = await mint(w, alice.access, {
      scope: "enterprise",
      visibility: "private",
    });
    const bob = await signIn(w, "bob");
    const deleted = await mint(w, bob.access);
    await call(w, "DELETE", "/v1/me", { token: bob.access });
    w.clock.advance(1000);
    const answers = [];
    for (const code of [
      await unknownCode(),
      revoked.canonical,
      used.canonical,
      expired.canonical,
      deleted.canonical,
      privateCode.canonical,
    ]) {
      const response = await resolve(w, code);
      answers.push({
        status: response.status,
        body: await response.text(),
        headers: headersOf(response),
      });
    }
    for (const answer of answers) expect(answer).toEqual(answers[0]);
    expect(answers[0]).toEqual({
      status: 404,
      body: '{"error":"not-found"}',
      headers: {
        "content-type": "application/json",
        "x-zz-contract": "1",
        "cache-control": "no-store",
      },
    });
  });

  it("writes a not-found event whose target is the HMAC of the match_key, never the code", async () => {
    const w = await makeWorld();
    const unknown = await unknownCode();
    await resolve(w, unknown);
    const rows = await env.ZZ_DB.prepare("SELECT * FROM audit_events").all<
      Record<string, string | null>
    >();
    expect(rows.results).toHaveLength(1);
    const event = rows.results[0];
    expect(event).toMatchObject({
      actor_id: null,
      action: "code.resolve",
      target_type: "code",
      result: "not-found",
      target_id: await hmacTag(await testDataKeys(), "match-key", unknown),
    });
    for (const word of unknown.slice(3, -3).split("-")) {
      expect(JSON.stringify(rows.results)).not.toContain(word);
    }
  });
});

describe("private records (FR-035, step 7)", () => {
  it("resolves for the owner and a viewer, and is not-found for anyone else", async () => {
    const w = await makeWorld();
    const alice = await enterprise(w, "alice");
    const code = await mint(w, alice.access, {
      scope: "enterprise",
      visibility: "private",
    });
    const viewer = await signIn(w, "viewer");
    await grant(viewer.accountId, "enterprise", "viewer");
    const otherScope = await signIn(w, "logistics-viewer");
    await grant(otherScope.accountId, "logistics", "viewer");
    const lapsed = await signIn(w, "lapsed");
    await grant(
      lapsed.accountId,
      "enterprise",
      "viewer",
      new Date(w.clock.ms - 1).toISOString(),
    );
    const stranger = await signIn(w, "stranger");

    const owner = await resolve(w, code.canonical, alice.access);
    expect(
      (await expectMatchesSchema<{ view: string }>(owner, "resolveCode", 200))
        .view,
    ).toBe("owner");
    expect(owner.headers.get("Cache-Control")).toBe("no-store");
    const seen = await resolve(w, code.canonical, viewer.access);
    expect((await seen.json<{ view: string }>()).view).toBe("viewer");
    expect(seen.headers.get("Cache-Control")).toBe("no-store");
    for (const session of [otherScope, lapsed, stranger]) {
      const response = await resolve(w, code.canonical, session.access);
      expect(await expectMatchesSchema(response, "resolveCode", 404)).toEqual({
        error: "not-found",
      });
    }
    expect((await resolve(w, code.canonical)).status).toBe(404);
  });
});

describe("single use (spec 002 US1 acceptance 6, step 8)", () => {
  it("answers the first resolve, marks the code used, and is not-found after", async () => {
    const w = await makeWorld();
    const alice = await signIn(w);
    const code = await mint(w, alice.access, { single_use: true });
    const first = await resolve(w, code.canonical);
    await expectMatchesSchema(first, "resolveCode", 200);
    expect(first.headers.get("Cache-Control")).toBe("no-store");
    const row = await env.ZZ_DB.prepare(
      "SELECT status, first_resolved_at FROM codes WHERE id = ?",
    )
      .bind(code.id)
      .first<Record<string, string>>();
    expect(row?.status).toBe("used");
    expect(row?.first_resolved_at).not.toBeNull();
    expect((await resolve(w, code.canonical)).status).toBe(404);
  });

  it("gives two resolves at the same time exactly one view", async () => {
    const w = await makeWorld();
    const alice = await signIn(w);
    const code = await mint(w, alice.access, { single_use: true });
    const results = await Promise.all([
      resolve(w, code.canonical),
      resolve(w, code.canonical),
    ]);
    expect(results.map((r) => r.status).sort()).toEqual([200, 404]);
    expect(
      await count(
        w,
        "SELECT count(*) AS n FROM audit_events WHERE action = 'code.resolve' AND result = 'ok'",
      ),
    ).toBe(1);
    expect(
      await count(
        w,
        "SELECT count(*) AS n FROM audit_events WHERE action = 'code.resolve' AND result = 'not-found'",
      ),
    ).toBe(1);
  });
});

describe("bearer tokens on resolve (FR-008, FR-021)", () => {
  it("treats an unusable bearer as no bearer: never 401, no-store, and private stays hidden", async () => {
    const w = await makeWorld();
    const alice = await enterprise(w, "alice");
    const publicCode = await mint(w, alice.access);
    const privateCode = await mint(w, alice.access, {
      scope: "enterprise",
      visibility: "private",
    });
    const expired = alice.access;
    w.clock.advance(901 * 1000);
    for (const token of ["garbage", expired]) {
      const open = await resolve(w, publicCode.canonical, token);
      const body = await expectMatchesSchema<{ view: string }>(
        open,
        "resolveCode",
        200,
      );
      expect(body.view).toBe("public");
      expect(open.headers.get("Cache-Control")).toBe("no-store");
      expect((await resolve(w, privateCode.canonical, token)).status).toBe(404);
    }
  });

  it("answers a signed-in resolve of a public record with view public and no-store", async () => {
    const w = await makeWorld();
    const alice = await signIn(w);
    const code = await mint(w, alice.access);
    const response = await resolve(w, code.canonical, alice.access);
    expect((await response.json<{ view: string }>()).view).toBe("public");
    expect(response.headers.get("Cache-Control")).toBe("no-store");
  });
});
