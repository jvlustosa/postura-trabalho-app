import type { PostureState } from '../posture/types';

export type TimelineState = Extract<PostureState, 'good' | 'warning' | 'bad'>;

export interface TimelineSegment {
  state: TimelineState;
  startedAt: number;
  endedAt: number;
}
