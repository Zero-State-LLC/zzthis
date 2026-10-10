import { env } from "cloudflare:workers";
import { afterEach, describe, expect, it, vi } from "vitest";
import { count, mintRequest, signIn } from "./helpers/http.ts";
import { expectMatchesSchema } from "./helpers/schema.ts";
import { makeWorld, type World } from "./helpers/world.ts";

afterEach(() => {
  vi.restoreAllMocks();
});

async function expectError(
  response: Response,
  status: number,
  body: Record<string, string>,
) {
  expect(await expectMatchesSchema(response, "mintCode", status)).toEqual(body);
}

async function stored(w: World): Promise<Record<string, number>> {
  return {
    records: await count(w, "SELECT count(*) AS n FROM records"),
    versions: await count(w, "SELECT count(*) AS n FROM record_versions"),
    codes: await count(w, "SELECT count(*) AS n FROM codes"),
  };
}

// RM-033: the account changes after requireActive passed but before the
// mint batch runs. The first batch on the wrapped database runs the change
// first, as a concurrent DELETE /v1/me or suspend.sql would.
function raceFirstBatch(w: World, sql: string, ...params: unknown[]): void {
  const real = w.env.ZZ_DB;
  let fired = false;
  const wrapped = new Proxy(real, {
    get(target, property) {
      if (property === "batch") {
        return async (statements: D1PreparedStatement[]) => {
          if (!fired) {
            fired = true;
            await target
              .prepare(sql)
              .bind(...params)
              .run();
          }
          return target.batch(statements);
        };
      }
      const value = Reflect.get(target, property) as unknown;
      return typeof value === "function" ? value.bind(target) : value;
    },
  });
  (w.env as { ZZ_DB: D1Database }).ZZ_DB = wrapped;
}

describe("mint racing account deletion or suspension (RM-033)", () => {
  it("stores nothing and answers 401 when the account was deleted mid-mint", async () => {
    const w = await makeWorld();
    const alice = await signIn(w);
    raceFirstBatch(
      w,
      "UPDATE accounts SET deleted_at = ? WHERE id = ?",
      new Date(w.clock.ms).toISOString(),
      alice.accountId,
    );
    await expectError(await mintRequest(w, alice.access), 401, {
      error: "unauthorized",
    });
    expect(await stored(w)).toEqual({ records: 0, versions: 0, codes: 0 });
  });

  it("stores nothing, answers 403, and audits once when the account was suspended mid-mint", async () => {
    const w = await makeWorld();
    const alice = await signIn(w);
    raceFirstBatch(
      w,
      "UPDATE accounts SET suspended_at = ? WHERE id = ?",
      new Date(w.clock.ms).toISOString(),
      alice.accountId,
    );
    await expectError(await mintRequest(w, alice.access), 403, {
      error: "forbidden",
    });
    expect(await stored(w)).toEqual({ records: 0, versions: 0, codes: 0 });
    expect(
      await count(
        w,
        "SELECT count(*) AS n FROM audit_events WHERE action = 'code.mint' AND result = 'denied' AND target_type = 'account' AND target_id = ?",
        alice.accountId,
      ),
    ).toBe(1);
    // A second lost race in the same limiter window writes no second row.
    await env.ZZ_DB.prepare(
      "UPDATE accounts SET suspended_at = NULL WHERE id = ?",
    )
      .bind(alice.accountId)
      .run();
    raceFirstBatch(
      w,
      "UPDATE accounts SET suspended_at = ? WHERE id = ?",
      new Date(w.clock.ms).toISOString(),
      alice.accountId,
    );
    await expectError(await mintRequest(w, alice.access), 403, {
      error: "forbidden",
    });
    expect(
      await count(
        w,
        "SELECT count(*) AS n FROM audit_events WHERE action = 'code.mint' AND result = 'denied' AND target_type = 'account' AND target_id = ?",
        alice.accountId,
      ),
    ).toBe(1);
  });

  it("guards a handle mint the same way", async () => {
    const w = await makeWorld();
    const alice = await signIn(w);
    raceFirstBatch(
      w,
      "UPDATE accounts SET deleted_at = ? WHERE id = ?",
      new Date(w.clock.ms).toISOString(),
      alice.accountId,
    );
    await expectError(
      await mintRequest(w, alice.access, { kind: "handle", handle: "@racer" }),
      401,
      { error: "unauthorized" },
    );
    expect(await stored(w)).toEqual({ records: 0, versions: 0, codes: 0 });
  });
});
