import { scoreQualificationObservations } from "./ocr-qualification-scoring-pipeline.mjs";
import { replayDecoderEvidence } from "./ocr-qualification-decoder-replay.mjs";
import { summarizeSigstoreVerifications } from "./ocr-qualification-verification-summary.mjs";
import { validateTrustedAttestationTimeline } from "./ocr-qualification-trusted-time.mjs";

export function runDecoderReplay(documents, schemaErrors) {
  if (
    schemaErrors.length > 0 ||
    !documents.manifest ||
    !documents.adapterResults ||
    !documents.candidateBundle ||
    !documents.gateConfig
  ) {
    return { performed: false, reason: "decoder_replay_inputs_invalid" };
  }
  return replayDecoderEvidence(
    documents.manifest,
    documents.adapterResults,
    documents.candidateBundle,
    documents.gateConfig,
  );
}

export function runScoring(documents, errors, decoderReplay, identityCheck) {
  if (
    errors.length > 0 ||
    !decoderReplay.performed ||
    decoderReplay.errors.length > 0 ||
    !identityCheck.verified
  ) {
    return { performed: false, reason: "scoring_and_receipt_not_performed" };
  }
  try {
    return {
      performed: true,
      result: scoreQualificationObservations(documents),
    };
  } catch {
    return { performed: false, reason: "qualification_scoring_failed" };
  }
}

export function buildQualificationReasonCodes({
  errors,
  policyPresent,
  policyError,
  sigstoreVerifications,
  executionAttestation,
  decoderReplay,
  decoderIdentityCheck,
  scoring,
  receiptArtifact,
  receiptAssemblyError,
}) {
  const reasonCodes = [...new Set(errors)];
  if (!policyPresent) reasonCodes.push("protected_verifier_policy_missing");
  if (policyError) reasonCodes.push(policyError);
  const sigstoreSummary = summarizeSigstoreVerifications(sigstoreVerifications);
  reasonCodes.push(...sigstoreSummary.reasons);
  const trustedTimeValidation = validateTrustedAttestationTimeline(
    executionAttestation,
    sigstoreVerifications,
  );
  reasonCodes.push(...trustedTimeValidation.reasonCodes);
  if (!decoderReplay.performed) {
    reasonCodes.push(decoderReplay.reason);
  } else {
    reasonCodes.push(...decoderIdentityCheck.reasons);
    reasonCodes.push(
      receiptArtifact
        ? "incomplete_non_authorizing_receipt_generated"
        : (receiptAssemblyError ??
            (scoring.performed
              ? "receipt_generation_not_performed"
              : (scoring.reason ?? "scoring_and_receipt_not_performed"))),
    );
  }
  return { reasonCodes, sigstoreSummary, trustedTimeValidation };
}

export function scoringAndReceiptStatus(scoring, receiptArtifact) {
  if (!scoring.performed) return "NOT_PERFORMED";
  return receiptArtifact ? "INCOMPLETE_RECEIPT" : "SCORED_NO_RECEIPT";
}
