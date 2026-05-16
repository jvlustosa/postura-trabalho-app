import { describe, expect, it } from 'vitest';

import { createPostureSmoother } from './createPostureSmoother';
import type { PostureAnalysis } from './types';

const analysis = (state: PostureAnalysis['state']): PostureAnalysis => ({
  state,
  score: state === 'good' ? 96 : state === 'warning' ? 70 : 35,
  reasons: [],
  message: state,
  metrics: {
    headOffset: 0,
    shoulderTilt: 0,
    neckTilt: 0,
    shoulderWidth: 0.22,
    torsoAspectRatio: 0,
    headVerticalRatio: 0,
  },
});

describe('createPostureSmoother', () => {
  it('keeps transient warnings from immediately replacing good posture', () => {
    const smoother = createPostureSmoother(4);
    smoother.push(analysis('good'));
    smoother.push(analysis('good'));
    smoother.push(analysis('good'));
    expect(smoother.push(analysis('warning')).state).toBe('good');
  });

  it('returns the majority state inside the rolling window', () => {
    const smoother = createPostureSmoother(3);
    smoother.push(analysis('good'));
    smoother.push(analysis('warning'));
    expect(smoother.push(analysis('warning')).state).toBe('warning');
  });
});
