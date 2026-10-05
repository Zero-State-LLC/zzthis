import { parseCode, resolveMatchKey } from "@zzthis/zz-core";
import { optionalCaller } from "../auth/caller.ts";
import { auditStatement } from "../audit/writer.ts";
import { readJson } from "../http/body.ts";
import type { AppContext } from "../http/context.ts";
import { json, malformed } from "../http/respond.ts";
import { ReportRequest } from "../http/schemas.ts";
import { codePoints, NOTE_MAX, withoutControls } from "../lib/text.ts";
import { iso } from "../lib/time.ts";
import { limitIp } from "../limits/enforce.ts";

// POST /v1/reports (FR-017): 202 whenever the body parses, including for an
// unknown code, so the call never says whether a code exists. The report
// keeps the code id, when there is one, for the operator.
export async function createReport(c: AppContext): Promise<Response> {
  const caller = await optionalCaller(c);
  await limitIp(c, "reports");
  const request = await readJson(c, ReportRequest);
  const code = parseCode(request.canonical);
  if (!code.ok) throw malformed(code.reason);
  const note = withoutControls(request.note);
  if (codePoints(note) > NOTE_MAX) throw malformed();
  const db = c.env.ZZ_DB;
  const found = await db
    .prepare("SELECT id FROM codes WHERE match_key = ?")
    .bind(resolveMatchKey(code))
    .first<{ id: string }>();
  const id = crypto.randomUUID();
  const now = iso(c.get("now"));
  await db.batch([
    db
      .prepare(
        "INSERT INTO reports (id, canonical, code_id, reason, note, created_at, closed_at) VALUES (?, ?, ?, ?, ?, ?, NULL)",
      )
      .bind(id, code.canonical, found?.id ?? null, request.reason, note, now),
    auditStatement(db, {
      actorId: caller?.id ?? null,
      action: "report.create",
      targetType: "report",
      targetId: id,
      result: "ok",
      at: now,
    }),
  ]);
  return json(202, { id });
}
