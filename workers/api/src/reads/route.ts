import { parseCode } from "@zzthis/zz-core";
import { optionalCaller } from "../auth/caller.ts";
import { auditStatement } from "../audit/writer.ts";
import type { AppContext } from "../http/context.ts";
import { ApiError, json, malformed, notReady } from "../http/respond.ts";
import { DAY, iso } from "../lib/time.ts";
import { limitCaller } from "../limits/enforce.ts";

// FR-013: jpeg only, at most 8 MiB, checked by its signature.
export const MAX_PHOTO_BYTES = 8388608;
// Room for the multipart boundaries and the canonical field.
const MAX_BODY_BYTES = MAX_PHOTO_BYTES + 64 * 1024;
const PHOTO_RETENTION = 30 * DAY;

const tooLarge = () => new ApiError(413, "payload-too-large");

function isJpeg(bytes: Uint8Array): boolean {
  return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
}

interface Upload {
  readonly photo: Uint8Array;
  readonly canonical: string | null;
}

// The body is refused before anything is written to R2.
async function upload(c: AppContext): Promise<Upload> {
  if (Number(c.req.header("Content-Length") ?? "0") > MAX_BODY_BYTES) {
    throw tooLarge();
  }
  const form = await c.req.raw.formData().catch(() => null);
  if (form === null) throw malformed();
  const photo = form.get("photo");
  if (!(photo instanceof File) || photo.type !== "image/jpeg")
    throw malformed();
  if (photo.size > MAX_PHOTO_BYTES) throw tooLarge();
  const bytes = new Uint8Array(await photo.arrayBuffer());
  if (!isJpeg(bytes)) throw malformed();
  const text = form.get("canonical");
  if (typeof text !== "string" || text === "")
    return { photo: bytes, canonical: null };
  const code = parseCode(text);
  if (!code.ok) throw malformed(code.reason);
  return { photo: bytes, canonical: code.canonical };
}

// POST /v1/reads (US5). 503 not-ready while photo_reads is false, storing
// nothing. With a reader, the photo is kept 30 days for review of this read
// only, never for a training set (FR-026).
export async function submitRead(c: AppContext): Promise<Response> {
  const caller = await optionalCaller(c);
  await limitCaller(c, "reads", caller?.id ?? null);
  const reader = c.get("deps").photoReader;
  if (!c.get("settings").photoReads || reader === null) throw notReady();
  const { photo, canonical } = await upload(c);
  const outcome = await reader.read(photo, canonical);
  const id = crypto.randomUUID();
  const objectKey = `reads/${id}.jpg`;
  const now = c.get("now");
  await c.env.ZZ_PHOTOS.put(objectKey, photo, {
    httpMetadata: { contentType: "image/jpeg" },
  });
  const db = c.env.ZZ_DB;
  try {
    await db.batch([
      db
        .prepare(
          "INSERT INTO read_photos (id, account_id, canonical, object_key, created_at, expires_at) VALUES (?, ?, ?, ?, ?, ?)",
        )
        .bind(
          id,
          caller?.id ?? null,
          canonical,
          objectKey,
          iso(now),
          iso(now + PHOTO_RETENTION),
        ),
      auditStatement(db, {
        actorId: caller?.id ?? null,
        action: "read.create",
        targetType: "read",
        targetId: id,
        result: "ok",
        at: iso(now),
      }),
    ]);
  } catch (error) {
    // Nothing is stored when the row or its audit event fails.
    await c.env.ZZ_PHOTOS.delete(objectKey);
    throw error;
  }
  return json(200, {
    canonical: outcome.canonical,
    band: outcome.band,
    reason: outcome.reason,
  });
}
