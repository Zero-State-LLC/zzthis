import type { components } from "../generated/api.ts";

export type CodeBody = components["schemas"]["Code"];
export type CodeStatus = CodeBody["status"];

export interface CodeRow {
  id: string;
  canonical: string;
  check_word: string | null;
  status: CodeStatus;
  expires_at: string | null;
  record_id: string;
  scope: CodeBody["scope"];
  rerolls_remaining: number;
  created_at: string;
}

export const CODE_COLUMNS =
  "id, canonical, check_word, status, expires_at, record_id, scope, rerolls_remaining, created_at";

// An active code whose expires_at has passed is expired: a resolve at T or
// later is not-found (spec 002 US3 acceptance 2).
export function effectiveStatus(
  row: Pick<CodeRow, "status" | "expires_at">,
  now: string,
): CodeStatus {
  const expired = row.expires_at !== null && row.expires_at <= now;
  return row.status === "active" && expired ? "expired" : row.status;
}

export function codeBody(row: CodeRow, now: string): CodeBody {
  return {
    id: row.id,
    canonical: row.canonical,
    check_word: row.check_word,
    status: effectiveStatus(row, now),
    record_id: row.record_id,
    scope: row.scope,
    rerolls_remaining: row.rerolls_remaining,
    created_at: row.created_at,
  };
}
