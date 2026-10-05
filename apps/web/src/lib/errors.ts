import { ApiFailure, Offline, SignedOut } from "./api.ts";
import type { StringKey } from "./strings.ts";

// Where the failure happened, because design/UX.md Errors maps one error
// code to different sentences on a resolve, a create, and other writes.
export type Action =
  "resolve" | "create" | "write" | "read" | "signin" | "delete";

function resolveMessage(failure: ApiFailure): StringKey {
  if (failure.status === 404) return "resolve.not_found";
  if (failure.status === 400) {
    if (failure.reason === "check-mismatch") return "scan.check_mismatch";
    if (failure.reason === "wrong-length") return "scan.wrong_length";
    return "type.malformed";
  }
  // A bare mark is not resolved; the person types the code.
  if (failure.status === 422) return "scan.bare";
  if (failure.status === 429) return "resolve.rate_limited";
  return "error.unavailable";
}

const BY_CODE: Partial<Record<string, StringKey>> = {
  "reroll-cap": "minted.reroll_cap",
  "scope-unavailable": "create.unavailable",
  forbidden: "error.forbidden",
  taken: "error.taken",
  "reserved-handle": "error.reserved_handle",
  "content-refused": "create.content_refused",
  "not-found": "resolve.not_found",
  "rate-limited": "resolve.rate_limited",
  unauthorized: "common.sign_in_needed",
};

// A 400 malformed or a 500 on a write stores nothing; the fields keep what
// the person typed (spec 005 Web session, Write errors).
function writeMessage(failure: ApiFailure, action: Action): StringKey {
  const byCode = failure.code === null ? undefined : BY_CODE[failure.code];
  if (byCode !== undefined) return byCode;
  if (failure.status === 503) {
    return action === "create" ? "create.unavailable" : "error.unavailable";
  }
  if (action !== "read" && (failure.status === 400 || failure.status === 500)) {
    return "error.nothing_saved";
  }
  return "error.unavailable";
}

// One sentence from design/copy.json for any failure (design/UX.md Errors).
export function messageFor(error: unknown, action: Action): StringKey {
  if (error instanceof Offline) {
    return action === "resolve"
      ? "resolve.not_on_device"
      : "error.no_connection";
  }
  if (error instanceof SignedOut) return "common.sign_in_needed";
  if (action === "signin") return "signin.failed";
  if (action === "delete") return "delete.failed";
  if (!(error instanceof ApiFailure)) return "error.unavailable";
  return action === "resolve"
    ? resolveMessage(error)
    : writeMessage(error, action);
}
