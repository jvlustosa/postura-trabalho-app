import type { LandmarkName, PoseLandmark, PostureAnalysis, PostureThresholds } from './types';

const defaultThresholds: PostureThresholds = {
  minVisibility: 0.55,
  headWarning: 0.14,
  headBad: 0.24,
  shoulderWarning: 0.07,
  shoulderBad: 0.12,
  neckWarning: 0.09,
  neckBad: 0.18,
  shoulderWidthBaseline: 0,
  shoulderNarrowWarning: 0.9,
  shoulderNarrowBad: 0.8,
  torsoAspectRatioBaseline: 0,
  headVerticalRatioBaseline: 0,
  slouchWarning: 0.9,
  slouchBad: 0.78,
  headDownWarning: 0.88,
  headDownBad: 0.72,
};

const MIN_SHOULDER_WIDTH = 0.04;

const requiredLandmarks: LandmarkName[] = ['nose', 'leftShoulder', 'rightShoulder'];

const byName = (landmarks: PoseLandmark[]): Map<LandmarkName, PoseLandmark> =>
  new Map(landmarks.map((landmark) => [landmark.name, landmark]));

const visibilityOf = (landmark: PoseLandmark | undefined): number => landmark?.visibility ?? 1;

const isVisible = (
  landmark: PoseLandmark | undefined,
  minVisibility: number,
): landmark is PoseLandmark => Boolean(landmark) && visibilityOf(landmark) >= minVisibility;

const zeroMetrics: PostureAnalysis['metrics'] = {
  headOffset: 0,
  shoulderTilt: 0,
  neckTilt: 0,
  shoulderWidth: 0,
  torsoAspectRatio: 0,
  headVerticalRatio: 0,
};

export const analyzePosture = (
  landmarks: PoseLandmark[],
  thresholds: PostureThresholds = defaultThresholds,
): PostureAnalysis => {
  const lookup = byName(landmarks);
  const hasLowConfidence = requiredLandmarks.some(
    (name) => !isVisible(lookup.get(name), thresholds.minVisibility),
  );

  if (hasLowConfidence) {
    return {
      state: 'calibrating',
      score: 0,
      reasons: ['low-confidence'],
      message: 'Mostre cabeça e ombros para a câmera',
      metrics: zeroMetrics,
    };
  }

  const nose = lookup.get('nose') as PoseLandmark;
  const leftShoulder = lookup.get('leftShoulder') as PoseLandmark;
  const rightShoulder = lookup.get('rightShoulder') as PoseLandmark;
  const leftEar = lookup.get('leftEar');
  const rightEar = lookup.get('rightEar');
  const leftHip = lookup.get('leftHip');
  const rightHip = lookup.get('rightHip');

  const shoulderCenterX = (leftShoulder.x + rightShoulder.x) / 2;
  const shoulderCenterY = (leftShoulder.y + rightShoulder.y) / 2;
  const shoulderWidth = Math.max(Math.abs(leftShoulder.x - rightShoulder.x), MIN_SHOULDER_WIDTH);

  const hipsVisible =
    isVisible(leftHip, thresholds.minVisibility) && isVisible(rightHip, thresholds.minVisibility);
  const hipCenterX = hipsVisible ? (leftHip!.x + rightHip!.x) / 2 : shoulderCenterX;
  const hipCenterY = hipsVisible ? (leftHip!.y + rightHip!.y) / 2 : shoulderCenterY;
  const torsoCenterX = (shoulderCenterX + hipCenterX) / 2;

  const earsVisible =
    isVisible(leftEar, thresholds.minVisibility) && isVisible(rightEar, thresholds.minVisibility);
  const earCenterX = earsVisible ? (leftEar!.x + rightEar!.x) / 2 : nose.x;
  const earCenterY = earsVisible ? (leftEar!.y + rightEar!.y) / 2 : nose.y;

  const headOffset = Math.abs(nose.x - torsoCenterX);
  const shoulderTilt = Math.abs(leftShoulder.y - rightShoulder.y);
  const headAnchorY = earsVisible ? (earCenterY + nose.y) / 2 : nose.y;
  const headVerticalRatio = Math.max(0, shoulderCenterY - headAnchorY) / shoulderWidth;

  // Neck tilt: prefer ears; nose fallback only when hips give a distinct torso center
  const neckTilt = earsVisible
    ? Math.abs(earCenterX - shoulderCenterX)
    : hipsVisible
      ? Math.abs(nose.x - shoulderCenterX)
      : 0;

  // Torso aspect ratio (only when hips visible)
  const torsoAspectRatio = hipsVisible
    ? Math.max(0, hipCenterY - shoulderCenterY) / shoulderWidth
    : 0;

  const reasons: PostureAnalysis['reasons'] = [];
  let severity = 0;

  if (headOffset >= thresholds.headWarning) {
    reasons.push('head-forward');
    severity = Math.max(severity, headOffset >= thresholds.headBad ? 2 : 1);
  }

  if (shoulderTilt >= thresholds.shoulderWarning) {
    reasons.push('shoulder-tilt');
    severity = Math.max(severity, shoulderTilt >= thresholds.shoulderBad ? 2 : 1);
  }

  if (neckTilt >= thresholds.neckWarning) {
    reasons.push('neck-tilt');
    severity = Math.max(severity, neckTilt >= thresholds.neckBad ? 2 : 1);
  }

  // Slouch via shoulder narrowing (works without hips — primary detection)
  if (thresholds.shoulderWidthBaseline > 0 && shoulderWidth > 0) {
    const widthRatio = shoulderWidth / thresholds.shoulderWidthBaseline;

    if (widthRatio <= thresholds.shoulderNarrowBad) {
      reasons.push('slouch');
      severity = Math.max(severity, 2);
    } else if (widthRatio <= thresholds.shoulderNarrowWarning) {
      reasons.push('slouch');
      severity = Math.max(severity, 1);
    }
  }

  // Slouch via torso collapse (hip-based, when hips visible and not already flagged)
  if (
    !reasons.includes('slouch') &&
    hipsVisible &&
    thresholds.torsoAspectRatioBaseline > 0 &&
    torsoAspectRatio > 0
  ) {
    const ratio = torsoAspectRatio / thresholds.torsoAspectRatioBaseline;

    if (ratio <= thresholds.slouchBad) {
      reasons.push('slouch');
      severity = Math.max(severity, 2);
    } else if (ratio <= thresholds.slouchWarning) {
      reasons.push('slouch');
      severity = Math.max(severity, 1);
    }
  }

  // Head dropping toward shoulders
  if (thresholds.headVerticalRatioBaseline > 0 && headVerticalRatio > 0) {
    const ratio = headVerticalRatio / thresholds.headVerticalRatioBaseline;

    if (ratio <= thresholds.headDownBad) {
      reasons.push('head-down');
      severity = Math.max(severity, 2);
    } else if (ratio <= thresholds.headDownWarning) {
      reasons.push('head-down');
      severity = Math.max(severity, 1);
    }
  }

  const state = severity === 0 ? 'good' : severity === 1 ? 'warning' : 'bad';

  const rawScore = 100 - Math.round((headOffset + shoulderTilt + neckTilt) * 200);
  const penaltyPerReason = reasons.filter((r) => r !== 'low-confidence').length * 8;
  const score = Math.max(0, Math.min(100, rawScore - penaltyPerReason));

  const message =
    state === 'good'
      ? 'Postura ok'
      : state === 'warning'
        ? 'Faça um ajuste leve na postura'
        : 'Ajuste ombros e cabeça';

  return {
    state,
    score,
    reasons,
    message,
    metrics: {
      headOffset,
      shoulderTilt,
      neckTilt,
      shoulderWidth,
      torsoAspectRatio,
      headVerticalRatio,
    },
  };
};
