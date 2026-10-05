import type { AppContext } from "../http/context.ts";
import { iso } from "../lib/time.ts";
import { auditStatement } from "./writer.ts";

// A refusal of an authenticated caller writes an audit event with result
// denied (spec 002 Error states). It changes no other row, so it is one
// statement on its own.
export async function auditDenied(
  c: AppContext,
  actorId: string,
  action: string,
  target: { readonly type: string; readonly id: string },
): Promise<void> {
  await auditStatement(c.env.ZZ_DB, {
    actorId,
    action,
    targetType: target.type,
    targetId: target.id,
    result: "denied",
    at: iso(c.get("now")),
  }).run();
}
