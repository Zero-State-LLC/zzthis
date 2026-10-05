import type { Caller } from "../auth/caller.ts";
import { auditDenied } from "../audit/denied.ts";
import type { AppContext } from "../http/context.ts";
import { ApiError } from "../http/respond.ts";
import type { EverydayText } from "../lib/text.ts";

// FR-024: a title or body with a blocklisted term is 422 content-refused,
// stores nothing, and writes an audit event with result denied.
export async function refuseBlocked(
  c: AppContext,
  caller: Caller,
  text: EverydayText,
  action: string,
  target: { readonly type: string; readonly id: string },
): Promise<void> {
  const blocklist = c.get("settings").blocklist;
  if (!blocklist.matches(text.title) && !blocklist.matches(text.body)) return;
  await auditDenied(c, caller.id, action, target);
  throw new ApiError(422, "content-refused");
}
