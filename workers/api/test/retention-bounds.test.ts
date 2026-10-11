import { env } from "cloudflare:workers";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PURGE_MAX } from "../src/account/me.ts";
import { runRetention } from "../src/retention/cron.ts";
import { call, count, mint, resolvePath, signIn } from "./helpers/http.ts";
import { makeWorld, type World } from "./helpers/world.ts";

// RM-035 (issue #130): bounded retention work and bounded deletion
// cleanup.

const DAY = 24 * 60 * 60 * 1000;
const SMALL = { batch: 3, rounds: 2, revocations: 2 };

afterEach(() => {
  vi.restoreAllMocks();
});

async function expiredNonces(w: World, n: number): Promise<void> {
  const past = new Date(w.clock.ms - DAY).toISOString();
  await env.ZZ_DB.batch(
    Array.from({ length: n }, () =>
      env.ZZ_DB.prepare(
        "INSERT INTO auth_nonces (nonce_hash, expires_at, used_at) VALUES (?, ?, NULL)",
      ).bind(crypto.randomUUID(), past),
    ),
  );
}

async function expiredPhotoRows(w: World, n: number): Promise<string[]> {
  const past = new Date(w.clock.ms - DAY).toISOString();
  const keys = Array.from({ length: n }, () => `reads/${crypto.randomUUID()}`);
  for (const key of keys) await env.ZZ_PHOTOS.put(key, "x");
  await env.ZZ_DB.batch(
    keys.map((key) =>
      env.ZZ_DB.prepare(
        "INSERT INTO read_photos (id, account_id, canonical, object_key, created_at, expires_at) VALUES (?, NULL, NULL, ?, ?, ?)",
      ).bind(crypto.randomUUID(), key, past, past),
    ),
  );
  return keys;
}

describe("bounded retention run (RM-035)", () => {
  it("deletes a backlog over successive runs, at most batch times rounds rows per step", async () => {
    vi.spyOn(console, "log").mockImplementation(() => {});
    const w = await makeWorld();
    await expiredNonces(w, 10);
    await expiredPhotoRows(w, 7);
    const first = await runRetention(w.env, w.deps, SMALL);
    expect(first).toMatchObject({ nonces: 6, photos: 6 });
    expect(await count(w, "SELECT count(*) AS n FROM auth_nonces")).toBe(4);
    const second = await runRetention(w.env, w.deps, SMALL);
    expect(second).toMatchObject({ nonces: 4, photos: 1 });
    expect(await count(w, "SELECT count(*) AS n FROM auth_nonces")).toBe(0);
    expect(await count(w, "SELECT count(*) AS n FROM read_photos")).toBe(0);
  });

  it("logs a failed step by name and still runs the others", async () => {
    vi.spyOn(console, "log").mockImplementation(() => {});
    const errors = vi.spyOn(console, "error").mockImplementation(() => {});
    const w = await makeWorld();
    await expiredPhotoRows(w, 1);
    await expiredNonces(w, 2);
    vi.spyOn(env.ZZ_PHOTOS, "delete").mockRejectedValue(new Error("r2 down"));
    const report = await runRetention(w.env, w.deps, SMALL);
    expect(report).toMatchObject({ photos: 0, nonces: 2 });
    expect(errors.mock.calls.map((args) => String(args[0]))).toContain(
      JSON.stringify({ event: "retention-step-fault", step: "photos" }),
    );
  });
});

describe("bounded deletion cleanup (RM-035)", () => {
  it("purges only codes that could be cached, at most PURGE_MAX, and returns 204", async () => {
    const w = await makeWorld();
    const alice = await signIn(w);
    const code = await mint(w, alice.access);
    expect((await call(w, "GET", resolvePath(code.canonical))).status).toBe(
      200,
    );
    // Bulk codes on the same record: resolved once, reusable, no expiry,
    // public, so each could be cached. Plus never-resolved ones, which are
    // never purged.
    const now = new Date(w.clock.ms).toISOString();
    const insert = (resolved: boolean) =>
      env.ZZ_DB.prepare(
        "INSERT INTO codes (id, scope, canonical, match_key, kind, check_word, list_version, status, revoked_reason, single_use, expires_at, record_id, owner_id, first_resolved_at, rerolls_remaining, replaced_by, write_id, created_at) VALUES (?, 'free_public', ?, ?, 'plain', NULL, NULL, 'active', NULL, 0, NULL, ?, ?, ?, 0, NULL, NULL, ?)",
      ).bind(
        crypto.randomUUID(),
        `zz-bulk-${crypto.randomUUID()}-zz`,
        crypto.randomUUID(),
        code.record_id,
        alice.accountId,
        resolved ? now : null,
        now,
      );
    const resolved = Array.from({ length: PURGE_MAX + 20 }, () => insert(true));
    const fresh = Array.from({ length: 30 }, () => insert(false));
    for (let i = 0; i < resolved.length; i += 50) {
      await env.ZZ_DB.batch(resolved.slice(i, i + 50));
    }
    await env.ZZ_DB.batch(fresh);
    const purges = vi.spyOn(caches.default, "delete");
    const response = await call(w, "DELETE", "/v1/me", { token: alice.access });
    expect(response.status).toBe(204);
    expect(purges).toHaveBeenCalledTimes(PURGE_MAX);
    expect(
      await count(
        w,
        "SELECT count(*) AS n FROM codes WHERE owner_id = ? AND status = 'active'",
        alice.accountId,
      ),
    ).toBe(0);
  });

  it("keeps the 204 when the photo cleanup fails", async () => {
    const w = await makeWorld();
    const alice = await signIn(w);
    const now = new Date(w.clock.ms).toISOString();
    await env.ZZ_PHOTOS.put("reads/alice-photo", "x");
    await env.ZZ_DB.prepare(
      "INSERT INTO read_photos (id, account_id, canonical, object_key, created_at, expires_at) VALUES (?, ?, NULL, 'reads/alice-photo', ?, ?)",
    )
      .bind(crypto.randomUUID(), alice.accountId, now, now)
      .run();
    const errors = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(env.ZZ_PHOTOS, "delete").mockRejectedValue(new Error("r2 down"));
    const response = await call(w, "DELETE", "/v1/me", { token: alice.access });
    expect(response.status).toBe(204);
    expect(errors.mock.calls.map((args) => String(args[0]))).toContain(
      JSON.stringify({ event: "deletion-cleanup-fault", step: "photos" }),
    );
  });
});
