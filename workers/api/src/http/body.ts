import type { z } from "zod";
import type { AppContext } from "./context.ts";
import { malformed } from "./respond.ts";

// Far above the largest valid body (a 120 code point title and a 4000 code
// point body, even with every character escaped), so only junk is refused.
const MAX_JSON_BYTES = 256 * 1024;

const JSON_TYPE = /^application\/json(?:\s*;|$)/i;

// RM-039: reads the body while counting bytes, and stops at the limit, so
// a body without Content-Length is never read whole first.
async function boundedText(request: Request): Promise<string | null> {
  if (request.body === null) return "";
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > MAX_JSON_BYTES) {
      await reader.cancel();
      return null;
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder().decode(bytes);
}

// A JSON request body that matches the schema, or 400 malformed.
export async function readJson<T>(
  c: AppContext,
  schema: z.ZodType<T>,
): Promise<T> {
  const type = c.req.header("Content-Type") ?? "";
  const declared = Number(c.req.header("Content-Length") ?? "0");
  if (!JSON_TYPE.test(type.trim()) || declared > MAX_JSON_BYTES) {
    throw malformed();
  }
  const text = await boundedText(c.req.raw);
  if (text === null) throw malformed();
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch {
    throw malformed();
  }
  const parsed = schema.safeParse(value);
  if (!parsed.success) throw malformed();
  return parsed.data;
}
