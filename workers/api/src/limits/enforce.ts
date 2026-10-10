import type { AppContext } from "../http/context.ts";
import { ApiError, notReady } from "../http/respond.ts";
import { hmacTag } from "../lib/crypto.ts";
import type { Take } from "./limiter.ts";
import {
  CALLER_RULES,
  IP_RULES,
  USER_RULES,
  type CallerRule,
  type IpRule,
  type Limit,
  type UserRule,
} from "./rules.ts";

// RM-038: one limiter call, bounded by the limiter timeout. A thrown error
// or a call that does not answer in time is null, logged by rule only.
async function callLimiter(
  c: AppContext,
  rule: string,
  key: string,
  limit: number,
  windowMs: number,
): Promise<Take | null> {
  const namespace = c.env.ZZ_LIMITER;
  let timer = 0;
  const timeout = new Promise<null>((resolve) => {
    timer = setTimeout(() => resolve(null), c.get("deps").limiterTimeoutMs);
  });
  try {
    const result = await Promise.race([
      namespace
        .get(namespace.idFromName(key))
        .take(limit, windowMs, c.get("now")),
      timeout,
    ]);
    if (result === null) throw new Error("limiter timeout");
    return result;
  } catch {
    console.error(JSON.stringify({ event: "limiter-fault", rule }));
    return null;
  } finally {
    clearTimeout(timer);
  }
}

// RM-038: discovery and the OpenAPI document stay up when the limiter is
// down, so clients can still learn the contract. Every other rule fails
// closed with 503 not-ready, which every operation declares, so a limiter
// fault never becomes unlimited traffic or a 500.
const FAIL_OPEN: ReadonlySet<string> = new Set(["discovery"]);

async function take(
  c: AppContext,
  rule: string,
  subject: string,
  limit: Limit,
): Promise<void> {
  c.set("limiter", `${rule}:${subject.slice(0, subject.indexOf(":"))}`);
  const result = await callLimiter(
    c,
    rule,
    `${rule}:${subject}`,
    limit.limit,
    limit.windowMs,
  );
  if (result === null) {
    if (FAIL_OPEN.has(rule)) return;
    throw notReady();
  }
  if (!result.allowed) {
    // FR-011: one body, whether or not any code exists.
    throw new ApiError(429, "rate-limited", undefined, {
      "Retry-After": String(result.retryAfter),
    });
  }
}

// RM-030: the /64 prefix of an IPv6 address, as four lowercase hextets,
// or null when the text is not a well-formed IPv6 address.
function ipv6Prefix64(ip: string): string | null {
  const halves = ip.split("::");
  if (halves.length > 2) return null;
  const words = (part: string): string[] =>
    part === "" ? [] : part.split(":");
  const head = words(halves[0] as string);
  const tail = halves.length === 2 ? words(halves[1] as string) : [];
  const missing = 8 - head.length - tail.length;
  if (halves.length === 1 ? missing !== 0 : missing < 1) return null;
  const all = [
    ...head,
    ...Array<string>(halves.length === 1 ? 0 : missing).fill("0"),
    ...tail,
  ];
  const prefix = all.slice(0, 4);
  if (!prefix.every((word) => /^[0-9a-f]{1,4}$/.test(word))) return null;
  return prefix.map((word) => parseInt(word, 16).toString(16)).join(":");
}

// RM-030: what one IP bucket counts. IPv4 and IPv4-mapped IPv6 count per
// address. Other IPv6 counts per /64, the smallest block one subscriber is
// usually given, so rotating addresses inside it gains nothing. Text that
// does not parse counts as itself.
export function ipBucket(ip: string): string {
  const lower = ip.toLowerCase();
  if (!lower.includes(":")) return lower;
  const mapped = /^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/.exec(lower);
  if (mapped !== null) return mapped[1] as string;
  const prefix = ipv6Prefix64(lower);
  return prefix === null ? lower : `${prefix}::/64`;
}

// The limiter key holds an HMAC of the IP bucket, never the IP (FR-027).
async function ipSubject(c: AppContext): Promise<string> {
  const ip = ipBucket(c.req.header("CF-Connecting-IP") ?? "unknown");
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
  const result = await callLimiter(
    c,
    rule,
    `${rule}:refused:user:${accountId}`,
    Number.MAX_SAFE_INTEGER,
    USER_RULES[rule].windowMs,
  );
  // A limiter fault skips the audit row; the refusal itself stands.
  return result?.count === 1;
}
