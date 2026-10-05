import type { Settings } from "../env.ts";
import { toBase64url, utf8 } from "../lib/encoding.ts";

// spec 005 Data model: the signed bytes are the UTF-8 of
// JSON.stringify([record_id, version, title, body, created_at]), signed
// with the one Ed25519 key, stored as base64url. A failed signature throws,
// before any batch runs, so nothing is stored (spec 002 FR-018).
export async function signVersion(
  settings: Settings,
  recordId: string,
  version: number,
  title: string,
  body: string,
  createdAt: string,
): Promise<string> {
  const signed = utf8(
    JSON.stringify([recordId, version, title, body, createdAt]),
  );
  const signature = await crypto.subtle.sign(
    "Ed25519",
    settings.signingKey,
    signed,
  );
  return toBase64url(new Uint8Array(signature));
}
