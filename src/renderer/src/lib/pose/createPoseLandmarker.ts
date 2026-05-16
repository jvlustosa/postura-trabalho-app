import { FilesetResolver, PoseLandmarker } from '@mediapipe/tasks-vision';

export const createPoseLandmarker = async (): Promise<PoseLandmarker> => {
  const fileset = await FilesetResolver.forVisionTasks('./mediapipe/wasm');
  const baseOptions = {
    modelAssetPath: './models/pose_landmarker_lite.task',
  };
  const config = {
    runningMode: 'VIDEO' as const,
    numPoses: 1,
    minPoseDetectionConfidence: 0.5,
    minPosePresenceConfidence: 0.5,
    minTrackingConfidence: 0.5,
  };

  try {
    return await PoseLandmarker.createFromOptions(fileset, {
      ...config,
      baseOptions: { ...baseOptions, delegate: 'GPU' },
    });
  } catch {
    return PoseLandmarker.createFromOptions(fileset, {
      ...config,
      baseOptions: { ...baseOptions, delegate: 'CPU' },
    });
  }
};
