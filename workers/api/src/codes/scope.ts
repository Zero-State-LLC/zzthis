import type { Caller } from "../auth/caller.ts";
import { auditDenied } from "../audit/denied.ts";
import type { AppContext } from "../http/context.ts";
import { ApiError, forbidden } from "../http/respond.ts";
import type { ScopeName } from "../http/schemas.ts";
import { iso } from "../lib/time.ts";

const ACTIVE_GRANT =
  "SELECT 1 AS granted FROM grants WHERE subject_id = ? AND role = ? AND (expires_at IS NULL OR expires_at > ?)";

// FR-034: an issuer grant holds for one scope.
export async function hasScopeGrant(
  c: AppContext,
  accountId: string,
  scope: string,
  role: "issuer",
): Promise<boolean> {
  const row = await c.env.ZZ_DB.prepare(`${ACTIVE_GRANT} AND scope = ?`)
    .bind(accountId, role, iso(c.get("now")), scope)
    .first();
  return row !== null;
}

// FR-035 (D-2026-10-10-22, #135): a viewer grant on the code's scope opens
// another account's private record only when the grant's org_id is set
// and equals the owner's. The join on org_id never matches a null, so a
// grant with no organization, or an owner with none, opens nothing.
export async function viewerReaches(
  c: AppContext,
  viewerId: string,
  scope: string,
  ownerId: string,
): Promise<boolean> {
  const row = await c.env.ZZ_DB.prepare(
    "SELECT 1 AS granted FROM grants g JOIN accounts o ON o.org_id = g.org_id WHERE g.subject_id = ? AND g.role = 'viewer' AND g.scope = ? AND (g.expires_at IS NULL OR g.expires_at > ?) AND o.id = ?",
  )
    .bind(viewerId, scope, iso(c.get("now")), ownerId)
    .first();
  return row !== null;
}

// D-2026-10-05-04 (Danny, #78): the auditor role is least-privilege. An
// account reads only what its auditor grants reach (FR-016), and no grant
// reads the whole log.
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
// Re-roll issues a new code too, so it runs the same check on the old
// code's scope (RM-032), audited under its own action.
export async function checkMintScope(
  c: AppContext,
  caller: Caller,
  scope: ScopeName,
  action: "code.mint" | "code.reroll" = "code.mint",
): Promise<void> {
  if (scope === "free_public") {
    if (!c.get("settings").freePublic)
      throw new ApiError(403, "scope-unavailable");
    return;
  }
  if (!(await hasScopeGrant(c, caller.id, scope, "issuer"))) {
    await auditDenied(c, caller.id, action, { type: "scope", id: scope });
    throw forbidden();
  }
}
