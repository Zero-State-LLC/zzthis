import { createScheduledController } from "cloudflare:test";
import { env } from "cloudflare:workers";
import { afterEach, describe, expect, it, vi } from "vitest";
import { seal, sha256Hex } from "../src/lib/crypto.ts";
import type { PhotoReader } from "../src/reads/reader.ts";
import { runRetention } from "../src/retention/cron.ts";
import { call, count, nonce, signIn } from "./helpers/http.ts";
import {
  APPLE_SERVICES_ID,
  appleSettings,
  makeWorld,
  testDataKeys,
  type World,
} from "./helpers/world.ts";

const DAY = 24 * 60 * 60 * 1000;

afterEach(() => {
  vi.restoreAllMocks();
});

const abstain: PhotoReader = {
  read: async () => ({ canonical: null, band: "abstain", reason: null }),
};

async function run(w: World): Promise<void> {
  await w.worker.scheduled(
    createScheduledController({ cron: "17 3 * * *" }),
    w.env,
  );
}

async function photo(w: World, ip: string): Promise<string> {
  const data = new FormData();
  data.set(
    "photo",
    new Blob([new Uint8Array([0xff, 0xd8, 0xff, 0xe0])], {
      type: "image/jpeg",
    }),
    "read.jpg",
  );
  expect((await call(w, "POST", "/v1/reads", { raw: data, ip })).status).toBe(
    200,
  );
  const row = await env.ZZ_DB.prepare(
    "SELECT object_key FROM read_photos ORDER BY created_at DESC, rowid DESC",
  ).first<{ object_key: string }>();
  return row?.object_key as string;
}

async function pending(
  w: World,
  createdAt: number,
  nextAttemptAt: number,
  attempts = 1,
  clientId = APPLE_SERVICES_ID,
): Promise<string> {
  const id = crypto.randomUUID();
  await env.ZZ_DB.prepare(
    "INSERT INTO pending_revocations (id, provider, client_id, token_enc, attempts, next_attempt_at, created_at) VALUES (?, 'apple', ?, ?, ?, ?, ?)",
  )
    .bind(
      id,
      clientId,
      await seal(await testDataKeys(), "apple-refresh-value", clientId),
      attempts,
      new Date(nextAttemptAt).toISOString(),
      new Date(createdAt).toISOString(),
    )
    .run();
  return id;
}

async function pendingRow(id: string) {
  return env.ZZ_DB.prepare(
    "SELECT attempts, next_attempt_at FROM pending_revocations WHERE id = ?",
  )
    .bind(id)
    .first<{ attempts: number; next_attempt_at: string }>();
}

describe("daily retention run (FR-026, T031)", () => {
  it("deletes an expired photo and its row, and keeps a newer one", async () => {
    vi.spyOn(console, "log").mockImplementation(() => {});
    const w = await makeWorld({
      settings: { ZZ_PHOTO_READS: "true" },
      photoReader: abstain,
    });
    const old = await photo(w, "192.0.2.1");
    w.clock.advance(10 * DAY);
    const newer = await photo(w, "192.0.2.2");
    w.clock.advance(20 * DAY);
    await run(w);
    expect(await w.env.ZZ_PHOTOS.head(old)).toBeNull();
    expect(
      await count(
        w,
        "SELECT count(*) AS n FROM read_photos WHERE object_key = ?",
        old,
      ),
    ).toBe(0);
    expect(await w.env.ZZ_PHOTOS.head(newer)).not.toBeNull();
    expect(
      await count(
        w,
        "SELECT count(*) AS n FROM read_photos WHERE object_key = ?",
        newer,
      ),
    ).toBe(1);
  });

  it("deletes used and expired nonces, and refresh tokens 30 days past expiry", async () => {
    const w = await makeWorld();
    const session = await signIn(w);
    const fresh = await nonce(w);
    const expiring = await nonce(w);
    w.clock.advance(11 * 60 * 1000);
    const live = await nonce(w);
    await run(w);
    expect(await count(w, "SELECT count(*) AS n FROM auth_nonces")).toBe(1);
    expect(
      await count(
        w,
        "SELECT count(*) AS n FROM auth_nonces WHERE nonce_hash = ?",
        await sha256Hex(live),
      ),
    ).toBe(1);
    expect(fresh).not.toBe(expiring);
    // The sign-in's refresh token expires after 30 days and is kept 30 more.
    w.clock.advance(59 * DAY);
    await run(w);
    expect(
      await count(
        w,
        "SELECT count(*) AS n FROM refresh_tokens WHERE account_id = ?",
        session.accountId,
      ),
    ).toBe(1);
    w.clock.advance(1 * DAY);
    await run(w);
    expect(
      await count(
        w,
        "SELECT count(*) AS n FROM refresh_tokens WHERE account_id = ?",
        session.accountId,
      ),
    ).toBe(0);
  });

  it("retries a due Apple revocation with its stored client id, then removes it", async () => {
    const logs = vi.spyOn(console, "log").mockImplementation(() => {});
    const w = await makeWorld({ settings: await appleSettings() });
    const id = await pending(w, w.clock.ms - DAY, w.clock.ms);
    await run(w);
    const revoke = w.appleStub.calls.find((c) =>
      c.url.endsWith("/auth/revoke"),
    );
    expect(revoke?.form.get("client_id")).toBe(APPLE_SERVICES_ID);
    expect(revoke?.form.get("token")).toBe("apple-refresh-value");
    expect(revoke?.form.get("token_type_hint")).toBe("refresh_token");
    expect(await pendingRow(id)).toBeNull();
    const report = logs.mock.calls
      .map((args) => String(args[0]))
      .find((line) => line.includes('"retention"'));
    expect(JSON.parse(report as string)).toMatchObject({
      event: "retention",
      revoked: 1,
      retried: 0,
      abandoned: 0,
    });
    expect(logs.mock.calls.join("\n")).not.toContain("apple-refresh-value");
  });

  it("waits 1 day after the first failure and doubles the wait after each one (D-2026-10-05-04)", async () => {
    vi.spyOn(console, "log").mockImplementation(() => {});
    const w = await makeWorld({ settings: await appleSettings() });
    w.appleStub.revoke = () => new Response(null, { status: 500 });
    const start = w.clock.ms;
    // A deletion's failed revoke is attempt 1, due a day later (FR-023).
    const id = await pending(w, start, start + DAY, 1);
    const waits: number[] = [];
    let due = start + DAY;
    for (let attempt = 2; attempt <= 5; attempt += 1) {
      w.clock.ms = due - 1;
      await run(w);
      // Not due yet: untouched.
      expect((await pendingRow(id))?.attempts).toBe(attempt - 1);
      w.clock.ms = due;
      await run(w);
      const row = await pendingRow(id);
      expect(row?.attempts).toBe(attempt);
      const next = Date.parse(row?.next_attempt_at as string);
      waits.push((next - due) / DAY);
      due = next;
    }
    expect(waits).toEqual([2, 4, 8, 16]);
    // 30 days after the deletion it is dropped without another call.
    const calls = w.appleStub.calls.length;
    w.clock.ms = start + 30 * DAY;
    await run(w);
    expect(await pendingRow(id)).toBeNull();
    expect(w.appleStub.calls.length).toBe(calls);
  });

  it("keeps retrying when Apple is not configured or the token cannot be read", async () => {
    vi.spyOn(console, "log").mockImplementation(() => {});
    const w = await makeWorld();
    const unconfigured = await pending(w, w.clock.ms, w.clock.ms);
    const unreadable = crypto.randomUUID();
    await env.ZZ_DB.prepare(
      "INSERT INTO pending_revocations (id, provider, client_id, token_enc, attempts, next_attempt_at, created_at) VALUES (?, 'apple', 'x', 'AAAA', 1, ?, ?)",
    )
      .bind(
        unreadable,
        new Date(w.clock.ms).toISOString(),
        new Date(w.clock.ms).toISOString(),
      )
      .run();
    const result = await runRetention(w.env, w.deps);
    expect(result).toMatchObject({ revoked: 0, retried: 2, abandoned: 0 });
    expect((await pendingRow(unconfigured))?.attempts).toBe(2);
    expect((await pendingRow(unreadable))?.attempts).toBe(2);
    expect(w.appleStub.calls).toHaveLength(0);
  });

  it("logs the config error and changes nothing when a setting is missing", async () => {
    const errors = vi.spyOn(console, "error").mockImplementation(() => {});
    const w = await makeWorld({ settings: { ZZ_DATA_KEY: undefined } });
    await env.ZZ_DB.prepare(
      "INSERT INTO auth_nonces (nonce_hash, expires_at, used_at) VALUES ('h', '2000-01-01T00:00:00.000Z', NULL)",
    ).run();
    expect(await runRetention(w.env, w.deps)).toBeNull();
    expect(await count(w, "SELECT count(*) AS n FROM auth_nonces")).toBe(1);
    expect(JSON.parse(String(errors.mock.calls[0]?.[0]))).toEqual({
      event: "config-error",
      settings: ["ZZ_DATA_KEY"],
    });
  });
});
