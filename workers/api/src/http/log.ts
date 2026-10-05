// FR-027: the method, the route template, the status, the duration, cache
// hit or miss, the limiter rule, and the data center. Never a code, record
// text, a token, a nonce, a photo, or an IP address.
export interface LogLine {
  readonly method: string;
  readonly route: string;
  readonly status: number;
  readonly duration_ms: number;
  readonly cache: string | null;
  readonly limiter: string | null;
  readonly colo: string | null;
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
