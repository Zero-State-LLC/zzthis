import { env } from "cloudflare:workers";
import { afterEach, describe, expect, it, vi } from "vitest";
import { call, count, mint, mintRequest, signIn } from "./helpers/http.ts";
import { expectMatchesSchema } from "./helpers/schema.ts";
import { makeWorld } from "./helpers/world.ts";

// spec 005 Data model, column for column.
const TABLES: Record<string, string[]> = {
  accounts: ["id", "created_at", "suspended_at", "deleted_at", "org_id"],
  identities: [
    "id",
    "account_id",
    "provider",
    "provider_subject",
    "apple_refresh_token_enc",
    "apple_client_id",
    "created_at",
  ],
  auth_nonces: ["nonce_hash", "expires_at", "used_at"],
  refresh_tokens: [
    "id",
    "account_id",
    "family_id",
    "client",
    "token_hash",
    "expires_at",
    "revoked_at",
    "replaced_by",
    "write_id",
  ],
  codes: [
    "id",
    "scope",
    "canonical",
    "match_key",
    "kind",
    "check_word",
    "list_version",
    "status",
    "revoked_reason",
    "single_use",
    "expires_at",
    "record_id",
    "owner_id",
    "first_resolved_at",
    "rerolls_remaining",
    "replaced_by",
    "write_id",
    "created_at",
  ],
  records: [
    "id",
    "owner_id",
    "visibility",
    "current_version_id",
    "created_at",
    "deleted_at",
  ],
  record_versions: [
    "id",
    "record_id",
    "version",
    "title",
    "body",
    "signature",
    "signing_key_id",
    "created_by",
    "created_at",
    "erased_at",
  ],
  grants: ["id", "subject_id", "scope", "role", "expires_at", "org_id"],
  audit_events: [
    "id",
    "actor_id",
    "action",
    "target_type",
    "target_id",
    "result",
    "created_at",
  ],
  read_photos: [
    "id",
    "account_id",
    "canonical",
    "object_key",
    "created_at",
    "expires_at",
  ],
  pending_revocations: [
    "id",
    "provider",
    "client_id",
    "token_enc",
    "attempts",
    "next_attempt_at",
    "created_at",
  ],
  reports: [
    "id",
    "canonical",
    "code_id",
    "reason",
    "note",
    "created_at",
    "closed_at",
  ],
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe("migration 0001 (T004)", () => {
  for (const [table, columns] of Object.entries(TABLES)) {
    it(`creates ${table} with the spec's columns`, async () => {
      const info = await env.ZZ_DB.prepare(`PRAGMA table_info(${table})`).all<{
        name: string;
      }>();
      expect(info.results.map((row) => row.name)).toEqual(columns);
    });
  }

  it("keeps match_key unique across every row, retired rows included (FR-032)", async () => {
    const w = await makeWorld();
    const alice = await signIn(w);
    const code = await mint(w, alice.access);
    await env.ZZ_DB.prepare(
      "UPDATE codes SET status = 'revoked', revoked_reason = 'owner' WHERE id = ?",
    )
      .bind(code.id)
      .run();
    await expect(
      env.ZZ_DB.prepare(
        "INSERT INTO codes (id, scope, canonical, match_key, kind, status, single_use, record_id, owner_id, rerolls_remaining, created_at) SELECT 'x', scope, canonical, match_key, kind, 'active', 0, record_id, owner_id, 3, created_at FROM codes WHERE id = ?",
      )
        .bind(code.id)
        .run(),
    ).rejects.toThrow(/UNIQUE/);
  });

  it("keeps the audit log append-only: no update, no delete", async () => {
    const w = await makeWorld();
    await signIn(w);
    await expect(
      env.ZZ_DB.prepare("UPDATE audit_events SET result = 'x'").run(),
    ).rejects.toThrow(/append-only/);
    await expect(
      env.ZZ_DB.prepare("DELETE FROM audit_events").run(),
    ).rejects.toThrow(/append-only/);
  });

  it("writes the Apple token and its client id together, or neither", async () => {
    const w = await makeWorld();
    const alice = await signIn(w);
    await expect(
      env.ZZ_DB.prepare(
        "UPDATE identities SET apple_client_id = 'x' WHERE account_id = ?",
      )
        .bind(alice.accountId)
        .run(),
    ).rejects.toThrow(/CHECK/);
  });
});

describe("the one audit writer (T004 done-when)", () => {
  it("stores nothing when the audit insert fails", async () => {
    const w = await makeWorld();
    const alice = await signIn(w);
    const before = {
      records: await count(w, "SELECT count(*) AS n FROM records"),
      versions: await count(w, "SELECT count(*) AS n FROM record_versions"),
      codes: await count(w, "SELECT count(*) AS n FROM codes"),
      audit: await count(w, "SELECT count(*) AS n FROM audit_events"),
    };
    await env.ZZ_DB.prepare(
      "CREATE TRIGGER audit_down BEFORE INSERT ON audit_events BEGIN SELECT RAISE (ABORT, 'audit down'); END",
    ).run();
    vi.spyOn(console, "error").mockImplementation(() => {});
    const response = await mintRequest(w, alice.access);
    expect(await expectMatchesSchema(response, "mintCode", 500)).toEqual({
      error: "failed",
    });
    await env.ZZ_DB.prepare("DROP TRIGGER audit_down").run();
    expect({
      records: await count(w, "SELECT count(*) AS n FROM records"),
      versions: await count(w, "SELECT count(*) AS n FROM record_versions"),
      codes: await count(w, "SELECT count(*) AS n FROM codes"),
      audit: await count(w, "SELECT count(*) AS n FROM audit_events"),
    }).toEqual(before);
    // The same call succeeds once the audit log takes writes again.
    expect((await mintRequest(w, alice.access)).status).toBe(201);
  });

  it("stores nothing when a sign-in's audit insert fails", async () => {
    const w = await makeWorld();
    await env.ZZ_DB.prepare(
      "CREATE TRIGGER audit_down BEFORE INSERT ON audit_events BEGIN SELECT RAISE (ABORT, 'audit down'); END",
    ).run();
    vi.spyOn(console, "error").mockImplementation(() => {});
    const nonceResponse = await call(w, "POST", "/v1/auth/nonce");
    const { nonce } = await nonceResponse.json<{ nonce: string }>();
    const response = await call(w, "POST", "/v1/auth/token", {
      body: { provider: "dev", client: "ios", id_token: "dev:alice", nonce },
    });
    expect(await expectMatchesSchema(response, "exchangeToken", 500)).toEqual({
      error: "failed",
    });
    expect(await count(w, "SELECT count(*) AS n FROM accounts")).toBe(0);
    expect(await count(w, "SELECT count(*) AS n FROM identities")).toBe(0);
    expect(await count(w, "SELECT count(*) AS n FROM refresh_tokens")).toBe(0);
  });
});
