import {
  matchFiducials,
  scoreFiducialPairs,
} from "./ocr-qualification-matching.mjs";

function rate(numerator, denominator) {
  return {
    numerator,
    denominator,
    rate: denominator === 0 ? null : numerator / denominator,
  };
}

/** Score endpoint detection and pair linking for one sample observation. */
export function scoreFiducialObservation(
  predictions,
  truths,
  fiducialIouThreshold,
) {
  const assignment = matchFiducials(predictions, truths, fiducialIouThreshold);
  const pairScoring = scoreFiducialPairs(
    predictions,
    truths,
    assignment.matches,
  );
  const predictedPairCount = new Set(
    predictions
      .map((prediction) => prediction.pair_id)
      .filter((pairId) => typeof pairId === "string" && pairId.length > 0),
  ).size;
  const correctPairCount = pairScoring.correct_pairs.length;
  const falsePairCount = pairScoring.false_pairs.length;
  const matchedEndpointCount = assignment.matches.length;
  const completeTruthPairCount = pairScoring.complete_truth_pair_ids.length;
  const detectedCompleteTruthPairCount =
    pairScoring.detected_complete_truth_pair_ids.length;

  return {
    endpoint_precision: rate(matchedEndpointCount, predictions.length),
    endpoint_recall: rate(matchedEndpointCount, truths.length),
    false_finder_count: assignment.unmatched_prediction_indices.length,
    false_finder_rate: rate(
      assignment.unmatched_prediction_indices.length,
      predictions.length,
    ),
    missed_endpoint_count: assignment.unmatched_truth_indices.length,
    complete_pair_rate: rate(
      detectedCompleteTruthPairCount,
      completeTruthPairCount,
    ),
    pair_accuracy: rate(correctPairCount, predictedPairCount),
    false_pair_count: falsePairCount,
    false_pair_rate: rate(falsePairCount, predictedPairCount),
    endpoint_matches: assignment.matches,
    correct_pairs: pairScoring.correct_pairs,
    false_pairs: pairScoring.false_pairs,
    complete_truth_pair_count: completeTruthPairCount,
    detected_complete_truth_pair_count: detectedCompleteTruthPairCount,
  };
}
