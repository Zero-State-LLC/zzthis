import { auditStatement } from "../audit/writer.ts";
import { readJson } from "../http/body.ts";
import type { AppContext } from "../http/context.ts";
import {
  clearedRefreshCookie,
  readRefreshCookie,
  refreshCookie,
} from "../http/cookies.ts";
import { json, unauthorized } from "../http/respond.ts";
import { RefreshRequest } from "../http/schemas.ts";
import { randomToken, sha256Hex } from "../lib/crypto.ts";
import { changes } from "../lib/db.ts";
import { DAY, iso } from "../lib/time.ts";
import { limitIp } from "../limits/enforce.ts";
import type { Client } from "./idtoken.ts";
import { ACCESS_TOKEN_SECONDS, signAccessToken } from "./tokens.ts";

const REFRESH_LIFETIME = 30 * DAY;

export interface NewRefreshToken {
  readonly id: string;
  readonly token: string;
  readonly hash: string;
  readonly expiresAt: string;
}

// 32 random bytes, stored only as a hash, valid 30 days (FR-021).
export async function newRefreshToken(nowMs: number): Promise<NewRefreshToken> {
  const token = randomToken();
  return {
    id: crypto.randomUUID(),
    token,
    hash: await sha256Hex(token),
    expiresAt: iso(nowMs + REFRESH_LIFETIME),
  };
}

export function insertRefreshToken(
  db: D1Database,
  refresh: NewRefreshToken,
  accountId: string,
  client: Client,
): D1PreparedStatement {
  return db
    .prepare(
      "INSERT INTO refresh_tokens (id, account_id, family_id, client, token_hash, expires_at, revoked_at, replaced_by, write_id) VALUES (?, ?, ?, ?, ?, ?, NULL, NULL, NULL)",
    )
    .bind(
      refresh.id,
      accountId,
      crypto.randomUUID(),
      client,
      refresh.hash,
      refresh.expiresAt,
    );
}

// iOS and Android get the refresh token in the body. The web client gets it
// only as the __Host- cookie, and the body field is null.
export async function sessionResponse(
  c: AppContext,
  accountId: string,
  client: string,
  refreshToken: string,
): Promise<Response> {
  const web = client === "web";
  const accessToken = await signAccessToken(
    c.get("settings").tokenSecret,
    accountId,
    c.get("now"),
  );
  return json(
    200,
    {
      access_token: accessToken,
      token_type: "Bearer",
      expires_in: ACCESS_TOKEN_SECONDS,
      refresh_token: web ? null : refreshToken,
    },
    web ? { "Set-Cookie": refreshCookie(refreshToken) } : {},
  );
}

interface Presented {
  readonly hash: string;
  readonly fromCookie: boolean;
}

interface TokenRow {
  account_id: string;
  family_id: string;
  client: string;
}

// The native clients send the token in the body; the web sends {} and the
// cookie.
async function presentedToken(c: AppContext): Promise<Presented> {
  const body = await readJson(c, RefreshRequest);
  const cookie = readRefreshCookie(c);
  const token = body.refresh_token ?? cookie;
  if (token === undefined || token === "") throw unauthorized();
  return { hash: await sha256Hex(token), fromCookie: token === cookie };
}

function refused(presented: Presented): Error {
  return unauthorized(
    presented.fromCookie ? { "Set-Cookie": clearedRefreshCookie() } : {},
  );
}

async function tokenRow(
  c: AppContext,
  presented: Presented,
): Promise<TokenRow> {
  const row = await c.env.ZZ_DB.prepare(
    "SELECT account_id, family_id, client FROM refresh_tokens WHERE token_hash = ?",
  )
    .bind(presented.hash)
    .first<TokenRow>();
  if (row === null) throw refused(presented);
  return row;
}

// POST /v1/auth/refresh. Rotation is one guarded update, and the new
// token's insert and the audit event are gated on it (FR-021, FR-031).
// When the guard changes no row, the token was already used, revoked, or
// expired: every token in its family is revoked and the call is 401. There
// is no grace window (RFC 9700 section 4.14.2).
export async function refreshSession(c: AppContext): Promise<Response> {
  await limitIp(c, "session");
  const presented = await presentedToken(c);
  const row = await tokenRow(c, presented);
  const db = c.env.ZZ_DB;
  const now = iso(c.get("now"));
  const writeId = c.get("requestId");
  const next = await newRefreshToken(c.get("now"));
  const rotated = await db.batch([
    db
      .prepare(
        "UPDATE refresh_tokens SET revoked_at = ?, replaced_by = ?, write_id = ? WHERE token_hash = ? AND revoked_at IS NULL AND expires_at > ? AND account_id IN (SELECT id FROM accounts WHERE deleted_at IS NULL)",
      )
      .bind(now, next.id, writeId, presented.hash, now),
    db
      .prepare(
        "INSERT INTO refresh_tokens (id, account_id, family_id, client, token_hash, expires_at, revoked_at, replaced_by, write_id) SELECT ?, account_id, family_id, client, ?, ?, NULL, NULL, NULL FROM refresh_tokens WHERE token_hash = ? AND write_id = ?",
      )
      .bind(next.id, next.hash, next.expiresAt, presented.hash, writeId),
    auditStatement(
      db,
      {
        actorId: row.account_id,
        action: "auth.refresh",
        targetType: "account",
        targetId: row.account_id,
        result: "ok",
        at: now,
      },
      {
        sql: "SELECT 1 FROM refresh_tokens WHERE token_hash = ? AND write_id = ?",
        params: [presented.hash, writeId],
      },
    ),
  ]);
  if (changes(rotated) === 1) {
    return sessionResponse(c, row.account_id, row.client, next.token);
  }
  await db.batch([
    db
      .prepare(
        "UPDATE refresh_tokens SET revoked_at = ? WHERE family_id = ? AND revoked_at IS NULL",
      )
      .bind(now, row.family_id),
    auditStatement(db, {
      actorId: row.account_id,
      action: "auth.refresh",
      targetType: "account",
      targetId: row.account_id,
      result: "denied",
      at: now,
    }),
  ]);
  throw refused(presented);
}

// POST /v1/auth/revoke: sign out. Revokes the presented token. The web
// cookie is cleared either way.
export async function revokeSession(c: AppContext): Promise<Response> {
  await limitIp(c, "session");
  const presented = await presentedToken(c);
  const row = await tokenRow(c, presented);
  const db = c.env.ZZ_DB;
  const now = iso(c.get("now"));
  const writeId = c.get("requestId");
  const revoked = await db.batch([
    db
      .prepare(
        "UPDATE refresh_tokens SET revoked_at = ?, write_id = ? WHERE token_hash = ? AND revoked_at IS NULL AND expires_at > ?",
      )
      .bind(now, writeId, presented.hash, now),
    auditStatement(
      db,
      {
        actorId: row.account_id,
        action: "auth.revoke",
        targetType: "account",
        targetId: row.account_id,
        result: "ok",
        at: now,
      },
      {
        sql: "SELECT 1 FROM refresh_tokens WHERE token_hash = ? AND write_id = ?",
        params: [presented.hash, writeId],
      },
    ),
  ]);
  if (changes(revoked) !== 1) throw refused(presented);
  return new Response(null, {
    status: 204,
    headers: presented.fromCookie
      ? { "Set-Cookie": clearedRefreshCookie() }
      : {},
  });
}
