import type { PoseLandmark } from '../posture/types';

interface RawLandmark {
  x: number;
  y: number;
  visibility?: number;
}

const postureLandmarkMap = [
  ['nose', 0],
  ['leftEar', 7],
  ['rightEar', 8],
  ['leftShoulder', 11],
  ['rightShoulder', 12],
  ['leftHip', 23],
  ['rightHip', 24],
] as const;

export const mapPoseLandmarks = (landmarks: RawLandmark[] | undefined): PoseLandmark[] => {
  if (!landmarks) {
    return [];
  }

  return postureLandmarkMap.flatMap(([name, index]) => {
    const landmark = landmarks[index];

    if (!landmark) {
      return [];
    }

    return {
      name,
      x: landmark.x,
      y: landmark.y,
      visibility: landmark.visibility,
    };
  });
};
