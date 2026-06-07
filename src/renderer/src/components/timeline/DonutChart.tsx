import { type ReactElement } from 'react';

import { formatPercent } from '../../lib/timeline/format';
import { STATE_ORDER, type Totals } from '../../lib/timeline/stats';

interface DonutChartProps {
  totals: Totals;
}

const RADIUS = 50;
const CENTER = 60;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/** Donut breakdown of monitored time by posture state, with good-time % in the center. */
export const DonutChart = ({ totals }: DonutChartProps): ReactElement => {
  const slices = STATE_ORDER.filter((state) => totals[state] > 0).map((state) => ({
    state,
    pct: totals[state] / totals.monitored,
  }));

  let offset = 0;
  const goodPct = totals.monitored > 0 ? totals.good / totals.monitored : 0;

  return (
    <div className="donut-chart" aria-hidden="true">
      <svg viewBox="0 0 120 120" className="donut-chart__svg">
        {slices.map(({ state, pct }) => {
          const dashArray = `${pct * CIRCUMFERENCE} ${CIRCUMFERENCE}`;
          const dashOffset = -offset * CIRCUMFERENCE;
          offset += pct;
          return (
            <circle
              key={state}
              className={`donut-chart__slice donut-chart__slice--${state}`}
              cx={CENTER}
              cy={CENTER}
              r={RADIUS}
              fill="none"
              strokeWidth="14"
              strokeDasharray={dashArray}
              strokeDashoffset={dashOffset}
              strokeLinecap="butt"
              transform="rotate(-90 60 60)"
            />
          );
        })}
      </svg>
      <div className="donut-chart__center">
        <span className="donut-chart__value">{formatPercent(goodPct)}</span>
        <span className="donut-chart__caption">do tempo</span>
      </div>
    </div>
  );
};
