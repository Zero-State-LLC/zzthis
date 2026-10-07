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
  const union = left.width * left.height + right.width * right.height - intersection;
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
    if (!item || !["opening", "closing"].includes(item.role)) {
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
  for (let predictionIndex = 0; predictionIndex < predictions.length; predictionIndex += 1) {
    for (let truthIndex = 0; truthIndex < truths.length; truthIndex += 1) {
      if (predictions[predictionIndex].role !== truths[truthIndex].role) continue;
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
  const matchedPredictions = new Set(matches.map((match) => match.prediction_index));
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
