export function validateReceiptDisposition(receipt, gateFailures) {
  if (receipt.disposition === "INCOMPLETE") {
    return {
      status: "INCOMPLETE",
      errors: [receipt.no_promotion_reason ?? "receipt is marked incomplete"],
      gateFailures,
      authorizesPromotion: false,
    };
  }
  if (receipt.disposition === "FAIL") {
    if (
      receipt.false_accepts.length > 0 ||
      receipt.false_valid_cases.length > 0
    ) {
      return incomplete(
        "FAIL receipt conflicts with false cases that require NO_PROMOTION",
      );
    }
    if (gateFailures.length === 0) {
      return incomplete("FAIL receipt has no failed release gate");
    }
    return {
      status: "FAIL",
      errors: [],
      gateFailures,
      authorizesPromotion: false,
    };
  }
  if (receipt.disposition === "NO_PROMOTION") {
    return {
      status: "NO_PROMOTION",
      errors: [],
      gateFailures,
      authorizesPromotion: false,
    };
  }
  if (
    gateFailures.length > 0 ||
    receipt.false_accepts.length > 0 ||
    receipt.false_valid_cases.length > 0
  ) {
    return {
      status: "NO_PROMOTION",
      errors: [],
      gateFailures,
      authorizesPromotion: false,
    };
  }
  return {
    status: "SEMANTIC_CHECKS_PASS",
    errors: [],
    gateFailures: [],
    authorizesPromotion: false,
  };
}

function incomplete(message) {
  return {
    status: "INCOMPLETE",
    errors: [message],
    gateFailures: [],
    authorizesPromotion: false,
  };
}
