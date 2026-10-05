import { env } from "cloudflare:workers";
import { describe, expect, it } from "vitest";
import {
  call,
  count,
  mint,
  mintRequest,
  signIn,
  type Session,
} from "./helpers/http.ts";
import { expectMatchesSchema } from "./helpers/schema.ts";
import { makeWorld, type World } from "./helpers/world.ts";

const HOUR = 60 * 60 * 1000;

function deleteMe(w: World, token: string): Promise<Response> {
  return call(w, "DELETE", "/v1/me", { token });
}

async function suspend(session: Session): Promise<void> {
  await env.ZZ_DB.prepare("UPDATE accounts SET suspended_at = ? WHERE id = ?")
    .bind(new Date().toISOString(), session.accountId)
    .run();
}

async function deniedActions(accountId: string): Promise<string[]> {
  const rows = await env.ZZ_DB.prepare(
    "SELECT action, target_type, target_id FROM audit_events WHERE result = 'denied' AND actor_id = ? ORDER BY rowid",
  )
    .bind(accountId)
    .all<{ action: string; target_type: string; target_id: string }>();
  for (const row of rows.results) {
    expect(row).toMatchObject({ target_type: "account", target_id: accountId });
  }
  return rows.results.map((row) => row.action);
}

describe("suspension (FR-025)", () => {
  it("keeps sign-in, GET /v1/me, and DELETE /v1/me, and refuses writes and the list", async () => {
    const w = await makeWorld();
    const alice = await signIn(w);
    const code = await mint(w, alice.access);
    await suspend(alice);
    const again = await signIn(w);
    expect(again.accountId).toBe(alice.accountId);
    expect(
      (await call(w, "GET", "/v1/me", { token: alice.access })).status,
    ).toBe(200);
    const forbidden = [
      [await mintRequest(w, alice.access), "mintCode"],
      [
        await call(w, "POST", `/v1/codes/${code.id}/reroll`, {
          token: alice.access,
        }),
        "rerollCode",
      ],
      [
        await call(w, "POST", `/v1/codes/${code.id}/revoke`, {
          token: alice.access,
        }),
        "revokeCode",
      ],
      [
        await call(w, "POST", `/v1/records/${code.record_id}/versions`, {
          token: alice.access,
          body: { title: "x", body: "" },
        }),
        "addRecordVersion",
      ],
      [
        await call(w, "GET", "/v1/me/codes", { token: alice.access }),
        "listMyCodes",
      ],
    ] as const;
    for (const [response, operationId] of forbidden) {
      expect(await expectMatchesSchema(response, operationId, 403)).toEqual({
        error: "forbidden",
      });
    }
    // The first refusal per account per limiter window is audited
    // (D-2026-10-05-05). Mint and re-roll share the mint window, and record
    // versions and revoke share theirs, so the second of each is not.
    expect(await deniedActions(alice.accountId)).toEqual([
      "code.mint",
      "code.revoke",
      "code.list",
    ]);
    // The owner record read is not a write, so it still works.
    expect(
      (
        await call(w, "GET", `/v1/records/${code.record_id}`, {
          token: alice.access,
        })
      ).status,
    ).toBe(200);
    expect((await deleteMe(w, alice.access)).status).toBe(204);
  });

  it("rate-limits a suspended account before refusing it, with one audit event per window", async () => {
    const w = await makeWorld();
    const alice = await signIn(w);
    await suspend(alice);
    // Mint and re-roll allow 10 per hour per user.
    for (let i = 0; i < 10; i += 1) {
      expect((await mintRequest(w, alice.access)).status).toBe(403);
    }
    const flood = await mintRequest(w, alice.access);
    expect(await expectMatchesSchema(flood, "mintCode", 429)).toEqual({
      error: "rate-limited",
    });
    expect(await deniedActions(alice.accountId)).toEqual(["code.mint"]);
    // The next window's first refusal is audited again.
    w.clock.advance(HOUR);
    const later = await signIn(w);
    expect((await mintRequest(w, later.access)).status).toBe(403);
    expect((await mintRequest(w, later.access)).status).toBe(403);
    expect(await deniedActions(alice.accountId)).toEqual([
      "code.mint",
      "code.mint",
    ]);
  });

  it("audits the first refusal even after allowed calls earlier in the window", async () => {
    const w = await makeWorld();
    const alice = await signIn(w);
    await mint(w, alice.access);
    await mint(w, alice.access);
    await suspend(alice);
    expect((await mintRequest(w, alice.access)).status).toBe(403);
    expect(await deniedActions(alice.accountId)).toEqual(["code.mint"]);
  });

  it("counts each account's refusals on their own", async () => {
    const w = await makeWorld();
    const alice = await signIn(w, "alice");
    const bob = await signIn(w, "bob");
    await suspend(alice);
    await suspend(bob);
    await mintRequest(w, alice.access);
    await mintRequest(w, bob.access);
    await mintRequest(w, bob.access);
    expect(await deniedActions(alice.accountId)).toEqual(["code.mint"]);
    const bobRows = await count(
      w,
      "SELECT count(*) AS n FROM audit_events WHERE result = 'denied' AND actor_id = ?",
      bob.accountId,
    );
    expect(bobRows).toBe(1);
  });
});
