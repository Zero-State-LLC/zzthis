import { requireCaller } from "../auth/caller.ts";
import type { AppContext } from "../http/context.ts";
import { json, notFound } from "../http/respond.ts";
import { limitUser } from "../limits/enforce.ts";

export interface CurrentVersion {
  id: string;
  version: number;
  title: string;
  body: string;
  updated_at: string;
}

// The owner's live record with its current version, or null for a missing
// record, a deleted one, or another account's.
export async function ownedRecord(
  c: AppContext,
  recordId: string,
  ownerId: string,
): Promise<CurrentVersion | null> {
  return c.env.ZZ_DB.prepare(
    "SELECT r.id, v.version, v.title, v.body, v.created_at AS updated_at FROM records r JOIN record_versions v ON v.id = r.current_version_id WHERE r.id = ? AND r.owner_id = ? AND r.deleted_at IS NULL",
  )
    .bind(recordId, ownerId)
    .first<CurrentVersion>();
}

// GET /v1/records/{id} (FR-030): the owner's current title and body. Anyone
// else, and a missing id, get the one not-found body.
export async function getRecord(c: AppContext): Promise<Response> {
  const caller = await requireCaller(c);
  await limitUser(c, "owner-read", caller.id);
  const record = await ownedRecord(c, c.req.param("id") as string, caller.id);
  if (record === null) throw notFound();
  return json(200, record);
}
