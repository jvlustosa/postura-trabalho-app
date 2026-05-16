import type { PostureAnalysis, PostureThresholds } from './types';

const baseThresholds: PostureThresholds = {
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

const median = (values: number[]): number => {
  if (values.length === 0) return 0;

  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);

  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
};

const robustCenter = (values: number[]): number => {
  const positive = values.filter((v) => Number.isFinite(v) && v > 0);
  if (positive.length === 0) return 0;
  if (positive.length < 4) return median(positive);

  const sorted = [...positive].sort((a, b) => a - b);
  const q1 = sorted[Math.floor(sorted.length * 0.25)];
  const q3 = sorted[Math.floor(sorted.length * 0.75)];
  const iqr = q3 - q1;
  const trimmed = sorted.filter((v) => v >= q1 - 1.5 * iqr && v <= q3 + 1.5 * iqr);

  return median(trimmed.length > 0 ? trimmed : sorted);
};

export const createPersonalizedThresholds = (
  metrics: PostureAnalysis['metrics'][],
): PostureThresholds => {
  if (metrics.length === 0) return baseThresholds;

  const headBaseline = robustCenter(metrics.map((m) => m.headOffset));
  const shoulderBaseline = robustCenter(metrics.map((m) => m.shoulderTilt));
  const neckBaseline = robustCenter(metrics.map((m) => m.neckTilt));
  const shoulderWidthBaseline = robustCenter(metrics.map((m) => m.shoulderWidth));
  const torsoAspectRatioBaseline = robustCenter(metrics.map((m) => m.torsoAspectRatio));
  const headVerticalRatioBaseline = robustCenter(metrics.map((m) => m.headVerticalRatio));

  const headWarning = Math.min(baseThresholds.headWarning, headBaseline + 0.07);
  const shoulderWarning = Math.min(baseThresholds.shoulderWarning, shoulderBaseline + 0.04);
  const neckWarning = Math.min(baseThresholds.neckWarning, neckBaseline + 0.06);

  return {
    minVisibility: baseThresholds.minVisibility,
    headWarning,
    headBad: Math.min(baseThresholds.headBad, headWarning + 0.1),
    shoulderWarning,
    shoulderBad: Math.min(baseThresholds.shoulderBad, shoulderWarning + 0.05),
    neckWarning,
    neckBad: Math.min(baseThresholds.neckBad, neckWarning + 0.09),
    shoulderWidthBaseline,
    shoulderNarrowWarning: baseThresholds.shoulderNarrowWarning,
    shoulderNarrowBad: baseThresholds.shoulderNarrowBad,
    torsoAspectRatioBaseline,
    headVerticalRatioBaseline,
    slouchWarning: baseThresholds.slouchWarning,
    slouchBad: baseThresholds.slouchBad,
    headDownWarning: baseThresholds.headDownWarning,
    headDownBad: baseThresholds.headDownBad,
  };
};
