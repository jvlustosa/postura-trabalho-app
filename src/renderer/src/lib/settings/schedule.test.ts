import { describe, expect, it } from 'vitest';

import { isWithinSchedule } from './schedule';
import type { ScheduleConfig } from './types';

const at = (iso: string): Date => new Date(iso);

describe('isWithinSchedule', () => {
  it('returns false when no weekdays selected', () => {
    const schedule: ScheduleConfig = { weekdays: [], startTime: '09:00', endTime: '18:00' };
    expect(isWithinSchedule(schedule, at('2026-05-18T10:00:00'))).toBe(false);
  });

  it('returns true inside a daytime window', () => {
    const schedule: ScheduleConfig = { weekdays: [1], startTime: '09:00', endTime: '18:00' };
    expect(isWithinSchedule(schedule, at('2026-05-18T09:00:00'))).toBe(true);
    expect(isWithinSchedule(schedule, at('2026-05-18T17:59:00'))).toBe(true);
  });

  it('returns false outside a daytime window', () => {
    const schedule: ScheduleConfig = { weekdays: [1], startTime: '09:00', endTime: '18:00' };
    expect(isWithinSchedule(schedule, at('2026-05-18T08:59:00'))).toBe(false);
    expect(isWithinSchedule(schedule, at('2026-05-18T18:00:00'))).toBe(false);
  });

  it('returns false on excluded weekday', () => {
    const schedule: ScheduleConfig = { weekdays: [1, 2, 3, 4, 5], startTime: '09:00', endTime: '18:00' };
    expect(isWithinSchedule(schedule, at('2026-05-16T12:00:00'))).toBe(false);
  });

  it('handles windows that cross midnight', () => {
    const schedule: ScheduleConfig = { weekdays: [1], startTime: '22:00', endTime: '02:00' };
    expect(isWithinSchedule(schedule, at('2026-05-18T23:00:00'))).toBe(true);
    expect(isWithinSchedule(schedule, at('2026-05-19T01:00:00'))).toBe(true);
    expect(isWithinSchedule(schedule, at('2026-05-19T02:00:00'))).toBe(false);
    expect(isWithinSchedule(schedule, at('2026-05-19T22:00:00'))).toBe(false);
  });
});
