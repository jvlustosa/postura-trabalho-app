import { describe, expect, it } from 'vitest';

import { decideScheduleAutoStart } from './scheduleAutoStart';

describe('decideScheduleAutoStart', () => {
  it('auto-starts on the first tick when opening the app inside the window', () => {
    expect(
      decideScheduleAutoStart({
        isWithinWindow: true,
        wasWithinWindow: null,
        isCheckActive: false,
      }),
    ).toBe('start');
  });

  it('does not auto-start on the first tick when outside the window', () => {
    expect(
      decideScheduleAutoStart({
        isWithinWindow: false,
        wasWithinWindow: null,
        isCheckActive: false,
      }),
    ).toBeNull();
  });

  it('auto-starts when transitioning from outside to inside the window', () => {
    expect(
      decideScheduleAutoStart({
        isWithinWindow: true,
        wasWithinWindow: false,
        isCheckActive: false,
      }),
    ).toBe('start');
  });

  it('does nothing while the window remains open and nothing is running', () => {
    expect(
      decideScheduleAutoStart({
        isWithinWindow: true,
        wasWithinWindow: true,
        isCheckActive: false,
      }),
    ).toBeNull();
  });

  it('does not stop a manually-started run when leaving the window', () => {
    // Regression: schedule must never tear down a check the user is using.
    expect(
      decideScheduleAutoStart({
        isWithinWindow: false,
        wasWithinWindow: true,
        isCheckActive: true,
      }),
    ).toBeNull();
  });

  it('does not stop a run that was started outside the window', () => {
    // Regression: user starts manually at 7am with an 9am-5pm schedule.
    // Each subsequent tick before 9am must keep the run alive.
    expect(
      decideScheduleAutoStart({
        isWithinWindow: false,
        wasWithinWindow: false,
        isCheckActive: true,
      }),
    ).toBeNull();
  });

  it('does not re-start when entering the window if a manual run is already active', () => {
    // User started manually at 7am, time crosses 9am into the schedule window.
    expect(
      decideScheduleAutoStart({
        isWithinWindow: true,
        wasWithinWindow: false,
        isCheckActive: true,
      }),
    ).toBeNull();
  });

  it('does not act when the user stops a run while still inside the window', () => {
    // User stopped manually at 10am inside a 9am-5pm window; schedule must not re-start.
    expect(
      decideScheduleAutoStart({
        isWithinWindow: true,
        wasWithinWindow: true,
        isCheckActive: false,
      }),
    ).toBeNull();
  });

  it('does nothing while the window stays closed and nothing is running', () => {
    expect(
      decideScheduleAutoStart({
        isWithinWindow: false,
        wasWithinWindow: false,
        isCheckActive: false,
      }),
    ).toBeNull();
  });

  it('does not auto-start on the first tick when opened inside the window with a run already restored', () => {
    // Session persistence restored an active check; do not redundantly call start.
    expect(
      decideScheduleAutoStart({
        isWithinWindow: true,
        wasWithinWindow: null,
        isCheckActive: true,
      }),
    ).toBeNull();
  });
});
