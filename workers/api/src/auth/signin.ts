import { auditStatement } from "../audit/writer.ts";
import { readJson } from "../http/body.ts";
import type { AppContext } from "../http/context.ts";
import { unauthorized } from "../http/respond.ts";
import { TokenRequest } from "../http/schemas.ts";
import { seal } from "../lib/crypto.ts";
import { iso } from "../lib/time.ts";
import { limitIp } from "../limits/enforce.ts";
import { exchangeAppleCode } from "./apple.ts";
import { verifyIdentity, type Client, type Identity } from "./idtoken.ts";
import { consumeNonce } from "./nonce.ts";
import {
  insertRefreshToken,
  newRefreshToken,
  sessionResponse,
  type NewRefreshToken,
} from "./session.ts";

interface AppleToken {
  readonly sealed: string;
  readonly clientId: string;
}

// FR-020: exchange the Apple authorization code once and keep the refresh
// token, encrypted, only to revoke it at deletion.
async function appleToken(
  c: AppContext,
  identity: Identity,
  code: string | null | undefined,
): Promise<AppleToken | null> {
  const apple = c.get("settings").apple;
  const clientId = identity.appleClientId;
  if (apple === null || clientId === null || !code) return null;
  const token = await exchangeAppleCode(
    c.get("deps"),
    apple,
    clientId,
    code,
    c.get("now"),
  );
  if (token === null) return null;
  return {
    sealed: await seal(c.get("settings").dataKey, token, clientId),
    clientId,
  };
}

interface Session {
  readonly identity: Identity;
  readonly apple: AppleToken | null;
  readonly client: Client;
  readonly refresh: NewRefreshToken;
}

function signInAudit(
  db: D1Database,
  accountId: string,
  action: string,
  at: string,
): D1PreparedStatement {
  return auditStatement(db, {
    actorId: accountId,
    action,
    targetType: "account",
    targetId: accountId,
    result: "ok",
    at,
  });
}

async function existingAccount(
  c: AppContext,
  session: Session,
): Promise<string | null> {
  const db = c.env.ZZ_DB;
  const found = await db
    .prepare(
      "SELECT id, account_id FROM identities WHERE provider = ? AND provider_subject = ?",
    )
    .bind(session.identity.provider, session.identity.subject)
    .first<{ id: string; account_id: string }>();
  if (found === null) return null;
  const now = iso(c.get("now"));
  const statements = [
    insertRefreshToken(db, session.refresh, found.account_id, session.client),
    signInAudit(db, found.account_id, "auth.token", now),
  ];
  if (session.apple !== null) {
    // The token and its client id are written and replaced together.
    statements.unshift(
      db
        .prepare(
          "UPDATE identities SET apple_refresh_token_enc = ?, apple_client_id = ? WHERE id = ?",
        )
        .bind(session.apple.sealed, session.apple.clientId, found.id),
    );
  }
  await db.batch(statements);
  return found.account_id;
}

// A new, empty account. No email or name is stored.
async function newAccount(c: AppContext, session: Session): Promise<string> {
  const db = c.env.ZZ_DB;
  const accountId = crypto.randomUUID();
  const now = iso(c.get("now"));
  await db.batch([
    db
      .prepare(
        "INSERT INTO accounts (id, created_at, suspended_at, deleted_at) VALUES (?, ?, NULL, NULL)",
      )
      .bind(accountId, now),
    db
      .prepare(
        "INSERT INTO identities (id, account_id, provider, provider_subject, apple_refresh_token_enc, apple_client_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
      )
      .bind(
        crypto.randomUUID(),
        accountId,
        session.identity.provider,
        session.identity.subject,
        session.apple?.sealed ?? null,
        session.apple?.clientId ?? null,
        now,
      ),
    insertRefreshToken(db, session.refresh, accountId, session.client),
    signInAudit(db, accountId, "account.create", now),
  ]);
  return accountId;
}

// Find or create the account by provider and subject. Two first sign-ins
// for one subject race on the unique (provider, provider_subject) key; the
// loser's batch rolls back and it signs in to the winner's account.
async function signIn(c: AppContext, session: Session): Promise<string> {
  const existing = await existingAccount(c, session);
  if (existing !== null) return existing;
  try {
    return await newAccount(c, session);
  } catch (error) {
    const winner = await existingAccount(c, session);
    if (winner === null) throw error;
    return winner;
  }
}

// POST /v1/auth/token: consume the nonce, then verify the ID token
// (FR-020). Developer sign-in uses the same nonce flow (FR-022).
export async function exchangeToken(c: AppContext): Promise<Response> {
  await limitIp(c, "auth");
  const request = await readJson(c, TokenRequest);
  if (!(await consumeNonce(c, request.nonce))) throw unauthorized();
  const identity = await verifyIdentity(c, request);
  if (identity === null) throw unauthorized();
  const session: Session = {
    identity,
    apple: await appleToken(c, identity, request.authorization_code),
    client: request.client,
    refresh: await newRefreshToken(c.get("now")),
  };
  const accountId = await signIn(c, session);
  return sessionResponse(c, accountId, request.client, session.refresh.token);
}
