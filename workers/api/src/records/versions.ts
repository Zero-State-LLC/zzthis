import { requireActive, type Caller } from "../auth/caller.ts";
import { auditStatement } from "../audit/writer.ts";
import { readJson } from "../http/body.ts";
import type { AppContext } from "../http/context.ts";
import { failed, json, malformed, notFound } from "../http/respond.ts";
import { EverydayRecord } from "../http/schemas.ts";
import { changes } from "../lib/db.ts";
import { cleanRecord, type EverydayText } from "../lib/text.ts";
import { iso } from "../lib/time.ts";
import { limitUser } from "../limits/enforce.ts";
import { refuseBlocked } from "../moderation/content.ts";
import { purgeResolve } from "../resolve/cache.ts";
import { ownedRecord, type CurrentVersion } from "./read.ts";
import { signVersion } from "./signing.ts";

// Two edits of one record at once: the loser reads the new current version
// and signs the next number, up to this many times.
const MAX_ATTEMPTS = 3;

// One batch: the signed version, the record's pointer, and the audit event.
// The insert is guarded on the version this call read, so a concurrent
// append makes it insert nothing and the call tries again.
async function appendVersion(
  c: AppContext,
  caller: Caller,
  current: CurrentVersion,
  text: EverydayText,
): Promise<{ id: string; version: number } | null> {
  const db = c.env.ZZ_DB;
  const id = crypto.randomUUID();
  const version = current.version + 1;
  const now = iso(c.get("now"));
  const settings = c.get("settings");
  const signature = await signVersion(
    settings,
    current.id,
    version,
    text.title,
    text.body,
    now,
  );
  const results = await db.batch([
    db
      .prepare(
        "INSERT INTO record_versions (id, record_id, version, title, body, signature, signing_key_id, created_by, created_at, erased_at) SELECT ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL WHERE EXISTS (SELECT 1 FROM records r JOIN record_versions v ON v.id = r.current_version_id WHERE r.id = ? AND r.owner_id = ? AND r.deleted_at IS NULL AND v.version = ?)",
      )
      .bind(
        id,
        current.id,
        version,
        text.title,
        text.body,
        signature,
        settings.signingKeyId,
        caller.id,
        now,
        current.id,
        caller.id,
        current.version,
      ),
    db
      .prepare(
        "UPDATE records SET current_version_id = ? WHERE id = ? AND EXISTS (SELECT 1 FROM record_versions WHERE id = ?)",
      )
      .bind(id, current.id, id),
    auditStatement(
      db,
      {
        actorId: caller.id,
        action: "record.version",
        targetType: "record",
        targetId: current.id,
        result: "ok",
        at: now,
      },
      { sql: "SELECT 1 FROM record_versions WHERE id = ?", params: [id] },
    ),
  ]);
  return changes(results) === 1 ? { id, version } : null;
}

// A record update purges the cache key of each live code on the record
// (FR-018, spec 005 T024).
async function purgeRecordCodes(
  c: AppContext,
  recordId: string,
): Promise<void> {
  const rows = await c.env.ZZ_DB.prepare(
    "SELECT canonical FROM codes WHERE record_id = ? AND status = 'active'",
  )
    .bind(recordId)
    .all<{ canonical: string }>();
  await Promise.all(rows.results.map((row) => purgeResolve(row.canonical)));
}

// POST /v1/records/{id}/versions: append a signed version with title and
// body. A failed signature or audit write stores nothing.
export async function addRecordVersion(c: AppContext): Promise<Response> {
  const caller = await requireActive(c);
  await limitUser(c, "owner-write", caller.id);
  const recordId = c.req.param("id") as string;
  const request = await readJson(c, EverydayRecord);
  const text = cleanRecord(request.title, request.body);
  if (text === null) throw malformed();
  let current = await ownedRecord(c, recordId, caller.id);
  if (current === null) throw notFound();
  await refuseBlocked(c, caller, text, "record.version", {
    type: "record",
    id: recordId,
  });
  for (let attempt = 1; ; attempt += 1) {
    const added = await appendVersion(c, caller, current, text);
    if (added !== null) {
      await purgeRecordCodes(c, recordId);
      return json(201, added);
    }
    if (attempt === MAX_ATTEMPTS) throw failed();
    current = await ownedRecord(c, recordId, caller.id);
    if (current === null) throw notFound();
  }
}
