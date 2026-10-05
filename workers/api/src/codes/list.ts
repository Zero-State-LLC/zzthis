import { requireActive } from "../auth/caller.ts";
import type { components } from "../generated/api.ts";
import type { AppContext } from "../http/context.ts";
import { json, malformed } from "../http/respond.ts";
import { fromBase64url, toBase64url, utf8 } from "../lib/encoding.ts";
import { iso, parseTimestamp } from "../lib/time.ts";
import { codeBody, type CodeRow } from "./view.ts";

type OwnedCode = components["schemas"]["OwnedCode"];

const MAX_PAGE = 50;

interface Cursor {
  readonly createdAt: string;
  readonly id: string;
}

// Opaque to clients: base64url of the last row's created_at and id.
function encodeCursor(row: CodeRow): string {
  return toBase64url(utf8(JSON.stringify([row.created_at, row.id])));
}

function decodeCursor(text: string): Cursor {
  try {
    const bytes = fromBase64url(text) as Uint8Array;
    const [createdAt, id] = JSON.parse(
      new TextDecoder().decode(bytes),
    ) as unknown[];
    if (
      typeof createdAt === "string" &&
      parseTimestamp(createdAt) !== null &&
      typeof id === "string"
    ) {
      return { createdAt, id };
    }
  } catch {
    // Falls through to malformed.
  }
  throw malformed();
}

function pageLimit(text: string | undefined): number {
  if (text === undefined) return MAX_PAGE;
  const limit = Number(text);
  if (!/^\d+$/.test(text) || limit < 1 || limit > MAX_PAGE) throw malformed();
  return limit;
}

// GET /v1/me/codes (FR-030): the caller's codes, newest first, each with its
// record's current title. Codes retired by a re-roll are not listed.
export async function listMyCodes(c: AppContext): Promise<Response> {
  const caller = await requireActive(c, "code.list", "owner-read");
  const limit = pageLimit(c.req.query("limit"));
  const cursorText = c.req.query("cursor");
  const cursor = cursorText === undefined ? null : decodeCursor(cursorText);
  const after =
    cursor === null
      ? ""
      : "AND (c.created_at < ? OR (c.created_at = ? AND c.id < ?))";
  const rows = await c.env.ZZ_DB.prepare(
    `SELECT c.id, c.canonical, c.check_word, c.status, c.expires_at, c.record_id, c.scope, c.rerolls_remaining, c.created_at, v.title FROM codes c JOIN records r ON r.id = c.record_id JOIN record_versions v ON v.id = r.current_version_id WHERE c.owner_id = ? AND (c.revoked_reason IS NULL OR c.revoked_reason <> 'reroll') ${after} ORDER BY c.created_at DESC, c.id DESC LIMIT ?`,
  )
    .bind(
      caller.id,
      ...(cursor === null
        ? []
        : [cursor.createdAt, cursor.createdAt, cursor.id]),
      limit + 1,
    )
    .all<CodeRow & { title: string }>();
  const page = rows.results.slice(0, limit);
  const now = iso(c.get("now"));
  const codes: OwnedCode[] = page.map((row) => ({
    ...codeBody(row, now),
    title: row.title,
  }));
  const last = page.at(-1);
  const more = rows.results.length > limit && last !== undefined;
  return json(200, { codes, next_cursor: more ? encodeCursor(last) : null });
}
