import type { Caller } from "../auth/caller.ts";
import { auditDenied } from "../audit/denied.ts";
import type { AppContext } from "../http/context.ts";
import { ApiError, forbidden } from "../http/respond.ts";
import type { ScopeName } from "../http/schemas.ts";
import { iso } from "../lib/time.ts";

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

// D-2026-10-05-04 (Danny, #78): the auditor role is least-privilege. An
// account reads the events of the scopes it holds an auditor grant for,
// and no grant reads the whole log.
export async function auditorScopes(
  c: AppContext,
  accountId: string,
): Promise<string[]> {
  const rows = await c.env.ZZ_DB.prepare(
    "SELECT DISTINCT scope FROM grants WHERE subject_id = ? AND role = 'auditor' AND (expires_at IS NULL OR expires_at > ?) ORDER BY scope",
  )
    .bind(accountId, iso(c.get("now")))
    .all<{ scope: string }>();
  return rows.results.map((row) => row.scope);
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
    await auditDenied(c, caller.id, "code.mint", { type: "scope", id: scope });
    throw forbidden();
  }
}
