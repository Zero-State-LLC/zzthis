import { auditDenied } from "../audit/denied.ts";
import type { AppContext } from "../http/context.ts";
import { firstRefusal, limitUser } from "../limits/enforce.ts";
import type { UserRule } from "../limits/rules.ts";
import { forbidden, unauthorized } from "../http/respond.ts";
import { verifyAccessToken } from "./tokens.ts";

export interface Caller {
  readonly id: string;
  readonly createdAt: string;
  readonly suspended: boolean;
}

const BEARER = /^Bearer ([A-Za-z0-9_.-]+)$/i;

interface AccountRow {
  id: string;
  created_at: string;
  suspended_at: string | null;
  deleted_at: string | null;
}

// FR-021: after the signature and expiry checks, the account must exist and
// not be deleted. Anything else is no usable bearer.
async function usableCaller(c: AppContext): Promise<Caller | null> {
  const match = BEARER.exec(c.req.header("Authorization") ?? "");
  if (match === null) return null;
  const settings = c.get("settings");
  const accountId = await verifyAccessToken(
    settings.tokenSecret,
    match[1] as string,
    c.get("now"),
  );
  if (accountId === null) return null;
  const row = await c.env.ZZ_DB.prepare(
    "SELECT id, created_at, suspended_at, deleted_at FROM accounts WHERE id = ?",
  )
    .bind(accountId)
    .first<AccountRow>();
  if (row === null || row.deleted_at !== null) return null;
  return {
    id: row.id,
    createdAt: row.created_at,
    suspended: row.suspended_at !== null,
  };
}

// Resolve, reads, and reports: an unusable bearer counts as no bearer and
// never gets 401.
export function optionalCaller(c: AppContext): Promise<Caller | null> {
  return usableCaller(c);
}

// Owner routes: no usable bearer is 401 unauthorized.
export async function requireCaller(c: AppContext): Promise<Caller> {
  const caller = await usableCaller(c);
  if (caller === null) throw unauthorized();
  return caller;
}

// FR-025: a suspended account keeps sign-in, GET /v1/me, and DELETE /v1/me.
// Every write and GET /v1/me/codes are 403 forbidden. This runs after the
// deleted-account check.
//
// D-2026-10-05-05: the route's rate limit runs before the suspension check,
// so a suspended account's flood gets 429 like any other. The first refusal
// per account per limiter window writes a denied audit event naming the
// attempted action, with the account as its target (D-2026-10-05-04); the
// window's later refusals write none.
export async function requireActive(
  c: AppContext,
  action: string,
  rule: UserRule,
): Promise<Caller> {
  const caller = await requireCaller(c);
  await limitUser(c, rule, caller.id);
  if (caller.suspended) {
    if (await firstRefusal(c, rule, caller.id)) {
      await auditDenied(c, caller.id, action, {
        type: "account",
        id: caller.id,
      });
    }
    throw forbidden();
  }
  return caller;
}
