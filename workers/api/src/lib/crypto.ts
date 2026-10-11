import { fromBase64url, toBase64url, utf8 } from "./encoding.ts";

const IV_BYTES = 12;
const DERIVED_KEY_BYTES = 32;

// D-2026-10-05-04 (Danny, #78): ZZ_DATA_KEY is never used directly. HKDF-
// SHA-256 (RFC 5869) with an empty salt and these fixed info labels derives
// one key for AES-GCM and one for HMAC.
export const AES_KEY_INFO = "zzthis ZZ_DATA_KEY aes-gcm v1";
export const HMAC_KEY_INFO = "zzthis ZZ_DATA_KEY hmac-sha256 v1";
// RM-021: a public label for one ZZ_DATA_KEY, derived the same way, so a
// sealed value names the key that sealed it without revealing the key.
export const KEY_ID_INFO = "zzthis ZZ_DATA_KEY key-id v1";

export interface DataKeys {
  // Eight hex characters naming this ZZ_DATA_KEY (RM-021).
  readonly id: string;
  // The stored Apple refresh tokens.
  readonly aes: CryptoKey;
  // Limiter keys, not-found audit targets, and nonce audit targets.
  readonly hmac: CryptoKey;
  // ZZ_DATA_KEY_PREVIOUS during a rotation: it only opens older values.
  readonly previous: { readonly id: string; readonly aes: CryptoKey } | null;
}

function hex(bytes: ArrayBuffer): string {
  return [...new Uint8Array(bytes)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

// A random value for a nonce or a refresh token: 32 bytes, base64url.
export function randomToken(bytes = 32): string {
  return toBase64url(crypto.getRandomValues(new Uint8Array(bytes)));
}

export async function sha256Hex(text: string): Promise<string> {
  return hex(await crypto.subtle.digest("SHA-256", utf8(text)));
}

// RFC 5869 HKDF-SHA-256 through crypto.subtle.
export async function hkdfSha256(
  ikm: Uint8Array,
  salt: Uint8Array,
  info: Uint8Array,
  length: number,
): Promise<Uint8Array> {
  const base = await crypto.subtle.importKey("raw", ikm, "HKDF", false, [
    "deriveBits",
  ]);
  const bits = await crypto.subtle.deriveBits(
    { name: "HKDF", hash: "SHA-256", salt, info },
    base,
    length * 8,
  );
  return new Uint8Array(bits);
}

export function derivedKeyBytes(
  dataKey: Uint8Array,
  info: string,
): Promise<Uint8Array> {
  return hkdfSha256(dataKey, new Uint8Array(), utf8(info), DERIVED_KEY_BYTES);
}

async function keyId(dataKey: Uint8Array): Promise<string> {
  const bytes = await derivedKeyBytes(dataKey, KEY_ID_INFO);
  return hex(bytes.slice(0, 4).buffer);
}

function importAes(bytes: Uint8Array): Promise<CryptoKey> {
  return crypto.subtle.importKey("raw", bytes, "AES-GCM", false, [
    "encrypt",
    "decrypt",
  ]);
}

export async function deriveDataKeys(
  dataKey: Uint8Array,
  previousKey: Uint8Array | null = null,
): Promise<DataKeys> {
  const [aes, hmac] = await Promise.all([
    derivedKeyBytes(dataKey, AES_KEY_INFO),
    derivedKeyBytes(dataKey, HMAC_KEY_INFO),
  ]);
  return {
    id: await keyId(dataKey),
    previous:
      previousKey === null
        ? null
        : {
            id: await keyId(previousKey),
            aes: await importAes(
              await derivedKeyBytes(previousKey, AES_KEY_INFO),
            ),
          },
    aes: await importAes(aes),
    hmac: await crypto.subtle.importKey(
      "raw",
      hmac,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"],
    ),
  };
}

// HMAC-SHA256 with the derived HMAC key. The label keeps the uses apart.
export async function hmacTag(
  keys: DataKeys,
  label: string,
  message: string,
): Promise<string> {
  const tag = await crypto.subtle.sign(
    "HMAC",
    keys.hmac,
    utf8(`${label}\n${message}`),
  );
  return toBase64url(new Uint8Array(tag));
}

// AES-GCM with the derived AES key, for the stored Apple refresh token. The
// client id is the additional data, so a token only decrypts with the
// client it was issued to. Output: `k1.<key id>.` and then base64url of
// the IV, then the ciphertext and tag (RM-021).
export async function seal(
  keys: DataKeys,
  plaintext: string,
  context: string,
): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES));
  const sealed = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv, additionalData: utf8(context) },
    keys.aes,
    utf8(plaintext),
  );
  const out = new Uint8Array(IV_BYTES + sealed.byteLength);
  out.set(iv);
  out.set(new Uint8Array(sealed), IV_BYTES);
  return `k1.${keys.id}.${toBase64url(out)}`;
}

async function decrypt(
  aes: CryptoKey,
  sealed: string,
  context: string,
): Promise<string> {
  const bytes = fromBase64url(sealed);
  if (bytes === null || bytes.length <= IV_BYTES) {
    throw new Error("sealed value is not readable");
  }
  const plain = await crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: bytes.slice(0, IV_BYTES),
      additionalData: utf8(context),
    },
    aes,
    bytes.slice(IV_BYTES),
  );
  return new TextDecoder().decode(plain);
}

const TAGGED = /^k1\.([0-9a-f]{8})\.(.+)$/;

// RM-021: a tagged value opens with the key it names, current or previous.
// A value sealed before key ids existed has no tag: it is tried with the
// current key, then the previous one.
export async function open(
  keys: DataKeys,
  sealed: string,
  context: string,
): Promise<string> {
  const tagged = TAGGED.exec(sealed);
  if (tagged !== null) {
    const [, id, body] = tagged as unknown as [string, string, string];
    if (id === keys.id) return decrypt(keys.aes, body, context);
    if (keys.previous !== null && id === keys.previous.id) {
      return decrypt(keys.previous.aes, body, context);
    }
    throw new Error("sealed with an unknown key");
  }
  try {
    return await decrypt(keys.aes, sealed, context);
  } catch (error) {
    if (keys.previous === null) throw error;
    return decrypt(keys.previous.aes, sealed, context);
  }
}
