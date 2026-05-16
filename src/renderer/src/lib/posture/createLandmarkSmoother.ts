import type { PoseLandmark } from './types';

export interface LandmarkSmoother {
  smooth(landmarks: PoseLandmark[]): PoseLandmark[];
  reset(): void;
}

export const createLandmarkSmoother = (alpha = 0.4): LandmarkSmoother => {
  const blend = Math.min(1, Math.max(0, alpha));
  let previous: Map<string, PoseLandmark> | null = null;

  return {
    smooth(landmarks) {
      if (!previous) {
        previous = new Map(landmarks.map((landmark) => [landmark.name, landmark]));
        return landmarks;
      }

      const next = landmarks.map((landmark) => {
        const prior = previous!.get(landmark.name);

        if (!prior) {
          return landmark;
        }

        return {
          ...landmark,
          x: prior.x * (1 - blend) + landmark.x * blend,
          y: prior.y * (1 - blend) + landmark.y * blend,
        };
      });

      previous = new Map(next.map((landmark) => [landmark.name, landmark]));

      return next;
    },
    reset() {
      previous = null;
    },
  };
};
