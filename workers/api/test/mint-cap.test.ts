import { listDurableObjectIds, runInDurableObject } from "cloudflare:test";
import { env } from "cloudflare:workers";
import { afterEach, describe, expect, it, vi } from "vitest";
import { hmacTag } from "../src/lib/crypto.ts";
import {
  call,
  count,
  mintBody,
  signIn,
  TEST_IP,
  type MintedCode,
  type Session,
} from "./helpers/http.ts";
import { expectMatchesSchema } from "./helpers/schema.ts";
import { makeWorld, testDataKeys, type World } from "./helpers/world.ts";

// D-2026-10-13-03 (RM-072, spec 005 FR-011 amended): each free_public mint
// and each re-roll of a free_public code counts once against the caller's
// mint subject (30 per UTC day) and once against the RM-030 IP subject
// (60 per UTC day). The hourly mint row (10 per user) still applies, so
// these tests move the clock one hour per 10 draws, and sign in again
// because an access token lasts 900 seconds.

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;
const SUBJECT_CAP = 30;
const IP_CAP = 60;
const HOURLY = 10;
// Many draws per test, and the issuer needs room: proto-v0, not fixture-7.
const SETTINGS = { ZZ_WORDLIST_VERSION: "proto-v0" };
const SLOW = 60_000;

afterEach(() => {
  vi.restoreAllMocks();
});

interface Drawer {
  readonly name: string;
  session: Session;
  current: MintedCode | null;
  readonly scope: string;
  readonly ip: string;
}

// 15 seconds into a UTC day, so Retry-After to the next UTC day is known.
async function world(): Promise<World> {
  const w = await makeWorld({ settings: SETTINGS });
  w.clock.ms = w.clock.ms - (w.clock.ms % DAY) + DAY + 15 * 1000;
  return w;
}

async function drawer(
  w: World,
  name: string,
  options: { scope?: string; ip?: string } = {},
): Promise<Drawer> {
  return {
    name,
    session: await signIn(w, name),
    current: null,
    scope: options.scope ?? "free_public",
    ip: options.ip ?? TEST_IP,
  };
}

// A new hour window for the hourly mint row, with fresh access tokens.
async function nextHour(w: World, drawers: Drawer[]): Promise<void> {
  w.clock.advance(HOUR);
  for (const d of drawers) d.session = await signIn(w, d.name);
}

function mintCall(w: World, d: Drawer): Promise<Response> {
  return call(w, "POST", "/v1/codes", {
    token: d.session.access,
    ip: d.ip,
    body: mintBody({ scope: d.scope }),
  });
}

function rerollCall(w: World, d: Drawer, id: string): Promise<Response> {
  return call(w, "POST", `/v1/codes/${id}/reroll`, {
    token: d.session.access,
    ip: d.ip,
  });
}

// One draw: re-roll the current code until it has one re-roll left, then
// mint a new one. So every code ends with a re-roll in hand, and a run of
// draws is mostly re-rolls.
async function draw(w: World, d: Drawer): Promise<void> {
  const reroll = d.current !== null && d.current.rerolls_remaining > 1;
  const response = reroll
    ? await rerollCall(w, d, (d.current as MintedCode).id)
    : await mintCall(w, d);
  expect(response.status, `${d.name} draw`).toBe(reroll ? 200 : 201);
  d.current = await response.json<MintedCode>();
}

// `total` draws for each drawer, at most HOURLY per drawer per hour.
async function drawMany(
  w: World,
  drawers: Drawer[],
  total: number,
): Promise<void> {
  for (let done = 0; done < total; done += HOURLY) {
    if (done > 0) await nextHour(w, drawers);
    for (const d of drawers) {
      for (let i = 0; i < Math.min(HOURLY, total - done); i += 1) {
        await draw(w, d);
      }
    }
  }
}

function untilNextUtcDay(w: World): string {
  return String((DAY - (w.clock.ms % DAY)) / 1000);
}

async function expectCapped(
  w: World,
  response: Response,
  operationId: "mintCode" | "rerollCode",
): Promise<void> {
  expect(await expectMatchesSchema(response, operationId, 429)).toEqual({
    error: "rate-limited",
  });
  expect(response.headers.get("Retry-After")).toBe(untilNextUtcDay(w));
  expect(response.headers.get("Cache-Control")).toBe("no-store");
  expect(response.headers.get("X-ZZ-Contract")).toBe("1");
}

function codes(w: World): Promise<number> {
  return count(w, "SELECT count(*) AS n FROM codes");
}

describe("daily free_public mint cap (D-2026-10-13-03, RM-072)", () => {
  it(
    "allows 30 draws per subject per UTC day, re-rolls included, then 429 with Retry-After to the next UTC day",
    async () => {
      const w = await world();
      const alice = await drawer(w, "alice");
      await drawMany(w, [alice], SUBJECT_CAP);
      // Six mints and 24 re-rolls: re-rolls count like mints.
      expect(await codes(w)).toBe(SUBJECT_CAP);
      expect(
        await count(
          w,
          "SELECT count(*) AS n FROM audit_events WHERE action = 'code.reroll' AND result = 'ok'",
        ),
      ).toBe(24);
      await nextHour(w, [alice]);
      const current = alice.current as MintedCode;
      expect(current.rerolls_remaining).toBe(1);
      await expectCapped(w, await mintCall(w, alice), "mintCode");
      await expectCapped(
        w,
        await rerollCall(w, alice, current.id),
        "rerollCode",
      );
      // A refused draw writes nothing, and the current code stays active.
      expect(await codes(w)).toBe(SUBJECT_CAP);
      expect(
        await count(
          w,
          "SELECT count(*) AS n FROM codes WHERE id = ? AND status = 'active'",
          current.id,
        ),
      ).toBe(1);
      // Another subject on the same IP is not limited by alice's count.
      const bob = await drawer(w, "bob");
      await draw(w, bob);
    },
    SLOW,
  );

  it(
    "opens again on the next UTC day",
    async () => {
      const w = await world();
      const alice = await drawer(w, "alice");
      await drawMany(w, [alice], SUBJECT_CAP);
      await nextHour(w, [alice]);
      const capped = await mintCall(w, alice);
      await expectCapped(w, capped, "mintCode");
      // One second before midnight UTC: still capped.
      w.clock.advance(Number(capped.headers.get("Retry-After")) * 1000 - 1000);
      alice.session = await signIn(w, "alice");
      await expectCapped(w, await mintCall(w, alice), "mintCode");
      // Midnight UTC: a new window for the mint and the re-roll.
      w.clock.advance(1000);
      expect(w.clock.ms % DAY).toBe(0);
      alice.session = await signIn(w, "alice");
      const current = alice.current as MintedCode;
      expect((await rerollCall(w, alice, current.id)).status).toBe(200);
      expect((await mintCall(w, alice)).status).toBe(201);
    },
    SLOW,
  );

  it(
    "allows 60 draws per IP per UTC day across subjects, then 429 for any subject on that IP",
    async () => {
      const w = await world();
      const drawers = [
        await drawer(w, "alice"),
        await drawer(w, "bob"),
        await drawer(w, "carol"),
      ];
      await drawMany(w, drawers, IP_CAP / drawers.length);
      expect(await codes(w)).toBe(IP_CAP);
      await nextHour(w, drawers);
      // dave has drawn nothing, but his IP is at 60.
      const dave = await drawer(w, "dave");
      await expectCapped(w, await mintCall(w, dave), "mintCode");
      const alice = drawers[0] as Drawer;
      await expectCapped(
        w,
        await rerollCall(w, alice, (alice.current as MintedCode).id),
        "rerollCode",
      );
      expect(await codes(w)).toBe(IP_CAP);
      // The same subjects from another IP (another /64 or address) draw.
      const elsewhere = await drawer(w, "dave", { ip: "198.51.100.9" });
      await draw(w, elsewhere);
      const aliceElsewhere = { ...alice, ip: "198.51.100.9" };
      await draw(w, aliceElsewhere);
    },
    SLOW,
  );

  it(
    "never counts enterprise mints or re-rolls, and never caps them",
    async () => {
      const w = await world();
      const alice = await drawer(w, "alice");
      await env.ZZ_DB.prepare(
        "INSERT INTO grants (id, subject_id, scope, role, expires_at) VALUES (?, ?, 'enterprise', 'issuer', NULL)",
      )
        .bind(crypto.randomUUID(), alice.session.accountId)
        .run();
      const issuer: Drawer = { ...alice, scope: "enterprise", current: null };
      // Hour 0: ten enterprise draws.
      await drawMany(w, [issuer], HOURLY);
      // Hours 1 to 3: still all 30 free_public draws.
      await nextHour(w, [alice]);
      await drawMany(w, [alice], SUBJECT_CAP);
      await nextHour(w, [alice]);
      await expectCapped(w, await mintCall(w, alice), "mintCode");
      // Enterprise is not capped by the free_public count.
      issuer.session = alice.session;
      const enterprise = issuer.current as MintedCode;
      expect((await rerollCall(w, issuer, enterprise.id)).status).toBe(200);
      expect((await mintCall(w, issuer)).status).toBe(201);
    },
    SLOW,
  );

  it(
    "keeps the day's count when the account is deleted and the same provider subject signs in again",
    async () => {
      const w = await world();
      const alice = await drawer(w, "alice");
      await drawMany(w, [alice], SUBJECT_CAP);
      await nextHour(w, [alice]);
      const deleted = await call(w, "DELETE", "/v1/me", {
        token: alice.session.access,
      });
      expect(deleted.status).toBe(204);
      const again = await drawer(w, "alice");
      expect(again.session.accountId).not.toBe(alice.session.accountId);
      expect(
        await count(
          w,
          "SELECT count(*) AS n FROM identities WHERE provider = 'dev' AND provider_subject = 'alice'",
        ),
      ).toBe(1);
      await expectCapped(w, await mintCall(w, again), "mintCode");
      expect(
        await count(
          w,
          "SELECT count(*) AS n FROM codes WHERE owner_id = ?",
          again.session.accountId,
        ),
      ).toBe(0);
    },
    SLOW,
  );

  it("keys the subject on an HMAC of provider and provider subject, the oldest identity first", async () => {
    const w = await world();
    const alice = await drawer(w, "alice");
    await draw(w, alice);
    // A second, newer identity on the account does not move the subject.
    await env.ZZ_DB.prepare(
      "INSERT INTO identities (id, account_id, provider, provider_subject, created_at) VALUES (?, ?, 'google', 'g-1', ?)",
    )
      .bind(
        crypto.randomUUID(),
        alice.session.accountId,
        new Date(w.clock.ms + 1000).toISOString(),
      )
      .run();
    await draw(w, alice);
    const keys = await testDataKeys();
    const subject = await hmacTag(keys, "mint-subject", "dev:alice");
    const other = await hmacTag(keys, "mint-subject", "google:g-1");
    const ip = await hmacTag(keys, "limiter-ip", TEST_IP);
    const ids = (await listDurableObjectIds(env.ZZ_LIMITER)).map((id) =>
      id.toString(),
    );
    const idOf = (name: string) => env.ZZ_LIMITER.idFromName(name).toString();
    expect(ids).toContain(idOf(`mint-day:subject:${subject}`));
    expect(ids).toContain(idOf(`mint-day:ip:${ip}`));
    expect(ids).not.toContain(idOf(`mint-day:subject:${other}`));
    // Never the account id or the provider subject itself.
    for (const raw of [alice.session.accountId, "dev:alice", "alice"]) {
      expect(ids).not.toContain(idOf(`mint-day:subject:${raw}`));
    }
    for (const name of [`mint-day:subject:${subject}`, `mint-day:ip:${ip}`]) {
      const stub = env.ZZ_LIMITER.get(env.ZZ_LIMITER.idFromName(name));
      await runInDurableObject(stub, async (_, state) => {
        expect(await state.storage.get("window")).toMatchObject({
          start: w.clock.ms - (w.clock.ms % DAY),
          count: 2,
        });
      });
    }
  });

  it("answers 401 and writes nothing when the identity is gone after the account check", async () => {
    const w = await world();
    const alice = await drawer(w, "alice");
    await draw(w, alice);
    const before = await codes(w);
    // Stands in for an account deletion that lands between requireActive
    // and the subject lookup: deletion removes the identity rows.
    await env.ZZ_DB.prepare("DELETE FROM identities WHERE account_id = ?")
      .bind(alice.session.accountId)
      .run();
    expect(
      await expectMatchesSchema(await mintCall(w, alice), "mintCode", 401),
    ).toEqual({ error: "unauthorized" });
    expect(
      await expectMatchesSchema(
        await rerollCall(w, alice, (alice.current as MintedCode).id),
        "rerollCode",
        401,
      ),
    ).toEqual({ error: "unauthorized" });
    expect(await codes(w)).toBe(before);
  });
});
