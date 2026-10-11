import { env } from "cloudflare:workers";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ipBucket } from "../src/limits/enforce.ts";
import { call, count, resolvePath, signIn } from "./helpers/http.ts";
import { expectMatchesSchema } from "./helpers/schema.ts";
import { makeWorld } from "./helpers/world.ts";

// RM-030 and RM-038 (issue #130): IP buckets and the limiter failure policy.

const MINUTE = 60 * 1000;

afterEach(() => {
  vi.restoreAllMocks();
});

describe("IP buckets (RM-030)", () => {
  it("counts IPv4 and IPv4-mapped IPv6 per address, other IPv6 per /64", () => {
    expect(ipBucket("203.0.113.7")).toBe("203.0.113.7");
    expect(ipBucket("::FFFF:203.0.113.7")).toBe("203.0.113.7");
    expect(ipBucket("2001:db8:85a3:12::8a2e:370:7334")).toBe(
      "2001:db8:85a3:12::/64",
    );
    expect(ipBucket("2001:DB8:0:0:1:2:3:4")).toBe("2001:db8:0:0::/64");
    expect(ipBucket("2001:0db8:0000:0042::")).toBe("2001:db8:0:42::/64");
    expect(ipBucket("::1")).toBe("0:0:0:0::/64");
  });

  it("counts text that is not a well-formed IPv6 address as itself", () => {
    expect(ipBucket("unknown")).toBe("unknown");
    expect(ipBucket("1::2::3")).toBe("1::2::3");
    expect(ipBucket("1:2:3:4:5:6:7")).toBe("1:2:3:4:5:6:7");
    expect(ipBucket("1:2:3:4::5:6:7:8")).toBe("1:2:3:4::5:6:7:8");
    expect(ipBucket("zz:2:3:4:5:6:7:8")).toBe("zz:2:3:4:5:6:7:8");
  });

  it("shares one bucket across addresses in one IPv6 /64", async () => {
    const w = await makeWorld();
    w.clock.ms = w.clock.ms - (w.clock.ms % MINUTE) + 15 * 1000;
    for (let i = 0; i < 60; i += 1) {
      const response = await call(w, "GET", "/v1", {
        ip: `2001:db8:1:2::${(i + 1).toString(16)}`,
      });
      expect(response.status).not.toBe(429);
    }
    const sameBlock = await call(w, "GET", "/v1", {
      ip: "2001:db8:1:2:ffff:ffff:ffff:ffff",
    });
    expect(sameBlock.status).toBe(429);
    const otherBlock = await call(w, "GET", "/v1", { ip: "2001:db8:1:3::1" });
    expect(otherBlock.status).toBe(200);
  });
});

// A limiter namespace whose objects throw, or never answer, for the keys
// the test picks.
function brokenLimiter(
  fails: (key: string) => boolean,
  mode: "throw" | "hang" = "throw",
): DurableObjectNamespace {
  const real = env.ZZ_LIMITER;
  return {
    idFromName: (name: string) => name,
    get: (key: string) => {
      if (!fails(key)) return real.get(real.idFromName(key));
      return {
        take: () =>
          mode === "throw"
            ? Promise.reject(new Error("limiter down"))
            : new Promise(() => {}),
      };
    },
  } as unknown as DurableObjectNamespace;
}

describe("limiter failure policy (RM-038)", () => {
  it("keeps discovery up and fails every other route closed with not-ready", async () => {
    const w = await makeWorld({
      settings: { ZZ_LIMITER: brokenLimiter(() => true) },
    });
    const errors = vi.spyOn(console, "error").mockImplementation(() => {});
    expect((await call(w, "GET", "/v1")).status).toBe(200);
    expect((await call(w, "GET", "/v1/openapi.json")).status).toBe(200);
    const resolve = await call(
      w,
      "GET",
      resolvePath("zz-copper-lantern-sky-zz"),
    );
    expect(await expectMatchesSchema(resolve, "resolveCode", 503)).toEqual({
      error: "not-ready",
    });
    const nonceCall = await call(w, "POST", "/v1/auth/nonce");
    expect(nonceCall.status).toBe(503);
    expect(errors.mock.calls.map((args) => String(args[0]))).toContain(
      JSON.stringify({ event: "limiter-fault", rule: "resolve" }),
    );
  });

  it("treats a limiter that does not answer in time as down", async () => {
    const w = await makeWorld({
      settings: { ZZ_LIMITER: brokenLimiter(() => true, "hang") },
      limiterTimeoutMs: 20,
    });
    vi.spyOn(console, "error").mockImplementation(() => {});
    const response = await call(
      w,
      "GET",
      resolvePath("zz-copper-lantern-sky-zz"),
    );
    expect(response.status).toBe(503);
  });

  it("still refuses a suspended account when only the refusal count fails, without an audit row", async () => {
    const w = await makeWorld();
    const alice = await signIn(w);
    await env.ZZ_DB.prepare("UPDATE accounts SET suspended_at = ? WHERE id = ?")
      .bind(new Date(w.clock.ms).toISOString(), alice.accountId)
      .run();
    const broken = await makeWorld({
      settings: {
        ZZ_LIMITER: brokenLimiter((key) => key.includes(":refused:")),
      },
    });
    vi.spyOn(console, "error").mockImplementation(() => {});
    const response = await call(broken, "POST", "/v1/codes", {
      token: alice.access,
      body: {
        scope: "free_public",
        kind: "plain",
        record: { title: "t", body: "" },
      },
    });
    expect(response.status).toBe(403);
    expect(
      await count(
        broken,
        "SELECT count(*) AS n FROM audit_events WHERE result = 'denied' AND target_type = 'account'",
      ),
    ).toBe(0);
  });
});
