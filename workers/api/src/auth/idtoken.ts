import { jwtVerify, type JWTPayload, type JWTVerifyGetKey } from "jose";
import type { AppContext } from "../http/context.ts";
import { sha256Hex } from "../lib/crypto.ts";

// spec 005 Provider constants.
export const APPLE_ISSUER = "https://appleid.apple.com";
export const GOOGLE_ISSUERS = [
  "https://accounts.google.com",
  "accounts.google.com",
];

export type Provider = "apple" | "google" | "dev";
export type Client = "ios" | "android" | "web";

export interface SignInRequest {
  readonly provider: Provider;
  readonly client: Client;
  readonly id_token: string;
  readonly nonce: string;
}

export interface Identity {
  readonly provider: Provider;
  readonly subject: string;
  // The verified Apple ID token's aud, the client id for the code exchange
  // and the revoke at deletion (FR-020, FR-023). Null for other providers.
  readonly appleClientId: string | null;
}

const DEV_TOKEN = /^dev:([a-z0-9-]{1,40})$/;

// OpenID Connect Core 1.0 section 3.1.3.7: signature, issuer, audience, and
// expiry, then the nonce claim (section 15.5.2). An aud list with any
// audience this deployment does not accept is refused.
async function verifyIdToken(
  c: AppContext,
  token: string,
  keys: JWTVerifyGetKey,
  issuer: string | string[],
  audiences: readonly string[],
): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, keys, {
      algorithms: ["RS256"],
      issuer,
      audience: [...audiences],
      requiredClaims: ["sub", "exp", "iat", "nonce"],
      currentDate: new Date(c.get("now")),
    });
    const listed = ([] as string[]).concat(payload.aud as string | string[]);
    return listed.every((aud) => audiences.includes(aud)) ? payload : null;
  } catch {
    return null;
  }
}

function appleAudience(c: AppContext, client: Client): string | null {
  const apple = c.get("settings").apple;
  if (apple === null) return null;
  // iOS signs in with the bundle id and the web with the Services ID.
  // Android has no Sign in with Apple in v1 (Q67).
  if (client === "ios") return apple.bundleId;
  return client === "web" ? apple.servicesId : null;
}

async function apple(
  c: AppContext,
  request: SignInRequest,
): Promise<Identity | null> {
  const audience = appleAudience(c, request.client);
  if (audience === null) return null;
  const payload = await verifyIdToken(
    c,
    request.id_token,
    c.get("deps").appleKeys,
    APPLE_ISSUER,
    [audience],
  );
  // Apple carries the hex SHA-256 of the server nonce.
  if (payload?.nonce !== (await sha256Hex(request.nonce))) return null;
  return {
    provider: "apple",
    subject: payload.sub as string,
    appleClientId: audience,
  };
}

async function google(
  c: AppContext,
  request: SignInRequest,
): Promise<Identity | null> {
  const clientIds = c.get("settings").googleClientIds;
  if (clientIds === null) return null;
  const payload = await verifyIdToken(
    c,
    request.id_token,
    c.get("deps").googleKeys,
    GOOGLE_ISSUERS,
    clientIds,
  );
  // Google carries the server nonce itself.
  if (payload?.nonce !== request.nonce) return null;
  return {
    provider: "google",
    subject: payload.sub as string,
    appleClientId: null,
  };
}

// FR-022: a dev token is not a JWT, so only its shape is checked.
function dev(c: AppContext, request: SignInRequest): Identity | null {
  const match = DEV_TOKEN.exec(request.id_token);
  if (!c.get("settings").devAuth || match === null) return null;
  return { provider: "dev", subject: match[1] as string, appleClientId: null };
}

// The verified identity, or null for any token that fails a check or a
// provider this deployment does not list (401).
export async function verifyIdentity(
  c: AppContext,
  request: SignInRequest,
): Promise<Identity | null> {
  if (request.provider === "apple") return apple(c, request);
  if (request.provider === "google") return google(c, request);
  return dev(c, request);
}
