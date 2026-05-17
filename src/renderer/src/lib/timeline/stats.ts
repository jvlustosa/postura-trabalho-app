import type { TimelineSegment, TimelineState } from './types';

export interface ClippedSegment extends TimelineSegment {
  durationMs: number;
}

export const clipSegments = (
  segments: readonly TimelineSegment[],
  rangeStart: number,
  rangeEnd: number,
): ClippedSegment[] => {
  const clipped: ClippedSegment[] = [];
  for (const segment of segments) {
    if (segment.endedAt <= rangeStart || segment.startedAt >= rangeEnd) {
      continue;
    }
    const startedAt = Math.max(segment.startedAt, rangeStart);
    const endedAt = Math.min(segment.endedAt, rangeEnd);
    const durationMs = Math.max(0, endedAt - startedAt);
    if (durationMs === 0) {
      continue;
    }
    clipped.push({ state: segment.state, startedAt, endedAt, durationMs });
  }
  return clipped;
};

export const computeBestStreak = (segments: readonly TimelineSegment[]): number => {
  let best = 0;
  for (const segment of segments) {
    if (segment.state !== 'good') continue;
    const duration = segment.endedAt - segment.startedAt;
    if (duration > best) best = duration;
  }
  return best;
};

export const computeCurrentStreak = (
  segments: readonly TimelineSegment[],
  now: number,
): number => {
  const last = segments[segments.length - 1];
  if (!last || last.state !== 'good') return 0;
  if (now - last.endedAt > 60_000) return 0;
  return last.endedAt - last.startedAt;
};

export interface SparklinePoint {
  bucketStart: number;
  bucketEnd: number;
  goodRatio: number;
  monitoredMs: number;
}

export const computeSparkline = (
  segments: readonly ClippedSegment[],
  rangeStart: number,
  rangeEnd: number,
  bucketCount: number,
): SparklinePoint[] => {
  const totalRange = rangeEnd - rangeStart;
  if (totalRange <= 0 || bucketCount <= 0) return [];
  const bucketMs = totalRange / bucketCount;
  const goodTime = new Array<number>(bucketCount).fill(0);
  const monitoredTime = new Array<number>(bucketCount).fill(0);

  for (const segment of segments) {
    let cursor = segment.startedAt;
    while (cursor < segment.endedAt) {
      const rawIdx = Math.floor((cursor - rangeStart) / bucketMs);
      const idx = Math.max(0, Math.min(bucketCount - 1, rawIdx));
      const bucketEnd = rangeStart + (idx + 1) * bucketMs;
      const sliceEnd = Math.min(bucketEnd, segment.endedAt);
      const sliceDuration = sliceEnd - cursor;
      if (sliceDuration <= 0) break;
      monitoredTime[idx] += sliceDuration;
      if (segment.state === 'good') {
        goodTime[idx] += sliceDuration;
      }
      cursor = sliceEnd;
    }
  }

  const points: SparklinePoint[] = [];
  for (let i = 0; i < bucketCount; i += 1) {
    const bucketStart = rangeStart + i * bucketMs;
    const bucketEnd = bucketStart + bucketMs;
    const monitoredMs = monitoredTime[i];
    const goodRatio = monitoredMs > 0 ? goodTime[i] / monitoredMs : 0;
    points.push({ bucketStart, bucketEnd, goodRatio, monitoredMs });
  }
  return points;
};

export interface Totals {
  good: number;
  warning: number;
  bad: number;
  monitored: number;
}

export const sumTotals = (segments: readonly ClippedSegment[]): Totals => {
  const totals: Totals = { good: 0, warning: 0, bad: 0, monitored: 0 };
  for (const segment of segments) {
    totals[segment.state] += segment.durationMs;
    totals.monitored += segment.durationMs;
  }
  return totals;
};

export const STATE_ORDER: readonly TimelineState[] = ['good', 'warning', 'bad'];
