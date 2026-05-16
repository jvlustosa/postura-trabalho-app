import { appendSegment } from './storage';
import type { TimelineSegment, TimelineState } from './types';
import type { PostureState } from '../posture/types';

const isRecordableState = (state: PostureState): state is TimelineState =>
  state === 'good' || state === 'warning' || state === 'bad';

const MIN_SEGMENT_MS = 750;

export interface TimelineRecorder {
  observe: (state: PostureState, now?: number) => void;
  flush: (now?: number) => void;
  reset: () => void;
}

export interface CreateTimelineRecorderOptions {
  retentionDays?: number;
  persist?: (segment: TimelineSegment, retentionDays: number) => void;
  minSegmentMs?: number;
}

interface ActiveRecording {
  state: TimelineState;
  startedAt: number;
  lastSeenAt: number;
}

const deferPersist = (run: () => void): void => {
  if (typeof queueMicrotask === 'function') {
    queueMicrotask(run);
    return;
  }
  setTimeout(run, 0);
};

export const createTimelineRecorder = (
  options: CreateTimelineRecorderOptions = {},
): TimelineRecorder => {
  const retentionDays = options.retentionDays ?? 7;
  const userPersist = options.persist;
  const persist = userPersist
    ? userPersist
    : (segment: TimelineSegment, days: number): void => {
        deferPersist(() => {
          appendSegment(segment, days);
        });
      };
  const minSegmentMs = options.minSegmentMs ?? MIN_SEGMENT_MS;
  let active: ActiveRecording | null = null;

  const commit = (recording: ActiveRecording): void => {
    if (recording.lastSeenAt - recording.startedAt < minSegmentMs) {
      return;
    }
    persist(
      {
        state: recording.state,
        startedAt: recording.startedAt,
        endedAt: recording.lastSeenAt,
      },
      retentionDays,
    );
  };

  const closeActive = (now: number): void => {
    if (!active) {
      return;
    }
    active.lastSeenAt = Math.max(active.lastSeenAt, now);
    commit(active);
    active = null;
  };

  return {
    observe(state, now = Date.now()): void {
      if (!isRecordableState(state)) {
        closeActive(now);
        return;
      }

      if (!active) {
        active = { state, startedAt: now, lastSeenAt: now };
        return;
      }

      if (active.state === state) {
        active.lastSeenAt = now;
        return;
      }

      closeActive(now);
      active = { state, startedAt: now, lastSeenAt: now };
    },
    flush(now = Date.now()): void {
      closeActive(now);
    },
    reset(): void {
      active = null;
    },
  };
};
