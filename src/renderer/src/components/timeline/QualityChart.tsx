import { type ReactElement } from 'react';

import {
  buildAreaPath,
  buildQualitySegments,
  toPolylinePoints,
} from '../../lib/timeline/buildQualityLine';
import {
  evenlySpacedIndices,
  formatBucketLabel,
  tickAlign,
  type TimelineRange,
} from '../../lib/timeline/format';
import type { TimelineBucket } from '../../lib/timeline/stats';

interface QualityChartProps {
  buckets: readonly TimelineBucket[];
  range: TimelineRange;
}

const CHART_W = 300;
const CHART_H = 60;
const GRID_RATIOS = [0.5, 0.75] as const;

/** Line chart of the share of "postura ok" time across each time bucket. */
export const QualityChart = ({ buckets, range }: QualityChartProps): ReactElement => {
  const n = buckets.length;
  if (n === 0) {
    return <div className="quality-chart quality-chart--empty" aria-hidden="true" />;
  }

  const segments = buildQualitySegments(buckets, CHART_W, CHART_H);
  const gridYOf = (ratio: number): number => CHART_H - ratio * CHART_H;
  const labelIndices = new Set(evenlySpacedIndices(range === '24h' ? 5 : 6, n));

  return (
    <div className="quality-chart" role="img" aria-label="Qualidade da postura ao longo do tempo">
      <svg
        viewBox={`0 0 ${CHART_W} ${CHART_H}`}
        preserveAspectRatio="none"
        className="quality-chart__svg"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="qc-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--md-sys-color-primary)" stopOpacity="0.28" />
            <stop offset="100%" stopColor="var(--md-sys-color-primary)" stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {GRID_RATIOS.map((ratio) => (
          <g key={ratio}>
            <line
              x1={0}
              y1={gridYOf(ratio)}
              x2={CHART_W}
              y2={gridYOf(ratio)}
              className="quality-chart__grid"
            />
            <text x={CHART_W} y={gridYOf(ratio) - 2} className="quality-chart__y-label">
              {Math.round(ratio * 100)}%
            </text>
          </g>
        ))}

        {segments.map((points, i) => (
          <path key={`area-${i}`} d={buildAreaPath(points, CHART_H)} className="quality-chart__area" />
        ))}

        {segments.map((points, i) => (
          <polyline key={`line-${i}`} points={toPolylinePoints(points)} className="quality-chart__line" />
        ))}

        {segments.flat().map((point) => (
          <circle
            key={point.index}
            cx={point.x}
            cy={point.y}
            r={2}
            className="quality-chart__dot"
          />
        ))}
      </svg>

      <div className="quality-chart__axis" aria-hidden="true">
        {buckets.map((bucket, i) => {
          if (!labelIndices.has(i)) return null;
          const ratio = n === 1 ? 0.5 : i / (n - 1);
          return (
            <span
              key={bucket.bucketStart}
              className={`quality-chart__tick quality-chart__tick--${tickAlign(ratio)}`}
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
