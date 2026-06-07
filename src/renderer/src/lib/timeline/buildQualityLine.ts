import type { TimelineBucket } from './stats';

export interface QualityPoint {
  /** Bucket index in the original array. */
  index: number;
  x: number;
  y: number;
}

/**
 * Maps monitored buckets to chart coordinates, split into contiguous runs.
 * Buckets without monitoring break the line so gaps are not drawn through.
 */
export const buildQualitySegments = (
  buckets: readonly TimelineBucket[],
  width: number,
  height: number,
): QualityPoint[][] => {
  const n = buckets.length;
  if (n === 0) return [];

  const xOf = (i: number): number => (n === 1 ? width / 2 : (i / (n - 1)) * width);
  const yOf = (ratio: number): number => height - ratio * height;

  const segments: QualityPoint[][] = [];
  let run: QualityPoint[] = [];

  for (let i = 0; i < n; i += 1) {
    const bucket = buckets[i];
    if (bucket.monitoredMs === 0) {
      if (run.length > 0) {
        segments.push(run);
        run = [];
      }
      continue;
    }
    run.push({ index: i, x: xOf(i), y: yOf(bucket.goodRatio) });
  }
  if (run.length > 0) segments.push(run);

  return segments;
};

/** Closed SVG path filling the area under a run of points down to `baselineY`. */
export const buildAreaPath = (points: readonly QualityPoint[], baselineY: number): string => {
  if (points.length === 0) return '';
  const first = points[0];
  const last = points[points.length - 1];
  const line = points.map((p) => `L${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  return `M${first.x.toFixed(1)},${baselineY} ${line} L${last.x.toFixed(1)},${baselineY} Z`;
};

/** `points` attribute string for an SVG polyline. */
export const toPolylinePoints = (points: readonly QualityPoint[]): string =>
  points.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
