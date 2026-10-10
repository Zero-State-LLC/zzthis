import { env } from "cloudflare:workers";
import { afterEach, describe, expect, it, vi } from "vitest";
import { sha256Hex } from "../src/lib/crypto.ts";
import { call, count, mintRequest, nonce, signIn } from "./helpers/http.ts";
import { expectMatchesSchema } from "./helpers/schema.ts";
import {
  APPLE_BUNDLE_ID,
  appleSettings,
  makeWorld,
  type World,
} from "./helpers/world.ts";

// RM-039 (issue #130): low-severity hardening.

afterEach(() => {
  vi.restoreAllMocks();
});

async function appleSignIn(w: World, code: string): Promise<Response> {
  const n = await nonce(w);
  const idToken = await w.apple.idToken({
    sub: "apple-user-2",
    aud: APPLE_BUNDLE_ID,
    nonce: await sha256Hex(n),
  });
  return call(w, "POST", "/v1/auth/token", {
    body: {
      provider: "apple",
      client: "ios",
      id_token: idToken,
      nonce: n,
      authorization_code: code,
    },
  });
}

describe("hardening (RM-039)", () => {
  it("matches a blocklisted term split by a format character", async () => {
    const w = await makeWorld({ settings: { ZZ_BLOCKLIST: "badword" } });
    const alice = await signIn(w);
    const response = await mintRequest(w, alice.access, {
      record: { title: "bad​word", body: "" },
    });
    expect(await expectMatchesSchema(response, "mintCode", 422)).toEqual({
      error: "content-refused",
    });
  });

  it("refuses a chunked JSON body over the limit without reading it whole, and a missing body", async () => {
    const w = await makeWorld();
    const alice = await signIn(w);
    const chunk = new TextEncoder().encode(" ".repeat(64 * 1024));
    let sent = 0;
    const stream = new ReadableStream<Uint8Array>({
      pull(controller) {
        sent += 1;
        if (sent > 20) controller.close();
        else controller.enqueue(chunk);
      },
    });
    const big = await call(w, "POST", "/v1/codes", {
      token: alice.access,
      raw: stream,
      contentType: "application/json",
    });
    expect(big.status).toBe(400);
    expect(sent).toBeLessThan(20);
    const empty = await call(w, "POST", "/v1/codes", {
      token: alice.access,
      contentType: "application/json",
    });
    expect(empty.status).toBe(400);
  });

  it("revokes the replaced Apple token on a later sign-in, and queues it when the revoke fails", async () => {
    const w = await makeWorld({ settings: await appleSettings() });
    expect((await appleSignIn(w, "first")).status).toBe(200);
    expect((await appleSignIn(w, "second")).status).toBe(200);
    const revokes = w.appleStub.calls.filter((c) =>
      c.url.endsWith("/auth/revoke"),
    );
    expect(revokes).toHaveLength(1);
    expect(
      await count(w, "SELECT count(*) AS n FROM pending_revocations"),
    ).toBe(0);
    vi.spyOn(console, "log").mockImplementation(() => {});
    w.appleStub.revoke = () => new Response("down", { status: 503 });
    expect((await appleSignIn(w, "third")).status).toBe(200);
    expect(
      await count(w, "SELECT count(*) AS n FROM pending_revocations"),
    ).toBe(1);
  });

  it("queues a replaced token that no longer opens", async () => {
    const w = await makeWorld({ settings: await appleSettings() });
    expect((await appleSignIn(w, "first")).status).toBe(200);
    await env.ZZ_DB.prepare(
      "UPDATE identities SET apple_refresh_token_enc = 'k1.00000000.AAAA'",
    ).run();
    expect((await appleSignIn(w, "second")).status).toBe(200);
    expect(
      await count(w, "SELECT count(*) AS n FROM pending_revocations"),
    ).toBe(1);
  });

  it("audits a rejected ID token with the provider as target and never the token", async () => {
    const w = await makeWorld({ settings: await appleSettings() });
    const n = await nonce(w);
    const response = await call(w, "POST", "/v1/auth/token", {
      body: {
        provider: "apple",
        client: "ios",
        id_token: "not-a-jwt",
        nonce: n,
      },
    });
    expect(response.status).toBe(401);
    const rows = await env.ZZ_DB.prepare(
      "SELECT actor_id, target_type, target_id FROM audit_events WHERE action = 'auth.token' AND result = 'denied'",
    ).all<Record<string, unknown>>();
    expect(rows.results).toEqual([
      { actor_id: null, target_type: "provider", target_id: "apple" },
    ]);
  });

  it("answers a handle re-roll with reroll-cap even while the plain issuer is off", async () => {
    const w = await makeWorld();
    const alice = await signIn(w);
    const minted = await mintRequest(w, alice.access, {
      kind: "handle",
      handle: "@hardening",
    });
    expect(minted.status).toBe(201);
    const { id } = await minted.json<{ id: string }>();
    const off = await makeWorld({ settings: { ZZ_MINT_ENABLED: "false" } });
    const response = await call(off, "POST", `/v1/codes/${id}/reroll`, {
      token: alice.access,
    });
    expect(await expectMatchesSchema(response, "rerollCode", 403)).toEqual({
      error: "reroll-cap",
    });
  });
});
