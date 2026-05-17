import type { PostureThresholds } from '../posture/types';

export type SensitivityLevel = 'relaxed' | 'standard' | 'strict';
export type AlertThresholdSeconds = 30 | 60 | 120 | 180;

export type AutoStartMode = 'off' | 'on-launch' | 'schedule';

export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface ScheduleConfig {
  weekdays: Weekday[];
  startTime: string;
  endTime: string;
}

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
  alertSound: boolean;
  floatingWindow: boolean;
  floatingOpacity: number;
  compactMode: boolean;
  autoStartMode: AutoStartMode;
  schedule: ScheduleConfig;
}

export const defaultSchedule: ScheduleConfig = {
  weekdays: [1, 2, 3, 4, 5],
  startTime: '09:00',
  endTime: '18:00',
};

export const defaultSettings: AppSettings = {
  sensitivity: 'standard',
  calibrationSeconds: 5,
  mirrorVideo: true,
  showOverlay: true,
  onboardingCompleted: false,
  screenHeight: 50,
  calibration: null,
  alertsEnabled: true,
  alertThresholdSeconds: 30,
  alertSound: false,
  floatingWindow: true,
  floatingOpacity: 0.85,
  compactMode: false,
  autoStartMode: 'off',
  schedule: defaultSchedule,
};
