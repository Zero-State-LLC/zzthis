import { fromBase64url, toBase64url, utf8 } from "./encoding.ts";

const IV_BYTES = 12;
const DERIVED_KEY_BYTES = 32;

// D-2026-10-05-04 (Danny, #78): ZZ_DATA_KEY is never used directly. HKDF-
// SHA-256 (RFC 5869) with an empty salt and these fixed info labels derives
// one key for AES-GCM and one for HMAC.
export const AES_KEY_INFO = "zzthis ZZ_DATA_KEY aes-gcm v1";
export const HMAC_KEY_INFO = "zzthis ZZ_DATA_KEY hmac-sha256 v1";

export interface DataKeys {
  // The stored Apple refresh tokens.
  readonly aes: CryptoKey;
  // Limiter keys, not-found audit targets, and nonce audit targets.
  readonly hmac: CryptoKey;
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

export async function deriveDataKeys(dataKey: Uint8Array): Promise<DataKeys> {
  const [aes, hmac] = await Promise.all([
    derivedKeyBytes(dataKey, AES_KEY_INFO),
    derivedKeyBytes(dataKey, HMAC_KEY_INFO),
  ]);
  return {
    aes: await crypto.subtle.importKey("raw", aes, "AES-GCM", false, [
      "encrypt",
      "decrypt",
    ]),
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
// client it was issued to. Output: base64url of the IV, then the
// ciphertext and tag.
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
  return toBase64url(out);
}

export async function open(
  keys: DataKeys,
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
    keys.aes,
    bytes.slice(IV_BYTES),
  );
  return new TextDecoder().decode(plain);
}
