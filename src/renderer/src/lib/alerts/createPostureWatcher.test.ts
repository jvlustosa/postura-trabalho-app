import { describe, expect, it, vi } from 'vitest';

import { createPostureWatcher } from './createPostureWatcher';

const makeWatcher = (
  overrides: {
    warningMs?: number;
    badMs?: number;
    cooldownMs?: number;
    goodHysteresisMs?: number;
  } = {},
) => {
  const onAlert = vi.fn();
  const onClear = vi.fn();
  const watcher = createPostureWatcher({
    warningThresholdMs: overrides.warningMs ?? 5_000,
    badThresholdMs: overrides.badMs ?? 10_000,
    cooldownMs: overrides.cooldownMs ?? 60_000,
    goodHysteresisMs: overrides.goodHysteresisMs ?? 0,
    onAlert,
    onClear,
  });

  return { watcher, onAlert, onClear };
};

describe('createPostureWatcher', () => {
  it('fires a warning alert when warning persists past the threshold', () => {
    const { watcher, onAlert } = makeWatcher({ warningMs: 3_000 });

    watcher.observe('warning', ['head-forward'], 0);
    watcher.observe('warning', ['head-forward'], 2_000);
    watcher.observe('warning', ['head-forward'], 3_500);

    expect(onAlert).toHaveBeenCalledTimes(1);
    expect(onAlert).toHaveBeenCalledWith(
      expect.objectContaining({ level: 'warning', reasons: ['head-forward'] }),
    );
  });

  it('fires a bad alert when bad persists past the bad threshold', () => {
    const { watcher, onAlert } = makeWatcher({ warningMs: 3_000, badMs: 6_000 });

    watcher.observe('bad', ['shoulder-tilt'], 0);
    watcher.observe('bad', ['shoulder-tilt'], 5_000);
    watcher.observe('bad', ['shoulder-tilt'], 7_000);

    expect(onAlert).toHaveBeenCalledTimes(2);
    expect(onAlert.mock.calls[0][0].level).toBe('warning');
    expect(onAlert.mock.calls[1][0].level).toBe('bad');
  });

  it('escalates from warning to bad when posture worsens', () => {
    const { watcher, onAlert } = makeWatcher({ warningMs: 2_000, badMs: 4_000, cooldownMs: 0 });

    watcher.observe('warning', ['neck-tilt'], 0);
    watcher.observe('warning', ['neck-tilt'], 2_500);
    expect(onAlert).toHaveBeenCalledTimes(1);
    expect(onAlert.mock.calls[0][0].level).toBe('warning');

    watcher.observe('bad', ['neck-tilt', 'shoulder-tilt'], 3_000);
    watcher.observe('bad', ['neck-tilt', 'shoulder-tilt'], 7_500);
    expect(onAlert).toHaveBeenCalledTimes(2);
    expect(onAlert.mock.calls[1][0].level).toBe('bad');
  });

  it('clears when posture goes to good', () => {
    const { watcher, onAlert, onClear } = makeWatcher({ warningMs: 1_000 });

    watcher.observe('warning', ['head-forward'], 0);
    watcher.observe('warning', ['head-forward'], 1_500);
    expect(onAlert).toHaveBeenCalledTimes(1);

    watcher.observe('good', [], 2_000);
    expect(onClear).toHaveBeenCalledTimes(1);
  });

  it('does not alert during cooldown', () => {
    const { watcher, onAlert } = makeWatcher({ warningMs: 1_000, cooldownMs: 10_000 });

    watcher.observe('warning', ['head-forward'], 0);
    watcher.observe('warning', ['head-forward'], 1_500);
    expect(onAlert).toHaveBeenCalledTimes(1);

    watcher.observe('good', [], 2_000);
    watcher.observe('warning', ['head-forward'], 3_000);
    watcher.observe('warning', ['head-forward'], 5_000);
    expect(onAlert).toHaveBeenCalledTimes(1);
  });

  it('alerts again after cooldown expires', () => {
    const { watcher, onAlert } = makeWatcher({
      warningMs: 1_000,
      cooldownMs: 5_000,
    });

    watcher.observe('warning', ['head-forward'], 0);
    watcher.observe('warning', ['head-forward'], 1_500);
    expect(onAlert).toHaveBeenCalledTimes(1);

    watcher.observe('good', [], 2_000);
    watcher.observe('warning', ['neck-tilt'], 8_000);
    watcher.observe('warning', ['neck-tilt'], 10_000);
    expect(onAlert).toHaveBeenCalledTimes(2);
  });

  it('does not fire when state is calibrating or inactive', () => {
    const { watcher, onAlert } = makeWatcher({ warningMs: 100 });

    watcher.observe('calibrating', [], 0);
    watcher.observe('calibrating', [], 1_000);
    watcher.observe('inactive', [], 2_000);

    expect(onAlert).not.toHaveBeenCalled();
  });

  it('reset clears all state', () => {
    const { watcher, onAlert, onClear } = makeWatcher({ warningMs: 1_000, cooldownMs: 0 });

    watcher.observe('warning', ['head-forward'], 0);
    watcher.observe('warning', ['head-forward'], 1_500);
    expect(onAlert).toHaveBeenCalledTimes(1);

    watcher.reset();
    expect(onClear).not.toHaveBeenCalled();

    watcher.observe('warning', ['head-forward'], 2_000);
    watcher.observe('warning', ['head-forward'], 3_500);
    expect(onAlert).toHaveBeenCalledTimes(2);
  });

  it('ignores brief good blips when hysteresis is configured', () => {
    const { watcher, onAlert } = makeWatcher({
      warningMs: 5_000,
      badMs: 10_000,
      cooldownMs: 0,
      goodHysteresisMs: 1_500,
    });

    watcher.observe('bad', ['head-forward'], 0);
    watcher.observe('bad', ['head-forward'], 4_000);
    // brief good frames — under the hysteresis window, so badSince must survive
    watcher.observe('good', [], 4_500);
    watcher.observe('good', [], 5_200);
    watcher.observe('bad', ['head-forward'], 5_500);
    watcher.observe('bad', ['head-forward'], 10_500);

    expect(onAlert).toHaveBeenCalledTimes(2);
    expect(onAlert.mock.calls[0][0].level).toBe('warning');
    expect(onAlert.mock.calls[1][0].level).toBe('bad');
  });

  it('clears once good posture is sustained past the hysteresis window', () => {
    const { watcher, onAlert, onClear } = makeWatcher({
      warningMs: 1_000,
      cooldownMs: 10_000,
      goodHysteresisMs: 1_500,
    });

    watcher.observe('warning', ['head-forward'], 0);
    watcher.observe('warning', ['head-forward'], 1_500);
    expect(onAlert).toHaveBeenCalledTimes(1);

    watcher.observe('good', [], 2_000);
    expect(onClear).not.toHaveBeenCalled();
    watcher.observe('good', [], 3_600);
    expect(onClear).toHaveBeenCalledTimes(1);
  });

  it('passes the primary reason to the alert callback', () => {
    const { watcher, onAlert } = makeWatcher({ warningMs: 500 });

    watcher.observe('warning', ['shoulder-tilt', 'neck-tilt'], 0);
    watcher.observe('warning', ['shoulder-tilt', 'neck-tilt'], 600);

    expect(onAlert.mock.calls[0][0].reasons).toEqual(['shoulder-tilt', 'neck-tilt']);
  });
});
