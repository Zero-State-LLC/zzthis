import { auditStatement } from "../audit/writer.ts";
import { readJson } from "../http/body.ts";
import type { AppContext } from "../http/context.ts";
import { unauthorized } from "../http/respond.ts";
import { TokenRequest } from "../http/schemas.ts";
import { open, seal } from "../lib/crypto.ts";
import { DAY, iso } from "../lib/time.ts";
import { limitIp } from "../limits/enforce.ts";
import { exchangeAppleCode, revokeAppleToken } from "./apple.ts";
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
    sealed: await seal(c.get("settings").dataKeys, token, clientId),
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
      "SELECT id, account_id, apple_refresh_token_enc, apple_client_id FROM identities WHERE provider = ? AND provider_subject = ?",
    )
    .bind(session.identity.provider, session.identity.subject)
    .first<{
      id: string;
      account_id: string;
      apple_refresh_token_enc: string | null;
      apple_client_id: string | null;
    }>();
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
  if (session.apple !== null && found.apple_refresh_token_enc !== null) {
    await revokeReplaced(
      c,
      found.apple_refresh_token_enc,
      found.apple_client_id as string,
    );
  }
  return found.account_id;
}

// RM-039: a later Apple sign-in replaces the stored token, so the old one
// is revoked, not left live. A failed revoke goes to pending_revocations,
// which the daily run retries (FR-026), as at account deletion.
async function revokeReplaced(
  c: AppContext,
  sealed: string,
  clientId: string,
): Promise<void> {
  const settings = c.get("settings");
  const revoked = await open(settings.dataKeys, sealed, clientId).then(
    (token) =>
      revokeAppleToken(
        c.get("deps"),
        settings.apple,
        clientId,
        token,
        c.get("now"),
      ),
    () => false,
  );
  if (revoked) return;
  const now = c.get("now");
  await c.env.ZZ_DB.prepare(
    "INSERT INTO pending_revocations (id, provider, client_id, token_enc, attempts, next_attempt_at, created_at) VALUES (?, 'apple', ?, ?, 1, ?, ?)",
  )
    .bind(crypto.randomUUID(), clientId, sealed, iso(now + DAY), iso(now))
    .run();
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
  if (identity === null) {
    // RM-039: a rejected ID token is audited, with the provider as its
    // target and no actor. Never the token.
    await auditStatement(c.env.ZZ_DB, {
      actorId: null,
      action: "auth.token",
      targetType: "provider",
      targetId: request.provider,
      result: "denied",
      at: iso(c.get("now")),
    }).run();
    throw unauthorized();
  }
  const session: Session = {
    identity,
    apple: await appleToken(c, identity, request.authorization_code),
    client: request.client,
    refresh: await newRefreshToken(c.get("now")),
  };
  const accountId = await signIn(c, session);
  return sessionResponse(c, accountId, request.client, session.refresh.token);
}
