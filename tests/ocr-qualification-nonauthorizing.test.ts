import { describe, expect, it } from "vitest";
import { assertNonAuthorizingReport } from "../scripts/ocr-qualification-nonauthorizing.mjs";

describe("trusted qualification workflow report guard", () => {
  const incompleteReport = {
    status: "INCOMPLETE",
    disposition: "NO_PROMOTION",
    promotion_eligible: false,
    qualification_scoring: { status: "DIAGNOSTIC_ONLY" },
    qualification_receipt: {
      validation: { authorizesPromotion: false },
    },
  };

  it("accepts only an explicitly incomplete and non-authorizing result", () => {
    expect(assertNonAuthorizingReport(incompleteReport)).toBe(
      "INCOMPLETE_NO_PROMOTION",
    );
  });

  it.each([
    { status: "PASS" },
    { disposition: "PASS" },
    { promotion_eligible: true },
    { qualification_scoring: null },
    {
      qualification_receipt: {
        validation: { authorizesPromotion: true },
      },
    },
  ])("rejects unsafe report state %j", (change) => {
    expect(() =>
      assertNonAuthorizingReport({ ...incompleteReport, ...change }),
    ).toThrow("qualification_report_not_fail_closed");
  });
});
