import { describe, expect, it } from "vitest";
import { ApiFailure, Offline, SignedOut } from "../src/lib/api.ts";
import { messageFor, type Action } from "../src/lib/errors.ts";
import { t } from "../src/lib/strings.ts";

const fail = (
  status: number,
  code: string | null = null,
  reason: string | null = null,
) => new ApiFailure(status, code, reason);

describe("one sentence per failure (design/UX.md Errors)", () => {
  it("maps a resolve", () => {
    const rows: [ApiFailure, string][] = [
      [fail(404, "not-found"), "No match. Check the words and try again."],
      [fail(400, "malformed", "check-mismatch"), t("scan.check_mismatch")],
      [fail(400, "malformed", "wrong-length"), t("scan.wrong_length")],
      [fail(400, "malformed", "no-closing-marker"), t("type.malformed")],
      [fail(422, "unsupported", "bare-mark-needs-context"), t("scan.bare")],
      [fail(429, "rate-limited"), "Wait a moment, then try again."],
      [fail(503, "not-ready"), t("error.unavailable")],
    ];
    for (const [failure, sentence] of rows) {
      expect(t(messageFor(failure, "resolve"))).toBe(sentence);
    }
    expect(messageFor(new Offline(), "resolve")).toBe("resolve.not_on_device");
  });

  it("maps a create, and a write that stores nothing", () => {
    const rows: [ApiFailure, Action, string][] = [
      [fail(400, "malformed"), "create", t("error.nothing_saved")],
      [fail(500, "failed"), "write", t("error.nothing_saved")],
      [fail(403, "reroll-cap"), "create", "These words stay."],
      [
        fail(403, "scope-unavailable"),
        "create",
        "Create is not available yet.",
      ],
      [fail(503, "not-ready"), "create", "Create is not available yet."],
      [fail(503, "not-ready"), "write", t("error.unavailable")],
      [fail(403, "forbidden"), "write", "You cannot do that."],
      [fail(409, "taken"), "create", "That code is already taken."],
      [fail(422, "reserved-handle"), "create", "That name cannot be claimed."],
      [fail(422, "content-refused"), "create", t("create.content_refused")],
      [fail(404, "not-found"), "write", t("resolve.not_found")],
      [fail(429, "rate-limited"), "write", t("resolve.rate_limited")],
      [fail(401, "unauthorized"), "write", t("common.sign_in_needed")],
      [fail(418), "write", t("error.unavailable")],
    ];
    for (const [failure, action, sentence] of rows) {
      expect(t(messageFor(failure, action))).toBe(sentence);
    }
  });

  it("maps a read, a sign-in, a deletion, and anything unexpected", () => {
    expect(messageFor(fail(500, "failed"), "read")).toBe("error.unavailable");
    expect(messageFor(fail(400, "malformed"), "read")).toBe(
      "error.unavailable",
    );
    expect(messageFor(fail(404, "not-found"), "read")).toBe(
      "resolve.not_found",
    );
    expect(messageFor(fail(401, "unauthorized"), "signin")).toBe(
      "signin.failed",
    );
    expect(messageFor(fail(500, "failed"), "delete")).toBe("delete.failed");
    expect(messageFor(new Offline(), "delete")).toBe("error.no_connection");
    expect(messageFor(new SignedOut(), "create")).toBe("common.sign_in_needed");
    expect(messageFor(new Error("bug"), "write")).toBe("error.unavailable");
  });
});
