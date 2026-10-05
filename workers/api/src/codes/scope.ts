import type { Caller } from "../auth/caller.ts";
import { auditStatement } from "../audit/writer.ts";
import type { AppContext } from "../http/context.ts";
import { ApiError, forbidden } from "../http/respond.ts";
import type { ScopeName } from "../http/schemas.ts";
import { iso } from "../lib/time.ts";

// A refusal of an authenticated caller writes an audit event with result
// denied (spec 002 Error states). It is one statement, so it stands alone.
export async function auditDenied(
  c: AppContext,
  caller: Caller,
  action: string,
  targetType: string,
  targetId: string,
): Promise<void> {
  await auditStatement(c.env.ZZ_DB, {
    actorId: caller.id,
    action,
    targetType,
    targetId,
    result: "denied",
    at: iso(c.get("now")),
  }).run();
}

const ACTIVE_GRANT =
  "SELECT 1 AS granted FROM grants WHERE subject_id = ? AND role = ? AND (expires_at IS NULL OR expires_at > ?)";

// FR-034: an issuer or viewer grant holds for one scope.
export async function hasScopeGrant(
  c: AppContext,
  accountId: string,
  scope: string,
  role: "issuer" | "viewer",
): Promise<boolean> {
  const row = await c.env.ZZ_DB.prepare(`${ACTIVE_GRANT} AND scope = ?`)
    .bind(accountId, role, iso(c.get("now")), scope)
    .first();
  return row !== null;
}

// The auditor role reads the whole log, so a grant on any scope gives it
// (INFERRED: audit events carry no scope).
export async function isAuditor(
  c: AppContext,
  accountId: string,
): Promise<boolean> {
  const row = await c.env.ZZ_DB.prepare(ACTIVE_GRANT)
    .bind(accountId, "auditor", iso(c.get("now")))
    .first();
  return row !== null;
}

// FR-005 and FR-034: free_public needs ZZ_FREE_PUBLIC; enterprise and
// logistics need an issuer grant for that scope.
export async function checkMintScope(
  c: AppContext,
  caller: Caller,
  scope: ScopeName,
): Promise<void> {
  if (scope === "free_public") {
    if (!c.get("settings").freePublic)
      throw new ApiError(403, "scope-unavailable");
    return;
  }
  if (!(await hasScopeGrant(c, caller.id, scope, "issuer"))) {
    await auditDenied(c, caller, "code.mint", "scope", scope);
    throw forbidden();
  }
}
