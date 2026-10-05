import type { AppContext } from "../http/context.ts";
import { ApiError } from "../http/respond.ts";
import { hmacTag } from "../lib/crypto.ts";
import {
  CALLER_RULES,
  IP_RULES,
  USER_RULES,
  type CallerRule,
  type IpRule,
  type Limit,
  type UserRule,
} from "./rules.ts";

async function take(
  c: AppContext,
  rule: string,
  subject: string,
  limit: Limit,
): Promise<void> {
  c.set("limiter", `${rule}:${subject.slice(0, subject.indexOf(":"))}`);
  const namespace = c.env.ZZ_LIMITER;
  const stub = namespace.get(namespace.idFromName(`${rule}:${subject}`));
  const result = await stub.take(limit.limit, limit.windowMs, c.get("now"));
  if (!result.allowed) {
    // FR-011: one body, whether or not any code exists.
    throw new ApiError(429, "rate-limited", undefined, {
      "Retry-After": String(result.retryAfter),
    });
  }
}

// The limiter key holds an HMAC of the IP, never the IP (FR-027).
async function ipSubject(c: AppContext): Promise<string> {
  const ip = c.req.header("CF-Connecting-IP") ?? "unknown";
  return `ip:${await hmacTag(c.get("settings").dataKeys, "limiter-ip", ip)}`;
}

export async function limitIp(c: AppContext, rule: IpRule): Promise<void> {
  await take(c, rule, await ipSubject(c), IP_RULES[rule]);
}

export async function limitUser(
  c: AppContext,
  rule: UserRule,
  accountId: string,
): Promise<void> {
  await take(c, rule, `user:${accountId}`, USER_RULES[rule]);
}

// Signed in: the user row. Signed out, or an unusable bearer: the IP row.
export async function limitCaller(
  c: AppContext,
  rule: CallerRule,
  accountId: string | null,
): Promise<void> {
  const limits = CALLER_RULES[rule];
  if (accountId === null) {
    await take(c, rule, await ipSubject(c), limits.ip);
  } else {
    await take(c, rule, `user:${accountId}`, limits.user);
  }
}

// D-2026-10-05-05: a suspended account's refusals are audited once per
// account per limiter window, so a flood stays visible without one audit
// row per call. A separate count per rule, never refused, marks the first.
export async function firstRefusal(
  c: AppContext,
  rule: UserRule,
  accountId: string,
): Promise<boolean> {
  const namespace = c.env.ZZ_LIMITER;
  const stub = namespace.get(
    namespace.idFromName(`${rule}:refused:user:${accountId}`),
  );
  const result = await stub.take(
    Number.MAX_SAFE_INTEGER,
    USER_RULES[rule].windowMs,
    c.get("now"),
  );
  return result.count === 1;
}
