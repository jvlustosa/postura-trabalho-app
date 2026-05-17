import { describe, expect, it } from 'vitest';

import { analyzePosture } from './analyzePosture';
import type { PoseLandmark, PostureThresholds } from './types';

const baseLandmarks = (): PoseLandmark[] => [
  { name: 'nose', x: 0.5, y: 0.21, visibility: 0.98 },
  { name: 'leftEar', x: 0.44, y: 0.23, visibility: 0.98 },
  { name: 'rightEar', x: 0.56, y: 0.23, visibility: 0.98 },
  { name: 'leftShoulder', x: 0.39, y: 0.42, visibility: 0.98 },
  { name: 'rightShoulder', x: 0.61, y: 0.42, visibility: 0.98 },
  { name: 'leftHip', x: 0.43, y: 0.72, visibility: 0.98 },
  { name: 'rightHip', x: 0.57, y: 0.72, visibility: 0.98 },
];

const calibrated = (overrides: Partial<PostureThresholds> = {}): PostureThresholds => ({
  minVisibility: 0.55,
  headWarning: 0.14,
  headBad: 0.24,
  shoulderWarning: 0.07,
  shoulderBad: 0.12,
  neckWarning: 0.09,
  neckBad: 0.18,
  shoulderWidthBaseline: 0.22,
  shoulderNarrowWarning: 0.9,
  shoulderNarrowBad: 0.8,
  torsoAspectRatioBaseline: 1.36,
  headVerticalRatioBaseline: 1.0,
  slouchWarning: 0.9,
  slouchBad: 0.78,
  headDownWarning: 0.88,
  headDownBad: 0.72,
  ...overrides,
});

describe('analyzePosture', () => {
  it('classifies aligned landmarks as good', () => {
    expect(analyzePosture(baseLandmarks()).state).toBe('good');
  });

  it('returns calibrating when required landmarks have low confidence', () => {
    const landmarks = baseLandmarks().map((l) =>
      l.name === 'leftShoulder' ? { ...l, visibility: 0.2 } : l,
    );
    expect(analyzePosture(landmarks).state).toBe('calibrating');
  });

  it('warns on head-forward offset', () => {
    const landmarks = baseLandmarks().map((l) =>
      l.name === 'nose' ? { ...l, x: 0.68 } : l,
    );
    const result = analyzePosture(landmarks);
    expect(result.state).toBe('warning');
    expect(result.reasons).toContain('head-forward');
  });

  it('marks bad on strong shoulder tilt', () => {
    const landmarks = baseLandmarks().map((l) =>
      l.name === 'rightShoulder' ? { ...l, y: 0.55 } : l,
    );
    const result = analyzePosture(landmarks);
    expect(result.state).toBe('bad');
    expect(result.reasons).toContain('shoulder-tilt');
  });

  it('detects neck tilt with ears visible', () => {
    const landmarks = baseLandmarks().map((l) => {
      if (l.name === 'leftEar') return { ...l, x: 0.34 };
      if (l.name === 'rightEar') return { ...l, x: 0.46 };
      return l;
    });
    const result = analyzePosture(landmarks);
    expect(result.reasons).toContain('neck-tilt');
  });

  it('detects neck tilt via nose fallback when ears not visible', () => {
    const landmarks = baseLandmarks().map((l) => {
      if (l.name === 'leftEar' || l.name === 'rightEar') return { ...l, visibility: 0.1 };
      if (l.name === 'nose') return { ...l, x: 0.38 };
      return l;
    });
    const result = analyzePosture(landmarks);
    expect(result.reasons).toContain('neck-tilt');
  });

  it('emits shoulderWidth in metrics', () => {
    const result = analyzePosture(baseLandmarks());
    expect(result.metrics.shoulderWidth).toBeCloseTo(0.22, 2);
  });

  it('computes torsoAspectRatio when hips visible', () => {
    const result = analyzePosture(baseLandmarks());
    expect(result.metrics.torsoAspectRatio).toBeCloseTo((0.72 - 0.42) / 0.22, 2);
  });

  it('flags slouch via shoulder narrowing without hips', () => {
    const landmarks = baseLandmarks()
      .filter((l) => l.name !== 'leftHip' && l.name !== 'rightHip')
      .map((l) => {
        if (l.name === 'leftShoulder') return { ...l, x: 0.44 };
        if (l.name === 'rightShoulder') return { ...l, x: 0.56 };
        return l;
      });
    // Narrowed to 0.12, baseline 0.22, ratio 0.545 < 0.8 (bad)
    const result = analyzePosture(landmarks, calibrated());
    expect(result.reasons).toContain('slouch');
    expect(result.state).toBe('bad');
  });

  it('flags slouch via torso collapse when hips visible', () => {
    const landmarks = baseLandmarks().map((l) => {
      if (l.name === 'leftShoulder' || l.name === 'rightShoulder') return { ...l, y: 0.58 };
      return l;
    });
    const result = analyzePosture(landmarks, calibrated({ shoulderWidthBaseline: 0 }));
    expect(result.reasons).toContain('slouch');
  });

  it('flags head-down when head drops toward shoulders', () => {
    const landmarks = baseLandmarks().map((l) => {
      if (l.name === 'nose') return { ...l, y: 0.37 };
      if (l.name === 'leftEar' || l.name === 'rightEar') return { ...l, y: 0.38 };
      return l;
    });
    const result = analyzePosture(landmarks, calibrated());
    expect(result.reasons).toContain('head-down');
  });

  it('flags slouch as warning via composite hunch when axes drop subtly', () => {
    // Shoulders narrow ~4%, torso collapses ~5%, head drops ~5% — each below
    // its individual warning threshold; together they indicate a hunched back.
    const landmarks = baseLandmarks().map((l) => {
      if (l.name === 'leftShoulder') return { ...l, x: 0.3945 };
      if (l.name === 'rightShoulder') return { ...l, x: 0.6055 };
      if (l.name === 'leftHip') return { ...l, y: 0.691 };
      if (l.name === 'rightHip') return { ...l, y: 0.691 };
      return l;
    });
    const result = analyzePosture(landmarks, calibrated());
    expect(result.reasons).toContain('slouch');
    expect(result.state).toBe('warning');
  });

  it('escalates slouch to bad via composite when multiple axes drop together', () => {
    // Each axis stays below its individual "bad" threshold (~9% deficit),
    // but the combined deficit pushes the composite over the bad threshold.
    const landmarks = baseLandmarks().map((l) => {
      if (l.name === 'leftShoulder') return { ...l, x: 0.3999 };
      if (l.name === 'rightShoulder') return { ...l, x: 0.6001 };
      if (l.name === 'leftHip') return { ...l, y: 0.6678 };
      if (l.name === 'rightHip') return { ...l, y: 0.6678 };
      if (l.name === 'nose') return { ...l, y: 0.22 };
      if (l.name === 'leftEar') return { ...l, y: 0.256 };
      if (l.name === 'rightEar') return { ...l, y: 0.256 };
      return l;
    });
    const result = analyzePosture(landmarks, calibrated());
    expect(result.reasons).toContain('slouch');
    expect(result.state).toBe('bad');
  });

  it('does not trigger composite slouch when only one axis drops', () => {
    // Head drops significantly but shoulders and torso are unchanged.
    // Composite must not promote this to a back-curvature alert.
    const landmarks = baseLandmarks().map((l) => {
      if (l.name === 'nose') return { ...l, y: 0.27 };
      if (l.name === 'leftEar' || l.name === 'rightEar') return { ...l, y: 0.28 };
      return l;
    });
    const result = analyzePosture(landmarks, calibrated());
    expect(result.reasons).not.toContain('slouch');
  });

  it('does not flag slouch without calibrated baselines', () => {
    const landmarks = baseLandmarks().map((l) => {
      if (l.name === 'leftShoulder') return { ...l, x: 0.44 };
      if (l.name === 'rightShoulder') return { ...l, x: 0.56 };
      return l;
    });
    const result = analyzePosture(landmarks);
    expect(result.reasons).not.toContain('slouch');
  });

  it('degrades gracefully when ears are not visible', () => {
    const landmarks = baseLandmarks().map((l) =>
      l.name === 'leftEar' || l.name === 'rightEar' ? { ...l, visibility: 0.1 } : l,
    );
    const result = analyzePosture(landmarks);
    expect(result.state).not.toBe('calibrating');
  });

  it('score penalizes multiple reasons', () => {
    const landmarks = baseLandmarks().map((l) => {
      if (l.name === 'nose') return { ...l, x: 0.68 };
      if (l.name === 'rightShoulder') return { ...l, y: 0.55 };
      return l;
    });
    const result = analyzePosture(landmarks);
    expect(result.reasons.length).toBeGreaterThanOrEqual(2);
    expect(result.score).toBeLessThan(70);
  });
});
