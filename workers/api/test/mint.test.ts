import { env } from "cloudflare:workers";
import { parseCode, loadWordlist, verifyCheckWord } from "@zzthis/zz-core";
import { afterEach, describe, expect, it, vi } from "vitest";
import { fromBase64url } from "../src/lib/encoding.ts";
import {
  count,
  mint,
  mintRequest,
  signIn,
  type MintedCode,
} from "./helpers/http.ts";
import { repeating, scripted } from "./helpers/random.ts";
import { expectMatchesSchema } from "./helpers/schema.ts";
import { makeWorld, testSecrets, type World } from "./helpers/world.ts";

afterEach(() => {
  vi.restoreAllMocks();
});

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

async function stored(w: World): Promise<Record<string, number>> {
  return {
    records: await count(w, "SELECT count(*) AS n FROM records"),
    versions: await count(w, "SELECT count(*) AS n FROM record_versions"),
    codes: await count(w, "SELECT count(*) AS n FROM codes"),
  };
}

async function expectError(
  response: Response,
  status: number,
  body: Record<string, string>,
) {
  expect(await expectMatchesSchema(response, "mintCode", status)).toEqual(body);
}

describe("POST /v1/codes, plain (FR-004, T008)", () => {
  it("mints a server-chosen code with version 1 signed", async () => {
    const w = await makeWorld();
    const alice = await signIn(w);
    const response = await mintRequest(w, alice.access, {
      record: { title: "Lost cat", body: "Answers to Kathy." },
    });
    const code = await expectMatchesSchema<MintedCode>(
      response,
      "mintCode",
      201,
    );
    expect(code).toMatchObject({
      status: "active",
      scope: "free_public",
      rerolls_remaining: 3,
    });
    const parsed = parseCode(code.canonical);
    expect(parsed.ok && parsed.kind).toBe("plain");
    const words = parsed.ok ? parsed.words : [];
    expect(words).toHaveLength(3);
    expect(code.check_word).toBe(words[2]);
    expect(verifyCheckWord(words, loadWordlist("fixture-7")).result).toBe("ok");

    const row = await env.ZZ_DB.prepare("SELECT * FROM codes WHERE id = ?")
      .bind(code.id)
      .first<Record<string, unknown>>();
    expect(row).toMatchObject({
      canonical: code.canonical,
      match_key: code.canonical,
      kind: "plain",
      list_version: "fixture-7",
      single_use: 0,
      expires_at: null,
      owner_id: alice.accountId,
      record_id: code.record_id,
    });
    const record = await env.ZZ_DB.prepare("SELECT * FROM records WHERE id = ?")
      .bind(code.record_id)
      .first<Record<string, unknown>>();
    expect(record).toMatchObject({
      owner_id: alice.accountId,
      visibility: "public",
      deleted_at: null,
    });
    const version = await env.ZZ_DB.prepare(
      "SELECT * FROM record_versions WHERE id = ?",
    )
      .bind(record?.current_version_id)
      .first<Record<string, string | number>>();
    expect(version).toMatchObject({
      version: 1,
      title: "Lost cat",
      body: "Answers to Kathy.",
      signing_key_id: "test-1",
    });
    const signed = new TextEncoder().encode(
      JSON.stringify([
        code.record_id,
        1,
        "Lost cat",
        "Answers to Kathy.",
        version?.created_at,
      ]),
    );
    const valid = await crypto.subtle.verify(
      "Ed25519",
      (await testSecrets()).signingPublicKey,
      fromBase64url(version?.signature as string) as Uint8Array,
      signed,
    );
    expect(valid).toBe(true);
    expect(
      await count(
        w,
        "SELECT count(*) AS n FROM audit_events WHERE action = 'code.mint' AND target_id = ? AND result = 'ok'",
        code.id,
      ),
    ).toBe(1);
  });

  it("chooses the words itself and ignores a word list from the client", async () => {
    const w = await makeWorld({ random: repeating(3, 5) });
    const alice = await signIn(w);
    const code = await mint(w, alice.access, {
      kind: undefined,
      words: ["copper", "lantern", "sky"],
      canonical: "zz-copper-lantern-sky-zz",
    });
    expect(code.canonical).toBe("zz-maple-harbor-falcon-zz");
  });

  it("draws again on a match_key conflict", async () => {
    const w = await makeWorld({ random: scripted(0, 1, 0, 1, 3, 5) });
    const alice = await signIn(w);
    expect((await mint(w, alice.access)).canonical).toBe(
      "zz-copper-lantern-sky-zz",
    );
    expect((await mint(w, alice.access)).canonical).toBe(
      "zz-maple-harbor-falcon-zz",
    );
  });

  it("returns 500 failed after the first draw and 8 more all conflict, storing nothing", async () => {
    let draws = 0;
    const always = repeating(0, 1);
    const w = await makeWorld({
      random: () => {
        draws += 1;
        return always();
      },
    });
    const alice = await signIn(w);
    await mint(w, alice.access);
    const before = await stored(w);
    draws = 0;
    vi.spyOn(console, "error").mockImplementation(() => {});
    await expectError(await mintRequest(w, alice.access), 500, {
      error: "failed",
    });
    // Two indexes per draw: 9 draws in all.
    expect(draws).toBe(18);
    expect(await stored(w)).toEqual(before);
  });

  it("stores nothing when the signature fails", async () => {
    const w = await makeWorld();
    const alice = await signIn(w);
    const sign = crypto.subtle.sign.bind(crypto.subtle);
    vi.spyOn(crypto.subtle, "sign").mockImplementation(
      (algorithm, key, data) =>
        algorithm === "Ed25519"
          ? Promise.reject(new Error("signer down"))
          : sign(algorithm, key, data),
    );
    vi.spyOn(console, "error").mockImplementation(() => {});
    const before = await stored(w);
    await expectError(await mintRequest(w, alice.access), 500, {
      error: "failed",
    });
    expect(await stored(w)).toEqual(before);
  });

  it("is 401 with no usable bearer token", async () => {
    const w = await makeWorld();
    await expectError(await mintRequest(w, "not-a-token"), 401, {
      error: "unauthorized",
    });
  });

  it("refuses a body that is not a MintRequest", async () => {
    const w = await makeWorld();
    const alice = await signIn(w);
    for (const overrides of [
      { scope: "postal" },
      { kind: "words" },
      { record: undefined },
      { record: { title: "x" } },
      { single_use: "yes" },
      { visibility: "secret" },
    ]) {
      await expectError(await mintRequest(w, alice.access, overrides), 400, {
        error: "malformed",
      });
    }
  });
});

describe("record text (FR-007)", () => {
  it("trims the title, drops control characters other than line feed, and counts code points", async () => {
    const w = await makeWorld();
    const alice = await signIn(w);
    const code = await mint(w, alice.access, {
      record: {
        title: "  \u0007Lost\u0000 cat\t ",
        body: "Line one\nLine two\r\u009f",
      },
    });
    const version = await env.ZZ_DB.prepare(
      "SELECT v.title, v.body FROM records r JOIN record_versions v ON v.id = r.current_version_id WHERE r.id = ?",
    )
      .bind(code.record_id)
      .first<{ title: string; body: string }>();
    expect(version).toEqual({ title: "Lost cat", body: "Line one\nLine two" });
    const astral = "\u{1F431}";
    expect(
      (
        await mintRequest(w, alice.access, {
          record: { title: astral.repeat(120), body: astral.repeat(4000) },
        })
      ).status,
    ).toBe(201);
  });

  it("refuses an empty or whitespace-only title and text over the limits", async () => {
    const w = await makeWorld();
    const alice = await signIn(w);
    const before = await stored(w);
    for (const record of [
      { title: "", body: "" },
      { title: " \n\t ", body: "" },
      { title: "x".repeat(121), body: "" },
      { title: "\u{1F431}".repeat(121), body: "" },
      { title: "ok", body: "y".repeat(4001) },
    ]) {
      await expectError(await mintRequest(w, alice.access, { record }), 400, {
        error: "malformed",
      });
    }
    expect(await stored(w)).toEqual(before);
  });
});

describe("content check (FR-024)", () => {
  it("refuses a blocklisted term in the title or body, case-folded and as a whole word", async () => {
    const w = await makeWorld({
      settings: { ZZ_BLOCKLIST: "badword\nTwo Words\n" },
    });
    const alice = await signIn(w);
    const before = await stored(w);
    for (const record of [
      { title: "a badword here", body: "" },
      { title: "fine", body: "BADWORD." },
      { title: "fine", body: "ｂａｄｗｏｒｄ" },
      { title: "say two words", body: "" },
    ]) {
      await expectError(await mintRequest(w, alice.access, { record }), 422, {
        error: "content-refused",
      });
    }
    expect(await stored(w)).toEqual(before);
    expect(
      await count(
        w,
        "SELECT count(*) AS n FROM audit_events WHERE action = 'code.mint' AND result = 'denied' AND actor_id = ?",
        alice.accountId,
      ),
    ).toBe(4);
    // Inside a longer word it is not a match.
    expect(
      (
        await mintRequest(w, alice.access, {
          record: { title: "badwords", body: "abadword" },
        })
      ).status,
    ).toBe(201);
  });
});

describe("scopes (FR-005, FR-034, T010)", () => {
  it("refuses free_public with scope-unavailable while the flag is off, and stores nothing", async () => {
    const w = await makeWorld({ settings: { ZZ_FREE_PUBLIC: "false" } });
    const alice = await signIn(w);
    await expectError(await mintRequest(w, alice.access), 403, {
      error: "scope-unavailable",
    });
    expect(await stored(w)).toEqual({ records: 0, versions: 0, codes: 0 });
  });

  it("refuses a plain mint with not-ready while the issuer is off, and stores nothing (FR-004)", async () => {
    const w = await makeWorld({ settings: { ZZ_MINT_ENABLED: "false" } });
    const alice = await signIn(w);
    await expectError(await mintRequest(w, alice.access), 503, {
      error: "not-ready",
    });
    expect(await stored(w)).toEqual({ records: 0, versions: 0, codes: 0 });
  });

  it("needs an issuer grant for enterprise and logistics", async () => {
    const w = await makeWorld();
    const alice = await signIn(w);
    await expectError(
      await mintRequest(w, alice.access, { scope: "enterprise" }),
      403,
      { error: "forbidden" },
    );
    expect(
      await count(
        w,
        "SELECT count(*) AS n FROM audit_events WHERE action = 'code.mint' AND result = 'denied' AND target_type = 'scope' AND target_id = 'enterprise'",
      ),
    ).toBe(1);
    await grant(alice.accountId, "enterprise", "viewer");
    await grant(
      alice.accountId,
      "enterprise",
      "issuer",
      new Date(w.clock.ms - 1000).toISOString(),
    );
    await grant(alice.accountId, "logistics", "issuer");
    await expectError(
      await mintRequest(w, alice.access, { scope: "enterprise" }),
      403,
      { error: "forbidden" },
    );
    const logistics = await mint(w, alice.access, { scope: "logistics" });
    expect(logistics.scope).toBe("logistics");
    await grant(
      alice.accountId,
      "enterprise",
      "issuer",
      new Date(w.clock.ms + 60_000).toISOString(),
    );
    expect((await mint(w, alice.access, { scope: "enterprise" })).scope).toBe(
      "enterprise",
    );
  });
});

describe("visibility, single use, and expiry (FR-035)", () => {
  it("defaults to public, allows private only in enterprise and logistics", async () => {
    const w = await makeWorld();
    const alice = await signIn(w);
    await grant(alice.accountId, "enterprise", "issuer");
    await expectError(
      await mintRequest(w, alice.access, { visibility: "private" }),
      400,
      { error: "malformed" },
    );
    const privateCode = await mint(w, alice.access, {
      scope: "enterprise",
      visibility: "private",
    });
    const publicCode = await mint(w, alice.access, { scope: "enterprise" });
    const visibility = async (code: MintedCode) =>
      (
        await env.ZZ_DB.prepare("SELECT visibility FROM records WHERE id = ?")
          .bind(code.record_id)
          .first<{ visibility: string }>()
      )?.visibility;
    expect(await visibility(privateCode)).toBe("private");
    expect(await visibility(publicCode)).toBe("public");
  });

  it("stores single_use and a future expiry in the server's timestamp form", async () => {
    const w = await makeWorld();
    const alice = await signIn(w);
    const expiresAt = new Date(w.clock.ms + 3_600_000).toISOString();
    const code = await mint(w, alice.access, {
      single_use: true,
      expires_at: expiresAt,
    });
    const row = await env.ZZ_DB.prepare(
      "SELECT single_use, expires_at FROM codes WHERE id = ?",
    )
      .bind(code.id)
      .first();
    expect(row).toEqual({ single_use: 1, expires_at: expiresAt });
    expect(
      (await mintRequest(w, alice.access, { expires_at: null })).status,
    ).toBe(201);
  });

  it("refuses an expiry in the past or in another form", async () => {
    const w = await makeWorld();
    const alice = await signIn(w);
    for (const expiresAt of [
      new Date(w.clock.ms).toISOString(),
      new Date(w.clock.ms - 1).toISOString(),
      "2999-01-01T00:00:00Z",
      "2999-02-30T00:00:00.000Z",
      "tomorrow",
    ]) {
      await expectError(
        await mintRequest(w, alice.access, { expires_at: expiresAt }),
        400,
        { error: "malformed" },
      );
    }
  });
});
