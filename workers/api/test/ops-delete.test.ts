import { createScheduledController } from "cloudflare:test";
import { env } from "cloudflare:workers";
import { afterEach, describe, expect, it, vi } from "vitest";
import { sha256Hex } from "../src/lib/crypto.ts";
import { TIMESTAMP } from "../src/lib/time.ts";
import {
  call,
  mint,
  nonce,
  resolvePath,
  type Session,
  sessionFrom,
  signIn,
} from "./helpers/http.ts";
import {
  audit,
  expectOperatorEvent,
  type Row,
  runOps,
  UUID_V4,
} from "./helpers/ops.ts";
import {
  APPLE_BUNDLE_ID,
  appleSettings,
  makeWorld,
  type World,
} from "./helpers/world.ts";

// ops/delete-account.sql (spec 005 FR-023, plan.md Operator work,
// D-2026-10-13-08, RM-023, RM-027): the FR-023 step 2 batch for an account
// whose owner cannot call DELETE /v1/me.

afterEach(() => {
  vi.restoreAllMocks();
});

// Every table in migrations 0001 to 0003.
const TABLES = [
  "accounts",
  "identities",
  "auth_nonces",
  "refresh_tokens",
  "records",
  "record_versions",
  "codes",
  "grants",
  "audit_events",
  "read_photos",
  "pending_revocations",
  "reports",
];

async function everyRow(): Promise<Record<string, Row[]>> {
  const dump: Record<string, Row[]> = {};
  for (const table of TABLES) {
    dump[table] = (
      await env.ZZ_DB.prepare(
        `SELECT * FROM ${table} ORDER BY rowid`,
      ).all<Row>()
    ).results;
  }
  return dump;
}

async function rows(sql: string, ...params: string[]): Promise<Row[]> {
  return (
    await env.ZZ_DB.prepare(sql)
      .bind(...params)
      .all<Row>()
  ).results;
}

const abstain = {
  read: async () => ({
    canonical: null,
    band: "abstain" as const,
    reason: null,
  }),
};

// One account's data: an active code with a second version, a used
// single-use code, a code its owner revoked, a grant, a read photo, and
// the sign-in's refresh token.
async function populate(w: World, session: Session): Promise<string> {
  const active = await mint(w, session.access);
  expect(
    (
      await call(w, "POST", `/v1/records/${active.record_id}/versions`, {
        token: session.access,
        body: { title: "Found", body: "Thanks." },
      })
    ).status,
  ).toBe(201);
  const used = await mint(w, session.access, { single_use: true });
  expect((await call(w, "GET", resolvePath(used.canonical))).status).toBe(200);
  const revoked = await mint(w, session.access);
  expect(
    (
      await call(w, "POST", `/v1/codes/${revoked.id}/revoke`, {
        token: session.access,
      })
    ).status,
  ).toBe(200);
  await env.ZZ_DB.prepare(
    "INSERT INTO grants (id, subject_id, scope, role, expires_at) VALUES (?, ?, 'enterprise', 'issuer', NULL)",
  )
    .bind(crypto.randomUUID(), session.accountId)
    .run();
  const form = new FormData();
  form.set(
    "photo",
    new Blob([new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3])], {
      type: "image/jpeg",
    }),
    "read.jpg",
  );
  expect(
    (
      await call(w, "POST", "/v1/reads", {
        token: session.access,
        raw: form,
      })
    ).status,
  ).toBe(200);
  const photo = await env.ZZ_DB.prepare(
    "SELECT object_key FROM read_photos WHERE account_id = ?",
  )
    .bind(session.accountId)
    .first<{ object_key: string }>();
  return photo?.object_key as string;
}

// The account's rows with ids, write ids, and times left out, so two
// accounts can be compared. A time is shown as whether it is set.
async function state(accountId: string) {
  return {
    accounts: await rows(
      "SELECT suspended_at, deleted_at IS NOT NULL AS deleted, org_id FROM accounts WHERE id = ?",
      accountId,
    ),
    codes: await rows(
      "SELECT scope, kind, status, revoked_reason, single_use, first_resolved_at IS NOT NULL AS resolved, rerolls_remaining FROM codes WHERE owner_id = ? ORDER BY rowid",
      accountId,
    ),
    records: await rows(
      "SELECT visibility, deleted_at IS NOT NULL AS deleted FROM records WHERE owner_id = ? ORDER BY rowid",
      accountId,
    ),
    versions: await rows(
      "SELECT v.version, v.title, v.body, v.signature, v.signing_key_id, v.erased_at IS NOT NULL AS erased FROM record_versions v JOIN records r ON r.id = v.record_id WHERE r.owner_id = ? ORDER BY v.rowid",
      accountId,
    ),
    identities: await rows(
      "SELECT provider FROM identities WHERE account_id = ?",
      accountId,
    ),
    grants: await rows(
      "SELECT scope, role FROM grants WHERE subject_id = ?",
      accountId,
    ),
    readPhotos: await rows(
      "SELECT id FROM read_photos WHERE account_id = ?",
      accountId,
    ),
    refreshTokens: await rows(
      "SELECT client, revoked_at IS NOT NULL AS revoked FROM refresh_tokens WHERE account_id = ? ORDER BY rowid",
      accountId,
    ),
    events: await rows(
      "SELECT action, target_type, result FROM audit_events WHERE target_type = 'account' AND target_id = ? ORDER BY rowid",
      accountId,
    ),
  };
}

async function appleSignIn(w: World, sub: string): Promise<Session> {
  const n = await nonce(w);
  const idToken = await w.apple.idToken({
    sub,
    aud: APPLE_BUNDLE_ID,
    nonce: await sha256Hex(n),
  });
  return sessionFrom(
    await call(w, "POST", "/v1/auth/token", {
      body: {
        provider: "apple",
        client: "ios",
        id_token: idToken,
        nonce: n,
        authorization_code: `code-${sub}`,
      },
    }),
  );
}

describe("ops/delete-account.sql", () => {
  it("leaves the account and its data as DELETE /v1/me does, with one event and no actor", async () => {
    const w = await makeWorld({
      settings: { ZZ_PHOTO_READS: "true" },
      photoReader: abstain,
    });
    const alice = await signIn(w, "alice");
    const bob = await signIn(w, "bob");
    const carol = await signIn(w, "carol");
    const alicePhoto = await populate(w, alice);
    const bobPhoto = await populate(w, bob);
    await populate(w, carol);
    const carolBefore = await state(carol.accountId);

    // Bob deletes himself; the operator deletes Alice.
    expect(
      (await call(w, "DELETE", "/v1/me", { token: bob.access })).status,
    ).toBe(204);
    const shown = await runOps("delete-account.sql", {
      account_id: alice.accountId,
    });
    expect(shown).toEqual([
      {
        id: alice.accountId,
        suspended_at: null,
        deleted_at: expect.stringMatching(TIMESTAMP),
      },
    ]);

    const aliceAfter = await state(alice.accountId);
    expect(aliceAfter).toEqual(await state(bob.accountId));
    expect(aliceAfter.codes.map((c) => [c.status, c.revoked_reason])).toEqual([
      ["revoked", "account-deleted"],
      ["used", null],
      ["revoked", "owner"],
    ]);
    expect(aliceAfter.versions).toHaveLength(4);
    for (const version of aliceAfter.versions) {
      expect(version).toMatchObject({
        title: "",
        body: "",
        signature: "",
        erased: 1,
      });
    }
    expect(aliceAfter.records).toEqual([
      { visibility: "public", deleted: 1 },
      { visibility: "public", deleted: 1 },
      { visibility: "public", deleted: 1 },
    ]);
    expect(aliceAfter.identities).toEqual([]);
    expect(aliceAfter.grants).toEqual([]);
    expect(aliceAfter.readPhotos).toEqual([]);
    expect(aliceAfter.refreshTokens).toEqual([{ client: "ios", revoked: 1 }]);
    // Another account is not touched.
    expect(await state(carol.accountId)).toEqual(carolBefore);

    // The event has no actor; DELETE /v1/me names the account as actor.
    const events = await audit("account.delete");
    expect(events).toHaveLength(2);
    expect(events[0]).toMatchObject({ actor_id: bob.accountId });
    expectOperatorEvent(
      events[1],
      "account.delete",
      "account",
      alice.accountId,
    );

    // One time throughout, as in DELETE /v1/me.
    const at = events[1]?.created_at;
    const times = await rows(
      "SELECT deleted_at AS t FROM accounts WHERE id = ?1 UNION ALL SELECT deleted_at FROM records WHERE owner_id = ?1 UNION ALL SELECT erased_at FROM record_versions WHERE record_id IN (SELECT id FROM records WHERE owner_id = ?1) UNION ALL SELECT revoked_at FROM refresh_tokens WHERE account_id = ?1",
      alice.accountId,
    );
    expect(times).toHaveLength(9);
    expect(new Set(times.map((row) => row.t))).toEqual(new Set([at]));

    // The account is locked out like a self-deleted one.
    for (const session of [alice, bob]) {
      expect(
        (await call(w, "GET", "/v1/me", { token: session.access })).status,
      ).toBe(401);
      expect(
        (
          await call(w, "POST", "/v1/auth/refresh", {
            body: { refresh_token: session.refresh },
          })
        ).status,
      ).toBe(401);
    }

    // Step 3 is not SQL: DELETE /v1/me removed Bob's photo object, and
    // Alice's is left to the 30-day reads/ lifecycle rule.
    expect(await w.env.ZZ_PHOTOS.head(bobPhoto)).toBeNull();
    expect(await w.env.ZZ_PHOTOS.head(alicePhoto)).not.toBeNull();
  });

  it("queues a stored Apple token, due now, and the daily run revokes it", async () => {
    vi.spyOn(console, "log").mockImplementation(() => {});
    const w = await makeWorld({ settings: await appleSettings() });
    const alice = await appleSignIn(w, "apple-alice");
    const stored = await env.ZZ_DB.prepare(
      "SELECT apple_refresh_token_enc AS t FROM identities WHERE account_id = ?",
    )
      .bind(alice.accountId)
      .first<{ t: string }>();
    expect(stored?.t).toEqual(expect.any(String));
    const calls = w.appleStub.calls.length;

    await runOps("delete-account.sql", { account_id: alice.accountId });

    // SQL makes no call to Apple.
    expect(w.appleStub.calls.length).toBe(calls);
    const [event] = await audit("account.delete");
    const pending = await rows("SELECT * FROM pending_revocations");
    expect(pending).toEqual([
      {
        id: expect.stringMatching(UUID_V4),
        provider: "apple",
        client_id: APPLE_BUNDLE_ID,
        token_enc: stored?.t,
        attempts: 0,
        next_attempt_at: event?.created_at,
        created_at: event?.created_at,
      },
    ]);
    expect(
      await rows(
        "SELECT * FROM identities WHERE account_id = ?",
        alice.accountId,
      ),
    ).toEqual([]);

    // The next daily run revokes it with the stored client id and removes
    // the row.
    w.clock.ms = Date.parse(event?.created_at as string) + 60_000;
    await w.worker.scheduled(
      createScheduledController({ cron: "17 3 * * *" }),
      w.env,
    );
    const revokes = w.appleStub.calls
      .slice(calls)
      .filter((c) => c.url === "https://appleid.apple.com/auth/revoke");
    expect(revokes.map((c) => c.form.get("client_id"))).toEqual([
      APPLE_BUNDLE_ID,
    ]);
    expect(await rows("SELECT * FROM pending_revocations")).toEqual([]);
  });

  it("deletes a suspended account, and a second run writes nothing", async () => {
    const w = await makeWorld();
    const alice = await signIn(w);
    await mint(w, alice.access);
    await runOps("suspend.sql", { account_id: alice.accountId });
    await runOps("delete-account.sql", { account_id: alice.accountId });
    expect(
      await rows(
        "SELECT suspended_at IS NOT NULL AS suspended, deleted_at IS NOT NULL AS deleted FROM accounts",
      ),
    ).toEqual([{ suspended: 1, deleted: 1 }]);
    expect(await audit("account.delete")).toHaveLength(1);
    const before = await everyRow();
    const shown = await runOps("delete-account.sql", {
      account_id: alice.accountId,
    });
    expect(shown).toEqual([
      {
        id: alice.accountId,
        suspended_at: expect.stringMatching(TIMESTAMP),
        deleted_at: expect.stringMatching(TIMESTAMP),
      },
    ]);
    expect(await everyRow()).toEqual(before);
  });

  it("writes nothing for an unknown account, a self-deleted one, or the placeholder left as written", async () => {
    vi.spyOn(console, "log").mockImplementation(() => {});
    const w = await makeWorld({ settings: await appleSettings() });
    const alice = await signIn(w, "alice");
    await mint(w, alice.access);
    const bob = await appleSignIn(w, "apple-bob");
    await mint(w, bob.access);
    // Apple cannot be reached, so Bob's token waits in pending_revocations.
    w.appleStub.revoke = () => new Response("unavailable", { status: 503 });
    expect(
      (await call(w, "DELETE", "/v1/me", { token: bob.access })).status,
    ).toBe(204);
    const before = await everyRow();
    expect(before.pending_revocations).toHaveLength(1);

    expect(
      await runOps("delete-account.sql", {
        account_id: crypto.randomUUID(),
      }),
    ).toEqual([]);
    expect(await runOps("delete-account.sql")).toEqual([]);
    expect(
      await runOps("delete-account.sql", { account_id: bob.accountId }),
    ).toEqual([
      {
        id: bob.accountId,
        suspended_at: null,
        deleted_at: expect.stringMatching(TIMESTAMP),
      },
    ]);
    expect(await everyRow()).toEqual(before);
  });
});
