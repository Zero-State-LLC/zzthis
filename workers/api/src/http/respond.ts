import type { components } from "../generated/api.ts";

export type ErrorCode = components["schemas"]["Error"]["error"];

const JSON_TYPE = "application/json";

export function json(
  status: number,
  body: unknown,
  headers: HeadersInit = {},
): Response {
  const out = new Headers(headers);
  out.set("Content-Type", JSON_TYPE);
  return new Response(JSON.stringify(body), { status, headers: out });
}

// An error the handler decided on. The error mapping turns it into the
// spec 005 Errors row: { "error": code } plus a reason only where the
// reason is the parser's, a check-word result, or bare-mark-needs-context.
export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: ErrorCode,
    readonly reason?: string,
    readonly headers: HeadersInit = {},
  ) {
    super(code);
  }

  toResponse(): Response {
    const body =
      this.reason === undefined
        ? { error: this.code }
        : { error: this.code, reason: this.reason };
    return json(this.status, body, this.headers);
  }
}

export const malformed = (reason?: string) =>
  new ApiError(400, "malformed", reason);
export const unauthorized = (headers?: HeadersInit) =>
  new ApiError(401, "unauthorized", undefined, headers);
export const forbidden = () => new ApiError(403, "forbidden");
export const notFound = () => new ApiError(404, "not-found");
export const notReady = () => new ApiError(503, "not-ready");
export const failed = () => new ApiError(500, "failed");
