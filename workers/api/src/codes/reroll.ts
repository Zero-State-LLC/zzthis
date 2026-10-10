import { requireActive } from "../auth/caller.ts";
import { auditStatement } from "../audit/writer.ts";
import type { AppContext } from "../http/context.ts";
import { ApiError, json, notFound, notReady } from "../http/respond.ts";
import { changes } from "../lib/db.ts";
import { iso } from "../lib/time.ts";
import { purgeResolve } from "../resolve/cache.ts";
import { withDrawnCode } from "./draw.ts";
import { checkMintScope } from "./scope.ts";
import { CODE_COLUMNS, codeBody, type CodeRow } from "./view.ts";

// The three statements in spec 005 Mint (re-roll), where ?new is a fresh
// id per request. Statement 1 is the guard; statements 2 and 3 select their
// rows through replaced_by = ?new, so a refused guard writes nothing.
function rerollBatch(
  c: AppContext,
  callerId: string,
  oldId: string,
  newId: string,
  code: {
    canonical: string;
    matchKey: string;
    checkWord: string;
    listVersion: string;
  },
): D1PreparedStatement[] {
  const db = c.env.ZZ_DB;
  const now = iso(c.get("now"));
  return [
    db
      .prepare(
        "UPDATE codes SET status = 'revoked', revoked_reason = 'reroll', replaced_by = ? WHERE id = ? AND owner_id = ? AND status = 'active' AND rerolls_remaining > 0 AND first_resolved_at IS NULL AND (expires_at IS NULL OR expires_at > ?)",
      )
      .bind(newId, oldId, callerId, now),
    db
      .prepare(
        "INSERT INTO codes (id, scope, canonical, match_key, kind, check_word, list_version, status, revoked_reason, single_use, expires_at, record_id, owner_id, first_resolved_at, rerolls_remaining, replaced_by, write_id, created_at) SELECT ?, o.scope, ?, ?, o.kind, ?, ?, 'active', NULL, o.single_use, o.expires_at, o.record_id, o.owner_id, NULL, o.rerolls_remaining - 1, NULL, NULL, ? FROM codes o WHERE o.id = ? AND o.replaced_by = ?",
      )
      .bind(
        newId,
        code.canonical,
        code.matchKey,
        code.checkWord,
        code.listVersion,
        now,
        oldId,
        newId,
      ),
    auditStatement(
      db,
      {
        actorId: callerId,
        action: "code.reroll",
        targetType: "code",
        targetId: oldId,
        result: "ok",
        at: now,
      },
      {
        sql: "SELECT 1 FROM codes WHERE id = ? AND replaced_by = ?",
        params: [oldId, newId],
      },
    ),
  ];
}

// POST /v1/codes/{id}/reroll. There is no 409.
export async function rerollCode(c: AppContext): Promise<Response> {
  const caller = await requireActive(c, "code.reroll", "mint");
  const oldId = c.req.param("id") as string;
  // RM-032: a re-roll issues a code in the old code's scope, so the caller
  // must still be allowed to mint there. Another owner's code, or no code,
  // stays the one not-found body.
  const owned = await c.env.ZZ_DB.prepare(
    "SELECT scope, kind FROM codes WHERE id = ? AND owner_id = ?",
  )
    .bind(oldId, caller.id)
    .first<{ scope: CodeRow["scope"]; kind: "plain" | "handle" }>();
  if (owned === null) throw notFound();
  // RM-039: a handle never re-rolls (FR-006), whether or not the plain-code
  // issuer is on.
  if (owned.kind === "handle") throw new ApiError(403, "reroll-cap");
  if (!c.get("settings").mintEnabled) throw notReady();
  await checkMintScope(c, caller, owned.scope, "code.reroll");
  const newId = await withDrawnCode(c, async (code) => {
    const id = crypto.randomUUID();
    const results = await c.env.ZZ_DB.batch(
      rerollBatch(c, caller.id, oldId, id, code),
    );
    return changes(results) === 1 ? id : null;
  });
  // The guard refused the caller's own code: no re-rolls left (a handle
  // always), already resolved, or no longer active, such as the loser of
  // two racing re-rolls.
  if (newId === null) throw new ApiError(403, "reroll-cap");
  const rows = await c.env.ZZ_DB.prepare(
    `SELECT ${CODE_COLUMNS} FROM codes WHERE id IN (?, ?)`,
  )
    .bind(oldId, newId)
    .all<CodeRow>();
  const replacement = rows.results.find((row) => row.id === newId) as CodeRow;
  const retired = rows.results.find((row) => row.id === oldId) as CodeRow;
  // A code that was never resolved was never cached, so this is cheap
  // insurance, not a correctness step.
  await purgeResolve(retired.canonical);
  return json(200, codeBody(replacement, iso(c.get("now"))));
}
