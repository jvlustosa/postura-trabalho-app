import { type ReactElement, useEffect, useMemo, useState } from 'react';
import { Clock, Trash2, X } from 'lucide-react';

import { clearTimeline, hydrateTimeline, loadTimeline } from '../lib/timeline/storage';
import type { TimelineSegment, TimelineState } from '../lib/timeline/types';

interface TimelineViewProps {
  onClose: () => void;
}

type Range = '24h' | '7d';

const RANGE_DURATION_MS: Record<Range, number> = {
  '24h': 24 * 60 * 60 * 1000,
  '7d': 7 * 24 * 60 * 60 * 1000,
};

const RANGE_LABEL: Record<Range, string> = {
  '24h': 'Últimas 24h',
  '7d': 'Últimos 7 dias',
};

const STATE_LABEL: Record<TimelineState, string> = {
  good: 'Postura ok',
  warning: 'Ajuste leve',
  bad: 'Postura ruim',
};

const formatDuration = (ms: number): string => {
  if (ms < 1000) {
    return '0s';
  }
  const totalSeconds = Math.round(ms / 1000);
  if (totalSeconds < 60) {
    return `${totalSeconds}s`;
  }
  const totalMinutes = Math.floor(totalSeconds / 60);
  if (totalMinutes < 60) {
    return `${totalMinutes} min`;
  }
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes - hours * 60;
  return minutes > 0 ? `${hours}h ${minutes} min` : `${hours}h`;
};

const formatPercent = (value: number): string => `${Math.round(value * 100)}%`;

interface ClippedSegment extends TimelineSegment {
  durationMs: number;
}

const clipSegments = (
  segments: readonly TimelineSegment[],
  rangeStart: number,
  rangeEnd: number,
): ClippedSegment[] => {
  const clipped: ClippedSegment[] = [];
  for (const segment of segments) {
    if (segment.endedAt <= rangeStart || segment.startedAt >= rangeEnd) {
      continue;
    }
    const startedAt = Math.max(segment.startedAt, rangeStart);
    const endedAt = Math.min(segment.endedAt, rangeEnd);
    const durationMs = Math.max(0, endedAt - startedAt);
    if (durationMs === 0) {
      continue;
    }
    clipped.push({ state: segment.state, startedAt, endedAt, durationMs });
  }
  return clipped;
};

interface Totals {
  good: number;
  warning: number;
  bad: number;
  monitored: number;
}

const sumTotals = (segments: readonly ClippedSegment[]): Totals => {
  const totals: Totals = { good: 0, warning: 0, bad: 0, monitored: 0 };
  for (const segment of segments) {
    totals[segment.state] += segment.durationMs;
    totals.monitored += segment.durationMs;
  }
  return totals;
};

export const TimelineView = ({ onClose }: TimelineViewProps): ReactElement => {
  const [segments, setSegments] = useState<TimelineSegment[]>([]);
  const [range, setRange] = useState<Range>('24h');
  const [now, setNow] = useState<number>(() => Date.now());

  useEffect(() => {
    let cancelled = false;
    void hydrateTimeline().then((loaded) => {
      if (cancelled) return;
      setSegments(loaded);
    });
    setSegments(loadTimeline());
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(id);
  }, []);

  const rangeEnd = now;
  const rangeStart = rangeEnd - RANGE_DURATION_MS[range];

  const clipped = useMemo(
    () => clipSegments(segments, rangeStart, rangeEnd),
    [segments, rangeStart, rangeEnd],
  );

  const totals = useMemo(() => sumTotals(clipped), [clipped]);
  const hasData = totals.monitored > 0;
  const pct = (value: number): number => (hasData ? value / totals.monitored : 0);

  const handleClear = (): void => {
    clearTimeline();
    setSegments([]);
  };

  return (
    <section className="card timeline-card" aria-label="Histórico de postura">
      <header className="timeline-card__header">
        <div>
          <h2 className="timeline-card__title">Histórico de postura</h2>
          <p className="timeline-card__subtitle">
            <Clock size={13} aria-hidden="true" />
            <span>Tempo monitorado: {formatDuration(totals.monitored)}</span>
          </p>
        </div>
        <button
          className="icon-button"
          type="button"
          onClick={onClose}
          aria-label="Fechar histórico"
        >
          <X size={20} aria-hidden="true" />
        </button>
      </header>

      <div className="segmented" role="radiogroup" aria-label="Janela de tempo">
        {(Object.keys(RANGE_LABEL) as Range[]).map((option) => {
          const isSelected = option === range;
          return (
            <button
              key={option}
              type="button"
              role="radio"
              aria-checked={isSelected}
              className={`segmented__option${isSelected ? ' segmented__option--selected' : ''}`}
              onClick={() => setRange(option)}
            >
              {RANGE_LABEL[option]}
            </button>
          );
        })}
      </div>

      {hasData ? (
        <div className="timeline-summary">
          <div className="donut-chart" aria-hidden="true">
            <svg viewBox="0 0 120 120" className="donut-chart__svg">
              {(() => {
                const r = 50;
                const cx = 60;
                const cy = 60;
                const circumference = 2 * Math.PI * r;
                const slices: { state: TimelineState; pct: number }[] = (
                  ['good', 'warning', 'bad'] as const
                )
                  .filter((s) => totals[s] > 0)
                  .map((s) => ({ state: s, pct: totals[s] / totals.monitored }));

                let offset = 0;
                return slices.map(({ state, pct: slicePct }) => {
                  const dashArray = `${slicePct * circumference} ${circumference}`;
                  const dashOffset = -offset * circumference;
                  offset += slicePct;
                  return (
                    <circle
                      key={state}
                      className={`donut-chart__slice donut-chart__slice--${state}`}
                      cx={cx}
                      cy={cy}
                      r={r}
                      fill="none"
                      strokeWidth="14"
                      strokeDasharray={dashArray}
                      strokeDashoffset={dashOffset}
                      strokeLinecap="butt"
                      transform="rotate(-90 60 60)"
                    />
                  );
                });
              })()}
            </svg>
            <div className="donut-chart__center">
              <span className="donut-chart__value">{formatPercent(pct(totals.good))}</span>
              <span className="donut-chart__caption">Postura ok</span>
            </div>
          </div>

          <ul className="timeline-stats">
            {(['good', 'warning', 'bad'] as const).map((state) => (
              <li key={state} className="timeline-stats__item">
                <div className="timeline-stats__row">
                  <span
                    className={`timeline-stats__dot timeline-stats__dot--${state}`}
                    aria-hidden="true"
                  />
                  <span className="timeline-stats__label">{STATE_LABEL[state]}</span>
                  <span className="timeline-stats__value">{formatDuration(totals[state])}</span>
                  <span className="timeline-stats__hint">{formatPercent(pct(totals[state]))}</span>
                </div>
                <div className="timeline-stats__track" aria-hidden="true">
                  <span
                    className={`timeline-stats__fill timeline-stats__fill--${state}`}
                    style={{ width: `${pct(totals[state]) * 100}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="timeline-empty" role="status">
          <Clock size={20} aria-hidden="true" />
          <p>Sem dados nesta janela.</p>
          <span>Ative o monitoramento para começar a registrar.</span>
        </div>
      )}

      <div className="timeline-card__footer">
        <button
          className="button button--text"
          type="button"
          onClick={handleClear}
          disabled={segments.length === 0}
        >
          <Trash2 size={16} aria-hidden="true" />
          Limpar histórico
        </button>
      </div>
    </section>
  );
};
