import { requireActive } from "../auth/caller.ts";
import { auditStatement } from "../audit/writer.ts";
import type { AppContext } from "../http/context.ts";
import { json, notFound } from "../http/respond.ts";
import { changes } from "../lib/db.ts";
import { iso } from "../lib/time.ts";
import { limitUser } from "../limits/enforce.ts";
import { purgeResolve } from "../resolve/cache.ts";
import { effectiveStatus } from "./view.ts";

interface RevokeRow {
  owner_id: string;
  canonical: string;
  status: "active" | "used" | "expired" | "revoked";
  expires_at: string | null;
}

// POST /v1/codes/{id}/revoke: one guarded update with its audit insert
// gated on write_id = ?req (spec 005 Mint, FR-031), so two racing revokes
// write one ok event.
export async function revokeCode(c: AppContext): Promise<Response> {
  const caller = await requireActive(c, "code.revoke");
  await limitUser(c, "owner-write", caller.id);
  const codeId = c.req.param("id") as string;
  const db = c.env.ZZ_DB;
  const now = iso(c.get("now"));
  const writeId = c.get("requestId");
  const results = await db.batch([
    db
      .prepare(
        "UPDATE codes SET status = 'revoked', revoked_reason = 'owner', write_id = ? WHERE id = ? AND owner_id = ? AND status = 'active' AND (expires_at IS NULL OR expires_at > ?)",
      )
      .bind(writeId, codeId, caller.id, now),
    auditStatement(
      db,
      {
        actorId: caller.id,
        action: "code.revoke",
        targetType: "code",
        targetId: codeId,
        result: "ok",
        at: now,
      },
      {
        sql: "SELECT 1 FROM codes WHERE id = ? AND write_id = ?",
        params: [codeId, writeId],
      },
    ),
  ]);
  const row = await db
    .prepare(
      "SELECT owner_id, canonical, status, expires_at FROM codes WHERE id = ?",
    )
    .bind(codeId)
    .first<RevokeRow>();
  if (changes(results) === 1) {
    await purgeResolve((row as RevokeRow).canonical);
    return json(200, { status: "revoked" });
  }
  // The guard refused. Another owner's row, or none, is not-found. The
  // caller's own revoked code answers revoked again with no second ok
  // event; its own used or expired code is not-found.
  if (row?.owner_id !== caller.id || effectiveStatus(row, now) !== "revoked") {
    throw notFound();
  }
  return json(200, { status: "revoked" });
}
