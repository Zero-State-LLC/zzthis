import {
  listDurableObjectIds,
  runDurableObjectAlarm,
  runInDurableObject,
} from "cloudflare:test";
import { env } from "cloudflare:workers";
import { afterEach, describe, expect, it, vi } from "vitest";
import { hmacTag } from "../src/lib/crypto.ts";
import {
  call,
  mint,
  nonce,
  resolvePath,
  signIn,
  TEST_IP,
  type CallOptions,
} from "./helpers/http.ts";
import { fixture7Codes } from "./helpers/random.ts";
import { expectMatchesSchema } from "./helpers/schema.ts";
import { makeWorld, testDataKeys, type World } from "./helpers/world.ts";

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;

afterEach(() => {
  vi.restoreAllMocks();
});

type Step = readonly [method: string, path: string, options?: CallOptions];

// Sends `limit` calls, cycling through the routes on one row, then one
// more, which must be the 429.
async function exhaust(
  w: World,
  limit: number,
  steps: readonly Step[],
  windowMs: number,
): Promise<Response> {
  // Start 15 seconds into a window, so Retry-After is known.
  w.clock.ms = w.clock.ms - (w.clock.ms % windowMs) + 15 * 1000;
  for (let i = 0; i < limit; i += 1) {
    const [method, path, options] = steps[i % steps.length] as Step;
    const response = await call(w, method, path, options);
    expect(response.status, `${method} ${path} call ${i + 1}`).not.toBe(429);
  }
  const [method, path, options] = steps[limit % steps.length] as Step;
  const limited = await call(w, method, path, options);
  expect(limited.status).toBe(429);
  expect(await limited.clone().json()).toEqual({ error: "rate-limited" });
  expect(limited.headers.get("Retry-After")).toBe(String(windowMs / 1000 - 15));
  expect(limited.headers.get("Cache-Control")).toBe("no-store");
  expect(limited.headers.get("X-ZZ-Contract")).toBe("1");
  return limited;
}

describe("rate limits, one rule per row (FR-011, T018)", () => {
  it("GET /v1 and GET /v1/openapi.json: 60 per minute per IP, shared", async () => {
    const w = await makeWorld();
    const limited = await exhaust(
      w,
      60,
      [
        ["GET", "/v1"],
        ["GET", "/v1/openapi.json"],
      ],
      MINUTE,
    );
    await expectMatchesSchema(limited, "getOpenApi", 429);
    expect((await call(w, "GET", "/v1", { ip: "198.51.100.1" })).status).toBe(
      200,
    );
  });

  it("POST /v1/auth/nonce and /v1/auth/token: 20 per minute per IP, shared", async () => {
    const w = await makeWorld();
    const token: Step = [
      "POST",
      "/v1/auth/token",
      {
        body: { provider: "dev", client: "ios", id_token: "dev:a", nonce: "x" },
      },
    ];
    await expectMatchesSchema(
      await exhaust(w, 20, [["POST", "/v1/auth/nonce"], token], MINUTE),
      "createNonce",
      429,
    );
  });

  it("POST /v1/auth/refresh and /v1/auth/revoke: 30 per minute per IP, shared", async () => {
    const w = await makeWorld();
    const body = { body: { refresh_token: "never-issued" } };
    await expectMatchesSchema(
      await exhaust(
        w,
        30,
        [
          ["POST", "/v1/auth/refresh", body],
          ["POST", "/v1/auth/revoke", body],
        ],
        MINUTE,
      ),
      "refreshToken",
      429,
    );
  });

  it("GET /v1/resolve/{code}: 60 per minute per IP signed out, and 120 per minute per signed-in user", async () => {
    const w = await makeWorld();
    const alice = await signIn(w, "alice");
    const signedOut: Step = ["GET", resolvePath("zz-copper-lantern-maple-zz")];
    await expectMatchesSchema(
      await exhaust(w, 60, [signedOut], MINUTE),
      "resolveCode",
      429,
    );
    // The signed-in user row is separate from the IP row it shares.
    const signedInStep: Step = [
      "GET",
      resolvePath("zz-copper-lantern-maple-zz"),
      { token: alice.access },
    ];
    await exhaust(w, 120, [signedInStep], MINUTE);
  });

  it("POST /v1/codes and /v1/codes/{id}/reroll: 10 per hour per user, shared", async () => {
    const w = await makeWorld();
    const alice = await signIn(w, "alice");
    const bob = await signIn(w, "bob");
    const limited = await exhaust(
      w,
      10,
      [
        [
          "POST",
          "/v1/codes",
          {
            token: alice.access,
            body: { scope: "free_public", record: { title: "t", body: "" } },
          },
        ],
        ["POST", "/v1/codes/no-such-code/reroll", { token: alice.access }],
      ],
      HOUR,
    );
    await expectMatchesSchema(limited, "mintCode", 429);
    // Another user is not limited by alice's count.
    expect(
      (
        await call(w, "POST", "/v1/codes/no-such-code/reroll", {
          token: bob.access,
        })
      ).status,
    ).toBe(404);
  });

  it("POST /v1/reads: 5 per hour per IP signed out, and 20 per hour per signed-in user", async () => {
    const w = await makeWorld();
    const alice = await signIn(w, "alice");
    await expectMatchesSchema(
      await exhaust(w, 5, [["POST", "/v1/reads"]], HOUR),
      "submitRead",
      429,
    );
    await exhaust(
      w,
      20,
      [["POST", "/v1/reads", { token: alice.access }]],
      HOUR,
    );
  });

  it("POST /v1/reports: 10 per hour per IP", async () => {
    const w = await makeWorld();
    const report: Step = [
      "POST",
      "/v1/reports",
      { body: { canonical: "zz-copper-lantern-sky-zz", reason: "spam" } },
    ];
    await expectMatchesSchema(
      await exhaust(w, 10, [report], HOUR),
      "createReport",
      429,
    );
  });

  it("GET /v1/me, /v1/me/codes, and /v1/records/{id}: 60 per minute per user, shared", async () => {
    const w = await makeWorld();
    const alice = await signIn(w, "alice");
    const limited = await exhaust(
      w,
      60,
      [
        ["GET", "/v1/me", { token: alice.access }],
        ["GET", "/v1/me/codes", { token: alice.access }],
        ["GET", "/v1/records/no-such-record", { token: alice.access }],
      ],
      MINUTE,
    );
    await expectMatchesSchema(limited, "getMe", 429);
  });

  it("POST /v1/records/{id}/versions and code revoke: 30 per hour per user, shared", async () => {
    const w = await makeWorld();
    const alice = await signIn(w, "alice");
    const limited = await exhaust(
      w,
      30,
      [
        [
          "POST",
          "/v1/records/no-such-record/versions",
          { token: alice.access, body: { title: "t", body: "" } },
        ],
        ["POST", "/v1/codes/no-such-code/revoke", { token: alice.access }],
      ],
      HOUR,
    );
    await expectMatchesSchema(limited, "addRecordVersion", 429);
  });

  it("DELETE /v1/me: 5 per hour per user", async () => {
    const w = await makeWorld();
    const alice = await signIn(w, "alice");
    // Failed deletions keep the account, so retries count up to the limit.
    await env.ZZ_DB.prepare(
      "CREATE TRIGGER audit_down BEFORE INSERT ON audit_events BEGIN SELECT RAISE (ABORT, 'audit down'); END",
    ).run();
    vi.spyOn(console, "error").mockImplementation(() => {});
    const limited = await exhaust(
      w,
      5,
      [["DELETE", "/v1/me", { token: alice.access }]],
      HOUR,
    );
    await expectMatchesSchema(limited, "deleteMe", 429);
  });

  it("GET /v1/audit: 60 per minute per user", async () => {
    const w = await makeWorld();
    const alice = await signIn(w, "alice");
    await expectMatchesSchema(
      await exhaust(
        w,
        60,
        [["GET", "/v1/audit", { token: alice.access }]],
        MINUTE,
      ),
      "listAudit",
      429,
    );
  });
});

describe("limiter behavior (FR-011, FR-019 e)", () => {
  it("answers an unknown code and a live code with the same 429", async () => {
    const w = await makeWorld();
    const alice = await signIn(w, "alice");
    const code = await mint(w, alice.access);
    const unknown = fixture7Codes().find((c) => c !== code.canonical) as string;
    await exhaust(w, 60, [["GET", resolvePath(unknown)]], MINUTE);
    const a = await call(w, "GET", resolvePath(unknown));
    const b = await call(w, "GET", resolvePath(code.canonical));
    expect(a.status).toBe(429);
    expect(await a.text()).toBe(await b.text());
    expect([...a.headers.entries()]).toEqual([...b.headers.entries()]);
  });

  it("counts cache hits, and an unusable bearer against the IP row", async () => {
    const w = await makeWorld();
    const alice = await signIn(w, "alice");
    const code = await mint(w, alice.access);
    await exhaust(w, 60, [["GET", resolvePath(code.canonical)]], MINUTE);
    expect(
      (await call(w, "GET", resolvePath(code.canonical), { token: "unusable" }))
        .status,
    ).toBe(429);
    expect(
      (
        await call(w, "GET", resolvePath(code.canonical), {
          token: alice.access,
        })
      ).status,
    ).toBe(200);
  });

  it("counts calls with no client IP together under one key", async () => {
    const w = await makeWorld();
    for (let i = 0; i < 60; i += 1) {
      expect((await call(w, "GET", "/v1", { ip: null })).status).toBe(200);
    }
    expect((await call(w, "GET", "/v1", { ip: null })).status).toBe(429);
    expect((await call(w, "GET", "/v1")).status).toBe(200);
  });

  it("opens again when the window ends", async () => {
    const w = await makeWorld();
    await exhaust(w, 60, [["GET", "/v1"]], MINUTE);
    w.clock.advance(45 * 1000);
    expect((await call(w, "GET", "/v1")).status).toBe(200);
  });

  it("keys IP rows on an HMAC of the IP, never the IP itself (FR-027)", async () => {
    const w = await makeWorld();
    await call(w, "GET", "/v1");
    const ids = (await listDurableObjectIds(env.ZZ_LIMITER)).map((id) =>
      id.toString(),
    );
    const tag = await hmacTag(await testDataKeys(), "limiter-ip", TEST_IP);
    expect(ids).toContain(
      env.ZZ_LIMITER.idFromName(`discovery:ip:${tag}`).toString(),
    );
    expect(ids).not.toContain(
      env.ZZ_LIMITER.idFromName(`discovery:ip:${TEST_IP}`).toString(),
    );
  });

  it("clears a finished window with its alarm and keeps a live one", async () => {
    // A window that ended more than one window ago: the alarm deletes it.
    const done = env.ZZ_LIMITER.get(env.ZZ_LIMITER.idFromName("probe-done"));
    await runInDurableObject(done, async (instance, state) => {
      const end = Date.now() - 2 * MINUTE;
      await state.storage.put("window", { start: end - MINUTE, end, count: 3 });
      await instance.alarm();
      expect(await state.storage.get("window")).toBeUndefined();
    });
    // A window that ended less than one window ago is kept a while longer.
    const recent = env.ZZ_LIMITER.get(
      env.ZZ_LIMITER.idFromName("probe-recent"),
    );
    await runInDurableObject(recent, async (instance, state) => {
      const end = Date.now() - 10 * 1000;
      await state.storage.put("window", { start: end - MINUTE, end, count: 3 });
      await instance.alarm();
      expect(await state.storage.get("window")).toMatchObject({ count: 3 });
      expect(await state.storage.getAlarm()).toBe(end + MINUTE);
    });
    // A live window: the alarm re-arms and keeps the count.
    const live = env.ZZ_LIMITER.get(env.ZZ_LIMITER.idFromName("probe-live"));
    await live.take(10, HOUR, Date.now());
    expect(await runDurableObjectAlarm(live)).toBe(true);
    await runInDurableObject(live, async (_, state) => {
      expect(await state.storage.get("window")).toMatchObject({ count: 1 });
      expect(await state.storage.getAlarm()).not.toBeNull();
    });
    // Nothing stored: the alarm leaves nothing behind.
    const empty = env.ZZ_LIMITER.get(env.ZZ_LIMITER.idFromName("probe-empty"));
    await runInDurableObject(empty, async (instance, state) => {
      await instance.alarm();
      expect(await state.storage.get("window")).toBeUndefined();
    });
  });

  it("never resets a window because the object restarted", async () => {
    const stub = env.ZZ_LIMITER.get(env.ZZ_LIMITER.idFromName("restart"));
    const now = Date.now();
    for (let i = 0; i < 3; i += 1) await stub.take(3, HOUR, now);
    const again = env.ZZ_LIMITER.get(env.ZZ_LIMITER.idFromName("restart"));
    expect(await again.take(3, HOUR, now)).toMatchObject({ allowed: false });
  });

  it("counts a signed-in nonce call against the IP, since the auth row is IP only", async () => {
    const w = await makeWorld();
    const alice = await signIn(w, "alice");
    // signIn used two of the IP's 20 calls this minute.
    for (let i = 0; i < 18; i += 1) await nonce(w);
    const response = await call(w, "POST", "/v1/auth/nonce", {
      token: alice.access,
    });
    expect(response.status).toBe(429);
  });
});
