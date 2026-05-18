import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  __resetForTests,
  appendSegment,
  clearTimeline,
  loadTimeline,
  pruneSegments,
  saveTimeline,
} from './storage';
import type { TimelineSegment } from './types';

describe('timeline storage', () => {
  beforeEach(() => {
    __resetForTests();
    window.localStorage.clear();
  });

  afterEach(() => {
    __resetForTests();
    window.localStorage.clear();
  });

  it('returns an empty array when nothing is stored', () => {
    expect(loadTimeline()).toEqual([]);
  });

  it('persists and rehydrates valid segments', () => {
    const segments: TimelineSegment[] = [
      { state: 'good', startedAt: 1000, endedAt: 2000 },
      { state: 'bad', startedAt: 2000, endedAt: 5000 },
    ];
    saveTimeline(segments);

    expect(loadTimeline()).toEqual(segments);
  });

  it('discards malformed segments', () => {
    window.localStorage.setItem(
      'postura-certa.timeline.v1',
      JSON.stringify([
        { state: 'good', startedAt: 1, endedAt: 5 },
        { state: 'invalid', startedAt: 0, endedAt: 1 },
        { state: 'bad', startedAt: 10, endedAt: 5 },
        null,
        { state: 'warning', startedAt: 100, endedAt: 200 },
      ]),
    );

    expect(loadTimeline()).toEqual([
      { state: 'good', startedAt: 1, endedAt: 5 },
      { state: 'warning', startedAt: 100, endedAt: 200 },
    ]);
  });

  it('appends a new segment in a new state', () => {
    saveTimeline([{ state: 'good', startedAt: 1000, endedAt: 2000 }]);

    const result = appendSegment({ state: 'bad', startedAt: 2500, endedAt: 3500 });

    expect(result).toEqual([
      { state: 'good', startedAt: 1000, endedAt: 2000 },
      { state: 'bad', startedAt: 2500, endedAt: 3500 },
    ]);
  });

  it('merges adjacent segments with the same state', () => {
    saveTimeline([{ state: 'bad', startedAt: 1000, endedAt: 2000 }]);

    const result = appendSegment({ state: 'bad', startedAt: 2050, endedAt: 3000 });

    expect(result).toEqual([{ state: 'bad', startedAt: 1000, endedAt: 3000 }]);
  });

  it('prunes segments older than the retention window', () => {
    const day = 24 * 60 * 60 * 1000;
    const now = 10 * day;
    const segments: TimelineSegment[] = [
      { state: 'good', startedAt: 0, endedAt: 1000 },
      { state: 'bad', startedAt: 8 * day, endedAt: 8 * day + 1000 },
      { state: 'good', startedAt: 9 * day, endedAt: 9 * day + 1000 },
    ];

    const pruned = pruneSegments(segments, now, 7);

    expect(pruned).toEqual([
      { state: 'bad', startedAt: 8 * day, endedAt: 8 * day + 1000 },
      { state: 'good', startedAt: 9 * day, endedAt: 9 * day + 1000 },
    ]);
  });

  it('clearTimeline removes the persisted entry', () => {
    saveTimeline([{ state: 'good', startedAt: 1, endedAt: 2 }]);
    clearTimeline();
    expect(loadTimeline()).toEqual([]);
  });
});
