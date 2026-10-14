import { DAY, HOUR, MINUTE } from "../lib/time.ts";

export interface Limit {
  readonly limit: number;
  readonly windowMs: number;
}

// spec 005 Rate limits, one rule per row. Signed-in calls count against the
// user rows and signed-out calls against the IP rows. Routes on one row
// share one count.
export const IP_RULES = {
  // GET /v1 and GET /v1/openapi.json
  discovery: { limit: 60, windowMs: MINUTE },
  // POST /v1/auth/nonce and POST /v1/auth/token
  auth: { limit: 20, windowMs: MINUTE },
  // POST /v1/auth/refresh and POST /v1/auth/revoke
  session: { limit: 30, windowMs: MINUTE },
  // POST /v1/reports
  reports: { limit: 10, windowMs: HOUR },
} as const satisfies Record<string, Limit>;

export const USER_RULES = {
  // POST /v1/codes and POST /v1/codes/{id}/reroll
  mint: { limit: 10, windowMs: HOUR },
  // GET /v1/me, GET /v1/me/codes, and GET /v1/records/{id}
  "owner-read": { limit: 60, windowMs: MINUTE },
  // POST /v1/records/{id}/versions and POST /v1/codes/{id}/revoke
  "owner-write": { limit: 30, windowMs: HOUR },
  // DELETE /v1/me
  "delete-account": { limit: 5, windowMs: HOUR },
  // GET /v1/audit
  audit: { limit: 60, windowMs: MINUTE },
} as const satisfies Record<string, Limit>;

// Rows with both an IP and a user limit.
export const CALLER_RULES = {
  resolve: {
    ip: { limit: 60, windowMs: MINUTE },
    user: { limit: 120, windowMs: MINUTE },
  },
  reads: {
    ip: { limit: 5, windowMs: HOUR },
    user: { limit: 20, windowMs: HOUR },
  },
} as const satisfies Record<string, { ip: Limit; user: Limit }>;

// D-2026-10-13-03 (RM-072): each free_public mint and each re-roll of a
// free_public code counts once against the caller's mint subject and once
// against the RM-030 IP subject, per UTC day. Windows are fixed and start
// at a multiple of the window length after the epoch, so a DAY window is
// the UTC day. These counts are on top of the hourly mint row.
export const MINT_DAY_RULES = {
  subject: { limit: 30, windowMs: DAY },
  ip: { limit: 60, windowMs: DAY },
} as const satisfies Record<string, Limit>;

export type IpRule = keyof typeof IP_RULES;
export type UserRule = keyof typeof USER_RULES;
export type CallerRule = keyof typeof CALLER_RULES;
