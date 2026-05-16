import type { PostureAnalysis, PostureState } from './types';

export interface PostureSmoother {
  push(analysis: PostureAnalysis): PostureAnalysis;
  reset(): void;
}

export const createPostureSmoother = (windowSize = 8): PostureSmoother => {
  const samples: PostureAnalysis[] = [];

  return {
    push(analysis) {
      samples.push(analysis);

      if (samples.length > windowSize) {
        samples.shift();
      }

      const stateCounts = samples.reduce<Record<string, number>>((counts, sample) => {
        counts[sample.state] = (counts[sample.state] ?? 0) + 1;

        return counts;
      }, {});

      const majorityState = Object.entries(stateCounts).sort(([, a], [, b]) => b - a)[0]?.[0] as
        | PostureState
        | undefined;

      if (!majorityState || majorityState === analysis.state) {
        return analysis;
      }

      const matching = [...samples].reverse().find((sample) => sample.state === majorityState);

      return matching ?? analysis;
    },
    reset() {
      samples.length = 0;
    },
  };
};
