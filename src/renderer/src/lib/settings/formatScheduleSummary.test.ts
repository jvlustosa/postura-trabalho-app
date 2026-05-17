import { describe, expect, it } from 'vitest';

import { formatScheduleSummary } from './formatScheduleSummary';

describe('formatScheduleSummary', () => {
  it('renders a contiguous Mon-Fri range with bullet separator', () => {
    expect(
      formatScheduleSummary({
        weekdays: [1, 2, 3, 4, 5],
        startTime: '09:00',
        endTime: '18:00',
      }),
    ).toBe('Seg a Sex · 09:00 às 18:00');
  });

  it('renders every day when all seven weekdays are selected', () => {
    expect(
      formatScheduleSummary({
        weekdays: [0, 1, 2, 3, 4, 5, 6],
        startTime: '08:00',
        endTime: '20:00',
      }),
    ).toBe('Todos os dias · 08:00 às 20:00');
  });

  it('renders an explicit list for non-contiguous days', () => {
    expect(
      formatScheduleSummary({
        weekdays: [1, 3, 5],
        startTime: '10:00',
        endTime: '12:00',
      }),
    ).toBe('Seg, Qua, Sex · 10:00 às 12:00');
  });

  it('renders a two-day list without using "a"', () => {
    expect(
      formatScheduleSummary({
        weekdays: [1, 2],
        startTime: '09:00',
        endTime: '11:00',
      }),
    ).toBe('Seg, Ter · 09:00 às 11:00');
  });

  it('renders weekend Sat-Sun as a contiguous range when ordered after weekdays', () => {
    expect(
      formatScheduleSummary({
        weekdays: [6, 0],
        startTime: '14:00',
        endTime: '16:00',
      }),
    ).toBe('Sáb, Dom · 14:00 às 16:00');
  });

  it('renders an empty schedule with the "no days" label', () => {
    expect(
      formatScheduleSummary({
        weekdays: [],
        startTime: '09:00',
        endTime: '18:00',
      }),
    ).toBe('Nenhum dia · 09:00 às 18:00');
  });
});
