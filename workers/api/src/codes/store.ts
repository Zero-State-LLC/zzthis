import { auditStatement } from "../audit/writer.ts";
import type { AppContext } from "../http/context.ts";
import { iso } from "../lib/time.ts";
import type { EverydayText } from "../lib/text.ts";
import { signVersion } from "../records/signing.ts";
import type { CodeRow } from "./view.ts";

export interface NewRecord {
  readonly id: string;
  readonly versionId: string;
  readonly ownerId: string;
  readonly visibility: "public" | "private";
  readonly text: EverydayText;
  readonly signature: string;
  readonly signingKeyId: string;
  readonly at: string;
}

export interface NewCode {
  readonly scope: CodeRow["scope"];
  readonly canonical: string;
  readonly matchKey: string;
  readonly kind: "plain" | "handle";
  readonly checkWord: string | null;
  readonly listVersion: string | null;
  readonly singleUse: boolean;
  readonly expiresAt: string | null;
  // 3 on a plain mint, 0 for a handle (FR-006).
  readonly rerolls: number;
}

// Version 1, signed before any write.
export async function newRecord(
  c: AppContext,
  ownerId: string,
  visibility: NewRecord["visibility"],
  text: EverydayText,
): Promise<NewRecord> {
  const settings = c.get("settings");
  const id = crypto.randomUUID();
  const at = iso(c.get("now"));
  return {
    id,
    versionId: crypto.randomUUID(),
    ownerId,
    visibility,
    text,
    signature: await signVersion(settings, id, 1, text.title, text.body, at),
    signingKeyId: settings.signingKeyId,
    at,
  };
}

// Mint step 5: the record, version 1, the code, and the audit event in one
// batch. A match_key conflict fails the batch, so nothing is stored.
export async function writeMint(
  c: AppContext,
  record: NewRecord,
  code: NewCode,
): Promise<CodeRow> {
  const db = c.env.ZZ_DB;
  const id = crypto.randomUUID();
  await db.batch([
    db
      .prepare(
        "INSERT INTO records (id, owner_id, visibility, current_version_id, created_at, deleted_at) VALUES (?, ?, ?, ?, ?, NULL)",
      )
      .bind(
        record.id,
        record.ownerId,
        record.visibility,
        record.versionId,
        record.at,
      ),
    db
      .prepare(
        "INSERT INTO record_versions (id, record_id, version, title, body, signature, signing_key_id, created_by, created_at, erased_at) VALUES (?, ?, 1, ?, ?, ?, ?, ?, ?, NULL)",
      )
      .bind(
        record.versionId,
        record.id,
        record.text.title,
        record.text.body,
        record.signature,
        record.signingKeyId,
        record.ownerId,
        record.at,
      ),
    db
      .prepare(
        "INSERT INTO codes (id, scope, canonical, match_key, kind, check_word, list_version, status, revoked_reason, single_use, expires_at, record_id, owner_id, first_resolved_at, rerolls_remaining, replaced_by, write_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, 'active', NULL, ?, ?, ?, ?, NULL, ?, NULL, NULL, ?)",
      )
      .bind(
        id,
        code.scope,
        code.canonical,
        code.matchKey,
        code.kind,
        code.checkWord,
        code.listVersion,
        code.singleUse ? 1 : 0,
        code.expiresAt,
        record.id,
        record.ownerId,
        code.rerolls,
        record.at,
      ),
    auditStatement(db, {
      actorId: record.ownerId,
      action: "code.mint",
      targetType: "code",
      targetId: id,
      result: "ok",
      at: record.at,
    }),
  ]);
  return {
    id,
    canonical: code.canonical,
    check_word: code.checkWord,
    status: "active",
    expires_at: code.expiresAt,
    record_id: record.id,
    scope: code.scope,
    rerolls_remaining: code.rerolls,
    created_at: record.at,
  };
}
