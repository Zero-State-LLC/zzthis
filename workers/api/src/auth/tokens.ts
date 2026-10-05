import { decodeProtectedHeader, jwtVerify, SignJWT } from "jose";

// FR-021 access tokens: HS256 JWTs, iss zzthis, sub the account id, exactly
// 900 seconds.
export const ACCESS_TOKEN_SECONDS = 900;
const ISSUER = "zzthis";
const ALGORITHM = "HS256";

export async function signAccessToken(
  secret: Uint8Array,
  accountId: string,
  nowMs: number,
): Promise<string> {
  const issuedAt = Math.floor(nowMs / 1000);
  return new SignJWT({})
    .setProtectedHeader({ alg: ALGORITHM, typ: "JWT" })
    .setIssuer(ISSUER)
    .setSubject(accountId)
    .setIssuedAt(issuedAt)
    .setExpirationTime(issuedAt + ACCESS_TOKEN_SECONDS)
    .sign(secret);
}

function headerAlgorithm(token: string): string | undefined {
  try {
    return decodeProtectedHeader(token).alg;
  } catch {
    return undefined;
  }
}

// The account id, or null for any token this server would not issue. The
// alg check runs before the signature check, so none and every other alg
// are refused without touching the key (RFC 8725 sections 3.1 and 3.2).
export async function verifyAccessToken(
  secret: Uint8Array,
  token: string,
  nowMs: number,
): Promise<string | null> {
  if (headerAlgorithm(token) !== ALGORITHM) return null;
  try {
    const { payload } = await jwtVerify(token, secret, {
      algorithms: [ALGORITHM],
      issuer: ISSUER,
      requiredClaims: ["sub", "exp", "iat"],
      currentDate: new Date(nowMs),
    });
    // requiredClaims guarantees sub, and jose checks that it is a string.
    return payload.sub as string;
  } catch {
    return null;
  }
}
