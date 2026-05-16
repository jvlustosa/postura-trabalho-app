import { describe, expect, it, vi } from 'vitest';

import { createTimelineRecorder } from './createTimelineRecorder';
import type { TimelineSegment } from './types';

describe('createTimelineRecorder', () => {
  it('records a segment on state change and persists with retention', () => {
    const persist = vi.fn();
    const recorder = createTimelineRecorder({ persist, retentionDays: 5, minSegmentMs: 0 });

    recorder.observe('good', 1000);
    recorder.observe('good', 2000);
    recorder.observe('bad', 3000);

    expect(persist).toHaveBeenCalledTimes(1);
    expect(persist).toHaveBeenCalledWith<[TimelineSegment, number]>(
      { state: 'good', startedAt: 1000, endedAt: 3000 },
      5,
    );
  });

  it('skips persisting segments shorter than the configured minimum', () => {
    const persist = vi.fn();
    const recorder = createTimelineRecorder({ persist, minSegmentMs: 500 });

    recorder.observe('good', 0);
    recorder.observe('bad', 200);
    recorder.observe('good', 1000);

    expect(persist).toHaveBeenCalledTimes(1);
    expect(persist.mock.calls[0]?.[0]).toMatchObject({ state: 'bad', startedAt: 200, endedAt: 1000 });
  });

  it('ignores non-recordable states and commits the current segment', () => {
    const persist = vi.fn();
    const recorder = createTimelineRecorder({ persist, minSegmentMs: 0 });

    recorder.observe('good', 1000);
    recorder.observe('calibrating', 2000);
    recorder.observe('good', 3000);

    expect(persist).toHaveBeenCalledTimes(1);
    expect(persist.mock.calls[0]?.[0]).toMatchObject({
      state: 'good',
      startedAt: 1000,
      endedAt: 2000,
    });
  });

  it('flushes the active recording', () => {
    const persist = vi.fn();
    const recorder = createTimelineRecorder({ persist, minSegmentMs: 0 });

    recorder.observe('warning', 100);
    recorder.observe('warning', 5000);
    recorder.flush(6000);

    expect(persist).toHaveBeenCalledTimes(1);
    expect(persist.mock.calls[0]?.[0]).toMatchObject({
      state: 'warning',
      startedAt: 100,
      endedAt: 6000,
    });
  });

  it('reset discards any active recording without persisting', () => {
    const persist = vi.fn();
    const recorder = createTimelineRecorder({ persist, minSegmentMs: 0 });

    recorder.observe('bad', 0);
    recorder.observe('bad', 2000);
    recorder.reset();
    recorder.flush(3000);

    expect(persist).not.toHaveBeenCalled();
  });
});
