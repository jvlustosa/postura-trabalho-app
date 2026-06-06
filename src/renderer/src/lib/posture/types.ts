export type LandmarkName =
  | 'nose'
  | 'leftEar'
  | 'rightEar'
  | 'leftShoulder'
  | 'rightShoulder'
  | 'leftHip'
  | 'rightHip';

export type PostureState =
  | 'inactive'
  | 'calibrating'
  | 'good'
  | 'warning'
  | 'bad'
  | 'away'
  | 'camera-error'
  | 'model-error';

export type PostureReason =
  | 'low-confidence'
  | 'head-forward'
  | 'shoulder-tilt'
  | 'neck-tilt'
  | 'neck-rotation'
  | 'slouch'
  | 'head-down';

export interface PoseLandmark {
  name: LandmarkName;
  x: number;
  y: number;
  visibility?: number;
}

export interface PostureMetrics {
  headOffset: number;
  shoulderTilt: number;
  neckTilt: number;
  neckRotation: number;
  shoulderWidth: number;
  torsoAspectRatio: number;
  headVerticalRatio: number;
}

export interface PostureAnalysis {
  state: PostureState;
  score: number;
  reasons: PostureReason[];
  message: string;
  metrics: PostureMetrics;
}

export interface PostureThresholds {
  minVisibility: number;
  headWarning: number;
  headBad: number;
  shoulderWarning: number;
  shoulderBad: number;
  neckWarning: number;
  neckBad: number;
  shoulderWidthBaseline: number;
  shoulderNarrowWarning: number;
  shoulderNarrowBad: number;
  torsoAspectRatioBaseline: number;
  headVerticalRatioBaseline: number;
  slouchWarning: number;
  slouchBad: number;
  headDownWarning: number;
  headDownBad: number;
  /** Minimum per-axis deficit (0-1) for a signal to count toward composite hunch */
  hunchSignificantDeficit: number;
  /** Average deficit across available signals that triggers composite warning */
  hunchCompositeWarning: number;
  /** Average deficit across available signals that triggers composite bad */
  hunchCompositeBad: number;
  /** Ear-nose distance asymmetry ratio (0=symmetric, 1=fully rotated) that triggers warning */
  neckRotationWarning: number;
  /** Ear-nose distance asymmetry ratio that triggers bad */
  neckRotationBad: number;
}
