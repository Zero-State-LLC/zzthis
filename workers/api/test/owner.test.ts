import { env } from "cloudflare:workers";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  call,
  count,
  mint,
  resolvePath,
  signIn,
  type MintedCode,
} from "./helpers/http.ts";
import { expectMatchesSchema } from "./helpers/schema.ts";
import { makeWorld, type World } from "./helpers/world.ts";

afterEach(() => {
  vi.restoreAllMocks();
});

interface Page {
  codes: (MintedCode & { title: string })[];
  next_cursor: string | null;
}

function list(w: World, token: string, query = ""): Promise<Response> {
  return call(w, "GET", `/v1/me/codes${query}`, { token });
}

function addVersion(
  w: World,
  token: string,
  recordId: string,
  title: string,
  body = "",
): Promise<Response> {
  return call(w, "POST", `/v1/records/${recordId}/versions`, {
    token,
    body: { title, body },
  });
}

function revoke(w: World, token: string, id: string): Promise<Response> {
  return call(w, "POST", `/v1/codes/${id}/revoke`, { token });
}

describe("GET /v1/me/codes (FR-030, T013)", () => {
  it("lists the caller's codes newest first, with titles and status, and hides re-rolled codes", async () => {
    const w = await makeWorld();
    const alice = await signIn(w);
    const bob = await signIn(w, "bob");
    await mint(w, bob.access);
    const first = await mint(w, alice.access, {
      record: { title: "First", body: "" },
    });
    w.clock.advance(1000);
    const second = await mint(w, alice.access, {
      record: { title: "Second", body: "" },
      expires_at: new Date(w.clock.ms + 2000).toISOString(),
    });
    w.clock.advance(1000);
    const rolled = await mint(w, alice.access, {
      record: { title: "Rolled", body: "" },
    });
    const replacement = await (
      await call(w, "POST", `/v1/codes/${rolled.id}/reroll`, {
        token: alice.access,
      })
    ).json<MintedCode>();
    await revoke(w, alice.access, first.id);
    w.clock.advance(2000);
    const page = await expectMatchesSchema<Page>(
      await list(w, alice.access),
      "listMyCodes",
      200,
    );
    expect(page.next_cursor).toBeNull();
    expect(page.codes.map((c) => [c.id, c.title, c.status])).toEqual([
      [replacement.id, "Rolled", "active"],
      [second.id, "Second", "expired"],
      [first.id, "First", "revoked"],
    ]);
  });

  it("pages with limit and next_cursor, breaking created_at ties by id", async () => {
    const w = await makeWorld();
    const alice = await signIn(w);
    const minted: string[] = [];
    for (let i = 0; i < 5; i += 1) {
      minted.unshift(
        (
          await mint(w, alice.access, {
            record: { title: `Code ${i}`, body: "" },
          })
        ).id,
      );
    }
    const seen: string[] = [];
    let cursor: string | null = null;
    do {
      const query: string = `?limit=2${cursor === null ? "" : `&cursor=${encodeURIComponent(cursor)}`}`;
      const page: Page = await expectMatchesSchema<Page>(
        await list(w, alice.access, query),
        "listMyCodes",
        200,
      );
      seen.push(...page.codes.map((c) => c.id));
      cursor = page.next_cursor;
    } while (cursor !== null);
    // The test clock does not move, so every created_at is the same and
    // the id breaks the tie: no row is skipped or repeated across pages.
    expect(seen).toEqual([...minted].sort().reverse());
    const all = await (await list(w, alice.access, "?limit=50")).json<Page>();
    expect(all.codes).toHaveLength(5);
  });

  it("refuses a limit outside 1 to 50 and a cursor it did not write", async () => {
    const w = await makeWorld();
    const alice = await signIn(w);
    const notJson = btoa("not json").replace(/=+$/, "");
    const wrongShape = btoa(JSON.stringify([1, 2])).replace(/=+$/, "");
    const badTime = btoa(JSON.stringify(["yesterday", "id"])).replace(
      /=+$/,
      "",
    );
    for (const query of [
      "?limit=0",
      "?limit=51",
      "?limit=abc",
      "?limit=1.5",
      "?cursor=@@",
      `?cursor=${notJson}`,
      `?cursor=${wrongShape}`,
      `?cursor=${badTime}`,
    ]) {
      const response = await list(w, alice.access, query);
      expect(await expectMatchesSchema(response, "listMyCodes", 400)).toEqual({
        error: "malformed",
      });
    }
  });

  it("is 401 with no bearer token", async () => {
    const w = await makeWorld();
    const response = await call(w, "GET", "/v1/me/codes");
    expect(await expectMatchesSchema(response, "listMyCodes", 401)).toEqual({
      error: "unauthorized",
    });
  });
});

describe("GET /v1/records/{id} (FR-030, T034)", () => {
  it("returns the owner's current title and body, and not-found to anyone else", async () => {
    const w = await makeWorld();
    const alice = await signIn(w);
    const bob = await signIn(w, "bob");
    const code = await mint(w, alice.access, {
      record: { title: "Lost cat", body: "Answers to Kathy." },
    });
    const response = await call(w, "GET", `/v1/records/${code.record_id}`, {
      token: alice.access,
    });
    const body = await expectMatchesSchema<Record<string, unknown>>(
      response,
      "getRecord",
      200,
    );
    expect(body).toEqual({
      id: code.record_id,
      version: 1,
      title: "Lost cat",
      body: "Answers to Kathy.",
      updated_at: code.created_at,
    });
    await addVersion(w, alice.access, code.record_id, "Found cat", "Thanks.");
    const updated = await (
      await call(w, "GET", `/v1/records/${code.record_id}`, {
        token: alice.access,
      })
    ).json<Record<string, unknown>>();
    expect(updated).toMatchObject({
      version: 2,
      title: "Found cat",
      body: "Thanks.",
    });
    for (const [token, id] of [
      [bob.access, code.record_id],
      [alice.access, "no-such-record"],
    ] as const) {
      const denied = await call(w, "GET", `/v1/records/${id}`, { token });
      expect(await expectMatchesSchema(denied, "getRecord", 404)).toEqual({
        error: "not-found",
      });
    }
    const anonymous = await call(w, "GET", `/v1/records/${code.record_id}`);
    expect(await expectMatchesSchema(anonymous, "getRecord", 401)).toEqual({
      error: "unauthorized",
    });
  });
});

describe("POST /v1/codes/{id}/revoke (T014, spec 005 Mint)", () => {
  it("revokes at the central server, then answers revoked again with no second ok event", async () => {
    const w = await makeWorld();
    const alice = await signIn(w);
    const code = await mint(w, alice.access);
    const first = await revoke(w, alice.access, code.id);
    expect(await expectMatchesSchema(first, "revokeCode", 200)).toEqual({
      status: "revoked",
    });
    const row = await env.ZZ_DB.prepare(
      "SELECT status, revoked_reason FROM codes WHERE id = ?",
    )
      .bind(code.id)
      .first();
    expect(row).toEqual({ status: "revoked", revoked_reason: "owner" });
    expect(
      await expectMatchesSchema(
        await revoke(w, alice.access, code.id),
        "revokeCode",
        200,
      ),
    ).toEqual({ status: "revoked" });
    expect(
      await count(
        w,
        "SELECT count(*) AS n FROM audit_events WHERE action = 'code.revoke' AND target_id = ? AND result = 'ok'",
        code.id,
      ),
    ).toBe(1);
    expect((await call(w, "GET", resolvePath(code.canonical))).status).toBe(
      404,
    );
  });

  it("writes one ok event when two revokes race", async () => {
    const w = await makeWorld();
    const alice = await signIn(w);
    const code = await mint(w, alice.access);
    const results = await Promise.all([
      revoke(w, alice.access, code.id),
      revoke(w, alice.access, code.id),
    ]);
    expect(results.map((r) => r.status)).toEqual([200, 200]);
    expect(
      await count(
        w,
        "SELECT count(*) AS n FROM audit_events WHERE action = 'code.revoke' AND target_id = ? AND result = 'ok'",
        code.id,
      ),
    ).toBe(1);
  });

  it("is not-found for another account's code, an unknown id, and the caller's own used or expired code", async () => {
    const w = await makeWorld();
    const alice = await signIn(w);
    const bob = await signIn(w, "bob");
    const theirs = await mint(w, bob.access);
    const used = await mint(w, alice.access, { single_use: true });
    await call(w, "GET", resolvePath(used.canonical));
    const expiring = await mint(w, alice.access, {
      expires_at: new Date(w.clock.ms + 1000).toISOString(),
    });
    w.clock.advance(1000);
    for (const id of [theirs.id, "no-such-code", used.id, expiring.id]) {
      const response = await revoke(w, alice.access, id);
      expect(await expectMatchesSchema(response, "revokeCode", 404)).toEqual({
        error: "not-found",
      });
    }
    const row = await env.ZZ_DB.prepare("SELECT status FROM codes WHERE id = ?")
      .bind(theirs.id)
      .first();
    expect(row).toEqual({ status: "active" });
  });

  it("answers revoked for the caller's own code that a re-roll retired", async () => {
    const w = await makeWorld();
    const alice = await signIn(w);
    const code = await mint(w, alice.access);
    await call(w, "POST", `/v1/codes/${code.id}/reroll`, {
      token: alice.access,
    });
    expect(await (await revoke(w, alice.access, code.id)).json()).toEqual({
      status: "revoked",
    });
  });

  it("is 401 with no bearer token", async () => {
    const w = await makeWorld();
    const response = await call(w, "POST", "/v1/codes/any/revoke");
    expect(await expectMatchesSchema(response, "revokeCode", 401)).toEqual({
      error: "unauthorized",
    });
  });
});
