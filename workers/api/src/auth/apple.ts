import { SignJWT } from "jose";
import type { Deps } from "../deps.ts";
import type { AppleSettings } from "../env.ts";
import { APPLE_ISSUER } from "./idtoken.ts";

// spec 005 Provider constants.
export const APPLE_TOKEN_URL = "https://appleid.apple.com/auth/token";
export const APPLE_REVOKE_URL = "https://appleid.apple.com/auth/revoke";

// Well under Apple's six-month ceiling: each call signs a fresh secret.
const CLIENT_SECRET_SECONDS = 300;

// The Apple client secret: an ES256 JWT whose sub is the client_id of the
// call it is sent with.
export async function appleClientSecret(
  apple: AppleSettings,
  clientId: string,
  nowMs: number,
): Promise<string> {
  const issuedAt = Math.floor(nowMs / 1000);
  return new SignJWT({})
    .setProtectedHeader({ alg: "ES256", kid: apple.keyId })
    .setIssuer(apple.teamId)
    .setAudience(APPLE_ISSUER)
    .setSubject(clientId)
    .setIssuedAt(issuedAt)
    .setExpirationTime(issuedAt + CLIENT_SECRET_SECONDS)
    .sign(apple.privateKey);
}

async function post(
  deps: Deps,
  url: string,
  form: URLSearchParams,
): Promise<Response | null> {
  try {
    return await deps.fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: form,
    });
  } catch {
    return null;
  }
}

function logOutcome(event: string, outcome: string, status: number | null) {
  // FR-027: the outcome and the status only, never a token or a code.
  console.log(JSON.stringify({ event, outcome, status }));
}

// FR-020: exchange the authorization code once, with client_id set to the
// token's aud. The web client (the Services ID) sends the one registered
// redirect URI; iOS sends none. Returns Apple's refresh token, or null on
// any failure, which is logged and does not stop the sign-in.
export async function exchangeAppleCode(
  deps: Deps,
  apple: AppleSettings,
  clientId: string,
  code: string,
  nowMs: number,
): Promise<string | null> {
  const form = new URLSearchParams({
    client_id: clientId,
    client_secret: await appleClientSecret(apple, clientId, nowMs),
    code,
    grant_type: "authorization_code",
  });
  if (clientId === apple.servicesId) {
    form.set("redirect_uri", apple.webRedirectUri);
  }
  const response = await post(deps, APPLE_TOKEN_URL, form);
  const body = response?.ok
    ? await response.json<{ refresh_token?: unknown }>().catch(() => null)
    : null;
  const token =
    typeof body?.refresh_token === "string" ? body.refresh_token : null;
  if (token === null) {
    logOutcome("apple-code-exchange", "failed", response?.status ?? null);
  }
  return token;
}

// FR-023 step 1: revoke the stored token with the client_id it was issued
// to. False when Apple is not configured or the call does not return 200.
export async function revokeAppleToken(
  deps: Deps,
  apple: AppleSettings | null,
  clientId: string,
  token: string,
  nowMs: number,
): Promise<boolean> {
  if (apple === null) return false;
  const form = new URLSearchParams({
    client_id: clientId,
    client_secret: await appleClientSecret(apple, clientId, nowMs),
    token,
    token_type_hint: "refresh_token",
  });
  const response = await post(deps, APPLE_REVOKE_URL, form);
  const revoked = response?.ok === true;
  logOutcome(
    "apple-revoke",
    revoked ? "revoked" : "failed",
    response?.status ?? null,
  );
  return revoked;
}
