import type { PostureReason, PostureState } from '../posture/types';

export type AlertLevel = 'warning' | 'bad';

export interface PostureWatcher {
  observe: (state: PostureState, reasons: PostureReason[], now?: number) => void;
  reset: () => void;
}

export interface CreatePostureWatcherOptions {
  warningThresholdMs: number | (() => number);
  badThresholdMs: number | (() => number);
  cooldownMs?: number;
  /** Required duration of sustained 'good' frames before accumulated bad/warning timers are cleared. Defaults to 1500ms so brief detection blips do not reset the countdown. */
  goodHysteresisMs?: number;
  onAlert: (payload: { level: AlertLevel; reasons: PostureReason[]; durationMs: number }) => void;
  onClear?: () => void;
}

export const createPostureWatcher = (options: CreatePostureWatcherOptions): PostureWatcher => {
  const cooldownMs = options.cooldownMs ?? 120_000;
  const goodHysteresisMs = options.goodHysteresisMs ?? 1_500;
  const getWarningMs = (): number =>
    typeof options.warningThresholdMs === 'function'
      ? options.warningThresholdMs()
      : options.warningThresholdMs;
  const getBadMs = (): number =>
    typeof options.badThresholdMs === 'function'
      ? options.badThresholdMs()
      : options.badThresholdMs;

  let warningSince: number | null = null;
  let badSince: number | null = null;
  let goodSince: number | null = null;
  let activeLevel: AlertLevel | null = null;
  let cooldownUntil = 0;

  const clear = (): void => {
    if (activeLevel) {
      activeLevel = null;
      options.onClear?.();
    }
    warningSince = null;
    badSince = null;
    goodSince = null;
  };

  const tryAlert = (level: AlertLevel, reasons: PostureReason[], durationMs: number, now: number): void => {
    const isEscalation = activeLevel === 'warning' && level === 'bad';

    if (!isEscalation && now < cooldownUntil) return;

    if (!activeLevel || isEscalation) {
      activeLevel = level;
      cooldownUntil = now + cooldownMs;
      options.onAlert({ level, reasons, durationMs });
    }
  };

  return {
    observe(state, reasons, now = Date.now()): void {
      if (
        state === 'calibrating' ||
        state === 'inactive' ||
        state === 'away' ||
        state === 'camera-error' ||
        state === 'model-error'
      ) {
        clear();
        return;
      }

      if (state === 'good') {
        goodSince ??= now;
        if (now - goodSince >= goodHysteresisMs) {
          clear();
        }
        return;
      }

      // Any tracked-bad-posture frame resets the good streak; the accumulated
      // warning/bad timers below survive brief detection blips.
      goodSince = null;

      if (state === 'bad') {
        warningSince ??= now;
        badSince ??= now;

        const duration = now - badSince;
        if (duration >= getBadMs()) {
          tryAlert('bad', reasons, duration, now);
        } else {
          const warningDuration = now - warningSince;
          if (!activeLevel && warningDuration >= getWarningMs()) {
            tryAlert('warning', reasons, warningDuration, now);
          }
        }
        return;
      }

      // state === 'warning'
      badSince = null;
      warningSince ??= now;

      if (activeLevel === 'bad') {
        activeLevel = null;
        options.onClear?.();
      }

      const duration = now - warningSince;
      if (duration >= getWarningMs()) {
        tryAlert('warning', reasons, duration, now);
      }
    },
    reset(): void {
      warningSince = null;
      badSince = null;
      goodSince = null;
      activeLevel = null;
      cooldownUntil = 0;
    },
  };
};
