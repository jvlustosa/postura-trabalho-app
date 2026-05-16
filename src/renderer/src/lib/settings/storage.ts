import type { PostureThresholds } from '../posture/types';
import {
  defaultSettings,
  type AlertThresholdSeconds,
  type AppSettings,
  type CalibrationData,
  type SensitivityLevel,
} from './types';

const STORAGE_KEY = 'postura-trabalho.settings.v1';

const sensitivityValues: readonly SensitivityLevel[] = ['relaxed', 'standard', 'strict'];
const calibrationValues: readonly AppSettings['calibrationSeconds'][] = [3, 5, 8];
const alertThresholdValues: readonly AlertThresholdSeconds[] = [30, 60, 120, 300];

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

const parseThresholds = (raw: unknown): PostureThresholds | null => {
  if (typeof raw !== 'object' || raw === null) return null;

  const c = raw as Partial<PostureThresholds>;

  if (
    !isFiniteNumber(c.minVisibility) ||
    !isFiniteNumber(c.headWarning) ||
    !isFiniteNumber(c.headBad) ||
    !isFiniteNumber(c.shoulderWarning) ||
    !isFiniteNumber(c.shoulderBad) ||
    !isFiniteNumber(c.neckWarning) ||
    !isFiniteNumber(c.neckBad)
  ) {
    return null;
  }

  return {
    minVisibility: c.minVisibility,
    headWarning: c.headWarning,
    headBad: c.headBad,
    shoulderWarning: c.shoulderWarning,
    shoulderBad: c.shoulderBad,
    neckWarning: c.neckWarning,
    neckBad: c.neckBad,
    shoulderWidthBaseline: isFiniteNumber(c.shoulderWidthBaseline) ? c.shoulderWidthBaseline : 0,
    shoulderNarrowWarning: isFiniteNumber(c.shoulderNarrowWarning) ? c.shoulderNarrowWarning : 0.9,
    shoulderNarrowBad: isFiniteNumber(c.shoulderNarrowBad) ? c.shoulderNarrowBad : 0.8,
    torsoAspectRatioBaseline: isFiniteNumber(c.torsoAspectRatioBaseline)
      ? c.torsoAspectRatioBaseline
      : 0,
    headVerticalRatioBaseline: isFiniteNumber(c.headVerticalRatioBaseline)
      ? c.headVerticalRatioBaseline
      : 0,
    slouchWarning: isFiniteNumber(c.slouchWarning) ? c.slouchWarning : 0.9,
    slouchBad: isFiniteNumber(c.slouchBad) ? c.slouchBad : 0.78,
    headDownWarning: isFiniteNumber(c.headDownWarning) ? c.headDownWarning : 0.88,
    headDownBad: isFiniteNumber(c.headDownBad) ? c.headDownBad : 0.72,
  };
};

const parseCalibration = (raw: unknown): CalibrationData | null => {
  if (typeof raw !== 'object' || raw === null) return null;

  const candidate = raw as Partial<CalibrationData>;
  const thresholds = parseThresholds(candidate.thresholds);
  if (!thresholds) return null;

  const b = candidate.baseline;
  if (
    !b ||
    !isFiniteNumber(b.headOffset) ||
    !isFiniteNumber(b.shoulderTilt) ||
    !isFiniteNumber(b.neckTilt)
  ) {
    return null;
  }

  if (!isFiniteNumber(candidate.sampleCount) || candidate.sampleCount < 1) return null;
  if (typeof candidate.sampledAt !== 'string') return null;

  return {
    thresholds,
    baseline: {
      headOffset: b.headOffset,
      shoulderTilt: b.shoulderTilt,
      neckTilt: b.neckTilt,
      shoulderWidth: isFiniteNumber(b.shoulderWidth) ? b.shoulderWidth : 0,
      torsoAspectRatio: isFiniteNumber(b.torsoAspectRatio) ? b.torsoAspectRatio : 0,
      headVerticalRatio: isFiniteNumber(b.headVerticalRatio) ? b.headVerticalRatio : 0,
    },
    sampleCount: Math.round(candidate.sampleCount),
    sampledAt: candidate.sampledAt,
  };
};

const parseSettings = (raw: unknown): AppSettings => {
  if (typeof raw !== 'object' || raw === null) return defaultSettings;

  const c = raw as Partial<AppSettings>;

  return {
    sensitivity: sensitivityValues.includes(c.sensitivity as SensitivityLevel)
      ? (c.sensitivity as SensitivityLevel)
      : defaultSettings.sensitivity,
    calibrationSeconds: calibrationValues.includes(
      c.calibrationSeconds as AppSettings['calibrationSeconds'],
    )
      ? (c.calibrationSeconds as AppSettings['calibrationSeconds'])
      : defaultSettings.calibrationSeconds,
    mirrorVideo: typeof c.mirrorVideo === 'boolean' ? c.mirrorVideo : defaultSettings.mirrorVideo,
    showOverlay:
      typeof c.showOverlay === 'boolean' ? c.showOverlay : defaultSettings.showOverlay,
    onboardingCompleted:
      typeof c.onboardingCompleted === 'boolean'
        ? c.onboardingCompleted
        : defaultSettings.onboardingCompleted,
    screenHeight:
      isFiniteNumber(c.screenHeight)
        ? Math.min(100, Math.max(0, Math.round(c.screenHeight)))
        : defaultSettings.screenHeight,
    calibration: parseCalibration(c.calibration),
    alertsEnabled:
      typeof c.alertsEnabled === 'boolean' ? c.alertsEnabled : defaultSettings.alertsEnabled,
    alertThresholdSeconds: alertThresholdValues.includes(
      c.alertThresholdSeconds as AlertThresholdSeconds,
    )
      ? (c.alertThresholdSeconds as AlertThresholdSeconds)
      : defaultSettings.alertThresholdSeconds,
    floatingWindow:
      typeof c.floatingWindow === 'boolean' ? c.floatingWindow : defaultSettings.floatingWindow,
    compactMode:
      typeof c.compactMode === 'boolean' ? c.compactMode : defaultSettings.compactMode,
  };
};

const getBridge = (): NonNullable<Window['postureApp']>['storage'] | undefined => {
  if (typeof window === 'undefined') return undefined;
  return window.postureApp?.storage;
};

const readFromLocalStorage = (): AppSettings => {
  if (typeof window === 'undefined' || !window.localStorage) return defaultSettings;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? parseSettings(JSON.parse(raw)) : defaultSettings;
  } catch {
    return defaultSettings;
  }
};

const writeToLocalStorage = (settings: AppSettings): void => {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // localStorage may be unavailable; fail silently
  }
};

export const loadSettings = (): AppSettings => readFromLocalStorage();

export const loadSettingsAsync = async (): Promise<AppSettings> => {
  const bridge = getBridge();
  const local = readFromLocalStorage();

  if (!bridge) return local;

  try {
    const remote = await bridge.readSettings();
    if (remote === null || remote === undefined) {
      if (local !== defaultSettings) {
        void bridge.writeSettings(local).catch(() => undefined);
      }
      return local;
    }
    return parseSettings(remote);
  } catch {
    return local;
  }
};

export const saveSettings = (settings: AppSettings): void => {
  writeToLocalStorage(settings);
  const bridge = getBridge();
  if (bridge) {
    void bridge.writeSettings(settings).catch(() => undefined);
  }
};
