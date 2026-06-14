import { type ReactElement, useEffect, useMemo, useState } from 'react';
import { Activity, BarChart3, Flame, History, LineChart, TrendingUp } from 'lucide-react';

import { hydrateTimeline, loadTimeline } from '../lib/timeline/storage';
import type { TimelineSegment } from '../lib/timeline/types';
import {
  clipSegments,
  computeBestStreak,
  computeCurrentStreak,
  computeTimelineBuckets,
  STATE_ORDER,
  sumTotals,
} from '../lib/timeline/stats';
import {
  formatDuration,
  formatPercent,
  RANGE_BUCKET_COUNT,
  RANGE_DURATION_MS,
  RANGE_LABEL,
  STATE_LABEL,
  type TimelineRange,
} from '../lib/timeline/format';
import { Button, SegmentedControl } from '../design-system/atoms';
import { DonutChart } from './timeline/DonutChart';
import { QualityChart } from './timeline/QualityChart';
import { TimelineChart } from './timeline/TimelineChart';

interface TimelineViewProps {
  onClose: () => void;
}

const NOW_REFRESH_MS = 30_000;

export const TimelineView = ({ onClose }: TimelineViewProps): ReactElement => {
  const [segments, setSegments] = useState<TimelineSegment[]>([]);
  const [range, setRange] = useState<TimelineRange>('24h');
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
    const id = window.setInterval(() => setNow(Date.now()), NOW_REFRESH_MS);
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
    () => computeTimelineBuckets(clipped, rangeStart, rangeEnd, RANGE_BUCKET_COUNT[range]),
    [clipped, rangeStart, rangeEnd, range],
  );

  const bucketHint = `por ${range === '24h' ? 'hora' : '6h'}`;

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
        <Button variant="text" onClick={onClose}>
          Fechar
        </Button>
      </header>

      {!hasAnyHistory ? (
        <div className="timeline-empty timeline-empty--hero" role="status">
          <span className="timeline-empty__icon" aria-hidden="true">
            <Activity size={32} />
          </span>
          <p>Nenhum histórico ainda</p>
          <span>Ative o monitoramento e o seu tempo de postura ok aparece aqui em segundos.</span>
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

          <SegmentedControl
            aria-label="Janela de tempo"
            value={range}
            onChange={setRange}
            options={(Object.keys(RANGE_LABEL) as TimelineRange[]).map((option) => ({
              value: option,
              label: RANGE_LABEL[option],
            }))}
          />

          {hasData ? (
            <>
              <div className="timeline-summary">
                <DonutChart totals={totals} />

                <ul className="timeline-stats">
                  {STATE_ORDER.map((state) => (
                    <li key={state} className="timeline-stats__item">
                      <div className="timeline-stats__row">
                        <span
                          className={`timeline-stats__dot timeline-stats__dot--${state}`}
                          aria-hidden="true"
                        />
                        <span className="timeline-stats__label">{STATE_LABEL[state]}</span>
                        <span className="timeline-stats__value">
                          {formatDuration(totals[state])}
                        </span>
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

              <section className="timeline-chart-section" aria-label="Qualidade da postura">
                <header className="timeline-chart-section__header">
                  <span className="timeline-chart-section__title-group">
                    <LineChart size={16} aria-hidden="true" className="timeline-chart-section__icon" />
                    <h3 className="timeline-chart-section__title">Qualidade da postura</h3>
                  </span>
                  <span className="timeline-chart-section__hint">% postura ok {bucketHint}</span>
                </header>
                <QualityChart buckets={buckets} range={range} />
              </section>

              <section className="timeline-chart-section" aria-label="Distribuição de postura">
                <header className="timeline-chart-section__header">
                  <span className="timeline-chart-section__title-group">
                    <BarChart3 size={16} aria-hidden="true" className="timeline-chart-section__icon" />
                    <h3 className="timeline-chart-section__title">Distribuição</h3>
                  </span>
                  <span className="timeline-chart-section__hint">{bucketHint}</span>
                </header>
                <TimelineChart buckets={buckets} range={range} />
                <ul className="timeline-chart__legend" aria-hidden="true">
                  {STATE_ORDER.map((state) => (
                    <li key={state} className="timeline-chart__legend-item">
                      <span className={`timeline-chart__legend-dot timeline-chart__legend-dot--${state}`} />
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
