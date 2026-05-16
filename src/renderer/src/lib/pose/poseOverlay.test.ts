import { describe, expect, it } from 'vitest';

import { getVisiblePosePoints } from './poseOverlay';

describe('getVisiblePosePoints', () => {
  it('maps visible normalized landmarks to canvas coordinates', () => {
    const points = getVisiblePosePoints(
      [
        { x: 0.25, y: 0.5, visibility: 0.9 },
        { x: 0.75, y: 0.25, visibility: 0.2 },
      ],
      {
        viewportWidth: 200,
        viewportHeight: 100,
        sourceWidth: 200,
        sourceHeight: 100,
      },
    );

    expect(points).toEqual([{ index: 0, x: 50, y: 50, visibility: 0.9 }]);
  });

  it('keeps points aligned when object-fit cover crops the video', () => {
    const points = getVisiblePosePoints([{ x: 0, y: 0.5, visibility: 0.9 }], {
      viewportWidth: 300,
      viewportHeight: 400,
      sourceWidth: 640,
      sourceHeight: 480,
    });

    expect(points[0]).toEqual({ index: 0, x: -116.66666666666669, y: 200, visibility: 0.9 });
  });
});
