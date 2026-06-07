import { type ReactElement } from 'react';

import {
  evenlySpacedIndices,
  formatBucketLabel,
  formatBucketRangeLabel,
  formatDuration,
  STATE_LABEL,
  tickAlign,
  type TimelineRange,
} from '../../lib/timeline/format';
import { STATE_ORDER, type TimelineBucket } from '../../lib/timeline/stats';
import type { TimelineState } from '../../lib/timeline/types';
import { Tooltip } from '../Tooltip';

interface TimelineChartProps {
  buckets: readonly TimelineBucket[];
  range: TimelineRange;
}

/** Stacked from bottom to top so "good" sits on top of the column. */
const STACK_ORDER: readonly TimelineState[] = ['bad', 'warning', 'good'];

const stateMs = (bucket: TimelineBucket, state: TimelineState): number => {
  if (state === 'good') return bucket.goodMs;
  if (state === 'warning') return bucket.warningMs;
  return bucket.badMs;
};

/** Stacked-bar distribution of posture states across each time bucket. */
export const TimelineChart = ({ buckets, range }: TimelineChartProps): ReactElement => {
  const n = buckets.length;
  if (n === 0) {
    return <div className="timeline-chart timeline-chart--empty" aria-hidden="true" />;
  }

  const maxMonitored = Math.max(1, ...buckets.map((b) => b.monitoredMs));
  const labelIndices = new Set(evenlySpacedIndices(range === '24h' ? 5 : 6, n));

  return (
    <div className="timeline-chart" role="img" aria-label="Distribuição de postura ao longo do tempo">
      <div className="timeline-chart__plot">
        {buckets.map((bucket) => {
          const heightPct =
            bucket.monitoredMs > 0 ? Math.max(4, (bucket.monitoredMs / maxMonitored) * 100) : 0;
          const tooltipLabel = (
            <div className="timeline-chart__tooltip">
              <strong>{formatBucketRangeLabel(range, bucket)}</strong>
              {bucket.monitoredMs === 0 ? (
                <span>Sem monitoramento</span>
              ) : (
                STATE_ORDER.map((state) => {
                  const ms = stateMs(bucket, state);
                  if (ms <= 0) return null;
                  return (
                    <span key={state} className="timeline-chart__tooltip-row">
                      <span
                        className={`timeline-chart__tooltip-dot timeline-chart__tooltip-dot--${state}`}
                        aria-hidden="true"
                      />
                      <span className="timeline-chart__tooltip-label">{STATE_LABEL[state]}</span>
                      <span className="timeline-chart__tooltip-value">{formatDuration(ms)}</span>
                    </span>
                  );
                })
              )}
            </div>
          );
          return (
            <Tooltip key={bucket.bucketStart} label={tooltipLabel} placement="top" delay={150}>
              <div className="timeline-chart__bucket" tabIndex={0}>
                {bucket.monitoredMs > 0 ? (
                  <div className="timeline-chart__column" style={{ height: `${heightPct}%` }}>
                    {STACK_ORDER.map((state) => {
                      const ms = stateMs(bucket, state);
                      if (ms <= 0) return null;
                      const pct = (ms / bucket.monitoredMs) * 100;
                      return (
                        <span
                          key={state}
                          className={`timeline-chart__seg timeline-chart__seg--${state}`}
                          style={{ height: `${pct}%` }}
                        />
                      );
                    })}
                  </div>
                ) : (
                  <span className="timeline-chart__empty-dot" aria-hidden="true" />
                )}
              </div>
            </Tooltip>
          );
        })}
      </div>
      <div className="timeline-chart__axis" aria-hidden="true">
        {buckets.map((bucket, i) => {
          if (!labelIndices.has(i)) return null;
          const ratio = n === 1 ? 0.5 : i / (n - 1);
          return (
            <span
              key={bucket.bucketStart}
              className={`timeline-chart__tick timeline-chart__tick--${tickAlign(ratio)}`}
              style={{ left: `${ratio * 100}%` }}
            >
              {formatBucketLabel(range, bucket.bucketStart)}
            </span>
          );
        })}
      </div>
    </div>
  );
};
