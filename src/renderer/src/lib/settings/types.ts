import type { PostureThresholds } from '../posture/types';

export type SensitivityLevel = 'relaxed' | 'standard' | 'strict';
export type AlertThresholdSeconds = 30 | 60 | 120 | 300;

export interface CalibrationData {
  thresholds: PostureThresholds;
  baseline: {
    headOffset: number;
    shoulderTilt: number;
    neckTilt: number;
    shoulderWidth: number;
    torsoAspectRatio: number;
    headVerticalRatio: number;
  };
  sampleCount: number;
  sampledAt: string;
}

export interface AppSettings {
  sensitivity: SensitivityLevel;
  calibrationSeconds: 3 | 5 | 8;
  mirrorVideo: boolean;
  showOverlay: boolean;
  onboardingCompleted: boolean;
  screenHeight: number;
  calibration: CalibrationData | null;
  alertsEnabled: boolean;
  alertThresholdSeconds: AlertThresholdSeconds;
  floatingWindow: boolean;
  compactMode: boolean;
}

export const defaultSettings: AppSettings = {
  sensitivity: 'standard',
  calibrationSeconds: 5,
  mirrorVideo: true,
  showOverlay: true,
  onboardingCompleted: false,
  screenHeight: 50,
  calibration: null,
  alertsEnabled: true,
  alertThresholdSeconds: 60,
  floatingWindow: false,
  compactMode: false,
};
