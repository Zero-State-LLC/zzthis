export interface RoiPolygonPoint {
  readonly x: number;
  readonly y: number;
}

export interface RoiScoringInput {
  readonly roiTruth: readonly {
    readonly pair_id: string;
    readonly polygon: readonly RoiPolygonPoint[];
  }[];
  readonly rois: readonly {
    readonly pair_id: string;
    readonly polygon: readonly RoiPolygonPoint[];
    readonly rectification_succeeded?: boolean;
  }[];
  readonly elapsedMs: readonly number[];
}

export interface RoiLatencyScore {
  readonly roi_truth_count: number;
  readonly roi_mean_iou: number | null;
  readonly rectification_success_count: number;
  readonly rectification_denominator: number | null;
  readonly rectification_success_rate: number | null;
  readonly rectification_unmeasured_pair_ids: readonly string[];
  readonly latency_sample_count: number;
  readonly latency_ms: { readonly p50: number; readonly p95: number } | null;
}

export function polygonIoU(
  left: readonly RoiPolygonPoint[],
  right: readonly RoiPolygonPoint[],
): number;
export function scoreRoiAndLatency(input: RoiScoringInput): RoiLatencyScore;
