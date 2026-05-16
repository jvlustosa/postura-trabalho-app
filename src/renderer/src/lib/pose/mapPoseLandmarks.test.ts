import { describe, expect, it } from 'vitest';

import { mapPoseLandmarks } from './mapPoseLandmarks';

describe('mapPoseLandmarks', () => {
  it('extracts the landmarks required by posture analysis', () => {
    const landmarks = Array.from({ length: 33 }, (_, index) => ({
      x: index / 100,
      y: index / 50,
      visibility: 0.9,
    }));

    expect(mapPoseLandmarks(landmarks)).toEqual([
      { name: 'nose', x: 0, y: 0, visibility: 0.9 },
      { name: 'leftEar', x: 0.07, y: 0.14, visibility: 0.9 },
      { name: 'rightEar', x: 0.08, y: 0.16, visibility: 0.9 },
      { name: 'leftShoulder', x: 0.11, y: 0.22, visibility: 0.9 },
      { name: 'rightShoulder', x: 0.12, y: 0.24, visibility: 0.9 },
      { name: 'leftHip', x: 0.23, y: 0.46, visibility: 0.9 },
      { name: 'rightHip', x: 0.24, y: 0.48, visibility: 0.9 },
    ]);
  });

  it('returns an empty list when the model produced no pose', () => {
    expect(mapPoseLandmarks(undefined)).toEqual([]);
  });
});
