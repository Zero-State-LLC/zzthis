import {
  parseCode,
  resolveMatchKey,
  verifyCheckWord,
  type ParseSuccess,
} from "@zzthis/zz-core";
import { optionalCaller, type Caller } from "../auth/caller.ts";
import { auditStatement, type AuditEvent } from "../audit/writer.ts";
import { hasScopeGrant } from "../codes/scope.ts";
import type { components } from "../generated/api.ts";
import type { AppContext } from "../http/context.ts";
import { ApiError, json, malformed, notFound } from "../http/respond.ts";
import { hmacTag } from "../lib/crypto.ts";
import { changes } from "../lib/db.ts";
import { iso } from "../lib/time.ts";
import { limitCaller } from "../limits/enforce.ts";
import { cachedResolve, PUBLIC_CACHE_CONTROL, storeResolve } from "./cache.ts";

type View = components["schemas"]["Resolve"]["view"];

interface ResolveRow {
  id: string;
  scope: string;
  canonical: string;
  status: string;
  single_use: number;
  expires_at: string | null;
  owner_id: string;
  first_resolved_at: string | null;
  visibility: "public" | "private";
  record_deleted_at: string | null;
  title: string;
  body: string;
  updated_at: string;
}

// Steps 3 and 4: the grammar, then the check word for a plain code whose
// parts are all on the list. unknown-word means a part is not on the list,
// so no check word applies (a field code).
function parsed(c: AppContext): ParseSuccess {
  const result = parseCode(c.req.param("code") as string);
  if (!result.ok) throw malformed(result.reason);
  if (result.kind === "bare") {
    throw new ApiError(422, "unsupported", "bare-mark-needs-context");
  }
  if (result.kind === "plain") {
    const check = verifyCheckWord(result.words, c.get("settings").wordlist);
    if (check.result === "check-mismatch" || check.result === "wrong-length") {
      throw malformed(check.result);
    }
  }
  return result;
}

async function lookup(
  c: AppContext,
  matchKey: string,
): Promise<ResolveRow | null> {
  const row = await c.env.ZZ_DB.prepare(
    "SELECT c.id, c.scope, c.canonical, c.status, c.single_use, c.expires_at, c.owner_id, c.first_resolved_at, r.visibility, r.deleted_at AS record_deleted_at, v.title, v.body, v.created_at AS updated_at FROM codes c JOIN records r ON r.id = c.record_id JOIN record_versions v ON v.id = r.current_version_id WHERE c.match_key = ?",
  )
    .bind(matchKey)
    .first<ResolveRow>();
  const now = iso(c.get("now"));
  const live =
    row !== null &&
    row.status === "active" &&
    (row.expires_at === null || row.expires_at > now) &&
    row.record_deleted_at === null;
  return live ? row : null;
}

// Step 7 (FR-035): a private record resolves only for its owner or for an
// account with a viewer grant on the code's scope.
async function viewFor(
  c: AppContext,
  caller: Caller | null,
  row: ResolveRow,
): Promise<View | null> {
  if (row.visibility === "public") return "public";
  if (caller === null) return null;
  if (caller.id === row.owner_id) return "owner";
  return (await hasScopeGrant(c, caller.id, row.scope, "viewer"))
    ? "viewer"
    : null;
}

function resolveEvent(
  c: AppContext,
  caller: Caller | null,
  targetId: string,
  result: "ok" | "not-found",
): AuditEvent {
  return {
    actorId: caller?.id ?? null,
    action: "code.resolve",
    targetType: "code",
    targetId,
    result,
    at: iso(c.get("now")),
  };
}

// Every resolve that reaches step 6 writes an audit event. A not-found
// event's target is the HMAC of the match_key, never the code.
async function notFoundResolve(
  c: AppContext,
  caller: Caller | null,
  matchKey: string,
): Promise<never> {
  const target = await hmacTag(
    c.get("settings").dataKeys,
    "match-key",
    matchKey,
  );
  await auditStatement(
    c.env.ZZ_DB,
    resolveEvent(c, caller, target, "not-found"),
  ).run();
  throw notFound();
}

// Steps 8 and 9. A single-use code is marked used by one guarded update in
// the same batch as its ok event; the loser of two racing resolves gets
// not-found. A reusable code gets its first-resolve mark once.
async function markResolved(
  c: AppContext,
  caller: Caller | null,
  row: ResolveRow,
): Promise<boolean> {
  const db = c.env.ZZ_DB;
  const now = iso(c.get("now"));
  const event = resolveEvent(c, caller, row.id, "ok");
  if (row.single_use === 1) {
    const writeId = c.get("requestId");
    const results = await db.batch([
      db
        .prepare(
          "UPDATE codes SET status = 'used', write_id = ?, first_resolved_at = COALESCE(first_resolved_at, ?) WHERE id = ? AND status = 'active' AND (expires_at IS NULL OR expires_at > ?)",
        )
        .bind(writeId, now, row.id, now),
      auditStatement(db, event, {
        sql: "SELECT 1 FROM codes WHERE id = ? AND write_id = ?",
        params: [row.id, writeId],
      }),
    ]);
    return changes(results) === 1;
  }
  const statements = [auditStatement(db, event)];
  if (row.first_resolved_at === null) {
    statements.unshift(
      db
        .prepare(
          "UPDATE codes SET first_resolved_at = ? WHERE id = ? AND first_resolved_at IS NULL",
        )
        .bind(now, row.id),
    );
  }
  await db.batch(statements);
  return true;
}

// GET /v1/resolve/{code}: the ten steps in spec 005 Resolve.
export async function resolveCode(c: AppContext): Promise<Response> {
  const caller = await optionalCaller(c);
  await limitCaller(c, "resolve", caller?.id ?? null);
  const code = parsed(c);
  // Step 5: only a request with no Authorization header uses the cache.
  const signedOut = c.req.header("Authorization") === undefined;
  if (signedOut) {
    const hit = await cachedResolve(code.canonical);
    c.set("cache", hit === null ? "miss" : "hit");
    c.set("cacheable", hit !== null);
    if (hit !== null) return hit;
  }
  const matchKey = resolveMatchKey(code);
  const row = await lookup(c, matchKey);
  const view = row === null ? null : await viewFor(c, caller, row);
  if (row === null || view === null || !(await markResolved(c, caller, row))) {
    return notFoundResolve(c, caller, matchKey);
  }
  // Step 10. Cacheable (FR-019 a): active, reusable, no expiry, public, and
  // no Authorization. Only the stored spelling is put in the cache, so a
  // purge by the stored canonical form always reaches it.
  const cacheable =
    signedOut &&
    row.single_use === 0 &&
    row.expires_at === null &&
    view === "public";
  const response = json(
    200,
    {
      view,
      canonical: row.canonical,
      record: { title: row.title, body: row.body, updated_at: row.updated_at },
      share: { text: row.canonical, url: null },
    },
    {
      "Cache-Control": cacheable ? PUBLIC_CACHE_CONTROL : "no-store",
      "X-ZZ-Contract": "1",
    },
  );
  c.set("cacheable", cacheable);
  if (cacheable && code.canonical === row.canonical) {
    await storeResolve(code.canonical, response);
  }
  return response;
}
