import {
  createLocalJWKSet,
  exportJWK,
  exportPKCS8,
  generateKeyPair,
  SignJWT,
  type JWTVerifyGetKey,
} from "jose";

// Stand-ins for Apple's and Google's signing keys and JWKS, made at run
// time. No key is ever written to the repo (spec 005 T005).
export interface TestIdp {
  readonly issuer: string;
  readonly keys: JWTVerifyGetKey;
  idToken(claims: IdTokenClaims): Promise<string>;
  // A token signed by a key this provider's JWKS does not list.
  foreignToken(claims: IdTokenClaims): Promise<string>;
}

export interface IdTokenClaims {
  readonly sub: string;
  readonly aud: string | string[];
  readonly nonce?: string;
  readonly iss?: string;
  readonly iat?: number;
  readonly exp?: number;
}

async function sign(
  key: CryptoKey,
  issuer: string,
  claims: IdTokenClaims,
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const jwt = new SignJWT(
    claims.nonce === undefined ? {} : { nonce: claims.nonce },
  )
    .setProtectedHeader({ alg: "RS256", kid: "test-key" })
    .setIssuer(claims.iss ?? issuer)
    .setAudience(claims.aud)
    .setSubject(claims.sub)
    .setIssuedAt(claims.iat ?? now)
    .setExpirationTime(claims.exp ?? now + 600);
  return jwt.sign(key);
}

export async function makeIdp(issuer: string): Promise<TestIdp> {
  const { privateKey, publicKey } = await generateKeyPair("RS256", {
    extractable: true,
  });
  const other = await generateKeyPair("RS256");
  const jwk = {
    ...(await exportJWK(publicKey)),
    kid: "test-key",
    alg: "RS256",
    use: "sig",
  };
  return {
    issuer,
    keys: createLocalJWKSet({ keys: [jwk] }),
    idToken: (claims) => sign(privateKey, issuer, claims),
    foreignToken: (claims) => sign(other.privateKey, issuer, claims),
  };
}

// The Sign in with Apple key (a .p8 PEM in production), made at run time,
// with its public half to check the client secrets the server signs.
export async function makeAppleSigningKey(): Promise<{
  pem: string;
  publicKey: CryptoKey;
}> {
  const { privateKey, publicKey } = await generateKeyPair("ES256", {
    extractable: true,
  });
  return { pem: await exportPKCS8(privateKey), publicKey };
}
