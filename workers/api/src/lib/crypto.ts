import { fromBase64url, toBase64url, utf8 } from "./encoding.ts";

const IV_BYTES = 12;

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

// HMAC-SHA256 keyed with ZZ_DATA_KEY, for limiter keys and not-found audit
// targets (spec 005 Environment, Resolve). The label keeps the two uses
// apart.
export async function hmacTag(
  key: Uint8Array,
  label: string,
  message: string,
): Promise<string> {
  const hmacKey = await crypto.subtle.importKey(
    "raw",
    key,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const tag = await crypto.subtle.sign(
    "HMAC",
    hmacKey,
    utf8(`${label}\n${message}`),
  );
  return toBase64url(new Uint8Array(tag));
}

function aesKey(
  key: Uint8Array,
  usage: "encrypt" | "decrypt",
): Promise<CryptoKey> {
  return crypto.subtle.importKey("raw", key, "AES-GCM", false, [usage]);
}

// AES-GCM with ZZ_DATA_KEY for the stored Apple refresh token. The client id
// is the additional data, so a token only decrypts with the client it was
// issued to. Output: base64url of the IV, then the ciphertext and tag.
export async function seal(
  key: Uint8Array,
  plaintext: string,
  context: string,
): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES));
  const sealed = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv, additionalData: utf8(context) },
    await aesKey(key, "encrypt"),
    utf8(plaintext),
  );
  const out = new Uint8Array(IV_BYTES + sealed.byteLength);
  out.set(iv);
  out.set(new Uint8Array(sealed), IV_BYTES);
  return toBase64url(out);
}

export async function open(
  key: Uint8Array,
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
    await aesKey(key, "decrypt"),
    bytes.slice(IV_BYTES),
  );
  return new TextDecoder().decode(plain);
}
