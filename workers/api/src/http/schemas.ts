import { z } from "zod";

// Request bodies, written from openapi.yaml. Objects the contract marks
// additionalProperties: false are strict here too. Title and body lengths
// are checked after the server's cleanup (FR-007), not here.

export const TokenRequest = z.strictObject({
  provider: z.enum(["apple", "google", "dev"]),
  client: z.enum(["ios", "android", "web"]),
  id_token: z.string(),
  nonce: z.string(),
  authorization_code: z.string().nullable().optional(),
});

export const RefreshRequest = z.strictObject({
  refresh_token: z.string().nullable().optional(),
});

export const EverydayRecord = z.object({
  title: z.string(),
  body: z.string(),
});

export const Scope = z.enum(["enterprise", "logistics", "free_public"]);

export const MintRequest = z.object({
  scope: Scope,
  kind: z.enum(["plain", "handle"]).default("plain"),
  handle: z.string().optional(),
  visibility: z.enum(["public", "private"]).optional(),
  record: EverydayRecord,
  single_use: z.boolean().default(false),
  expires_at: z.string().nullable().optional(),
});

export const ReportRequest = z.object({
  canonical: z.string(),
  reason: z.enum(["spam", "harassment", "personal-data", "other"]),
  note: z.string().default(""),
});

export type ScopeName = z.infer<typeof Scope>;
export type MintBody = z.infer<typeof MintRequest>;
