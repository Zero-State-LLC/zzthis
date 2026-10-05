import { createRemoteJWKSet, type JWTVerifyGetKey } from "jose";
import { cryptoUint32, type RandomUint32 } from "@zzthis/zz-core";
import type { PhotoReader } from "./reads/reader.ts";

// The ports the Worker talks to outside itself. Production uses the real
// ones. Tests pass keys made at run time, a stubbed fetch, and a clock.
export interface Deps {
  readonly now: () => number;
  readonly random: RandomUint32;
  // ID-token keys (spec 005 Provider constants). Tests pass jose
  // createLocalJWKSet; production fetches the published JWKS.
  readonly appleKeys: JWTVerifyGetKey;
  readonly googleKeys: JWTVerifyGetKey;
  // Outbound calls to Apple's token and revoke endpoints.
  readonly fetch: typeof fetch;
  // Q18 picks a reader. Until then there is none, so POST /v1/reads is
  // not-ready even if ZZ_PHOTO_READS is set.
  readonly photoReader: PhotoReader | null;
}

export const APPLE_KEYS_URL = "https://appleid.apple.com/auth/keys";
export const GOOGLE_KEYS_URL = "https://www.googleapis.com/oauth2/v3/certs";

export function productionDeps(): Deps {
  return {
    now: Date.now,
    random: cryptoUint32,
    appleKeys: createRemoteJWKSet(new URL(APPLE_KEYS_URL)),
    googleKeys: createRemoteJWKSet(new URL(GOOGLE_KEYS_URL)),
    fetch: globalThis.fetch.bind(globalThis),
    photoReader: null,
  };
}
