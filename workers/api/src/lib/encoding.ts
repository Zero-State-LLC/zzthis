// base64 and base64url (RFC 4648 sections 4 and 5) without Node buffers, so
// the same code runs in workerd and in the tests.

const BASE64URL = /^[A-Za-z0-9_-]*={0,2}$/;
const BASE64 = /^[A-Za-z0-9+/]*={0,2}$/;

function toBinary(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return binary;
}

function fromBinary(binary: string): Uint8Array {
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

export function toBase64(bytes: Uint8Array): string {
  return btoa(toBinary(bytes));
}

export function toBase64url(bytes: Uint8Array): string {
  return toBase64(bytes)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

// Strict: any character outside the alphabet, or a length no encoder writes,
// is null rather than a guess.
export function fromBase64(text: string): Uint8Array | null {
  if (!BASE64.test(text)) return null;
  try {
    return fromBinary(atob(text));
  } catch {
    // atob refuses a length no encoder writes, or padding in the wrong place.
    return null;
  }
}

export function fromBase64url(text: string): Uint8Array | null {
  if (!BASE64URL.test(text)) return null;
  return fromBase64(text.replace(/-/g, "+").replace(/_/g, "/"));
}

export function utf8(text: string): Uint8Array {
  return new TextEncoder().encode(text);
}
