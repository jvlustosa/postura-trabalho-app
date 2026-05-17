import { type ReactElement, useEffect, useMemo, useState } from 'react';
import { Flame, Trash2, TrendingUp, X } from 'lucide-react';

import { clearTimeline, hydrateTimeline, loadTimeline } from '../lib/timeline/storage';
import type { TimelineSegment, TimelineState } from '../lib/timeline/types';
import {
  clipSegments,
  computeBestStreak,
  computeCurrentStreak,
  computeSparkline,
  STATE_ORDER,
  sumTotals,
  type SparklinePoint,
} from '../lib/timeline/stats';
import { useConfirm } from './ConfirmDialog';

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

const SPARKLINE_BUCKETS: Record<Range, number> = {
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

interface SparklineChartProps {
  points: readonly SparklinePoint[];
  range: Range;
}

const SparklineChart = ({ points, range }: SparklineChartProps): ReactElement => {
  const width = 320;
  const height = 64;
  const paddingY = 6;
  const usableH = height - paddingY * 2;
  const n = points.length;
  if (n === 0) {
    return <div className="sparkline sparkline--empty" aria-hidden="true" />;
  }

  const xAt = (i: number): number => (n === 1 ? width / 2 : (i / (n - 1)) * width);
  const yAt = (ratio: number): number => paddingY + (1 - ratio) * usableH;

  const linePoints = points
    .map((p, i) => `${xAt(i).toFixed(2)},${yAt(p.goodRatio).toFixed(2)}`)
    .join(' ');

  const areaPoints = `0,${height} ${linePoints} ${width},${height}`;

  const desiredLabels = range === '24h' ? 5 : 6;
  const labelIndices = Array.from({ length: desiredLabels }, (_, k) =>
    Math.round((k / (desiredLabels - 1)) * (n - 1)),
  );
  const labelSet = new Set(labelIndices);

  return (
    <div className="sparkline" role="img" aria-label="Tendência de postura ok ao longo do tempo">
      <svg viewBox={`0 0 ${width} ${height}`} className="sparkline__svg" preserveAspectRatio="none">
        <line
          x1={0}
          x2={width}
          y1={yAt(0.5)}
          y2={yAt(0.5)}
          className="sparkline__grid"
          strokeDasharray="2 4"
        />
        <polygon points={areaPoints} className="sparkline__area" />
        <polyline points={linePoints} className="sparkline__line" />
        {points.map((p, i) => {
          if (p.monitoredMs <= 0) return null;
          return (
            <circle
              key={p.bucketStart}
              cx={xAt(i)}
              cy={yAt(p.goodRatio)}
              r={2.5}
              className="sparkline__dot"
            />
          );
        })}
      </svg>
      <div className="sparkline__axis" aria-hidden="true">
        {points.map((p, i) => {
          if (!labelSet.has(i)) return null;
          const ratio = n === 1 ? 0.5 : i / (n - 1);
          const align = ratio < 0.04 ? 'start' : ratio > 0.96 ? 'end' : 'center';
          return (
            <span
              key={p.bucketStart}
              className={`sparkline__tick sparkline__tick--${align}`}
              style={{ left: `${ratio * 100}%` }}
            >
              {formatBucketLabel(range, p.bucketStart)}
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
  const { confirm, dialog: confirmDialog } = useConfirm();

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

  const bestStreak = useMemo(() => computeBestStreak(segments), [segments]);
  const currentStreak = useMemo(() => computeCurrentStreak(segments, now), [segments, now]);

  const sparkline = useMemo(
    () => computeSparkline(clipped, rangeStart, rangeEnd, SPARKLINE_BUCKETS[range]),
    [clipped, rangeStart, rangeEnd, range],
  );

  const handleClear = async (): Promise<void> => {
    const ok = await confirm({
      title: 'Limpar histórico?',
      message: 'Os dados de postura registrados serão apagados e essa ação não pode ser desfeita.',
      confirmLabel: 'Limpar',
      destructive: true,
    });
    if (!ok) return;
    clearTimeline();
    setSegments([]);
  };

  return (
    <section className="card timeline-card" aria-label="Histórico de postura">
      <header className="timeline-card__header">
        <div className="timeline-card__heading">
          <img
            className="timeline-card__icon"
            src="./spine.svg"
            alt=""
            aria-hidden="true"
            width={20}
            height={20}
          />
          <div>
            <h2 className="timeline-card__title">Histórico de postura</h2>
            <p className="timeline-card__subtitle">
              <span>Tempo monitorado: {formatDuration(totals.monitored)}</span>
            </p>
          </div>
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

          <section className="sparkline-section" aria-label="Tendência de postura ok">
            <header className="sparkline-section__header">
              <h3 className="sparkline-section__title">Tendência de postura ok</h3>
              <span className="sparkline-section__hint">% por {range === '24h' ? 'hora' : 'período'}</span>
            </header>
            <SparklineChart points={sparkline} range={range} />
          </section>
        </>
      ) : (
        <div className="timeline-empty" role="status">
          <img
            src="./spine-outline.svg"
            alt=""
            aria-hidden="true"
            width={28}
            height={28}
          />
          <p>Sem dados nesta janela.</p>
          <span>Ative o monitoramento para começar a registrar.</span>
        </div>
      )}

      <div className="timeline-card__footer">
        <button
          className="button button--text"
          type="button"
          onClick={() => {
            void handleClear();
          }}
          disabled={segments.length === 0}
        >
          <Trash2 size={16} aria-hidden="true" />
          Limpar histórico
        </button>
      </div>

      {confirmDialog}
    </section>
  );
};
