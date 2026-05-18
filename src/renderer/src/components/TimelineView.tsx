import { type ReactElement, useEffect, useMemo, useState } from 'react';
import { Activity, BarChart3, Flame, History, TrendingUp } from 'lucide-react';

import { hydrateTimeline, loadTimeline } from '../lib/timeline/storage';
import type { TimelineSegment, TimelineState } from '../lib/timeline/types';
import {
  clipSegments,
  computeBestStreak,
  computeCurrentStreak,
  computeTimelineBuckets,
  STATE_ORDER,
  sumTotals,
  type TimelineBucket,
} from '../lib/timeline/stats';
import { Tooltip } from './Tooltip';

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

const TIMELINE_BUCKETS: Record<Range, number> = {
  '24h': 24,
  '7d': 28,
};

const STATE_LABEL: Record<TimelineState, string> = {
  good: 'Postura ok',
  warning: 'Ajuste leve',
  bad: 'Postura ruim',
};

const formatDuration = (ms: number): string => {
  if (ms < 1000) return '0s';
  const totalSeconds = Math.round(ms / 1000);
  if (totalSeconds < 60) return `${totalSeconds}s`;
  const totalMinutes = Math.floor(totalSeconds / 60);
  if (totalMinutes < 60) return `${totalMinutes} min`;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes - hours * 60;
  return minutes > 0 ? `${hours}h ${minutes} min` : `${hours}h`;
};

const formatPercent = (value: number): string => `${Math.round(value * 100)}%`;

const formatBucketLabel = (range: Range, bucketStart: number): string => {
  const date = new Date(bucketStart);
  if (range === '24h') {
    return `${String(date.getHours()).padStart(2, '0')}h`;
  }
  return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}`;
};

const formatBucketRangeLabel = (range: Range, bucket: TimelineBucket): string => {
  const start = new Date(bucket.bucketStart);
  const end = new Date(bucket.bucketEnd);
  const pad = (n: number): string => String(n).padStart(2, '0');
  if (range === '24h') {
    return `${pad(start.getHours())}:${pad(start.getMinutes())} – ${pad(end.getHours())}:${pad(end.getMinutes())}`;
  }
  return `${pad(start.getDate())}/${pad(start.getMonth() + 1)} ${pad(start.getHours())}h – ${pad(end.getDate())}/${pad(end.getMonth() + 1)} ${pad(end.getHours())}h`;
};

interface TimelineChartProps {
  buckets: readonly TimelineBucket[];
  range: Range;
}

const STACK_ORDER: readonly TimelineState[] = ['bad', 'warning', 'good'];

const stateMs = (bucket: TimelineBucket, state: TimelineState): number => {
  if (state === 'good') return bucket.goodMs;
  if (state === 'warning') return bucket.warningMs;
  return bucket.badMs;
};

const TimelineChart = ({ buckets, range }: TimelineChartProps): ReactElement => {
  const n = buckets.length;
  if (n === 0) {
    return <div className="timeline-chart timeline-chart--empty" aria-hidden="true" />;
  }

  const maxMonitored = Math.max(1, ...buckets.map((b) => b.monitoredMs));

  const desiredLabels = range === '24h' ? 5 : 6;
  const labelIndices = Array.from({ length: desiredLabels }, (_, k) =>
    Math.round((k / (desiredLabels - 1)) * (n - 1)),
  );
  const labelSet = new Set(labelIndices);

  return (
    <div className="timeline-chart" role="img" aria-label="Distribuição de postura ao longo do tempo">
      <div className="timeline-chart__plot">
        {buckets.map((bucket) => {
          const intensity = bucket.monitoredMs / maxMonitored;
          const heightPct = bucket.monitoredMs > 0 ? Math.max(4, intensity * 100) : 0;
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
                  <div
                    className="timeline-chart__column"
                    style={{ height: `${heightPct}%` }}
                  >
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
          if (!labelSet.has(i)) return null;
          const ratio = n === 1 ? 0.5 : i / (n - 1);
          const align = ratio < 0.04 ? 'start' : ratio > 0.96 ? 'end' : 'center';
          return (
            <span
              key={bucket.bucketStart}
              className={`timeline-chart__tick timeline-chart__tick--${align}`}
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
  const hasAnyHistory = segments.length > 0;
  const pct = (value: number): number => (hasData ? value / totals.monitored : 0);

  const bestStreak = useMemo(() => computeBestStreak(segments), [segments]);
  const currentStreak = useMemo(() => computeCurrentStreak(segments, now), [segments, now]);

  const buckets = useMemo(
    () => computeTimelineBuckets(clipped, rangeStart, rangeEnd, TIMELINE_BUCKETS[range]),
    [clipped, rangeStart, rangeEnd, range],
  );

  return (
    <section className="card timeline-card settings-card" aria-label="Histórico de postura">
      <header className="settings-card__header">
        <div className="timeline-card__heading">
          <div className="timeline-card__title-group">
            <span className="timeline-card__title-icon" aria-hidden="true">
              <History size={20} />
            </span>
            <h2 className="settings-card__title">Histórico de postura</h2>
          </div>
          {hasAnyHistory ? (
            <p className="timeline-card__subtitle">
              Tempo monitorado: {formatDuration(totals.monitored)}
            </p>
          ) : null}
        </div>
        <button className="button button--text" type="button" onClick={onClose}>
          Fechar
        </button>
      </header>

      {!hasAnyHistory ? (
        <div className="timeline-empty timeline-empty--hero" role="status">
          <span className="timeline-empty__icon" aria-hidden="true">
            <Activity size={32} />
          </span>
          <p>Nenhum histórico ainda</p>
          <span>
            Ative o monitoramento e o seu tempo de postura ok aparece aqui em segundos.
          </span>
        </div>
      ) : (
        <>
          <div className="streak-row">
            <div className="streak-card streak-card--record">
              <div className="streak-card__icon" aria-hidden="true">
                <Flame size={18} />
              </div>
              <div className="streak-card__content">
                <span className="streak-card__label">Recorde de postura</span>
                <span className="streak-card__value">
                  {bestStreak > 0 ? formatDuration(bestStreak) : '-'}
                </span>
              </div>
            </div>
            <div className="streak-card streak-card--current">
              <div className="streak-card__icon streak-card__icon--current" aria-hidden="true">
                <TrendingUp size={18} />
              </div>
              <div className="streak-card__content">
                <span className="streak-card__label">Streak atual</span>
                <span className="streak-card__value">
                  {currentStreak > 0 ? formatDuration(currentStreak) : '-'}
                </span>
              </div>
            </div>
          </div>

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
        <>
          <div className="timeline-summary">
            <div className="donut-chart" aria-hidden="true">
              <svg viewBox="0 0 120 120" className="donut-chart__svg">
                {(() => {
                  const r = 50;
                  const cx = 60;
                  const cy = 60;
                  const circumference = 2 * Math.PI * r;
                  const slices: { state: TimelineState; pct: number }[] = STATE_ORDER.filter(
                    (s) => totals[s] > 0,
                  ).map((s) => ({ state: s, pct: totals[s] / totals.monitored }));

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
                <span className="donut-chart__caption">do tempo</span>
              </div>
            </div>

            <ul className="timeline-stats">
              {STATE_ORDER.map((state) => (
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

          <section className="timeline-chart-section" aria-label="Linha do tempo de postura">
            <header className="timeline-chart-section__header">
              <span className="timeline-chart-section__title-group">
                <BarChart3 size={16} aria-hidden="true" className="timeline-chart-section__icon" />
                <h3 className="timeline-chart-section__title">Linha do tempo</h3>
              </span>
              <span className="timeline-chart-section__hint">
                por {range === '24h' ? 'hora' : '6h'}
              </span>
            </header>
            <TimelineChart buckets={buckets} range={range} />
            <ul className="timeline-chart__legend" aria-hidden="true">
              {STATE_ORDER.map((state) => (
                <li key={state} className="timeline-chart__legend-item">
                  <span
                    className={`timeline-chart__legend-dot timeline-chart__legend-dot--${state}`}
                  />
                  <span>{STATE_LABEL[state]}</span>
                </li>
              ))}
            </ul>
          </section>
        </>
          ) : (
            <div className="timeline-empty" role="status">
              <span className="timeline-empty__icon" aria-hidden="true">
                <Activity size={24} />
              </span>
              <p>Sem dados nesta janela</p>
              <span>Troque o período ou ative o monitoramento para registrar.</span>
            </div>
          )}
        </>
      )}
    </section>
  );
};
