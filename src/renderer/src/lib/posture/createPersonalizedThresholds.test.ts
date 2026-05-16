import { describe, expect, it } from 'vitest';

import { createPersonalizedThresholds } from './createPersonalizedThresholds';
import type { PostureAnalysis } from './types';

const sample = (
  headOffset: number,
  shoulderTilt: number,
  neckTilt: number,
  shoulderWidth = 0,
  torsoAspectRatio = 0,
  headVerticalRatio = 0,
): PostureAnalysis['metrics'] => ({
  headOffset,
  shoulderTilt,
  neckTilt,
  shoulderWidth,
  torsoAspectRatio,
  headVerticalRatio,
});

describe('createPersonalizedThresholds', () => {
  it('tightens thresholds when calibration baseline is very aligned', () => {
    const t = createPersonalizedThresholds([sample(0.01, 0.01, 0.01)]);
    expect(t.headWarning).toBeCloseTo(0.08);
    expect(t.shoulderWarning).toBeCloseTo(0.05);
    expect(t.neckWarning).toBeCloseTo(0.07);
  });

  it('caps thresholds at defaults so a bad baseline cannot loosen them', () => {
    const t = createPersonalizedThresholds([sample(0.2, 0.1, 0.15), sample(0.22, 0.11, 0.16)]);
    expect(t.headWarning).toBe(0.14);
    expect(t.shoulderWarning).toBe(0.07);
    expect(t.neckWarning).toBe(0.09);
  });

  it('captures shoulderWidth baseline from samples', () => {
    const t = createPersonalizedThresholds([
      sample(0.01, 0.01, 0.01, 0.22),
      sample(0.01, 0.01, 0.01, 0.21),
      sample(0.01, 0.01, 0.01, 0.23),
    ]);
    expect(t.shoulderWidthBaseline).toBeCloseTo(0.22, 1);
  });

  it('captures torso and head vertical baselines', () => {
    const t = createPersonalizedThresholds([
      sample(0.01, 0.01, 0.01, 0.22, 1.36, 0.9),
      sample(0.01, 0.01, 0.01, 0.22, 1.34, 0.92),
      sample(0.01, 0.01, 0.01, 0.22, 1.38, 0.91),
    ]);
    expect(t.torsoAspectRatioBaseline).toBeCloseTo(1.36, 1);
    expect(t.headVerticalRatioBaseline).toBeCloseTo(0.91, 1);
  });

  it('rejects outliers via IQR', () => {
    const t = createPersonalizedThresholds([
      sample(0.01, 0.01, 0.01, 0.22, 1.3, 0.9),
      sample(0.01, 0.01, 0.01, 0.22, 1.32, 0.9),
      sample(0.01, 0.01, 0.01, 0.22, 1.34, 0.91),
      sample(0.01, 0.01, 0.01, 0.22, 1.36, 0.91),
      sample(0.01, 0.01, 0.01, 0.22, 1.38, 0.92),
      sample(0.01, 0.01, 0.01, 0.22, 0.2, 0.9),
    ]);
    expect(t.torsoAspectRatioBaseline).toBeGreaterThan(1.2);
  });

  it('treats zero values as missing', () => {
    const t = createPersonalizedThresholds([
      sample(0.01, 0.01, 0.01, 0, 0, 0),
      sample(0.01, 0.01, 0.01, 0.22, 1.36, 0.9),
      sample(0.01, 0.01, 0.01, 0.21, 1.34, 0.92),
    ]);
    expect(t.shoulderWidthBaseline).toBeGreaterThan(0.2);
    expect(t.torsoAspectRatioBaseline).toBeGreaterThan(1.3);
  });

  it('returns base thresholds when no metrics provided', () => {
    const t = createPersonalizedThresholds([]);
    expect(t.headWarning).toBe(0.14);
    expect(t.shoulderWidthBaseline).toBe(0);
    expect(t.torsoAspectRatioBaseline).toBe(0);
  });
});
