import { describe, expect, it } from 'vitest';

import { buildAreaPath, buildQualitySegments, toPolylinePoints } from './buildQualityLine';
import type { TimelineBucket } from './stats';

const bucket = (goodRatio: number, monitoredMs: number): TimelineBucket => ({
  bucketStart: 0,
  bucketEnd: 0,
  bucketMs: 0,
  goodMs: 0,
  warningMs: 0,
  badMs: 0,
  monitoredMs,
  goodRatio,
});

describe('buildQualitySegments', () => {
  it('returns no segments for empty input', () => {
    expect(buildQualitySegments([], 100, 60)).toEqual([]);
  });

  it('maps goodRatio to inverted y (1 -> top, 0 -> bottom)', () => {
    const [segment] = buildQualitySegments([bucket(1, 10), bucket(0, 10)], 100, 60);
    expect(segment[0]).toMatchObject({ index: 0, x: 0, y: 0 });
    expect(segment[1]).toMatchObject({ index: 1, x: 100, y: 60 });
  });

  it('centers a single point', () => {
    const [segment] = buildQualitySegments([bucket(0.5, 10)], 100, 60);
    expect(segment[0]).toMatchObject({ x: 50, y: 30 });
  });

  it('splits contiguous runs around unmonitored gaps', () => {
    const segments = buildQualitySegments(
      [bucket(1, 10), bucket(0.5, 0), bucket(0.8, 10), bucket(0.2, 10)],
      90,
      60,
    );
    expect(segments).toHaveLength(2);
    expect(segments[0].map((p) => p.index)).toEqual([0]);
    expect(segments[1].map((p) => p.index)).toEqual([2, 3]);
  });

  it('ignores trailing gap without emitting an empty run', () => {
    const segments = buildQualitySegments([bucket(1, 10), bucket(0.5, 0)], 100, 60);
    expect(segments).toHaveLength(1);
  });
});

describe('buildAreaPath', () => {
  it('returns empty string for no points', () => {
    expect(buildAreaPath([], 60)).toBe('');
  });

  it('closes the path along the baseline', () => {
    const path = buildAreaPath(
      [
        { index: 0, x: 0, y: 0 },
        { index: 1, x: 100, y: 30 },
      ],
      60,
    );
    expect(path).toBe('M0.0,60 L0.0,0.0 L100.0,30.0 L100.0,60 Z');
  });
});

describe('toPolylinePoints', () => {
  it('joins points into a polyline attribute string', () => {
    expect(
      toPolylinePoints([
        { index: 0, x: 0, y: 0 },
        { index: 1, x: 50, y: 30 },
      ]),
    ).toBe('0.0,0.0 50.0,30.0');
  });
});
