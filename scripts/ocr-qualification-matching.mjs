function assertBox(box, label) {
  if (
    !box ||
    ![box.x, box.y, box.width, box.height].every(Number.isFinite) ||
    box.x < 0 ||
    box.y < 0 ||
    box.width <= 0 ||
    box.height <= 0 ||
    box.x + box.width > 1 ||
    box.y + box.height > 1
  ) {
    throw new TypeError(`invalid_normalized_box:${label}`);
  }
}

export function normalizedBoxIoU(left, right) {
  assertBox(left, "left");
  assertBox(right, "right");
  const intersectionWidth = Math.max(
    0,
    Math.min(left.x + left.width, right.x + right.width) -
      Math.max(left.x, right.x),
  );
  const intersectionHeight = Math.max(
    0,
    Math.min(left.y + left.height, right.y + right.height) -
      Math.max(left.y, right.y),
  );
  const intersection = intersectionWidth * intersectionHeight;
  const union =
    left.width * left.height + right.width * right.height - intersection;
  return union === 0 ? 0 : intersection / union;
}

// Hungarian assignment for a square, non-negative weight matrix. Zero-weight
// edges are equivalent to unmatched rows/columns and are filtered by callers.
function maximumAssignment(weights) {
  const size = weights.length;
  if (size === 0) return [];
  const maxWeight = Math.max(0, ...weights.flat());
  const u = Array(size + 1).fill(0);
  const v = Array(size + 1).fill(0);
  const p = Array(size + 1).fill(0);
  const way = Array(size + 1).fill(0);

  for (let row = 1; row <= size; row += 1) {
    p[0] = row;
    let column0 = 0;
    const minValue = Array(size + 1).fill(Number.POSITIVE_INFINITY);
    const used = Array(size + 1).fill(false);
    do {
      used[column0] = true;
      const row0 = p[column0];
      let delta = Number.POSITIVE_INFINITY;
      let column1 = 0;
      for (let column = 1; column <= size; column += 1) {
        if (used[column]) continue;
        const cost = maxWeight - weights[row0 - 1][column - 1];
        const current = cost - u[row0] - v[column];
        if (current < minValue[column]) {
          minValue[column] = current;
          way[column] = column0;
        }
        if (minValue[column] < delta) {
          delta = minValue[column];
          column1 = column;
        }
      }
      for (let column = 0; column <= size; column += 1) {
        if (used[column]) {
          u[p[column]] += delta;
          v[column] -= delta;
        } else {
          minValue[column] -= delta;
        }
      }
      column0 = column1;
    } while (p[column0] !== 0);

    do {
      const column1 = way[column0];
      p[column0] = p[column1];
      column0 = column1;
    } while (column0 !== 0);
  }

  return p.slice(1).map((row, column) => ({ row: row - 1, column }));
}

/**
 * Match predicted fiducials to truth one-to-one, maximizing total eligible IoU.
 * Roles must match and an edge is eligible at or above the frozen threshold.
 */
export function matchFiducials(predictions, truths, threshold) {
  if (!Array.isArray(predictions) || !Array.isArray(truths)) {
    throw new TypeError("fiducial_lists_required");
  }
  if (!Number.isFinite(threshold) || threshold <= 0 || threshold > 1) {
    throw new RangeError("fiducial_iou_threshold_out_of_range");
  }
  for (const [index, item] of predictions.entries()) {
    if (!item || !["opening", "closing", "unknown"].includes(item.role)) {
      throw new TypeError(`invalid_prediction_role:${index}`);
    }
    assertBox(item.box, `prediction:${index}`);
  }
  for (const [index, item] of truths.entries()) {
    if (!item || !["opening", "closing"].includes(item.role)) {
      throw new TypeError(`invalid_truth_role:${index}`);
    }
    assertBox(item.box, `truth:${index}`);
  }

  const size = Math.max(predictions.length, truths.length);
  const scores = Array.from({ length: size }, () => Array(size).fill(0));
  const overlaps = Array.from({ length: predictions.length }, () =>
    Array(truths.length).fill(0),
  );
  for (
    let predictionIndex = 0;
    predictionIndex < predictions.length;
    predictionIndex += 1
  ) {
    for (let truthIndex = 0; truthIndex < truths.length; truthIndex += 1) {
      if (predictions[predictionIndex].role !== truths[truthIndex].role)
        continue;
      const iou = normalizedBoxIoU(
        predictions[predictionIndex].box,
        truths[truthIndex].box,
      );
      overlaps[predictionIndex][truthIndex] = iou;
      if (iou >= threshold) scores[predictionIndex][truthIndex] = iou;
    }
  }

  const matches = maximumAssignment(scores)
    .filter(
      ({ row, column }) =>
        row < predictions.length &&
        column < truths.length &&
        scores[row][column] >= threshold,
    )
    .map(({ row, column }) => ({
      prediction_index: row,
      truth_index: column,
      iou: overlaps[row][column],
    }))
    .sort((left, right) => left.prediction_index - right.prediction_index);
  const matchedPredictions = new Set(
    matches.map((match) => match.prediction_index),
  );
  const matchedTruths = new Set(matches.map((match) => match.truth_index));

  return {
    matches,
    unmatched_prediction_indices: predictions
      .map((_, index) => index)
      .filter((index) => !matchedPredictions.has(index)),
    unmatched_truth_indices: truths
      .map((_, index) => index)
      .filter((index) => !matchedTruths.has(index)),
  };
}

/**
 * Reconcile endpoint matches with predicted pair IDs without using payload text.
 * A predicted pair is correct only if exactly one opening and closing endpoint
 * both matched to the same ground-truth pair.
 */
export function scoreFiducialPairs(predictions, truths, matches) {
  if (
    !Array.isArray(predictions) ||
    !Array.isArray(truths) ||
    !Array.isArray(matches)
  ) {
    throw new TypeError("fiducial_pair_inputs_required");
  }

  const { predictionToTruth, truthToPrediction } = indexMatches(
    predictions,
    truths,
    matches,
  );
  const truthPairs = indexTruthPairs(truths);
  const predictedPairs = indexPredictedPairs(predictions);
  const correctPairs = [];
  const falsePairs = [];
  for (const [predictedPairId, pair] of predictedPairs) {
    const score = scorePredictedPair(
      predictedPairId,
      pair,
      truths,
      predictionToTruth,
    );
    (score.correct ? correctPairs : falsePairs).push(score.result);
  }

  const completeTruthPairIds = [...truthPairs]
    .filter(
      ([, pair]) => pair.opening !== undefined && pair.closing !== undefined,
    )
    .map(([pairId]) => pairId)
    .sort();
  const detectedCompleteTruthPairIds = completeTruthPairIds.filter((pairId) => {
    const pair = truthPairs.get(pairId);
    return (
      truthToPrediction.has(pair.opening) && truthToPrediction.has(pair.closing)
    );
  });

  return {
    correct_pairs: correctPairs,
    false_pairs: falsePairs,
    complete_truth_pair_ids: completeTruthPairIds,
    detected_complete_truth_pair_ids: detectedCompleteTruthPairIds,
    missed_truth_pair_ids: completeTruthPairIds.filter(
      (pairId) => !detectedCompleteTruthPairIds.includes(pairId),
    ),
    correctly_linked_truth_pair_ids: correctPairs
      .map((pair) => pair.truth_pair_id)
      .sort(),
  };
}

function indexMatches(predictions, truths, matches) {
  const predictionToTruth = new Map();
  const truthToPrediction = new Map();
  for (const match of matches) {
    const { prediction_index: predictionIndex, truth_index: truthIndex } =
      match;
    if (
      !Number.isInteger(predictionIndex) ||
      predictionIndex < 0 ||
      predictionIndex >= predictions.length ||
      !Number.isInteger(truthIndex) ||
      truthIndex < 0 ||
      truthIndex >= truths.length ||
      predictionToTruth.has(predictionIndex) ||
      truthToPrediction.has(truthIndex)
    ) {
      throw new TypeError("invalid_fiducial_match_assignment");
    }
    predictionToTruth.set(predictionIndex, truthIndex);
    truthToPrediction.set(truthIndex, predictionIndex);
  }
  return { predictionToTruth, truthToPrediction };
}

function indexTruthPairs(truths) {
  const truthPairs = new Map();
  for (const [index, truth] of truths.entries()) {
    if (typeof truth.pair_id !== "string" || truth.pair_id.length === 0) {
      throw new TypeError(`invalid_truth_pair_id:${index}`);
    }
    const pair = truthPairs.get(truth.pair_id) ?? {};
    if (pair[truth.role] !== undefined) {
      throw new TypeError(
        `duplicate_truth_pair_endpoint:${truth.pair_id}:${truth.role}`,
      );
    }
    pair[truth.role] = index;
    truthPairs.set(truth.pair_id, pair);
  }
  return truthPairs;
}

function indexPredictedPairs(predictions) {
  const predictedPairs = new Map();
  for (const [index, prediction] of predictions.entries()) {
    if (prediction.pair_id === null || prediction.pair_id === undefined)
      continue;
    if (
      typeof prediction.pair_id !== "string" ||
      prediction.pair_id.length === 0
    ) {
      throw new TypeError(`invalid_prediction_pair_id:${index}`);
    }
    const pair = predictedPairs.get(prediction.pair_id) ?? {
      opening: [],
      closing: [],
      unknown: [],
    };
    if (!Array.isArray(pair[prediction.role])) {
      throw new TypeError(`invalid_prediction_role:${index}`);
    }
    pair[prediction.role].push(index);
    predictedPairs.set(prediction.pair_id, pair);
  }
  return predictedPairs;
}

function scorePredictedPair(predictedPairId, pair, truths, predictionToTruth) {
  const openingIndex = pair.opening.length === 1 ? pair.opening[0] : null;
  const closingIndex = pair.closing.length === 1 ? pair.closing[0] : null;
  const openingTruth = truthForPrediction(
    openingIndex,
    predictionToTruth,
    truths,
  );
  const closingTruth = truthForPrediction(
    closingIndex,
    predictionToTruth,
    truths,
  );
  const correct =
    pair.unknown.length === 0 &&
    openingTruth?.role === "opening" &&
    closingTruth?.role === "closing" &&
    openingTruth.pair_id === closingTruth.pair_id;

  if (correct) {
    return {
      correct: true,
      result: {
        predicted_pair_id: predictedPairId,
        truth_pair_id: openingTruth.pair_id,
        opening_prediction_index: openingIndex,
        closing_prediction_index: closingIndex,
      },
    };
  }
  return {
    correct: false,
    result: {
      predicted_pair_id: predictedPairId,
      prediction_indices: [...pair.opening, ...pair.closing, ...pair.unknown],
      matched_truth_pair_ids: [
        openingTruth?.pair_id,
        closingTruth?.pair_id,
      ].filter((pairId) => pairId !== undefined),
    },
  };
}

function truthForPrediction(predictionIndex, predictionToTruth, truths) {
  if (predictionIndex === null) return undefined;
  const truthIndex = predictionToTruth.get(predictionIndex);
  return truthIndex === undefined ? undefined : truths[truthIndex];
}
