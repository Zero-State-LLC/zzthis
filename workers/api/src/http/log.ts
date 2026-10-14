// FR-027: the method, the route template, the status, the duration, cache
// hit or miss, the limiter rule, and the data center. Never a code, record
// text, a token, a nonce, a photo, or an IP address.
//
// RM-036: plus the request id, the Cloudflare ray id, and the deployed
// Worker version, so one line can be traced to a request and a release.
// None of the three carries request data.
export interface LogLine {
  readonly method: string;
  readonly route: string;
  readonly status: number;
  readonly duration_ms: number;
  readonly cache: string | null;
  readonly limiter: string | null;
  readonly colo: string | null;
  readonly request_id: string | null;
  readonly ray: string | null;
  readonly version: string | null;
}

export function rayId(request: Request): string | null {
  return request.headers.get("cf-ray");
}

// The version metadata binding (wrangler [version_metadata]). It is absent
// in local runs and tests that do not set it.
export function workerVersion(env: {
  readonly [name: string]: unknown;
}): string | null {
  const metadata = env["CF_VERSION_METADATA"] as { id?: unknown } | undefined;
  return typeof metadata?.id === "string" ? metadata.id : null;
}

// RM-036: an unhandled error's storage class, from its message prefix only.
// D1 errors start "D1_"; anything else is "other". The message itself is
// never logged, since it can carry request data.
export function errorClass(error: Error): "d1" | "other" {
  return error.message.startsWith("D1_") ? "d1" : "other";
}

export function writeLog(line: LogLine): void {
  console.log(JSON.stringify(line));
}

export function colo(request: Request): string | null {
  const cf = request.cf as { colo?: unknown } | undefined;
  return typeof cf?.colo === "string" ? cf.colo : null;
}

// The setting names only, never their values.
export function logConfigError(problems: readonly string[]): void {
  console.error(JSON.stringify({ event: "config-error", settings: problems }));
}
