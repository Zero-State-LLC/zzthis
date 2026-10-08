function cross(a, b, p) {
  return (b.x - a.x) * (p.y - a.y) - (b.y - a.y) * (p.x - a.x);
}

function polygonArea(points) {
  let sum = 0;
  for (let i = 0; i < points.length; i += 1) {
    const current = points[i];
    const next = points[(i + 1) % points.length];
    sum += current.x * next.y - next.x * current.y;
  }
  return Math.abs(sum) / 2;
}

function segmentsIntersect(a, b, c, d) {
  const orient = (p, q, r) => cross(p, q, r);
  const onSegment = (p, q, r) =>
    Math.min(p.x, r.x) <= q.x + 1e-12 &&
    q.x <= Math.max(p.x, r.x) + 1e-12 &&
    Math.min(p.y, r.y) <= q.y + 1e-12 &&
    q.y <= Math.max(p.y, r.y) + 1e-12;
  const abC = orient(a, b, c);
  const abD = orient(a, b, d);
  const cdA = orient(c, d, a);
  const cdB = orient(c, d, b);
  if (abC * abD < -1e-12 && cdA * cdB < -1e-12) {
    return true;
  }
  return (
    (Math.abs(abC) <= 1e-12 && onSegment(a, c, b)) ||
    (Math.abs(abD) <= 1e-12 && onSegment(a, d, b)) ||
    (Math.abs(cdA) <= 1e-12 && onSegment(c, a, d)) ||
    (Math.abs(cdB) <= 1e-12 && onSegment(c, b, d))
  );
}

function validateConvexPolygon(points, label) {
  validateNormalizedPoints(points, label);
  validateConsistentConvexTurns(points, label);
  validateSimplePolygonEdges(points, label);
  if (polygonArea(points) <= Number.EPSILON) {
    throw new TypeError(`${label} must have positive area`);
  }
}

function validateNormalizedPoints(points, label) {
  if (!Array.isArray(points) || points.length < 3) {
    throw new TypeError(`${label} must contain at least three points`);
  }
  for (const point of points) {
    if (
      !Number.isFinite(point?.x) ||
      !Number.isFinite(point?.y) ||
      point.x < 0 ||
      point.x > 1 ||
      point.y < 0 ||
      point.y > 1
    ) {
      throw new TypeError(
        `${label} points must be finite normalized coordinates`,
      );
    }
  }
}

function validateConsistentConvexTurns(points, label) {
  let direction = 0;
  for (let i = 0; i < points.length; i += 1) {
    const turn = cross(
      points[i],
      points[(i + 1) % points.length],
      points[(i + 2) % points.length],
    );
    if (Math.abs(turn) <= Number.EPSILON) continue;
    const nextDirection = Math.sign(turn);
    if (direction !== 0 && direction !== nextDirection) {
      throw new TypeError(
        `${label} must be a convex, consistently ordered polygon`,
      );
    }
    direction = nextDirection;
  }
  if (direction === 0) {
    throw new TypeError(`${label} must have positive area`);
  }
}

function validateSimplePolygonEdges(points, label) {
  for (let i = 0; i < points.length; i += 1) {
    const nextI = (i + 1) % points.length;
    for (let j = i + 1; j < points.length; j += 1) {
      const nextJ = (j + 1) % points.length;
      if (i === j || nextI === j || nextJ === i) continue;
      if (
        segmentsIntersect(points[i], points[nextI], points[j], points[nextJ])
      ) {
        throw new TypeError(
          `${label} must be a simple polygon without self-intersections`,
        );
      }
    }
  }
}

function lineIntersection(start, end, clipStart, clipEnd) {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const cx = clipEnd.x - clipStart.x;
  const cy = clipEnd.y - clipStart.y;
  const denominator = dx * cy - dy * cx;
  if (Math.abs(denominator) <= Number.EPSILON) return end;
  const t =
    ((clipStart.x - start.x) * cy - (clipStart.y - start.y) * cx) / denominator;
  return { x: start.x + t * dx, y: start.y + t * dy };
}

function polygonIntersection(subject, clip) {
  let output = subject;
  const clipOrientation = Math.sign(
    clip.reduce((sum, point, i) => {
      const next = clip[(i + 1) % clip.length];
      return sum + point.x * next.y - next.x * point.y;
    }, 0),
  );
  for (let i = 0; i < clip.length; i += 1) {
    const clipStart = clip[i];
    const clipEnd = clip[(i + 1) % clip.length];
    const input = output;
    output = [];
    if (input.length === 0) break;
    let previous = input[input.length - 1];
    let previousInside =
      cross(clipStart, clipEnd, previous) * clipOrientation >= -1e-12;
    for (const current of input) {
      const currentInside =
        cross(clipStart, clipEnd, current) * clipOrientation >= -1e-12;
      if (currentInside !== previousInside) {
        output.push(lineIntersection(previous, current, clipStart, clipEnd));
      }
      if (currentInside) output.push(current);
      previous = current;
      previousInside = currentInside;
    }
  }
  return output;
}

export function polygonIoU(left, right) {
  validateConvexPolygon(left, "left polygon");
  validateConvexPolygon(right, "right polygon");
  const intersection = polygonArea(polygonIntersection(left, right));
  const union = polygonArea(left) + polygonArea(right) - intersection;
  if (!(union > 0) || !Number.isFinite(union)) {
    throw new TypeError("polygon union must have positive finite area");
  }
  return Math.max(0, Math.min(1, intersection / union));
}

function median(sorted) {
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1
    ? sorted[middle]
    : (sorted[middle - 1] + sorted[middle]) / 2;
}

function percentileNearestRank(sorted, percentile) {
  return sorted[Math.max(0, Math.ceil(percentile * sorted.length) - 1)];
}

/** Score one device/split group. Missing predicted ROIs score IoU 0 and failed rectification. */
export function scoreRoiAndLatency({ roiTruth, rois, elapsedMs }) {
  if (
    !Array.isArray(roiTruth) ||
    !Array.isArray(rois) ||
    !Array.isArray(elapsedMs)
  ) {
    throw new TypeError("roiTruth, rois, and elapsedMs must be arrays");
  }
  const truthByPair = indexPolygons(roiTruth, "ROI truth");
  const predictionByPair = indexPolygons(rois, "predicted ROI");
  return {
    ...scoreRoiCoverage(truthByPair, predictionByPair),
    ...summarizeLatency(elapsedMs),
  };
}

function indexPolygons(items, label) {
  const truthByPair = new Map();
  for (const item of items) {
    if (!item?.pair_id || truthByPair.has(item.pair_id)) {
      throw new TypeError(
        `${label} pair_id values must be non-empty and unique`,
      );
    }
    validateConvexPolygon(item.polygon, `${label} ${item.pair_id}`);
    truthByPair.set(item.pair_id, item);
  }
  return truthByPair;
}

function scoreRoiCoverage(truthByPair, predictionByPair) {
  const ious = [];
  let rectificationSuccessCount = 0;
  let rectificationMeasured = true;
  const unmeasuredPairIds = [];
  for (const [pairId, truth] of truthByPair) {
    const prediction = predictionByPair.get(pairId);
    if (!prediction) {
      ious.push(0);
      continue;
    }
    ious.push(polygonIoU(truth.polygon, prediction.polygon));
    if (typeof prediction.rectification_succeeded !== "boolean") {
      rectificationMeasured = false;
      unmeasuredPairIds.push(pairId);
    } else if (prediction.rectification_succeeded) {
      rectificationSuccessCount += 1;
    }
  }
  return {
    roi_truth_count: ious.length,
    roi_mean_iou:
      ious.length === 0
        ? null
        : ious.reduce((sum, value) => sum + value, 0) / ious.length,
    rectification_success_count: rectificationSuccessCount,
    rectification_denominator: rectificationMeasured ? ious.length : null,
    rectification_success_rate:
      !rectificationMeasured || ious.length === 0
        ? null
        : rectificationSuccessCount / ious.length,
    rectification_unmeasured_pair_ids: unmeasuredPairIds,
  };
}

function summarizeLatency(elapsedMs) {
  for (const value of elapsedMs) {
    if (!Number.isFinite(value) || value < 0) {
      throw new TypeError("elapsedMs values must be finite and non-negative");
    }
  }
  const sortedLatency = [...elapsedMs].sort((a, b) => a - b);
  return {
    latency_sample_count: sortedLatency.length,
    latency_ms:
      sortedLatency.length === 0
        ? null
        : {
            p50: median(sortedLatency),
            p95: percentileNearestRank(sortedLatency, 0.95),
          },
  };
}
