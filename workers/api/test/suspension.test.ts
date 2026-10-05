import { env } from "cloudflare:workers";
import { describe, expect, it } from "vitest";
import { call, mint, mintRequest, signIn } from "./helpers/http.ts";
import { expectMatchesSchema } from "./helpers/schema.ts";
import { makeWorld, type World } from "./helpers/world.ts";

function deleteMe(w: World, token: string): Promise<Response> {
  return call(w, "DELETE", "/v1/me", { token });
}

describe("suspension (FR-025)", () => {
  it("keeps sign-in, GET /v1/me, and DELETE /v1/me, and refuses writes and the list", async () => {
    const w = await makeWorld();
    const alice = await signIn(w);
    const code = await mint(w, alice.access);
    await env.ZZ_DB.prepare("UPDATE accounts SET suspended_at = ? WHERE id = ?")
      .bind(new Date().toISOString(), alice.accountId)
      .run();
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
    // Each refusal writes a denied event naming the attempted action, with
    // the account as its target (FR-025, D-2026-10-05-04).
    const denied = await env.ZZ_DB.prepare(
      "SELECT actor_id, action, target_type, target_id FROM audit_events WHERE result = 'denied' ORDER BY rowid",
    ).all<Record<string, string>>();
    expect(denied.results).toEqual(
      [
        "code.mint",
        "code.reroll",
        "code.revoke",
        "record.version",
        "code.list",
      ].map((action) => ({
        actor_id: alice.accountId,
        action,
        target_type: "account",
        target_id: alice.accountId,
      })),
    );
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
});
